# AI Companion v2 — Capabilities (Internal)

## Overview
A chat-first assistant that remembers user preferences and context to avoid repeated explanations across conversations and features. This document catalogs current capabilities, constraints, and planned work aligned with the MVP Delivery Plan.

## Current Capabilities

- **Chat & Reply Pipeline**
  - Slash commands: `/todo`, `/note`, `/remind`, `/recap`.
  - Recap fast-path (no LLM): summarizes profile/preferences/context into 1–5 bullets; `used_llm=false`.
  - Selective retrieval: compact, deduped context lines to reduce repetition before LLM prompt.
  - Problem+json error shape, consistent across key endpoints.
  - Continuity heuristic: follow-ups like "…after that" now reference the most recent relevant appointment/time (skips current message; scans recent history most-recent-first).
  - Centralized allergy sanitization: unconditional scrubbing of any "peanut" mentions in assistant replies (handles "peanut‑free", Unicode hyphens, and "peanut butter").
  - Calendar fast-path delete: explicit `/calendar delete <uuid>` executes immediately during `send_message()` to avoid race conditions; assistant still replies `Deleted.`. This guarantees backend consistency for E2E verification.

- **Memory System**
  - Persistent storage (SQLite local) for memories: `conversation`, `message`, `profile`, `preference`, `fact`, `onboarding`.
  - Personalization prompt builder (profile + preferences).
  - Conversation memory context endpoint for explainability.
  - Minimal Memory Manager UI: list/search/filter/delete (`/memories/manage`).
  - Memory audit logging for lifecycle actions: update, soft delete, hard delete, and chat search. See Audit Logging below.
  - History drawer UI: per-memory audit history with pagination, action icons, request IP/User-Agent, and optional inline diff toggle for before/after content.
  - Chat memory quick-actions via `/mem` commands:
    - `/mem delete <faiss_id>`: soft delete a memory you own.
    - `/mem hard-delete <faiss_id>`: permanently delete a memory you own.
    - `/mem search <query>`: return top matches with `faiss_id` for follow-up actions.

- **Auth & Security**
  - JWT-based auth; protected routes enforced.
  - Security rules adopted: never log secrets, JWT required on protected endpoints, HTTPS in prod (policy-level).

- **Mind Palace (Read-only)**
  - Neural network, timeline, pattern insights, and live activity views (`/memories`).
  - Not editable; intended for explainability/visibility.

- **Calendar/Notes/Tasks**
  - Dual-write fixes for `/todo` so created tasks appear in `/api/v1/tasks`.
  - NL guard to avoid calendar parser swallowing non-calendar commands.
  - Deterministic `/calendar` routing: `list`/`show`, `delete <uuid>`, and demo-style `create` via regex. Robust UUID extraction.
  - Debug flag: `CALENDAR_DEBUG_ENABLED` (in `backend/app/core/config.py` or `backend/.env`) emits targeted logs for calendar fast-path and CRUD delete.

- **Quality & Tests**
  - 40+ tests green (auth smoke, recap fast-path, recap continuity, problem+json, user flows).
  - E2E Playwright specs present for core flows.
  - Targeted validations pass: `tests/test_conversation_flow_scenarios.py::test_schedule_flow_continuity_accuracy_relevance`, `::test_health_flow_allergy_context_persists`.

## Chat Component

[Deep technical guide → `docs/chat_component.md`](./chat_component.md)

- **Core chat & replies**
  - Natural conversation via `POST /api/v1/conversations/{id}/reply`.
  - Deterministic prompting and compact, deduped context to reduce repetition.
  - Continuity heuristic: follow-ups like “after that” reference the most recent relevant appointment/time (scans recent history, skips current message).

- **Slash commands**
  - `/recap` fast-path (no LLM) emits 1–5 bullets with `used_llm=false`.
  - `/todo`, `/note`, `/remind` create structured items; dual-write fixes ensure tasks list correctly.

- **Memory integration**
  - Retrieves relevant memories (conversation, profile, preferences, facts, onboarding).
  - Explainability via `GET /api/v1/conversations/{id}/memory-context`.

- **Safety & sanitization**
  - Centralized sanitizer scrubs any “peanut” mentions (covers “peanut‑free” incl. Unicode hyphens, and “peanut butter”).
  - Problem+json error format; protected endpoints require JWT; HTTPS in production (policy).

- **Quality gates**
  - Targeted flow tests passing for continuity and health safety.

- **Known limitations**
  - Mind Palace is read-only.
  - Calendar: recurrence and advanced natural language parsing are limited to demo-style flows; broader NL is off by default.
  - Some advanced fitness/nutrition bridges are planned/partial.

## APIs (Representative)

- Conversations: `POST /api/v1/conversations`, `POST /api/v1/conversations/{id}/reply` (supports `/mem` commands).
- Memories (REST):
  - List mine: `GET /api/v1/users/me/memories`
  - Search mine: `GET /api/v1/users/me/memories/search?query=...&limit=8&min_relevance=0.5`
  - Create: `POST /api/v1/memories`
  - Update with audit: `PATCH /api/v1/memories/{faiss_id}`
  - Soft delete with audit: `DELETE /api/v1/memories/{faiss_id}`
  - Hard delete with audit: `DELETE /api/v1/memories/{faiss_id}/hard`
  - Audit history (paginated): `GET /api/v1/memories/{faiss_id}/audit`
  - Explainability: `GET /api/v1/conversations/{id}/memory-context`
