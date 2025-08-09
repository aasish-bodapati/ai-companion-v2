# AI Companion - Backend (Canonical)

This is the canonical FastAPI backend for the AI Companion application.

> The legacy single-file app `backend/main.py` is deprecated and will be removed. Use `backend/app/main.py`.

## Features

- JWT-based authentication
- User profile and management (admin-only creation)
- Conversations and messages APIs
- OpenAPI docs at `/api/v1/openapi.json` and Swagger UI at `/docs`

## Getting Started

### Prerequisites

- Python 3.10+
- pip (Python package manager)

### Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\\venv\\Scripts\\activate
   # macOS/Linux
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

```bash
uvicorn app.main:app --reload --app-dir backend
```

The API will be available at `http://localhost:8000`.

## Canonical API Endpoints

All endpoints are prefixed with `/api/v1`.

- Auth (form-encoded):
  - `POST /api/v1/login/access-token`
    - Body (x-www-form-urlencoded): `username`, `password`
    - Returns: `{ access_token, token_type }`
- Current user:
  - `GET /api/v1/users/me` with `Authorization: Bearer <token>`
- Conversations and messages:
  - See `docs/ground_truth/api_endpoints.md` for the full list and parameters.

Note: There is no public registration endpoint. User creation is admin-only.

## Testing

- Unit tests use FastAPI `TestClient` and override the DB to SQLite in-memory or file.
- Do not connect to external services for unit tests.

Run tests:

```bash
# unittest
python -m unittest discover -s backend -p "test_*.py" -v

# or pytest
pytest backend -q
```

## Project Structure

- `app/main.py` - FastAPI application with routers under `/api/v1`
- `app/api/` - API routers and versioned API setup
- `app/schemas/`, `app/models/`, `app/crud/` - Pydantic schemas, SQLAlchemy models, data access layer
- `alembic/` - Database migrations (for Postgres environments)
- `requirements.txt` - Python dependencies

## Documentation

See `docs/ground_truth/api_endpoints.md` for the canonical API documentation.

This project is proprietary and confidential.
