# API Endpoints – AI Companion v2

This is the canonical source of truth for the HTTP API. It reflects the current FastAPI implementation in `backend/app/main.py` and routers under `backend/app/api/endpoints/`.

- Base URL (local): `http://localhost:8000`
- API version prefix: `/api/v1`
- OpenAPI docs: `http://localhost:8000/docs`

---

## Authentication

- Scheme: Bearer JWT
- Header: `Authorization: Bearer <token>`
- Obtain token: `POST /api/v1/login/access-token`
  - Content-Type: `application/x-www-form-urlencoded`
  - Fields: `username=<email>&password=<password>`
  - Response: `{ "access_token": string, "token_type": "bearer" }`

Most endpoints under `/api/v1` require a valid JWT. Admin-only endpoints require a user with `is_superuser=true`.

---

## Health & Root

- GET `/` (Public)
  - Description: Root ping.
  - Response: `{ "message": "Welcome to Minimal AI Companion API" }`
  - Source: `backend/app/main.py::root`

- GET `/health` (Public)
  - Description: App health check.
  - Response: `{ "status": "ok" }`
  - Source: `backend/app/main.py::health_check`

---

## Auth – Login

- POST `/api/v1/login/access-token` (Public)
  - Description: OAuth2-compatible token login.
  - Request: `application/x-www-form-urlencoded`
    - `username`: string (email)
    - `password`: string
  - Response (Token):
    - `access_token`: string
    - `token_type`: string = `bearer`
  - Source: `backend/app/api/endpoints/login.py::login_access_token`

- POST `/api/v1/login/test-token` (Auth: Bearer)
  - Description: Validate token and return current user.
  - Response (User): see User schema below
  - Source: `backend/app/api/endpoints/login.py::test_token`

---

## Users

- GET `/api/v1/users/` (Auth: Admin)
  - Description: List users (paginated).
  - Query:
    - `skip`: integer, default 0
    - `limit`: integer, default 100
  - Response: `User[]`
  - Source: `backend/app/api/endpoints/users.py::read_users`

- POST `/api/v1/users/` (Auth: Admin)
  - Description: Create a new user.
  - Body (UserCreate):
    - `email`: string (email)
    - `password`: string (8–100 chars)
    - `full_name`: string | null
    - `is_active`: boolean | default true
    - `is_superuser`: boolean | default false
  - Response: `User`
  - Source: `backend/app/api/endpoints/users.py::create_user`

- GET `/api/v1/users/me` (Auth: Bearer)
  - Description: Get current user.
  - Response: `User`
  - Source: `backend/app/api/endpoints/users.py::read_user_me`

- GET `/api/v1/users/{user_id}` (Auth: Bearer; Admin or Self)
  - Description: Get a specific user by id.
  - Path:
    - `user_id`: UUID
  - Response: `User`
  - Source: `backend/app/api/endpoints/users.py::read_user_by_id`

---

## Utils

- GET `/api/v1/utils/health` (Public)
  - Description: API health.
  - Response: `{ "status": "ok" }`
  - Source: `backend/app/api/endpoints/utils.py::health_check`

- POST `/api/v1/utils/test-email` (Public)
  - Description: Test email trigger (stub).
  - Query:
    - `email_to`: string (email)
  - Response: `{ "msg": "Test email sent", "email_to": string }`
  - Source: `backend/app/api/endpoints/utils.py::test_email`

- GET `/api/v1/utils/retrieval-metrics` (Auth: Bearer)
  - Description: Lightweight retrieval diagnostics from the memory service.
  - Response: `{ total_requests: number, last: { query_prefix: string, mmr_lambda: number|null, top_k_limit: number, min_relevance: number, selected_count: number } }`
  - Source: `backend/app/api/endpoints/utils.py::get_retrieval_metrics`

- GET `/api/v1/utils/retrieval-settings` (Auth: Bearer)
  - Description: Read-only retrieval knobs for display in Settings UI.
  - Response: `{ MEMORY_ENABLED: boolean, MEMORY_PROVIDER: string, EMBEDDING_MODEL_NAME: string, RETRIEVAL_TOP_K: number, RETRIEVAL_RECENT_MESSAGES: number, MEMORY_MIN_RELEVANCE: number }`
  - Source: `backend/app/api/endpoints/utils.py::retrieval_settings`

- GET `/api/v1/utils/csrf-token` (Public)
  - Description: Issues a CSRF token and sets a `csrftoken` cookie (`SameSite=Lax`, `Secure` in production). SPA should send this token in the `X-CSRF-Token` header for state-changing requests.
  - Response: `{ csrf_token: string }`
  - Source: `backend/app/api/endpoints/utils.py::get_csrf_token`

