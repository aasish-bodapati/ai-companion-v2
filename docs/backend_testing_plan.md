# Backend Testing Plan – AI Companion v2

## 1. Overview
This document describes the backend testing strategy for AI Companion v2, with the goal of increasing backend coverage from **8% → 80%+** while ensuring stability, correctness, and maintainability.

**Backend stack:**
- **Framework:** FastAPI 0.95+
- **Database:** SQLite (dev), PostgreSQL (prod)
- **ORM:** SQLAlchemy 1.4+
- **Auth:** JWT
- **AI Integration:** Together AI API
- **Testing Framework:** pytest

---

## 2. Testing Priorities

### Critical (Weeks 1–2)
1. **Stability** – Reproduce and prevent:
   - 500 errors on `POST /api/chat`
   - SQLite threading issues
2. **Auth Flow**
   - Token creation/verification
   - Token URL mismatch fix
   - Protected endpoint access tests
3. **DB Reliability**
   - Conversation/message creation
   - FK constraints
4. **Input Validation**
   - Required fields, invalid payloads

### Medium (Weeks 3–4)
- Schema validation against Pydantic models
- Pagination, sorting, and search endpoints
- Error response consistency
- DB migrations and index checks

### Long-Term (Month 2+)
- WebSocket real-time updates testing
- Performance/load testing for chat endpoints
- Plugin system integration tests

---

## 3. Test Types & Scope

### 3.1 Unit Tests (Fast)
- Business logic functions:
  - Password hashing/verification
  - Token generation/validation
  - Memory/embedding transforms (if pure)
- Edge cases:
  - Empty/oversized inputs
  - Expired tokens
  - Invalid UUIDs

### 3.2 Integration Tests (Most Important)
Test endpoints with FastAPI TestClient + test database.

Endpoints to cover:
- `POST /token` – valid/invalid creds, expired tokens, URL mismatch
- `GET /api/v1/conversations/` – auth required, empty list, pagination
- `POST /api/v1/conversations/` – valid payload, missing fields, invalid FK
- `GET /api/chat` – retrieval with/without conversation_id
- `POST /api/chat` – success, LLM timeout, invalid payload, concurrent requests

### 3.3 Contract / Schema Tests
- Validate OpenAPI schema matches responses
- Ensure response fields don’t change unexpectedly

### 3.4 Security Tests
- JWT tampering attempts
- Missing/invalid auth header
- Rate-limiting abuse simulation (document if missing)

### 3.5 Non-functional Tests
- Concurrency test for `POST /api/chat`
- Load testing (small scale) to detect threading bugs

---

## 4. Test Infrastructure

**Tools:**
- `pytest` + `pytest-asyncio`
- `pytest-cov` for coverage
- `httpx.AsyncClient` for async HTTP calls
- `factory_boy` for test data
- `freezegun` for time control
- `respx` for mocking Together AI API calls

**Database in tests:**
- **Primary:** PostgreSQL (via Docker or testcontainers)
- Alembic migrations applied in test setup
- Mock Together AI responses in tests (no live calls in CI)

---

## 5. Fixtures

Suggested pytest fixtures:
- `db_session` – new DB session per test
- `client` – FastAPI test client with test DB
- `auth_token` – creates test user & returns JWT
- `mock_together_api` – mocks LLM responses

---

## 6. CI/CD Integration

**GitHub Actions / GitLab CI:**
1. Spin up PostgreSQL service
2. Apply migrations (`alembic upgrade head`)
3. Run tests with coverage:
   ```bash
   pytest --cov=app --cov-report=term-missing
