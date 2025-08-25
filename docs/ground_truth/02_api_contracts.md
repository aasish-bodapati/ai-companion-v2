# API Contracts

## Authentication

### Get Access Token
- **Endpoint**: `POST /token`
- **Description**: Get JWT token for authentication
- **Request**:
  ```json
  {
    "username": "user@example.com",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  }
  ```
- **Error Responses**:
  - 400: Invalid credentials
  - 422: Validation error

## Conversations

### List Conversations
- **Endpoint**: `GET /api/v1/conversations/`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "title": "First Conversation",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ]
  ```

### Create Conversation
- **Endpoint**: `POST /api/v1/conversations/`
- **Headers**: `Authorization: Bearer <token>`
- **Request**:
  ```json
  {
    "title": "New Conversation"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "uuid",
    "title": "New Conversation",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
  ```

## Messages

### List Messages
- **Endpoint**: `GET /api/v1/conversations/{conversation_id}/messages`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "content": "Hello, world!",
      "role": "user",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
  ```

### Send Message
- **Endpoint**: `POST /api/chat`
- **Headers**: `Authorization: Bearer <token>`
- **Request**:
  ```json
  {
    "conversation_id": "uuid",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "response": "Hello! How can I help you today?",
    "message_id": "uuid"
  }
  ```

## Users

### Get Current User
- **Endpoint**: `GET /api/v1/users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "is_active": true,
    "is_superuser": false
  }
  ```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Memory

### List My Memories
- Endpoint: `GET /api/v1/users/me/memories`
- Headers: `Authorization: Bearer <token>`
- Query Params:
  - `content_type` (optional, string) — filter by memory content type
  - `limit` (optional, int, default 100) — max items
- Response (200 OK):
```json
[
  {
    "id": "uuid",
    "content": "User prefers concise responses",
    "content_type": "preference",
    "user_id": "uuid",
    "conversation_id": null,
    "relevance_score": 0.92,
    "memory_metadata": null,
    "timestamp": "2025-08-10T17:00:00Z"
  }
]
```

### Conversation Memory Context
- Endpoint: `GET /api/v1/conversations/{conversation_id}/memory-context`
- Headers: `Authorization: Bearer <token>`
- Response (200 OK):
```json
{
  "context": [
    {
      "id": "profile",
      "content": "Serialized onboarding/profile facts...",
      "type": "profile",
      "relevance": 1.0,
      "timestamp": "2025-08-10T17:00:00Z"
    },
    {
      "id": "faiss-123",
      "content": "Long-term memory snippet...",
      "type": "fact",
      "relevance": 0.88,
      "timestamp": "2025-08-09T09:12:34Z"
    }
  ]
}
```

---

## Utils

### Retrieval Settings (Read-only)
- Endpoint: `GET /api/v1/utils/retrieval-settings`
- Response (200 OK):
```json
{
  "MEMORY_ENABLED": true,
  "MEMORY_PROVIDER": "faiss",
  "EMBEDDING_MODEL_NAME": "all-MiniLM-L6-v2",
  "RETRIEVAL_TOP_K": 12,
  "RETRIEVAL_RECENT_MESSAGES": 5,
  "MEMORY_MIN_RELEVANCE": 0.5
}
```

### CSRF Token
- Endpoint: `GET /api/v1/utils/csrf-token`
- Description: Issues a CSRF token and sets a `csrftoken` cookie (`SameSite=Lax`, `Secure` in production). SPA should send this token in the `X-CSRF-Token` header for state-changing requests.
- Response (200 OK):
```json
{ "csrf_token": "<token>" }
```

---

## Standardized Error Response Shape

All API errors are normalized to the following JSON shape:
```json
{
  "detail": "Human-readable summary",
  "message": "Human-readable summary (alias of detail)",
  "errors": [
    {
      "loc": ["body", "field"],
      "msg": "Field required",
      "type": "value_error.missing"
    }
  ]
}
```
Notes:
- `errors` is `null` for non-validation errors.
- Validation failures return HTTP 422 with `errors` populated.
