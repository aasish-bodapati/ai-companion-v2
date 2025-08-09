# Project Cleanup & Standards

This document defines cleanup rules and structural standards for AI Companion v2. It is source-of-truth. All changes must follow these rules.

## Scope
- Backend: `backend/app/` is the canonical FastAPI app. Legacy `backend/main.py` is deprecated.
- Frontend: Next.js app under `frontend/` uses `/api/v1` endpoints via `src/lib/api.ts`.
- Docs: All canonical API docs live in `docs/ground_truth/api_endpoints.md`.

## File Hygiene
- Do not commit local artifacts:
  - venv/, .venv/, __pycache__/, .pytest_cache/, .coverage
  - *.db (SQLite files)
- Remove deprecated/duplicate files. If deletion isn’t possible, mark with a deprecation banner and ensure they are not imported.

## Backend Standards
- App entry: `backend/app/main.py`.
- Routers live under `backend/app/api/endpoints/` and are included via `backend/app/api/api_v1/api.py` with prefix `/api/v1`.
- Schemas under `backend/app/schemas/`, models under `backend/app/models/`, CRUD under `backend/app/crud/`.
- Auth: JWT Bearer. No public registration endpoint. Admin-only user creation.
- DB:
  - Local dev/test: SQLite (in-memory/file) with dependency override in tests.
  - Production: Postgres via `SQLALCHEMY_DATABASE_URI`. No automatic table creation; use migrations.
- CORS: configured from settings.

## Testing Standards
- Use FastAPI `TestClient` against the app object from `backend/app/main.py`.
- Override `get_db` dependency to point to SQLite for tests. Never reach Postgres or network.
- Tests target canonical endpoints (e.g., `/api/v1/login/access-token`, `/api/v1/users/me`, `/api/v1/conversations/*`).
- External/network scripts (curl-like) are not tests; keep them under `scripts/` if needed, not named `test_*.py`.

## Frontend Standards
- All API calls must go through `frontend/src/lib/api.ts`. No hardcoded `http://localhost:8000` in components.
- `NEXT_PUBLIC_API_URL` should be set (e.g., `http://localhost:8000/api/v1`). The client appends `/api/v1` if missing.
- Tailwind only for styling. TypeScript strict mode on. Always type API responses.

## Deprecations
- Legacy backend file `backend/main.py` is deprecated. Do not import or run it.
- Duplicate utilities (e.g., `backend/list_routes2.py`) must be removed or replaced by `backend/list_routes.py`.
- Legacy tests targeting `/register` or `/token` must be removed or disabled.

## Operational
- Run backend: `uvicorn app.main:app --reload --app-dir backend`
- Run tests: `python -m unittest discover -s backend -p "test_*.py" -v` or `pytest backend -q`

## Change Management
- Any new rules must be added here and linked from `08_project_reference_index.md`.
