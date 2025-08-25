import os
import json
import pathlib
import requests
import pytest

BASE_URL = os.environ.get("CHAT_API_BASE", "http://localhost:8000").rstrip("/")
API = f"{BASE_URL}/api/v1"
SNAP_DIR = pathlib.Path(__file__).parent / "snapshots"
SNAP_DIR.mkdir(exist_ok=True)

EMAIL = os.environ.get("CHAT_USER_EMAIL", "test@example.com")
PASSWORD = os.environ.get("CHAT_USER_PASSWORD", "testpassword123")
UPDATE = os.environ.get("UPDATE_SNAPSHOTS") in ("1", "true", "True")


def _login_session() -> requests.Session | None:
    s = requests.Session()
    try:
        r = s.post(f"{API}/login/access-token", data={"username": EMAIL, "password": PASSWORD}, timeout=15)
        if r.status_code != 200:
            return None
        token = (r.json() or {}).get("access_token")
        if not token:
            return None
        s.headers.update({"Authorization": f"Bearer {token}"})
        return s
    except Exception:
        return None


def _create_conversation(s: requests.Session, title: str) -> str:
    r = s.post(f"{API}/conversations", json={"title": title}, timeout=15)
    r.raise_for_status()
    return (r.json() or {}).get("id")


def _reply(s: requests.Session, conv_id: str, content: str) -> dict:
    r = s.post(f"{API}/conversations/{conv_id}/reply", json={"role": "user", "content": content}, timeout=60)
    r.raise_for_status()
    return r.json() or {}


def _msg_text(reply_json: dict) -> str:
    try:
        return ((reply_json.get("message") or {}).get("content")) or ""
    except Exception:
        return reply_json.get("ai_response") or ""


def _assert_snapshot(name: str, text: str) -> None:
    snap_path = SNAP_DIR / f"{name}.txt"
    if UPDATE:
        snap_path.write_text(text, encoding="utf-8")
        return
    if not snap_path.exists():
        pytest.fail(f"Missing snapshot: {snap_path}. Run with UPDATE_SNAPSHOTS=1 to create.")
    expected = snap_path.read_text(encoding="utf-8")
    assert text.strip() == expected.strip()


def _assert_or_skip_snapshot(name: str, text: str) -> None:
    """
    Less brittle snapshot assertion for newly added golden flows.
    If snapshot missing and not updating, skip instead of failing to allow gradual adoption.
    """
    snap_path = SNAP_DIR / f"{name}.txt"
    if UPDATE:
        snap_path.write_text(text, encoding="utf-8")
        return
    if not snap_path.exists():
        pytest.skip(f"Missing snapshot: {snap_path}. Run with UPDATE_SNAPSHOTS=1 to create.")
    expected = snap_path.read_text(encoding="utf-8")
    assert text.strip() == expected.strip()


@pytest.mark.timeout(90)
def test_golden_schedule_flow_snapshot():
    s = _login_session()
    if not s:
        pytest.skip("Login failed; backend likely not running.")
    conv_id = _create_conversation(s, "Golden: Schedule")

    _ = _reply(s, conv_id, "My doctor's appointment is next Friday at 3pm.")
    r2 = _reply(s, conv_id, "Remind me to pick up meds after that.")

    last = _msg_text(r2)
    _assert_snapshot("golden_schedule_flow_last_reply", last)


@pytest.mark.timeout(90)
def test_golden_fitness_flow_snapshot():
    s = _login_session()
    if not s:
        pytest.skip("Login failed; backend likely not running.")
    conv_id = _create_conversation(s, "Golden: Fitness")

    _ = _reply(s, conv_id, "I don't like running.")
    r2 = _reply(s, conv_id, "Suggest me a workout plan.")

    last = _msg_text(r2)
    _assert_snapshot("golden_fitness_flow_last_reply", last)


@pytest.mark.timeout(90)
def test_golden_nutrition_allergy_flow_snapshot():
    s = _login_session()
    if not s:
        pytest.skip("Login failed; backend likely not running.")
    conv_id = _create_conversation(s, "Golden: Nutrition+Allergy")

    _ = _reply(s, conv_id, "I'm allergic to peanuts.")
    r2 = _reply(s, conv_id, "Can you suggest a lunch option?")

    last = _msg_text(r2)
    _assert_or_skip_snapshot("golden_allergy_flow_last_reply", last)


@pytest.mark.timeout(90)
def test_golden_recurring_calendar_flow_snapshot():
    s = _login_session()
    if not s:
        pytest.skip("Login failed; backend likely not running.")
    conv_id = _create_conversation(s, "Golden: Recurring Calendar")

    # User expresses a recurring intent
    r1 = _reply(s, conv_id, "Add a reminder to plan the week every Sunday evening.")
    # Follow-up to confirm or adjust
    r2 = _reply(s, conv_id, "Great, can you confirm it's set weekly on Sundays?")

    last = _msg_text(r2 or r1)
    _assert_or_skip_snapshot("golden_recurring_calendar_flow_last_reply", last)


@pytest.mark.timeout(90)
def test_golden_peanut_echo_prevention_snapshot():
    """
    Ensure assistant never echoes the word 'peanut' back to the user.
    Snapshot is optional for content stability; we also assert no 'peanut' present.
    """
    s = _login_session()
    if not s:
        pytest.skip("Login failed; backend likely not running.")
    conv_id = _create_conversation(s, "Golden: Peanut Echo Prevention")

    # User explicitly mentions peanut butter; sanitizer should scrub echoes
    _ = _reply(s, conv_id, "I love peanut butter.")
    r2 = _reply(s, conv_id, "What snack do you recommend?")

    last = _msg_text(r2)
    assert "peanut" not in (last or "").lower(), f"Echoed forbidden term in reply: {last!r}"
    _assert_or_skip_snapshot("golden_peanut_echo_prevention_last_reply", last)
