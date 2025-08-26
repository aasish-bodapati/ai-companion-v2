from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.actions.router import router
from app.actions.registry import ExecuteActionRequest


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def test_calendar_add_event_requires_confirm_when_from_chat():
    """
    When invoked from a chat context (conversation_id present),
    calendar.add_event must require params._confirm == True.
    """
    start = datetime.now(timezone.utc) + timedelta(hours=1)
    req = ExecuteActionRequest(
        action="calendar.add_event",
        params={
            "title": "Planning Session",
            "start": _iso(start),
        },
        user_id="test-user-1",
        conversation_id="conv-123",  # indicates invocation from chat
    )

    res = router.execute(req)
    assert res.ok is False
    assert res.code == "forbidden"
    assert "confirm" in (res.error or "").lower()


def test_calendar_add_event_allows_with_confirm_flag():
    """
    With _confirm=true, the guard should allow the write action to proceed.
    """
    start = datetime.now(timezone.utc) + timedelta(hours=2)
    req = ExecuteActionRequest(
        action="calendar.add_event",
        params={
            "title": "Sync",
            "start": _iso(start),
            "_confirm": True,
        },
        user_id="test-user-1",
        conversation_id="conv-123",
    )

    res = router.execute(req)
    assert res.ok is True
    assert res.result is not None
    assert "event_id" in res.result
