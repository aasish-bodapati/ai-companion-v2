# Memory API Contract

This document defines the canonical API shapes and rules for the Memory subsystem.
It is source-of-truth and must be kept in sync with backend and frontend.

Linked from: `08_project_reference_index.md`

---

## Entity: MemoryNode

Returned by memory endpoints, shaped by `backend/app/schemas/memory.py` (`MemoryNodeResponse`).

- id: string (UUID)
- faiss_id: string (UUID)
- content: string
- content_type: string (e.g., conversation | message | fact | onboarding)
- user_id: string
- conversation_id: string | null
- relevance_score: number
- importance_score: integer (0..100) — UI-facing importance; backfilled from relevance_score*100
- timestamp: ISO datetime string
- memory_metadata: object | null
  - Note: Exposed as an object in responses (not a JSON string).
  - Keys used today:
    - core: boolean — if true, treated as Core memory.
    - importance: number — used by auto‑promotion heuristics.
    - reinforced_count: number — reinforcement signals total.
    - auto_promoted_at: ISO string — timestamp when auto‑promoted.
    - source: string — provenance (e.g., chat:remember, auto_summary).

Backend stores metadata as JSON string in DB (`models.memory.MemoryNode.memory_metadata`),
but responses always parse it to an object by Pydantic validator.

---

## Endpoints

- GET `/api/v1/users/me/memories`
  - Query params: `content_type?: string`, `limit?: number`, `core?: boolean`
  - Returns: MemoryNode[]
  - Behavior: when `core=true|false`, items are filtered by `memory_metadata.core`.

- POST `/api/v1/memories`
  - Body: { content: string; content_type?: string; conversation_id?: string; core?: boolean; importance?: number; importance_score?: integer (0..100); source?: string; message_id?: string }
  - Returns: MemoryNode
  - Behavior: `core` and other hints are written to `memory_metadata`.
  - Behavior: `importance_score` is preferred if provided; otherwise `importance` (0..1) is scaled to 0..100; default 0.

- PATCH `/api/v1/memories/{memory_id}`
  - Body: { content?: string; relevance_score?: number; importance_score?: integer (0..100); core?: boolean }
  - Returns: MemoryNode
  - Behavior: toggles `memory_metadata.core` when provided.
  - Behavior: updates `importance_score` when provided (clamped 0..100).

- DELETE `/api/v1/memories/{memory_id}`
  - Deletes a memory (must be owned by current user).

- GET `/api/v1/conversations/{conversation_id}/memory-context`
  - Returns: { context: Array<{ id, content, type, relevance, timestamp, reason }> }
  - Reason may include `core=true`, `importance=`, etc. derived from metadata.

- GET `/api/v1/users/me/memories/digest`
  - Returns memory stats used by Brain Meter and candidate IDs for promotion.

---

## Frontend Contract

- `frontend/src/features/memory/api.ts` types must reflect that `memory_metadata` is an object.
- Components should reference metadata directly (e.g., `node.memory_metadata?.core === true`) without JSON.parse.
- Core tab (`/memories/core`) must call `listMyMemories({ core: true })` to fetch only core items.

---

## Testing Guidance

- Mock `listMyMemories` to return nodes where `memory_metadata` is an object.
- Verify Core filtering logic and promote/demote actions call `updateMemory` with `{ core: true|false }`.
- Validate that `importance_score` is present in responses and can be updated via PATCH. Ensure backfill populated existing rows (~relevance_score*100).

---

## Security Notes

- Authentication required: all memory endpoints require a valid JWT.
- Never log tokens or sensitive metadata.
- Use HTTPS in production.
