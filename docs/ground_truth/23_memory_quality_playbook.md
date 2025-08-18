# Memory Quality Playbook

This document defines how retrieval quality is improved via MMR diversification, recency awareness, and configuration flags. It is the single source of truth for retrieval behavior.

## Retrieval Pipeline

1. FAISS top-K retrieval (over-fetch: 2x limit)
2. Evolution-aware score boosts (importance, core, reinforcement, optional decay)
3. MMR reranking to diversify final results
4. Truncate to `limit` and return to caller

## MMR Reranking

- Controlled by `RETRIEVAL_MMR_LAMBDA` (default 0.7). Range: [0.0, 1.0].
  - Higher values weight query similarity more; lower values weight diversity more.
- Implementation: Maximal Marginal Relevance using cosine similarity between candidate vectors and the query, with redundancy penalty from selected items.

## Recency and Evolution Signals

- Importance and reinforcement are multiplicative boosts during candidate scoring.
- Optional decay enabled by `MEMORY_DECAY_ENABLED` uses half-life days to attenuate stale memories, with a mild recency boost for <= 30 days.

## Configuration

- `RETRIEVAL_TOP_K` (int): upstream FAISS candidates; effective final limit is set by the caller (e.g., 3–8 in context)
- `MEMORY_MIN_RELEVANCE` (float): minimum similarity for non-core items
- `RETRIEVAL_MMR_LAMBDA` (float 0..1): balance similarity vs diversity (recommended 0.6–0.8)
- `MEMORY_DECAY_ENABLED` (bool): enable time decay and mild recency boost

## Future Enhancements

- Per-retrieval metrics: hit rate, diversity, and age statistics exported via `/api/v1/utils/metrics`.

## Implemented Enhancements

- Profile blending: conversation context includes “Profile highlights” (1–3 concise bullets) derived from the user's onboarding profile, followed by the full profile block. Implemented in `backend/app/memory/service.py::get_conversation_context()` and `_extract_profile_highlights()`.
- Feedback-driven reweighting: `POST /api/v1/messages/{message_id}/feedback` with `signal=up` increases `reinforced_count` and `memory_metadata.rank_boost` (capped); `signal=down` applies a suppression window to exclude items from retrieval. Implemented in `backend/app/api/endpoints/memory.py::message_feedback()` and `backend/app/memory/service.py::increase_rank_boost_by_faiss_id()`.

## Tests

- Add integration tests to verify:
  - Diversity increases with MMR vs pure similarity
  - Newer items receive mild advantage when `MEMORY_DECAY_ENABLED`
  - Feedback affects subsequent ranks
