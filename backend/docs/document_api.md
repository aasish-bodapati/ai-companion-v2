# Document Management API

This document describes the API endpoints for managing documents in the AI Companion application.

## Base URL

```
/api/v1/documents
```

## Authentication

All endpoints require authentication. Include a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Upload a Document

Upload a new document for processing and storage.

```http
POST /api/v1/documents/upload
```

**Form Data:**
- `file` (required): The document file to upload (PDF, DOCX, TXT, etc.)
- `title` (optional): Document title (defaults to filename)
- `description` (optional): Document description
- `metadata` (optional): JSON string of additional metadata
- `process_async` (optional, default: true): Process document asynchronously

**Response:**
```json
{
  "id": 1,
  "title": "Document Title",
  "file_name": "example.pdf",
  "file_type": "application/pdf",
  "file_size": 1024,
  "status": "processing",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "metadata": {}
}
```

### 2. List Documents

List all documents for the authenticated user with optional filtering.

```http
GET /api/v1/documents/?skip=0&limit=100&include_chunks=false&search_query=example&file_type=application/pdf&tags=tag1&tags=tag2
```

**Query Parameters:**
- `skip` (optional, default: 0): Number of documents to skip
- `limit` (optional, default: 100, max: 1000): Maximum number of documents to return
- `include_chunks` (optional, default: false): Include document chunks in the response
- `search_query` (optional): Search query to filter documents by title, description, or filename
- `file_type` (optional): Filter by file MIME type (e.g., 'application/pdf')
- `tags` (optional, repeatable): Filter by tags (AND condition)

### 3. Get Document Details

Get details for a specific document by ID.

```http
GET /api/v1/documents/{document_id}?include_chunks=true&chunk_limit=50&chunk_offset=0
```

**Query Parameters:**
- `include_chunks` (optional, default: false): Include document chunks in the response
- `chunk_limit` (optional, default: 50, max: 500): Maximum number of chunks to return
- `chunk_offset` (optional, default: 0): Number of chunks to skip

### 4. Download Document

Get a signed URL to download a document.

```http
GET /api/v1/documents/{document_id}/download?expires_in=3600
```

**Query Parameters:**
- `expires_in` (optional, default: 3600): URL expiration time in seconds

### 5. Update Document

Update a document's metadata.

```http
PUT /api/v1/documents/{document_id}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "metadata": {
    "key": "value"
  }
}
```

### 6. Delete Document

Delete a document and all associated data.

```http
DELETE /api/v1/documents/{document_id}
```

### 7. Reprocess Document

Reprocess a document to update its text extraction and embeddings.

```http
POST /api/v1/documents/{document_id}/reprocess
```

### 8. Document Tags

#### Get All Tags

```http
GET /api/v1/documents/tags/?min_count=1
```

**Query Parameters:**
- `min_count` (optional, default: 1): Minimum number of documents a tag must be used in

#### Add Tags to Document

```http
POST /api/v1/documents/{document_id}/tags
```

**Request Body:**
```json
{
  "tags": ["tag1", "tag2"],
  "replace": false
}
```

#### Remove Tags from Document

```http
DELETE /api/v1/documents/{document_id}/tags
```

**Request Body:**
```json
{
  "tags": ["tag1", "tag2"]
}
```

### 9. Search Documents

Search across documents using semantic search.

```http
POST /api/v1/documents/search
```

**Request Body:**
```json
{
  "query": "search query",
  "limit": 10,
  "threshold": 0.5,
  "include_content": true,
  "file_types": ["application/pdf"],
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
[
  {
    "chunk_id": 1,
    "document_id": 1,
    "chunk_index": 0,
    "content": "Relevant text from document...",
    "similarity": 0.87,
    "document": {
      "id": 1,
      "title": "Document Title",
      "file_name": "example.pdf",
      "file_type": "application/pdf",
      "created_at": "2023-01-01T00:00:00Z",
      "metadata": {}
    },
    "chunk_metadata": {}
  }
]
```

## Error Responses

All endpoints return standard HTTP status codes. In case of an error, the response will include a JSON object with an error message:

```json
{
  "detail": "Error message"
}
```

Common error status codes:
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

API is rate limited to 1000 requests per hour per user by default.