- GET `/api/v1/utils/llm-latency` (Auth: Bearer)
  - Description: Rolling latency metrics for LLM calls recorded by reply streaming.
  - Response: `{ first_token_ms: { avg: number, min: number, max: number, count: number }, llm_total_ms: { avg: number, min: number, max: number, count: number } }`
  - Source: `backend/app/api/endpoints/utils.py::get_llm_latency`

---

## Conversations

All Conversation endpoints require Bearer JWT and operate on resources owned by the current user.

Schemas: `backend/app/schemas/conversation.py`

- Conversation
  - `id`: UUID
  - `user_id`: UUID
  - `title`: string | null
  - `created_at`: datetime
  - `updated_at`: datetime

- ConversationCreate
  - `title`: string | null

- ConversationWithMessages extends Conversation
  - `messages`: `Message[]`

- Message
  - `id`: UUID
  - `conversation_id`: UUID
  - `role`: string (`user` | `assistant`)
  - `content`: string
  - `created_at`: datetime

- MessageCreate
  - `role`: string (`user` | `assistant`)
  - `content`: string
  - `remember?`: boolean — explicitly save this message to memory; if omitted, smart gating applies

Endpoints:

- GET `/api/v1/conversations/` (Auth: Bearer)
  - Description: List conversations for current user (most recent first).
  - Query:
    - `skip`: integer, default 0
    - `limit`: integer, default 100
  - Response: `Conversation[]`
  - Source: `backend/app/api/endpoints/conversations.py::list_conversations`

- POST `/api/v1/conversations/` (Auth: Bearer)
  - Description: Create a new conversation.
  - Body (ConversationCreate):
    - `title`: string | null
  - Response: `Conversation`
  - Source: `backend/app/api/endpoints/conversations.py::create_conversation`

- GET `/api/v1/conversations/{conversation_id}` (Auth: Bearer)
  - Description: Get a conversation with all messages.
  - Path:
    - `conversation_id`: UUID
  - Response: `ConversationWithMessages`
  - Errors:
    - 404 if not found
    - 403 if not owner
  - Source: `backend/app/api/endpoints/conversations.py::get_conversation`

- GET `/api/v1/conversations/{conversation_id}/messages` (Auth: Bearer)
  - Description: List messages in a conversation.
  - Path:
    - `conversation_id`: UUID
  - Query:
    - `skip`: integer, default 0
    - `limit`: integer, default 100
  - Response: `Message[]`
  - Errors: 404 not found, 403 not owner
  - Source: `backend/app/api/endpoints/conversations.py::list_messages`

- POST `/api/v1/conversations/{conversation_id}/messages` (Auth: Bearer)
  - Description: Create a message in a conversation.
  - Path:
    - `conversation_id`: UUID
  - Body (MessageCreate):
    - `role`: `user` | `assistant`
    - `content`: string
    - `remember?`: boolean
  - Response: `Message`
  - Errors: 404 not found, 403 not owner
  - Source: `backend/app/api/endpoints/conversations.py::create_message`
  - Notes: When `remember` is true, the message is saved as memory. Without it, only sufficiently important user messages are stored; assistant messages are skipped unless explicit.

---

## Memories

All Memory endpoints require Bearer JWT and are scoped to the authenticated user.

Schemas: `backend/app/schemas/memory.py`

- MemoryNode
  - `id`: UUID
  - `user_id`: UUID
  - `content`: string
  - `content_type`: string (e.g., `conversation` | `message` | `fact` | `onboarding`)
  - `relevance_score`: number | null
  - `timestamp`: datetime
  - `memory_metadata`: string (JSON-as-text; may include `{ core: true }`)

- MemoryUpdate (PATCH body)
  - `content?`: string
  - `relevance_score?`: number
  - `core?`: boolean

Endpoints:

- GET `/api/v1/users/me/memories` (Auth: Bearer)
  - Description: List current user's memories
  - Query:
    - `content_type?`: string
    - `core?`: boolean — filters by `memory_metadata.core`
    - `limit?`: integer, default 100
  - Response: `MemoryNode[]`
  - Notes: `core` filtering is applied by parsing `memory_metadata` JSON; unparsable metadata is treated as non-core.
  - Source: `backend/app/api/endpoints/memory.py::list_my_memories`

- POST `/api/v1/memories` (Auth: Bearer)
  - Description: Create a memory node for the current user.
  - Body (CreateMemoryIn):
    - `content`: string (required)
    - `content_type?`: string (`conversation` | `message` | `fact` | `onboarding`) default `fact`
    - `conversation_id?`: UUID
    - `core?`: boolean
    - `importance?`: number
  - Response: `MemoryNode`
  - Notes: Assigns a placeholder FAISS id; indexing can be async.
  - Source: `backend/app/api/endpoints/memory.py::create_memory`