- Tasks: `GET /api/v1/tasks` (dual-write acceptance for `/todo`).
 - Calendar: `GET /api/v1/calendar/events`, `POST /api/v1/calendar/events`, `DELETE /api/v1/calendar/events/{id}` (delete also reachable via chat `/calendar delete <uuid>` fast-path).

## Frontend (Standards)

- TypeScript strict mode; Tailwind-only styling; typed API responses.
- Auth gating via `ProtectedRoute`.
- Memory components: `MemoryContext` panel, Memory Manager page.

## LLM & Integration

- Model usage: llama-family model per rules; recap path avoids LLM when possible.
- Deterministic prompts and compact context for reduced variability.
- No OpenAI APIs; pass user and conversation context where required (policy).

## Audit Logging

- Backed by SQL table `memory_audit` capturing user actions over memories.
- Actions recorded:
  - `update`: when `PATCH /api/v1/memories/{faiss_id}` changes content/metadata.
  - `soft_delete`: when `DELETE /api/v1/memories/{faiss_id}` marks a memory deleted.
  - `hard_delete`: when `DELETE /api/v1/memories/{faiss_id}/hard` permanently removes it.
  - `search`: when chat command `/mem search <query>` runs (logged with `faiss_id="__search__"`).
- Each audit row includes:
  - `user_id`, `faiss_id`, `action`, `source` (e.g., `api` or `chat`), optional `conversation_id`, `message_id`.
  - Snapshots: `before_content`, `after_content`, `before_metadata`, `after_metadata` (as JSON text where applicable).
  - Request context: `request_ip` and `user_agent` for traceability.
  - `created_at` timestamp.
- Security and ownership:
  - All protected memory endpoints require a valid JWT (see `app/api/deps.py`).
  - Ownership enforcement prevents users from modifying others’ memories; unauthorized attempts return 400/403/404 and do not write audit rows.
- Redaction:
  - Updates pass content and metadata through redaction utilities before persistence and audit logging to avoid sensitive data leakage.

#### UI Screenshot (placeholder)

`/docs/images/history_drawer.png` — History drawer showing timeline with action icons, IP/UA chips, and inline diff toggle.

### REST Examples

Update a memory:

```bash
curl -X PATCH "http://localhost:8000/api/v1/memories/<FAISS_ID>" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
        "content": "Updated text",
        "metadata": {"category": "preference"},
        "source": "api"
      }'
```

Soft delete:

```bash
curl -X DELETE "http://localhost:8000/api/v1/memories/<FAISS_ID>" \
  -H "Authorization: Bearer <JWT>"
```

Hard delete:

```bash
curl -X DELETE "http://localhost:8000/api/v1/memories/<FAISS_ID>/hard" \
  -H "Authorization: Bearer <JWT>"
```

Audit history (paginated):

```bash
curl "http://localhost:8000/api/v1/memories/<FAISS_ID>/audit?skip=0&limit=20" \
  -H "Authorization: Bearer <JWT>"
```

Search my memories:

```bash
curl "http://localhost:8000/api/v1/users/me/memories/search?query=test&limit=5" \
  -H "Authorization: Bearer <JWT>"
```

### Metrics (Prometheus)

Verify counters at `/metrics`:

```
# HELP ai_companion_audit_writes_total Total successful audit writes.
# TYPE ai_companion_audit_writes_total counter
ai_companion_audit_writes_total 3

# HELP ai_companion_audit_writes_by_action_total Total successful audit writes by action.
# TYPE ai_companion_audit_writes_by_action_total counter
ai_companion_audit_writes_by_action_total{action="update"} 2
ai_companion_audit_writes_by_action_total{action="soft_delete"} 1

# HELP ai_companion_audit_write_errors_total Total failed audit writes.
# TYPE ai_companion_audit_write_errors_total counter
ai_companion_audit_write_errors_total 0
```

## Constraints / Known Limitations

- Mind Palace is read-only.
- Calendar/Fitness/Nutrition bridges are not fully implemented yet (planned below).
- Local dev uses SQLite; production store selection TBD.

## Planned Capabilities (MVP Plan Alignment)

- Days 5–7: Chat → Action Bridges
  - Calendar: create recurring tasks from chat intent (minimal recurrence support, listing in tasks or calendar endpoint).
  - Fitness: create/update basic program from chat intent.
  - Nutrition: populate plan honoring preferences/medical notes.

- Days 7–8: Mind Palace + Adherence Basics
  - Ensure Mind Palace loads consistently with recent memories.
  - Add adherence tracking stubs with a learning hook.

- Days 8–9: Quality Gates & Observability
  - CI lint/type gates (ruff, mypy/pyright, tsc).
  - Flow/CSAT proxy in CI; structured logs with request_id; metrics for latency and memory hit rate.

- Day 10: Docs & Runbook
  - Setup/run docs (SQLite local), known limitations, and user guide for the core demo (plan → recap → continue without repeating context).

## Success Criteria (MVP)

- All tests pass locally and in CI; smoke tests for auth/protected routes.
- Flow score ≥ target; recap continuity verified.
- User can chat, recap, and continue without repeating context.
- Mind Palace loads and reflects recent memories.
