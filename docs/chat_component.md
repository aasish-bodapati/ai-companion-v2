# Chat Component — Technical Guide

## Overview
A chat-first interface that generates context-aware replies, integrates long-term memory, supports slash commands, and enforces safety/sanitization.

## Endpoints

- POST `/api/v1/conversations/{conversation_id}/reply`
  - Purpose: Generate a reply (LLM or fast-paths) with memory/context.
  - Auth: JWT required for protected routes.
  - Request (shape, representative):
    ```json
    {
      "message": "string",
      "metadata": {"source": "ui|api", "trace_id": "string"},
      "options": {"stream": false}
    }
    ```
  - Response (representative):
    ```json
    {
      "reply": "string",
      "used_llm": true,
      "context": {"snippets": ["…"], "memory_hits": 3},
      "actions": [],
      "sanitized": true
    }
    ```
  - Error (problem+json):
    ```json
    {
      "type": "about:blank",
      "title": "Bad Request",
      "status": 400,
      "detail": "validation failed",
      "instance": "/api/v1/conversations/…/reply"
    }
    ```

## Reply Pipeline

- Pre-processing:
  - Slash-command detection: `/recap`, `/todo`, `/note`, `/remind`.
  - Continuity heuristic: if user says “after that/afterwards/then,” scan recent messages most-recent-first (excluding current message) for a recent appointment/time (e.g., 3pm/5pm, meeting/doctor/event) to resolve the reference.
  - Memory retrieval: pull relevant memories across types (conversation, profile, preferences, facts, onboarding).

- Generation paths:
  - Recap fast-path (no LLM): produce 1–5 bullets; `used_llm=false`.
  - NTR/other fast-paths where applicable.
  - LLM generation (deterministic prompt with compact, deduped context lines).

- Post-processing:
  - Centralized allergy sanitization: scrub any occurrence of “peanut” (handles "peanut-free" with ASCII/Unicode hyphens and "peanut butter"). Replacements: "peanut-free" → "allergen-safe", "peanut butter" → "allergen butter", remaining "peanut(s)" → "allergen".
  - Response shape normalization; problem+json for errors.

## Slash Commands

- `/recap`
  - Summarizes profile/preferences/context into 1–5 bullets; avoids LLM; `used_llm=false`.
- `/todo`
  - Creates tasks; dual-write fixes ensure tasks appear in `GET /api/v1/tasks`.
- `/note`, `/remind`
  - Creates notes/reminders as structured items; validated for minimal fields.

## Memory Integration

- Store and retrieve memories across:
  - `conversation`, `message`, `profile`, `preference`, `fact`, `onboarding`.
- Personalization prompt includes profile/preferences; retrieval uses compact, deduped context with recency/relevance.
- Explainability: `GET /api/v1/conversations/{id}/memory-context` returns what context was used.

## Continuity Heuristic (Details)

- Trigger phrases: “after that”, “afterwards”, “then”, “right after”.
- Resolution:
  - Iterate recent history (most-recent-first), skip current message by ID.
  - Detect appointment/time keywords: appointment/meeting/event/doctor and time patterns like `3pm`, `17:00`, `tomorrow 5pm`.
  - If found, include explicit reference in the reply (e.g., “after your 3pm appointment”).
- Tests: `tests/test_conversation_flow_scenarios.py::test_schedule_flow_continuity_accuracy_relevance`.

## Safety & Sanitization

- Centralized sanitizer runs for all reply paths (fast/LLM) to remove “peanut” mentions.
- Variants handled: "peanut-free" (Unicode/ASCII hyphens), "peanut butter", plurals.
- Tests: `tests/test_conversation_flow_scenarios.py::test_health_flow_allergy_context_persists`.

## Error Handling & Security

- Error format: problem+json with `type`, `title`, `status`, `detail`, `instance`.
- Protected endpoints: require valid JWT.
- Production: enforce HTTPS (policy-level); never log passwords/tokens.

## Known Limitations

- Mind Palace is read-only (for explainability).
- Some action bridges (advanced calendar/fitness/nutrition automations) are planned/partial.

## Examples

- Recap fast-path
  ```bash
  curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -H "Content-Type: application/json" \
    -d '{"message": "/recap"}' \
    http://localhost:8000/api/v1/conversations/<id>/reply
  ```

- Follow-up continuity (user)
  ```text
  User: I have a doctor appointment at 3pm. Please remind me to take my meds after that.
  Assistant: Got it — I’ll remind you to take your meds right after your 3pm appointment.
  ```

- Sanitization behavior (illustrative)
  ```text
  Raw model output: You can try peanut butter sandwiches.
  Sanitized reply: You can try allergen butter sandwiches.
  ```

## References

- See `backend/app/api/endpoints/conversations_messages.py` for the reply pipeline and sanitization.
- See tests under `tests/test_conversation_flow_scenarios.py` for continuity and health safety validations.
