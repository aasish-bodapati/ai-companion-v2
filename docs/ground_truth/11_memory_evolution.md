# Memory Evolution (Adaptive Memory Growth)

## Purpose
Define how memories adapt over time: decay, temporal awareness, personality reflection, and goal tracking. This governs ranking, surfacing, and lifecycle of memories used in prompts and UI.

## Principles
- Safety-first: never log secrets; JWT-protected endpoints; HTTPS in prod.
- Deterministic fallbacks for LLM calls where applicable.
- Simple first: additive schema fields, feature flags, measurable impact, reversible.

## Feature Flags (ENV)
- `MEMORY_DECAY_ENABLED=true`
- `MEMORY_DECAY_HALF_LIFE_DAYS=90`
- `PERSONALITY_REFLECTION_ENABLED=true`
- `GOAL_TRACKING_ENABLED=true`

## Schema Changes (spec)
Extend MemoryNode (DB model + API) with:
- `importance: float` (default 1.0)
- `first_seen_at: datetime` (defaults to created_at)
- `last_seen_at: datetime` (updated on reinforcement/retrieval)
- `reinforcement_count: int` (default 0)
- `decay_half_life_days: int | null` (null = use global default)
- `suppressed_until: datetime | null` (temporary downweighting)

Notes:
- `memory_metadata.core` remains the authoritative Core flag.
- All timestamps are UTC.

## Retrieval Scoring
Let `sim` be cosine similarity of the query and memory vector.
Let `age_days = (now - last_seen_at).days`.
Let `half_life = decay_half_life_days or MEMORY_DECAY_HALF_LIFE_DAYS`.
- `decay_factor = 0.5 ** (age_days / half_life)` (bounded [0.1, 1.0])
- `recency_boost = clamp(1.0 + log1p(max(0, 30 - age_days)) / 5, 1.0, 1.3)`
- `core_boost = 1.3 if core else 1.0`
- `importance_boost = clamp(importance, 0.5, 2.0)`

Final score:
- `score = sim * recency_boost * importance_boost * decay_factor * core_boost`
- Suppressed memories (`now < suppressed_until`) get an additional multiplier 0.5.

## Reinforcement
- On each successful use (memory appears in the final retrieved context used for a reply), update:
  - `last_seen_at = now`, `reinforcement_count += 1`
- Provide an explicit endpoint for manual reinforcement: `POST /api/v1/memories/{id}/reinforce`

## Decay Job (APScheduler)
- Periodic job (e.g., daily) recomputes derived metrics and optionally marks long-unseen memories as low priority by setting `suppressed_until`.
- Observability: `decay.run.start/ok/error` with counts and elapsed_ms.

## Temporal Awareness
- Ensure timestamps are available to the LLM via memory context (`GET /api/v1/conversations/{id}/memory-context`).
- The assistant may refer to time (“Last year you told me…”) using the timestamp from memory items, not speculation.

## Personality Reflection
- Maintain a `personality_profile` per user derived from message analytics:
  - Metrics: `avg_msg_len`, `emoji_rate`, `formality` (0–1), `pace` (messages/day), `greeting_style` (categorical).
- Update metrics on each `POST /conversations/{id}/messages`.
- If `PERSONALITY_REFLECTION_ENABLED`, append a safe, bounded persona hint to the system prompt (do not leak PII). Example:
  - “Prefer concise, direct tone; mirror the user’s use of short bullets and occasional emojis.”

## Goal Tracking
- New `goals` resource:
  - Fields: `id, user_id, title, status(enum: active|paused|done), target_date, progress(float 0..1), metadata, created_at, updated_at`.
- Endpoints:
  - `POST/GET/PATCH/DELETE /api/v1/users/me/goals`
  - `POST /api/v1/users/me/goals/{id}/checkin` (updates progress and creates a memory node)
- Retrieval: active goals receive a boost similar to `core_boost` (e.g., 1.2).

## Frontend
- MemoryContext shows timestamps and optional decay hints.
- Simple Goals list with progress chips and a quick check-in action.

## Observability
- Structured logs for: `decay.run.*`, `reinforce.*`, `personality.update.*`, `goals.*` (trace_id, user_id, elapsed_ms).

## Testing
- Unit tests for scoring function and decay curve boundaries.
- API tests for reinforce and goals CRUD.
- Ensure tests mock OpenRouter LLM calls (e.g., patch `app/core/llm.py` HTTP client or stub `generate_with_openrouter`).

---

## Implemented Behavior (v2)

This section documents the memory evolution/forgetting behavior currently implemented in code.

- Fused scoring in retrieval (`memory/service.py: search_memories()`):
  - Score combines similarity, recency, importance, reinforcement, core boost, and decay.
  - Suppressed memories are filtered; core memories may bypass min similarity threshold.

- Consolidation on write (`store_memory`):
  - Detects a `Key: Value` pattern and uses `consolidation_key` to upsert instead of duplicating.
  - Updates DB content/metadata and re-embeds to update FAISS vector.

- Trivial/low-entropy filtering:
  - Skips very short greetings/acks or low-entropy strings to avoid noise.

- Mark-as-seen on retrieval (`mark_memories_seen`):
  - Called by `GET /conversations/{id}/memory-context` after retrieval.
  - Updates `last_seen_at`, increments `seen_count`, and auto-reinforces every 5 views by bumping `reinforced_count`.

- Soft forgetting (opportunistic):
  - Triggered after `store_memory` at most once per hour per user.
  - If total memories exceed threshold, suppresses stale, non-core, low-importance, non-reinforced items for 1 year via `suppressed_until`.

- UI transparency:
  - Memory Context items include a `reason` string explaining inclusion (score/core/importance/reinforcement).
  - Per-type caps are enforced for diversity.

- Performance:
  - Streaming reply endpoint fetches recent messages and builds memory context in parallel (separate SQLAlchemy sessions).

## Tunables (ENV)

- `MEMORY_ENABLED` (bool) — master switch.
- `MEMORY_MIN_RELEVANCE` (float) — base similarity threshold; may be bypassed by core.
- `RETRIEVAL_TOP_K` (int) — memory search limit.
- `MEMORY_DECAY_ENABLED` (bool) — enable decay term in fused scoring.
- `MEMORY_DECAY_HALF_LIFE_DAYS` (int) — half-life for decay.
- `MEMORY_MAX_MEMORIES` (int, default 500) — capacity target for soft forgetting.
- `MEMORY_FORGET_AGE_DAYS` (int, default 90) — age threshold for candidates.

## Metadata fields used

Stored in `memory_metadata` JSON:

- `core: bool`
- `importance: float` (0.0–2.0 typical)
- `reinforced_count: int`
- `seen_count: int`
- `last_seen_at: iso-datetime`
- `suppressed_until: iso-datetime`
- `consolidation_key: str` (when applicable)

## API touchpoints

- Retrieval context: `GET /api/v1/conversations/{id}/memory-context`
  - Performs deduplication, per-type caps, and writes `mark_memories_seen` after retrieval.
  - Returns items with `reason` strings for transparency.

- Reinforcement/suppression helpers:
  - `POST /api/v1/memories/{id}/reinforce` — manual reinforcement (existing helper in service).
  - `POST /api/v1/memories/{id}/suppress` — sets `suppressed_until` via service helper.

## Safety & Security

- Never store secrets; all endpoints require valid JWT; HTTPS in production.
- Soft forgetting uses suppression, not destructive delete.

## Migration notes

- Existing memories gain behavior without schema change; metadata fields are added lazily on update.
- Consolidation is backward-compatible; only updates content/vector when a `consolidation_key` is detected.
