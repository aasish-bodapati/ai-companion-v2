# Engineering Progress Journal

A living log of milestones, decisions, and test status. Keep entries brief and high-signal.

## How to use
- Add a new dated entry at the top.
- Sections: Summary, Key Changes, Tests/Health, Flags/Config, Notes, Next Up.

Template:

- Date: YYYY-MM-DD
  - Summary: one-liner
  - Why: rationale for the change(s)
  - Key Changes:
    - item
  - Tests/Health: state
  - Flags/Config: state
  - Notes: optional
  - Next Up: bullets

---

- Date: 2025-08-10
  - Summary: Add journal automation script
  - Why: Keep progress consistent and high-signal
  - Key Changes:
    - Add scripts/add_journal_entry.py
  - Tests/Health:
    - No code changes; script only
  - Next Up:
    - Use script for future milestones

- Date: 2025-08-10
  - Summary: Enabled registration, fixed minor API/UI drifts, added FAISS-ready memory module (flagged), hooked onboarding/message indexing, updated memory design; tests green.
  - Why: Stabilize core auth/UX and lay the foundation for efficient long-term memory while keeping inference costs low and changes non-breaking.
  - Key Changes:
    - Frontend: `ProtectedRoute` now checks `user.is_superuser`.
    - Backend: OAuth2 tokenUrl aligned to `/api/v1/login/access-token`.
    - Backend: Added public `POST /api/v1/register`; enabled frontend `register()`.
    - Backend: Messages pagination (`skip`, `limit`) on `GET /conversations/{id}/messages`.
    - Frontend: Deprecated legacy `/api/chat` usage.
    - Memory Milestone 1: Added flags, `app/memory/embeddings.py`, `faiss_store.py`, safe fallbacks, unit tests.
    - Memory Milestone 2 (hooks): Serialized onboarding profile; embedded/indexed on onboarding save/complete and on message create (guarded by flag).
    - Docs: Switched memory design to FAISS, added spiderweb graph plan, added cost-efficiency principles.
  - Tests/Health:
    - Backend tests: 9 passed, 1 skipped; no regressions after memory hooks.
  - Flags/Config:
    - `MEMORY_ENABLED=false` (default), `MEMORY_PROVIDER=faiss`, `EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2`, `RETRIEVAL_TOP_K=8`.
    - Together model (when used): `meta-llama/Llama-3.3-70B-Instruct-Turbo-Free` via `.env`.
  - Notes:
    - Memory operations no-op if FAISS/model unavailable; requests never fail due to memory.
    - Keep cost awareness: batch embeddings, strict token budgets, cache retrievals.
  - Next Up:
    - Add `POST /api/v1/conversations/{id}/reply` with FAISS retrieval + Together integration (mocked tests), streaming optional.
    - Optional: per-conversation retrieval cache and token budget clamps in prompt builder.
    - Future: spiderweb graph (nodes/edges) with 1–2 hop expansion behind a flag.
