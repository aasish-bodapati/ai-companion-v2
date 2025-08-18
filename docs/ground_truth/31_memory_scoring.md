# Memory Scoring (Relevance vs Importance)

This document is the single source of truth for how memories are scored.

---

## Definitions
- __Relevance (dynamic, 0–1+)__
  - Computed at retrieval time in `backend/app/memory/service.py::search_memories()`.
  - Starts from vector similarity and applies multiplicative boosts/decays.
  - Used to select and order memories for context.
- __Importance (intrinsic, 0–100)__
  - Computed at capture time or when not provided by callers.
  - Stable, used by policies (quotas, promotion), and surfaced in the UI.

---

## Importance Scoring (0–100)
Implemented in `MemoryService.grade_importance(text, content_type)`.

- Start with heuristic estimate in [0..1] using `_estimate_importance()`.
- If enabled, blend with LLM classifier (`_classify_with_llm()`); take max(heuristic, LLM).
- Apply small type priors:
  - `preference`, `profile` +0.10
  - `message`, `conversation` +0.02
- Map fused [0..1] to stable UI bands: 10/30/60/85/100 (with 0 if empty).
- Controlled by `IMPORTANCE_LLM_ENABLED` and `MEMORY_LLM_CLASSIFIER_ENABLED`.
- Endpoint wiring: `backend/app/api/endpoints/memory.py`
  - Prefer explicit `importance_score` (0–100) if provided.
  - Else if `importance` (0–1) provided, scale to 0–100.
  - Else call `grade_importance(content, content_type)`.

---

## Relevance Scoring (dynamic, retrieval-time)
Implemented and combined in `MemoryService.search_memories()`:

1) __Base similarity__ from FAISS or fallback embedding dot-product.
2) __Importance boost__ multiplicative, bounded to [0.5..2.0] from `metadata.importance`.
3) __Core boost__ 1.3× if `metadata.core`.
4) __Reinforcement boost__ 1 + min(0.25 × reinforced_count, 1.0).
5) __Feedback rank boost__ 1 + min(`metadata.rank_boost`, 1.0).
6) __Recency decay (new)__
   - Enabled via `RELEVANCE_RECENCY_DECAY_ENABLED`.
   - Age from `metadata.last_seen_at` or node timestamp.
   - Half-life by type:
     - preference: `RELEVANCE_HALFLIFE_PREFERENCE_DAYS` (default 365)
     - profile: `RELEVANCE_HALFLIFE_PROFILE_DAYS` (default 365)
     - message: `RELEVANCE_HALFLIFE_MESSAGE_DAYS` (default 7)
     - conversation: `RELEVANCE_HALFLIFE_CONVERSATION_DAYS` (default 14)
     - fact/other: `RELEVANCE_HALFLIFE_FACT_DAYS` (default 14)
   - Decay factor = 0.5^(age_days/half_life), clipped to [0.05..1.0].
7) __Type prior (new)__ small multiplicative bump by content_type:
   - preference: `RELEVANCE_PRIOR_PREFERENCE` (default 0.05)
   - profile: `RELEVANCE_PRIOR_PROFILE` (0.03)
   - message: `RELEVANCE_PRIOR_MESSAGE` (0.02)
   - conversation: `RELEVANCE_PRIOR_CONVERSATION` (0.01)
   - fact/other: `RELEVANCE_PRIOR_FACT` (0.02)
8) __Overlap bonus (new)__ multiplicative: 1 + min(cap, per_match × matches)
   - `RELEVANCE_OVERLAP_BONUS_PER_MATCH` (default 0.02)
   - `RELEVANCE_OVERLAP_BONUS_MAX` (default 0.08)
   - Matches are intersections of ≥3-char tokens in query vs memory content.
9) __Dedup__ by normalized content to avoid repeats.
10) __MMR reranking__ with `RETRIEVAL_MMR_LAMBDA` to diversify final top-K.

Notes:
- Core memories can bypass the `min_relevance` similarity threshold.
- Retrieval metrics are recorded for diagnostics.

---

## Configuration Flags
Defined in `backend/app/core/config.py`.

- Importance: `IMPORTANCE_LLM_ENABLED`, `MEMORY_LLM_CLASSIFIER_ENABLED`.
- Relevance recency/priors/overlap: `RELEVANCE_*` flags and halflives/priors.
- MMR: `RETRIEVAL_MMR_LAMBDA`.

---

## Frontend Surfacing
- The Memories page shows `importance_score` (0–100) and sorts by it.
- Relevance is dynamic and not stored; used at retrieval time for ranking.

---

## Future Work
- Learn priors per user via implicit feedback.
- Add per-type min floors for importance used in policy gating.
- A/B test band thresholds and decay half-lives.
