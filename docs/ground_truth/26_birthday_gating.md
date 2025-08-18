# Birthday Gating Rules

Source of truth for when the assistant should include or act on a user's birthday.

## Policy
- Only include the full `Birthday: YYYY-MM-DD` in model context when today's month/day matches the user's saved birthday.
- If a birthday is present but today is not the birthday, include only `BirthYear: YYYY` (when the year can be parsed) to avoid triggering birthday wishes.
- If only a year is stored (e.g., `1996`), never treat it as a birthday and never wish.

## Implementation
- Backend: `backend/app/memory/profile.py`
  - `serialize_onboarding_profile()` performs the date check and composes the profile string.
  - Uses `datetime.date.fromisoformat()` to parse `YYYY-MM-DD`. If parsing fails, it attempts to extract a 4-digit year prefix and emits `BirthYear: {YYYY}`.

## Rationale
- Prevents the LLM from improvising birthday wishes when it's not the user's birthday.
- Minimizes sensitive date exposure while preserving useful age/era signal via birth year.

## Frontend & Data Entry
- UI fields accept `YYYY-MM-DD`. If the user provides only a year, no birthday check occurs.
- Consider adding UI validation to nudge toward ISO dates for full birthday functionality.

## Future Guardrails (optional)
- Add a system prompt instruction: "Only mention birthdays if today matches the user's birthday. If only a year is known, don't wish."
- Consider a feature flag to entirely suppress birthday details from context.
