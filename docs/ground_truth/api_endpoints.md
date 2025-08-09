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
  - Response: `Message`
  - Errors: 404 not found, 403 not owner
  - Source: `backend/app/api/endpoints/conversations.py::create_message`

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
  -d '{"role": "user", "content": "Hello"}' \
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