- PATCH `/api/v1/memories/{memory_id}` (Auth: Bearer)
  - Description: Update a memory node you own; supports toggling Core via `core`
  - Path:
    - `memory_id`: UUID
  - Body (MemoryUpdate): `content?`, `relevance_score?`, `core?`
  - Response: `MemoryNode` (updated)
  - Errors:
    - 404 `{ error: "not_found", message: "Memory not found" }`
    - 403 `{ error: "forbidden", message: "Not enough permissions" }`
  - Source: `backend/app/api/endpoints/memory.py::patch_memory`

- POST `/api/v1/users/me/checkins` (Auth: Bearer)
  - Description: Create a daily/weekly check-in as a memory.
  - Body (CheckInIn):
    - `prompt?`: string (optional UI prompt shown to user)
    - `content`: string (required)
    - `cadence?`: `daily` | `weekly` (default `daily`)
  - Response: `MemoryNode`
  - Metadata: sets `source` in `memory_metadata` to `checkin:{cadence}`
  - Source: `backend/app/api/endpoints/memory.py::create_checkin_memory`

- DELETE `/api/v1/memories/{memory_id}` (Auth: Bearer)
  - Description: Delete a memory you own
  - Status: 204 No Content
  - Errors: 404 not found, 403 not owner
  - Source: `backend/app/api/endpoints/memory.py::delete_memory`

- POST `/api/v1/conversations/{conversation_id}/auto-summarize` (Auth: Bearer)
  - Description: Create a lightweight automatic summary memory for the conversation.
  - Path:
    - `conversation_id`: UUID
  - Response: `MemoryNode`
  - Notes: Uses OpenRouter to generate a concise summary. The LLM call includes `user_id` and `conversation_id` in the system prompt per AI Integration Rules. The created memory includes `memory_metadata` such as `{ "source": "auto_summary", "meta": true, "llm": "openrouter:meta-llama/llama-3.3-70b-instruct" }`.
  - Errors: 404 not found, 403 not owner
  - Source: `backend/app/api/endpoints/memory.py::auto_summarize_conversation`

- POST `/api/v1/messages/{message_id}/feedback` (Auth: Bearer)
  - Description: Record feedback on an assistant message. Supports optional memory reinforcement/suppression when a `faiss_id` is supplied.
  - Path:
    - `message_id`: UUID (assistant message id)
  - Body (FeedbackIn):
    - `signal`: `up` | `down` (required)
    - `reason?`: string (optional free-text)
    - `faiss_id?`: string (optional FAISS memory id to reinforce/suppress)
  - Behavior:
    - Logs feedback. If `faiss_id` present and owned by the user:
      - `signal=up`: increments `reinforced_count` and increases `memory_metadata.rank_boost` (capped), improving future retrieval rank.
      - `signal=down`: applies a suppression window (`suppressed_until`, default 14 days) to exclude the memory from context.
  - Response: `{ "status": "recorded", "signal": "up|down" }`
  - Errors: 404 not found (message), 403 not owner
  - Source: `backend/app/api/endpoints/memory.py::message_feedback`

---

## Nudges

All Nudges endpoints require Bearer JWT and are scoped to the authenticated user.

Schemas: in-memory placeholder (no DB yet), see router `backend/app/api/endpoints/nudges.py`.

- NudgeItem
  - `id`: string
  - `nudge_type`: `morning` | `evening` | `weekly` | `opportunity` | `checkin`
  - `title`: string
  - `message`: string
  - `scheduled_for?`: ISO datetime string | null
  - `seen`: boolean

Endpoints:

- GET `/api/v1/users/me/nudges` (Auth: Bearer)
  - Description: List pending nudges for the current user (placeholder implementation)
  - Response: `NudgeItem[]`
  - Source: `backend/app/api/endpoints/nudges.py::list_my_nudges`

- POST `/api/v1/nudges/run` (Auth: Bearer)
  - Description: Trigger nudge materialization (dev stub)
  - Response: `{ status: "ok" }`
  - Source: `backend/app/api/endpoints/nudges.py::run_nudges`

---

## Example Requests

- Get token
```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=changeme" \
  http://localhost:8000/api/v1/login/access-token
```

- Create conversation
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat"}' \
  http://localhost:8000/api/v1/conversations/
```

- Add message
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Save this: My phone is 555-1234", "remember": true}' \
  http://localhost:8000/api/v1/conversations/$CID/messages
```

---

## Notes

- Versioning: All stable endpoints are under `/api/v1`.
- Authorization: Conversations and messages are scoped to the authenticated user; admin-only where specified.
- Implementation sources:
  - Routers: `backend/app/api/endpoints/*.py`
  - App & mounting: `backend/app/main.py`, `backend/app/api/api_v1/api.py`
  - Schemas: `backend/app/schemas/*.py`
