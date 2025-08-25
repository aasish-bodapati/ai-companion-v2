# Runbook: Calendar Debugging

## Purpose
Quick steps to reproduce and diagnose calendar add/delete flows, especially the fast-path delete.

## Prereqs
- Backend dev server running.
- Frontend running or use Postman.
- Test user authenticated.

## Fast-path deletion overview
- Explicit `/calendar delete <uuid>` is executed during `send_message()` before the assistant reply is generated.
- Assistant still replies with `Deleted.` via calendar command handler.

## Enable debug logs
Create or edit `backend/.env`:
```env
CALENDAR_DEBUG_ENABLED=true
```
Restart backend if hot-reload doesn’t pick it up.

## Reproduce
1. Create an event (chat or API):
   - Chat: `/calendar create E2E Meeting on Aug 20 2025 at 10:00`
   - API: `POST /api/v1/calendar/events`
2. Copy the returned `id` (UUID).
3. Send: `/calendar delete <uuid>`

## Verify deletion
- Poll API: `GET /api/v1/calendar/events?start=<iso>&end=<iso>`
  - Expect the event to be missing within ~10s.
- UI: refresh calendar list; item should be gone.

## Expected logs (when flag enabled)
```
calendar.fastpath delete request user_id=... event_id=...
calendar.delete_for_user start user_id=... event_id=...
calendar.delete_for_user commit affected=1
```

## Troubleshooting
- Event still present:
  - Confirm user_id matches event owner.
  - Ensure the UUID passed is exact (no trailing punctuation).
  - Check DB commit errors in logs; retry with fresh conversation.
- No logs printed:
  - Confirm `CALENDAR_DEBUG_ENABLED=true` and backend restarted.
  - Verify message begins with `/calendar delete ` (leading slash, space before UUID).
- Test flake:
  - Ensure frontend test polls the backend events endpoint after sending the delete message.

## Notes
- CRUD deletion uses bulk delete with `synchronize_session=False` + immediate `commit()` to avoid session staleness.
- The fast-path avoids races between assistant reply generation and verification polling.
