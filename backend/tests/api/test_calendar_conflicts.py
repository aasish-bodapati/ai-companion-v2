from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient


def test_schedule_conflict_clarification(client: TestClient):
    # Create an event at a fixed time
    start = datetime(2025, 9, 1, 10, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(minutes=30)
    ev = client.post(
        "/api/v1/calendar/events",
        json={
            "title": "Team Sync",
            "description": "Weekly sync",
            "start": start.isoformat().replace("+00:00", "Z"),
            "end": end.isoformat().replace("+00:00", "Z"),
            "all_day": False,
        },
    )
    assert ev.status_code in (200, 201), ev.text

    # Create conversation
    convo = client.post(
        "/api/v1/conversations/",
        json={"title": "Conflicts", "personalization_enabled": True},
    )
    assert convo.status_code in (200, 201), convo.text
    conv_id = convo.json()["id"]

    # Ask to schedule at the same exact ISO time to trigger conflict heuristic
    msg = f"Please schedule a doctor visit at {start.isoformat().replace('+00:00','Z')}"
    rep = client.post(
        f"/api/v1/conversations/{conv_id}/reply",
        json={"role": "user", "content": msg},
    )
    assert rep.status_code == 200, rep.text
    content = (rep.json().get("message", {}).get("content") or "").lower()
    assert "conflict" in content
    assert "pick a different time" in content or "adjust" in content
