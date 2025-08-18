# Memory Promotion Policy

Source of truth for how memories are captured into All and promoted to Core.

## Definitions
- Core memories: Pinned, slow-changing context that receives a retrieval boost.
- All memories: Full working set that changes frequently; capture-first, promote-on-signal.

## Capture Rules (All)
- Conversation extractions: salient facts/procedures from model replies. `source: conversation`
- Check-ins: user-submitted updates. `source: checkin`
- Auto-summaries: summaries of sessions or conversations. `source: autosummary`
- Onboarding outcomes: profile data; also produces a seed profile Memory that is Core. `source: onboarding`
- Metadata set on capture:
  - `core: false` (default), `importance` (0..1), `source`, `consolidation_key` (optional),
  - `suppressed_until` (optional), `reinforced_count` (default 0), `seen_count` (default 0).

## Promotion to Core
- Manual: user promotes any All memory via UI; API patches `core: true`.
- Auto (optional, feature-flagged): promote if BOTH conditions hold:
  - importance ≥ `MEMORY_CORE_IMPORTANCE_MIN` (default 0.85)
  - reinforcement signal present:
    - `reinforced_count ≥ MEMORY_CORE_REINFORCE_MIN` (default 2), OR
    - repeated items share `consolidation_key` (stability signal)
- Seed: onboarding profile memory is Core by default.

### Reinforcement sources
- Explicit reinforce actions (e.g., thumbs-up or "Reinforce" in UI) increment `reinforced_count`.
- Passive reinforcement: `seen_count` increments when a memory is surfaced; every 5 views we increment `reinforced_count` by 1 (bounded behavior), see `MemoryService.mark_memories_seen()`.

### Provenance and badges
- When auto-promoted, memory metadata includes `auto_promoted_at` (ISO date) and `core: true`.
- UI should display an "Auto‑promoted" badge in the Core tab.
- Manual promotions remain available; UI may de-emphasize the manual "Promote to Core" path per product guidance.

## Demotion from Core
- Manual: user demotes (`core: false`).
- Auto (optional, rare): if importance decays below threshold with hysteresis and no recent reinforcement, and a newer consolidated memory supersedes the same `consolidation_key`.

## Retrieval Behavior
- Fusion scoring: similarity + recency + importance + reinforcement + core boost + decay.
- Suppressed memories are filtered out in retrieval and context assembly.
- Context assembly caps per type and falls back to DB when retrieval is empty.

Notes on hybrid capture integration:
- Importance may be derived from heuristic and/or LLM classifier; final stored `importance` and `importance_source` are used consistently by promotion logic.

## Tunables (Environment)
- `MEMORY_CORE_AUTOPROMOTE_ENABLED` (bool, default: False)
- `MEMORY_CORE_IMPORTANCE_MIN` (float, default: 0.85)
- `MEMORY_CORE_REINFORCE_MIN` (int, default: 2)
- Existing knobs (in config): `MEMORY_ENABLED`, `RETRIEVAL_TOP_K`, `MEMORY_MIN_RELEVANCE`, `MEMORY_DECAY_*`, `MEMORY_MAX_MEMORIES`, `MEMORY_FORGET_AGE_DAYS`.

## Observability
- Capture rate per source.
- Promotion rate (manual vs auto).
- Reinforcement distribution.
- Suppression hits/misses.
- Decay/consolidation outcomes.

## References
- Code: `backend/app/memory/service.py` (search/retrieval, suppression, consolidation)
- Endpoints: `backend/app/api/endpoints/memory.py`
- FAISS store: `backend/app/memory/faiss_store.py`
- Embeddings: `backend/app/memory/embeddings.py`
- Design docs: `09_continuous_context_ingestion.md`, `11_memory_evolution.md`
