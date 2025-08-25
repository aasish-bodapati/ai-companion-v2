# Retrieval Diagnostics

This document defines the source-of-truth for semantic memory retrieval diagnostics in AI Companion v2. It covers the backend debug flag, API contract, response shape, and frontend UI behavior.

---

## Overview
Retrieval diagnostics provide visibility into how a memory result was ranked by the retrieval system. When enabled, each result includes a `_retrieval_debug` object describing the raw similarity and all multiplicative/additive factors applied prior to final reranking.

Diagnostics are intended for development and QA. They are gated by a server-side config flag and must not be exposed in production UIs unless explicitly allowed.

---

## Backend

- Module: `backend/app/memory/service.py`
- Function: `MemoryService.search_memories(..., debug: bool = False)`
- Config flag: `DEBUG_RETRIEVAL_ENABLED: bool` in `backend/app/core/config.py` (default: `True`)

When `debug=True` AND `DEBUG_RETRIEVAL_ENABLED` is `True`, the service attaches the following fields under `memory_metadata._retrieval_debug` for each `MemorySearchResult`:

- `raw_score` — FAISS or fallback similarity score before tunables
- `importance` — parsed importance metadata (float)
- `importance_boost` — multiplicative factor from importance
- `core` — whether marked as core memory
- `core_boost` — multiplicative factor for core
- `reinforced_count` — number of reinforcements
- `reinforce_factor` — multiplicative boost from reinforcement (capped)
- `rank_boost` — learned feedback-based boost (capped)
- `recency_days` — age in days used for recency decay
- `halflife_days` — halflife used for decay, based on content type
- `decay_factor` — multiplicative recency decay factor
- `type_prior` — small multiplicative prior by content type
- `overlap_matches` — number of 3+ char term overlaps with query
- `overlap_bonus` — capped additive bonus applied multiplicatively
- `boosted_score` — final boosted score after all tunables (before MMR)

Reranking (MMR) is still applied after these boosts; MMR’s lambda (`RETRIEVAL_MMR_LAMBDA`) is reported in service logs/metrics but not per-item in `_retrieval_debug`.

---

## API

Endpoint: `GET /api/v1/users/me/memories/search`

Query parameters:
- `query` (string, required): search text.
- `content_type` (string, optional): filter by type.
- `limit` (int, optional, default 8, max 50)
- `min_relevance` (float, optional, default 0.5)
- `debug` (bool, optional, default false): include diagnostics if both this is true and server config allows it.

Response: `200 OK` with `MemorySearchResult[]` items. Each item includes:
- `faiss_id` (string)
- `content` (string)
- `content_type` (string)
- `relevance_score` (number) — boosted score used for ranking (post-tunables)
- `timestamp` (ISO string)
- `memory_metadata` (object | null): when debug is enabled, contains `_retrieval_debug` object as specified above. In non-debug mode, `memory_metadata` is passed through from storage if present.

Authorization: requires a valid authenticated session. Results are always scoped to the current user.

---

## Related Utils Endpoints

- `GET /api/v1/utils/retrieval-metrics` — lightweight retrieval diagnostics counters and last-run parameters.
- `GET /api/v1/utils/llm-latency` — rolling latency metrics for LLM calls captured during reply streaming.

See `backend/app/api/endpoints/utils.py` for exact response shapes.

---

## Frontend UI

- Page: `frontend/src/app/memories/page.tsx`
- API: `frontend/src/features/memory/api.ts`

Behavior:
- When the search field is non-empty, the page performs semantic search via `/users/me/memories/search`.
- A `Debug` checkbox toggles `debug=true` on the request. If enabled and allowed by server config, the UI shows a collapsible "Why this?" section rendering `_retrieval_debug` key-value pairs.
- Relevance is displayed with two decimals (e.g., `74.23%`).
- Importance shown in the list view is snapped to bands: `10/30/60/85/100` to align with guidance in `31_memory_scoring.md`.
- Search results do not expose destructive actions like delete (since they may not map 1:1 to DB records).

---

## Configuration and Safety

- `DEBUG_RETRIEVAL_ENABLED` controls whether the server will include debug metadata even if the client requests it.
- Keep this enabled in development for diagnosis; disable in production if you do not wish to expose ranking internals.
- No PII is added by diagnostics; they reflect scoring factors only. Respect general privacy and logging policies.

---

## Related Docs
- `12_retrieval_and_scoring.md` — Retrieval scoring, boosts, decay
- `23_memory_quality_playbook.md` — Retrieval quality guidance and tuning parameters
- `31_memory_scoring.md` — Importance scoring bands and algorithms
- `24_timeline_events.md` — Timeline diagnostics for chat SSE (complementary diagnostics)
