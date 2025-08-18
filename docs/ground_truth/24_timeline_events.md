# Timeline Events and Chat Timing UI

This document describes the backend timeline diagnostics emitted during streaming replies and the frontend UI that renders timing information per turn.

## Feature Flags

- Frontend UI: `NEXT_PUBLIC_FEATURE_TIMELINE`
  - When `true`, Chat shows a collapsible timing panel for the live assistant reply.
- Backend emission: `TIMELINE_ENABLED`
  - When `true`, the streaming reply endpoint emits `timeline-start` and `timeline-end` SSE events.

## Backend

- File: `backend/app/api/endpoints/conversations.py`
- Endpoint: `POST /conversations/{id}/reply/stream` (SSE)
- Controlled by: `settings.TIMELINE_ENABLED` from `backend/app/core/config.py`

### SSE Events

- `timeline-start`
  - Example payload:
    ```json
    {
      "trace_id": "7f7f0e10-1a2b-4c33-9f9a-afb6d9a6dabc",
      "timeline": {
        "received_at_server": "2025-08-12T12:34:56.789Z",
        "recent_messages_ms": 4.21,
        "memory_context_ms": 27.55
      }
    }
    ```
- `timeline-end`
  - Example payload:
    ```json
    {
      "trace_id": "7f7f0e10-1a2b-4c33-9f9a-afb6d9a6dabc",
      "timeline": {
        "llm_started_at": "2025-08-12T12:34:56.900Z",
        "first_token_ms": 812.45,
        "llm_total_ms": 2345.67,
        "persist_ms": 18.32
      }
    }
    ```

Notes:
- Additional fields may be added over time but will not break existing consumers.
- If the backend falls back to non-streaming, these events may not be present.

## Frontend Integration

- Parser: `startReplyStream()` in `frontend/src/features/conversations/api.ts`
  - Recognizes:
    - `event: timeline-start` → calls `onTimelineStart(payload)`
    - `event: timeline-end` → calls `onTimelineEnd(payload)`
    - `event: done` → calls `onDone()`
  - Streams `data: <text>` chunks to `onChunk(text)`.

- Hook: `useSendMessageStreamed()` forwards optional callbacks `onTimelineStart` and `onTimelineEnd`.
- UI: `frontend/src/features/chat/components/ChatArea.tsx`
  - When `NEXT_PUBLIC_FEATURE_TIMELINE=true`, shows a collapsible timing panel under the live assistant message.
  - Displays fields from `timeline-start` and `timeline-end` if available.

## Optional Persistence for Historical Messages (Proposed)

To show timing for past assistant messages, persist timeline metadata with each assistant message:

- Add a nullable column `timeline_json` (TEXT) on `messages` to store compact JSON.
- During streaming, when persistence completes, attach the finalized timeline payload and save it with the assistant message.
- Include `timeline_json` in the `GET /messages` response.
- Frontend: render the same timing panel for assistant messages that have `timeline_json`.

Considerations:
- Migration: Alembic/SQLite compatible schema change (nullable TEXT).
- Privacy: No PII in timeline fields; keep payload minimal (durations, trace_id).
- Types: Add TypeScript interfaces for timeline payload.

## Testing

- Backend unit tests: verify emission gating and JSON serialization.
- Frontend integration tests: simulate SSE with `timeline-start`/`timeline-end` and verify panel rendering when the flag is on.

## Security

- No credentials/tokens in timeline payloads.
- SSE endpoint remains JWT-protected like other conversation routes.
