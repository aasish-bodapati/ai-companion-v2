# Standardized Error Response Shape

This document defines the canonical error shape for all backend HTTP responses. All FastAPI routes must return errors in this format (directly or via global handlers).

## Global Exception Handlers

Implemented in `backend/app/main.py`:

- `HTTPException` handler:
  - Returns the following JSON body with original status code (e.g., 401, 403, 404):
  ```json
  {
    "detail": "<message>",
    "message": "<message>",
    "errors": null
  }
  ```
  - `message` mirrors `detail` for compatibility with clients.

- `RequestValidationError` handler (422):
  - Returns the following JSON body:
  ```json
  {
    "detail": "Validation Error",
    "message": "Validation Error",
    "errors": [ { "loc": [...], "msg": "...", "type": "..." }, ... ]
  }
  ```

## Examples

- Unauthorized (401) / Forbidden (403):
  ```json
  {
    "detail": "Not authenticated",
    "message": "Not authenticated",
    "errors": null
  }
  ```

- Not Found (404):
  ```json
  {
    "detail": "Not Found",
    "message": "Not Found",
    "errors": null
  }
  ```

- Validation Error (422):
  ```json
  {
    "detail": "Validation Error",
    "message": "Validation Error",
    "errors": [ { "loc": ["body", "field"], "msg": "field required", "type": "value_error.missing" } ]
  }
  ```

## Frontend Notes

- Frontend should read `message` for user-visible copy and can display field-level details from `errors` when present.
- This shape is stable and should be considered the single source of truth for client error handling.

## Tests

- See `backend/tests/api/test_error_shape.py` for automated validation of standardized error responses.
