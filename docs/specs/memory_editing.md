# Spec: Conversational Memory Editing (API + Intents)

## Goals
- Allow users to correct and update stored memories without re-explaining context.
- Support `preference`, `fact`, and `message` memory types.
- Provide deterministic chat intents to perform safe edits with confirmations.

## Non-Goals (MVP)
- No bulk imports.
- No cross-user edits.
- No auto-edits without explicit user confirmation.

## Security & Compliance
- Auth: JWT required for all endpoints (see `backend/app/api/deps.py`).
- TLS: HTTPS in production.
- Audit: all edits are append-only with an audit trail (who, when, before→after).
- PII: do not log full memory contents when `SENSITIVE_LOGGING_DISABLED`.

## Data Model (concept)
- Memory: `{ id, user_id, type: 'preference'|'fact'|'message', content, metadata, created_at, updated_at, deleted_at? }`
- MemoryEditAudit: `{ id, memory_id, user_id, action: 'update'|'delete'|'restore', before, after, reason, created_at }`

## API Endpoints (proposed)
- POST `/api/v1/memories/search`
  - Body: `{ query: string, types?: string[], limit?: number }`
  - Returns: `Memory[]`
- POST `/api/v1/memories`
  - Body: `{ type, content, metadata? }`
  - Returns: `Memory`
- PATCH `/api/v1/memories/{id}`
  - Body: `{ content?: string, metadata?: object, reason?: string }`
  - Returns: `{ memory: Memory, audit: MemoryEditAudit }`
- DELETE `/api/v1/memories/{id}`
  - Query: `{ reason?: string }`
  - Soft delete; returns `{ ok: true, audit: MemoryEditAudit }`
- POST `/api/v1/memories/{id}/restore`
  - Returns: `{ memory: Memory, audit: MemoryEditAudit }`

All responses typed (see Coding Standards). Errors: JSON with `detail`.

## Chat Intents (deterministic)
- Update Preference
  - Triggers on: `update my preference`, `change my preference`, `set my preference`.
  - Steps:
    1) Extract target preference (by key or semantic search top-1 with threshold).
    2) Confirm: "I found X. Update to: Y?"
    3) On "yes": call PATCH; else provide edit choices.
- Correct Fact
  - Triggers on: `that's wrong`, `correction:`, `actually,` with entity/value present.
  - Same confirm→PATCH flow.
- Remove Memory
  - Triggers on: `forget`, `remove that`, `delete this memory`.
  - Confirm target; call DELETE (soft).

## Disambiguation Strategy
- When multiple candidates: show top-3 with short snippets and IDs.
- Require explicit selection before edit.
- If below confidence threshold: ask user to paste/quote the memory.

## UX Copy (examples)
- Confirm update: "Update preference 'workout_time' to 'evenings'?"
- Confirm delete: "Delete memory 'Peanut allergy' (id ...)?"
- Success: "Updated. You can undo with 'restore <id>'."
- Failure: "I couldn't edit that. Please try again or specify the memory ID."

## Telemetry
- Emit counters: `memory.edit.update|delete|restore` (success/failure), latencies, top failure reasons.

## Risks
- Over-edit: wrong target chosen. Mitigation: confirmation + threshold + top-3 list.
- Prompt injection: enforce intent whitelist and server-side confirmations.

## Open Questions
- Should we allow partial redactions within a memory? (Out of scope for MVP.)
- Versioning strategy for messages vs. preferences? (Start with audit table.)

## Acceptance Criteria
- User can correct a fact via chat with confirmation; reflected in `/memories/{id}`.
- User can change a preference and see behavior change next turn.
- All edits are audited; soft-deleted memories are excluded from retrieval by default.
