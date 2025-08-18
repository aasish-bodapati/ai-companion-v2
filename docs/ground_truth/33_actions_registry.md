# Actions Registry (Coach Tooling)

Source of truth for how the chat companion invokes domain actions ("tools").

## Goals
- Safely execute structured actions from chat.
- Strong typing for requests/responses.
- Clear auditability and user control.

## Concepts
- Action: `domain.verb` (e.g., `fitness.create_goal`, `nutrition.log_meal`).
- Registry: maps `action_name` → handler with schema validation.
- Execution Policy: confirm → execute → summarize result.
- Idempotency: optional `client_action_id` to avoid duplicates.

## Security & Rules
- Require authenticated user; pass `user_id`, `conversation_id`.
- No secrets in logs. Never log tokens (see Security Rules).
- All state-changing actions require CSRF in web context (see `02_api_contracts.md`).
- Return standardized error shape on failure (see `22_error_response_standard.md`).

## Request Shape (generic)
```json
{
  "action": "fitness.log_workout",
  "params": { /* action-specific payload */ },
  "user_id": "uuid",
  "conversation_id": "uuid",
  "client_action_id": "optional-idempotency-key"
}
```

## Response Shape (generic)
```json
{
  "ok": true,
  "action": "fitness.log_workout",
  "result": { /* typed result */ }
}
```
On error:
```json
{
  "ok": false,
  "action": "fitness.log_workout",
  "error": {
    "detail": "Human-readable summary",
    "message": "Human-readable summary",
    "errors": null
  }
}
```

## Action Catalog (MVP)
- fitness.create_goal
- fitness.log_workout
- routine.set_schedule
- nutrition.log_meal
- hydration.log_water
- mood.log_checkin
- journal.add_entry
- review.weekly_generate

## Typing Examples

### fitness.create_goal
Request:
```json
{
  "name": "5k in 30 minutes",
  "target_date": "2025-12-01",
  "metrics": {"distance_km": 5, "time_min": 30}
}
```
Result:
```json
{
  "goal_id": "uuid",
  "status": "active"
}
```

### nutrition.log_meal
Request:
```json
{
  "when": "2025-08-17T12:30:00Z",
  "items": ["grilled chicken", "brown rice", "salad"],
  "notes": "~40g protein"
}
```
Result:
```json
{
  "entry_id": "uuid"
}
```

## Chat Flow
1. LLM detects intent → proposes action with params.
2. UI shows confirmation chip (or auto-confirm for low-risk logs).
3. Backend registry validates and executes.
4. Return human summary + typed result; optionally store a memory fact.

## Telemetry
- Log `action`, `latency_ms`, `ok`, not params (unless redacted & safe).
- Emit timeline events around action execution when `TIMELINE_ENABLED` is true.
