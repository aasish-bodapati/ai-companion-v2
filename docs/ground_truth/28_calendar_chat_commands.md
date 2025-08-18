# Calendar Chat Commands

Source of truth for chat-driven calendar control. This defines the supported commands, syntax, parsing rules, and backend/UX behaviors.

---

## Overview
- Users can manage calendar events directly in chat using explicit commands with the `/calendar` prefix.
- The backend intercepts these commands inside `backend/app/api/endpoints/conversations.py` and bypasses LLM generation for fast, deterministic responses.
- Events are persisted to the authenticated user's calendar via the calendar CRUD APIs.

---

## Commands

### 1) Add a single event
- Syntax:
  - `/calendar add <free-form event line>`
- Examples:
  - `/calendar add 2025-08-13 09:00-10:00 Team Standup`
  - `/calendar add 2025-08-15 All-day Offsite`
  - `/calendar add Tomorrow 2pm-3pm 1:1 with Alex`
- Behavior:
  - The free-form line is parsed by `backend/app/services/calendar_parser.py`.
  - Supports ISO-style `YYYY-MM-DD`, relative dates like `Today`, `Tomorrow`, and natural language time ranges.
  - All-day is inferred if no time is provided or if explicitly noted (e.g., "All-day").
  - On success, responds with a confirmation including the parsed datetime range.

### 2) Bulk add (hydrate multiple lines)
- Syntax:
  - `/calendar bulk` or `/calendar hydrate`
  - Followed by one event per line in the next user message (or the same message on subsequent lines).
- Example:
  ```
  /calendar bulk
  2025-08-15 13:00-14:00 All-hands
  2025-08-16 10:00-11:30 1:1 with Alex
  2025-08-20 Offsite (All-day)
  ```
- Behavior:
  - Each line is parsed via the same parser and persisted.
  - Returns a summary: e.g., "Bulk added 3 event(s)."

### 3) List events
- Syntax:
  - `/calendar list [today|tomorrow|next week]`
- Examples:
  - `/calendar list`
  - `/calendar list today`
  - `/calendar list next week`
- Behavior:
  - Lists events for the specified window. Default is today if unspecified.
  - Returns a newline-separated list with title and time range.

### 4) Delete an event
- Syntax:
  - `/calendar delete <event-id>`
  - `/calendar delete <free-form description>` (title + day)
- Examples:
  - `/calendar delete 9f7f7d18-5a87-4e20-bf4e-3a62a7b6c5f1`
  - `/calendar delete 2025-08-16 1:1 with Alex`
- Behavior:
  - If an explicit UUID is provided, deletes that event (if owned by the user).
  - Otherwise attempts to match by title (contains) on the given day and delete the first match.
  - Responds with "Deleted.", "Event not found.", or a similar outcome message.

---

## Parsing Rules
- Implemented by `backend/app/services/calendar_parser.py`.
- Uses `python-dateutil` for flexible date/time parsing.
- Handles:
  - ISO dates: `YYYY-MM-DD`.
  - Relative days: Today, Tomorrow; simple strings like day names are best provided with dates.
  - Time ranges: `HH:MM-HH:MM`, `2pm-3pm`, etc.
  - All-day detection if time is missing or "All-day" is included.
- Local time reference:
  - The system uses the server/application-local time as default when parsing relative references.

---

## Backend Behavior
- Command interception occurs in `reply()` and `reply_stream()` inside `backend/app/api/endpoints/conversations.py`:
  - If `/calendar` is detected, the backend executes the operation synchronously (no LLM call).
  - In `reply()`: persists an assistant confirmation message and returns it in the API response.
  - In `reply_stream()`: streams the confirmation immediately (SSE) and then persists the assistant message (if the client is still connected), with disconnect safety to avoid h11 errors.
- Persistence:
  - Events are stored via the calendar CRUD APIs and associated with the authenticated user.
  - A bulk endpoint exists: `POST /calendar/events/bulk`.
- Security:
  - All calendar operations require an authenticated user.
  - Users can only access/modify their own events.

---

## Frontend Behavior
- Calendar UI lives at `/calendar` using FullCalendar.
- Events added via chat appear after refetch (React Query hooks persist to backend).
- No special chat UI required; confirmations are plain assistant messages. Optional enhancements may show success badges or previews.

---

## Natural-language (NL) Intents

In addition to explicit `/calendar` commands, the backend now handles a limited set of natural-language scheduling intents without the `/calendar` prefix. This path is designed for fast, deterministic persistence similar to slash-commands and does not call the LLM when it matches.

Current supported pattern (heuristic):
- Phrases like: "wake up at 6:00 AM every day for the next week" or "add wake up at 6am to my calendar for the next week"
  - Behavior:
    - Parses the time (e.g., 6, 6:00, 6am, 6:00 am) and schedules 7 events titled "Wake up".
    - If the phrase includes "next week"/"for the next week": schedules the next week window starting the upcoming Monday.
    - Otherwise: schedules the next 7 days starting tomorrow.
    - Duration: 5 minutes per event.
    - Timezone: stored as UTC by default; frontend displays according to user locale/timezone.

Notes and limitations:
- This NL path is intentionally small and focused. It will expand as we add more robust patterns (e.g., weekdays-only, custom duration, arbitrary titles).
- If the NL phrase does not match the heuristic, the system falls back to normal chat generation (no automatic calendar persistence). Use explicit `/calendar` commands for guaranteed behavior.

Implementation references:
- `_handle_calendar_nl()` and interception in both `reply()` and `reply_stream()` inside `backend/app/api/endpoints/conversations.py`.

Examples:
- User: "wake up at 6:00 AM every day for the next week"
  - Assistant: "Scheduled Wake up at 06:00 for 7 day(s)."

---

## Examples
- Single add:
  - User: `/calendar add 2025-08-13 09:00-10:00 Team Standup`
  - Assistant: `Added: Team Standup @ 2025-08-13T09:00:00Z–2025-08-13T10:00:00Z`
- Bulk:
  - User:
    ```
    /calendar bulk
    2025-08-15 13:00-14:00 All-hands
    2025-08-16 10:00-11:30 1:1 with Alex
    ```
  - Assistant: `Bulk added 2 event(s).`
- List:
  - User: `/calendar list today`
  - Assistant: `Events:\n09:00–10:00 Team Standup\n13:00–14:00 All-hands`
- Delete:
  - User: `/calendar delete 2025-08-16 1:1 with Alex`
  - Assistant: `Deleted.`

---

## Error Handling
- If parsing fails: assistant responds with a brief suggestion, e.g.,
  - `Sorry, I couldn't parse that event. Try: 2025-08-13 09:00-10:00 Standup`
- For list/delete with no matches: a concise "No events" or "Event not found." message is returned.

---

## Maintenance Notes
- Keep this doc aligned with changes to `_handle_calendar_command()` and `calendar_parser.py`.
- Update the examples if parsing behavior or response formats change.
- If adding new subcommands, document them here and link any new APIs.
