# Brain Meter and Memory Provenance

This document defines the UX and backend/ frontend behavior for the Brain Meter and Memory Provenance.

## Goals
- Provide a light, always-available indicator of the companion’s understanding growth.
- Keep memory management in-flow (inside chat) with minimal UI.
- Track provenance of memory captures to improve observability and future tuning.

## Concepts
- Brain Meter: small header chip showing Level 1..5 derived from memory stats.
- Provenance: metadata about how a memory was captured.

## UX
- Chat Header: shows a chip "🧠 L{level}" with tooltip: "Level {level} • Core {core_count} • Memories {total_count}".
- Assistant messages: Helpful / Not helpful; Remember selection (requires text selection).
- User messages: Remember this; Save as Core.
- Memories page: optional/advanced; not required for daily usage.

## Backend
- Endpoint: GET /api/v1/users/me/memories/digest
  - Response fields:
    - total_count: int
    - core_count: int
    - reinforced_sum: int
    - level: int (1..5)
    - candidate_ids: string[] (non-core items near promotion thresholds)
  - Level heuristic: buckets from core_count
    - [0-2] → 1, [3-6] → 2, [7-12] → 3, [13-20] → 4, >20 → 5

- Provenance on create memory (POST /api/v1/memories):
  - Optional fields: source (string), message_id (UUID)
  - Metadata stored under memory_metadata:
    - source: one of
      - chat:remember (full user message)
      - chat:assistant_selection (selected snippet of assistant message)
    - message_id: the related chat message id

## Frontend
- Fetch digest via getMemoryDigest() and render brain chip in Chat header.
- Pass provenance when saving memories:
  - User message → source: "chat:remember", message_id: message.id
  - Assistant selection → source: "chat:assistant_selection", message_id: message.id

## Interaction with Auto-Promotion
- Auto-promotion remains governed by env tunables:
  - MEMORY_CORE_AUTOPROMOTE_ENABLED
  - MEMORY_CORE_IMPORTANCE_MIN
  - MEMORY_CORE_REINFORCE_MIN
- Digest candidates are computed against near-threshold criteria and can be surfaced in future UI.

## Metrics (future)
- Counters for capture, auto-promote, manual promote/demote, reinforcement.
- Weekly digest endpoint can summarize "What I learned" and suggested promotions.

## Security
- Do not log secrets. All protected endpoints require JWT. Use HTTPS in production.

## References
- docs/ground_truth/13_memory_promotion_policy.md
- backend/app/api/endpoints/memory.py
- frontend/src/features/chat/components/ChatArea.tsx
- frontend/src/features/memory/api.ts

## Lifecycle (caps, soft-forget, consolidation)
- Purpose: keep storage bounded and retrieval high-signal as memories grow.
- Tunables (backend/app/core/config.py):
  - MEMORY_MAX_ITEMS_PER_USER (int, default 20000)
  - MEMORY_MAX_MEMORIES (legacy alias, default 20000)
  - MEMORY_FORGET_AGE_DAYS (int, default 90)
  - MEMORY_SOFT_FORGET_ON_WRITE (bool, default true)
- Behavior:
  - Soft-forget on write: after `store_memory()`, suppress stale, low-importance, non-core memories beyond cap by setting `memory_metadata.suppressed_until` far in the future.
  - Consolidation: merge duplicates by `consolidation_key`, suppress older dupes.
- APIs:
  - POST `/api/v1/users/me/memories/lifecycle?consolidate=true|false` → runs soft-forget and optional consolidation for current user.
  - POST `/api/v1/users/me/memories/consolidate` → consolidation only.
- Frontend hooks:
  - Chat header "Optimize" button calls lifecycle endpoint and refreshes the brain meter.
