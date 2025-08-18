# Calendar Intents Endpoint

This endpoint unifies natural-language (NL) scheduling across the Companion and the Calendar UI. It normalizes free-form text into concrete events and can optionally persist them.

- Path: `POST /calendar/intents`
- Auth: Requires a valid user (JWT). See Security Rules: All protected endpoints must require valid JWT.
- Feature flags: Works with the existing rule-based parser today; can be upgraded to LLM-powered extraction behind `CALENDAR_NL_LLM_ENABLED` without changing the endpoint.

## Request

```jsonc
{
  "text": "tomorrow 1pm gym",
  "default_duration_minutes": 30,   // optional, 5..1440 (default 30)
  "persist": true,                   // optional, default false
  "description": "Leg day",        // optional
  "timezone_hint": "Asia/Kolkata"  // optional (reserved)
}
```

## Response

```jsonc
{
  "items": [
    {
      "title": "gym",
      "start": "2025-08-14T13:00:00+05:30",
      "end": "2025-08-14T13:30:00+05:30",
      "all_day": false,
      "description": "Leg day"
    }
  ],
  "persisted_event_ids": ["evt_123"] // present only when persist=true and write succeeds
}
```

Notes:
- If a parsed item has no end and is not all-day, `end` is synthesized using `default_duration_minutes`.
- Multiple events can be produced when the text contains multiple lines or items.
- When `persist` is true, each normalized item is inserted via the standard calendar CRUD and the created IDs are returned.

## Behavior and Sources of Truth

- The endpoint uses the same underlying parsing logic used by chat commands (see `app/services/calendar_parser.py` and `docs/ground_truth/28_calendar_chat_commands.md`).
- This ensures Companion ↔ Calendar parity: Quick Add in the UI and `/calendar` chat commands resolve through one backend path.
- Time handling: input is interpreted in server local timezone currently and stored as UTC downstream, consistent with existing calendar behavior.

## Examples

- "2025-08-20 09:00-10:00 Team sync"
- "Tue 3-4pm Call with Alice"
- "Tomorrow 9:00 Standup" (end inferred using default duration)
- "Aug 13 All-day Offsite" (all_day=true)

## Error Cases

- 401 Unauthorized if JWT missing/invalid
- 503 Service Unavailable if the calendar table is missing (migrations not applied)

## Integration Notes

- UI Quick Add now calls this endpoint when `whenText` is provided; it falls back to client-side parsing if the endpoint is unavailable.
- Chat-driven scheduling can call the same endpoint to ensure consistent normalization and persistence.
