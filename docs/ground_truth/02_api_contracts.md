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
