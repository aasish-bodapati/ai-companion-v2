# Weekly Digest

Source of truth for the Weekly Digest capability (backend API, response contract, UI notes).

---

## Overview
The Weekly Digest provides a read-only summary of the user's recent activity and highlights from memory. It:
- Summarizes up to N recent conversations in a chosen date window.
- Returns top memory highlights using recency, reinforcement, and rank_boost.
- Provides simple activity stats.
- Does not persist by default (a materialize endpoint may be added later).

Model selection follows project rules: default `meta-llama/llama-3.3-70b-instruct` via `LLM_KEY` and `LLM_BASE_URL` (OpenRouter). The summarization includes `user_id` and `conversation_id` in the system prompt per AI Integration Rules.

---

## API

- Method/Path: `GET /api/v1/users/me/weekly-digest`
- Auth: JWT required (uses `get_current_active_user`).
- Query params:
  - `start?: string` — Start date (YYYY-MM-DD or ISO). Default: now - 7 days.
  - `end?: string` — End date (YYYY-MM-DD or ISO). Default: now.
  - `limit_conversations?: number` — Max conversations to summarize (1..10, default 3).
  - `limit_highlights?: number` — Max highlight items (1..20, default 6).

- Response shape:
```json
{
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "summary": "string",
  "highlights": [
    {
      "title": "string",
      "detail": "string",
      "faiss_id": "string | null",
      "rank_boost": 0.0
    }
  ],
  "stats": {
    "messages": 0,
    "new_memories": 0,
    "reinforced": 0
  },
  "provenance": {
    "model": "meta-llama/llama-3.3-70b-instruct",
    "source": "weekly_digest",
    "user_id": "uuid"
  }
}
```

- Error shape: standard per `22_error_response_standard.md`.

---

## Implementation Notes
- Backend module: `backend/app/api/endpoints/weekly.py` (router tag `weekly`).
- Included in `backend/app/api/api_v1/api.py`.
- Summarization: `app/services/summarization.py#generate_conversation_summary()` is reused. It passes `user_id` and `conversation_id` and is provider-agnostic via config.
- Highlights selection:
  - Pull user memories via `crud.memory.memory.get_user_memories()`.
  - Score = 0.4*recency + 0.3*reinforced_count_norm + 0.3*rank_boost (capped).
  - Excludes `memory_metadata.source == "auto_summary"`.

Security:
- JWT required for all digest calls.
- No secrets logged; HTTPS required in production.

---

## Frontend Guidance (v1)
- Feature flag: `NEXT_PUBLIC_FEATURE_WEEKLY_DIGEST`.
- UI: a simple panel/tab that requests the endpoint, shows Period selector, Summary, Highlights, and Stats. Tailwind-only. Strict TS types.
- Optional future: "Save Digest to Memory" (materialization endpoint) — not part of v1.

---

## Testing
- Backend tests should mock OpenRouter LLM calls (e.g., patch the HTTP client or stub `generate_with_openrouter`). Validate:
  - 200 OK, shape matches contract.
  - JWT required.
  - Date filtering works (messages/new_memories counted in window).

---

## Changelog
- 2025-08-12: Initial version added with read-only endpoint and documentation.
