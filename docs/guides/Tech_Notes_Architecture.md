# Tech Notes / Architecture

Purpose: Document choices so future-you doesn’t forget.

## Stack
- Frontend: Next.js (React + TypeScript, Tailwind)
- Backend: FastAPI (Python 3.11)
- DB: SQLite (dev) → Postgres (scale path)
- Vector Index: FAISS (dev) → pgvector (scale path)
- Hosting: Vercel/Netlify (frontend), Railway/Fly/Render (backend)

## Key APIs / Integrations
- OpenAI (LLM)
- (Optional) Calendar bridge via provider API (confirm-before-write)

## Data Flow (high level)
- User → Frontend (chat) → API → memory_service (write)
- API → retrieval_service (read: vector + filters) → reasoning/guardrails → response generator
- API ↔ Third-party API (action execution) → confirm-before-write

## Modules & Responsibilities
- `memory_service`: upsert, reconcile, provenance, TTL policies
- `retrieval_service`: hybrid search, scoring, ranking
- `reasoning/guardrails`: check-before-ask, repetition guard, content safety
- `actions_service`: confirms, executes, idempotency via `client_action_id`

## Decisions Log
- Use strict TypeScript; no inline styles (Tailwind only)
- Deterministic upsert policies; never silently overwrite strong preferences
- RFC 7807 error shapes; versioned API contracts
- HTTPS in production; JWT-protected endpoints; redact secrets in logs
- For tests: run changed and related tests only; mock time and seeds; sanitize snapshots

## Open Questions / Risks
- Retrieval scaling under multi-user load (latency + throughput)
- Memory reconciliation conflicts (user edits vs inferred updates)
- Cost controls for LLM calls; caching and batching strategies
