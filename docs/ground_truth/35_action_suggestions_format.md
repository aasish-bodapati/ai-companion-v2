# Action Suggestions Format (Chat → Confirm → Execute)

This document defines how the assistant proposes structured, confirmable actions in chat and how the frontend parses them.

## Goals
- Enable the assistant to propose actions with parameters.
- Let the user confirm before execution.
- Keep suggestions machine-readable and safe.

## Message Convention
The assistant MAY include a fenced code block labeled `actions` containing a JSON array of action proposals. Each proposal:

```actions
[
  {
    "action": "fitness.log_workout",
    "label": "Log 30m run",
    "params": { "when": "2025-08-17T06:45:00Z", "type": "run", "duration_min": 30 },
    "client_action_id": "optional-idempotency-key"
  }
]
```

- `action`: string in `domain.verb` (see Actions Registry).
- `label`: short user-facing text for the chip.
- `params`: typed payload specific to the action (see Coaching API contracts).
- `client_action_id` (optional): for idempotency.

If present, the frontend will parse and render confirmable chips. If absent, the frontend may show a small set of generic actions.

## Execution Flow
1. Assistant includes an `actions` code block in the reply.
2. UI renders chips with labels. On click, prompt user to confirm.
3. UI calls `POST /api/v1/actions/execute` with provided `action`, `params`, and optional `client_action_id`.
4. UI surfaces success/error, may refresh trackers view.

## Security & Telemetry
- Actions require authenticated user (JWT).
- No secrets in suggestions or logs.
- Idempotency encouraged via `client_action_id`.
- When `TIMELINE_ENABLED` is true, emit action timing events around execution (optional).

## Examples
```actions
[
  { "action": "nutrition.log_meal", "label": "Log lunch", "params": { "when": "2025-08-17T12:30:00Z", "items": ["salad", "chicken"], "est_protein_g": 35 } },
  { "action": "hydration.log_water", "label": "+250 ml water", "params": { "when": "2025-08-17T13:00:00Z", "amount_ml": 250 } }
]
```

## Compatibility
- Backward-compatible: users without suggestions still get generic action chips.
- Frontend will ignore malformed/invalid blocks.
