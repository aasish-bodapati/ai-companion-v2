import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
API = f"{BASE_URL}/api/v1"
TEST_USER = {"username": "test@example.com", "password": "testpassword123"}


def _login_session() -> requests.Session:
    s = requests.Session()
    resp = s.post(f"{API}/login/access-token", data=TEST_USER)
    assert resp.status_code == 200, f"login failed: {resp.status_code} {resp.text}"
    token = resp.json().get("access_token")
    assert token, f"no access token in response: {resp.text}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def _create_conversation(s: requests.Session, title: str) -> str:
    payload = {"title": title}
    r = s.post(f"{API}/conversations", json=payload)
    assert r.status_code in (200, 201), f"create conversation failed: {r.status_code} {r.text}"
    return r.json()["id"]


def _reply(s: requests.Session, conv_id: str, content: str):
    payload = {"role": "user", "content": content}
    r = s.post(f"{API}/conversations/{conv_id}/reply", json=payload)
    assert r.status_code in (200, 201), f"reply failed: {r.status_code} {r.text}"
    return r.json()


def test_dual_write_note_task_reminder():
    s = _login_session()

    conv_id = _create_conversation(s, title="DualWrite Chat Test")

    # Note
    note_body = "buy milk and eggs"
    _reply(s, conv_id, f"note: {note_body}")
    notes_resp = s.get(f"{API}/notes")
    assert notes_resp.status_code == 200, notes_resp.text
    titles = [n.get("title", "") for n in notes_resp.json()]
    assert any(t.startswith(note_body[:10]) for t in titles), f"note not found in notes list: {titles}"

    # Task
    task_title = "Prepare slides"
    _reply(s, conv_id, f"/todo {task_title} tomorrow 10am")
    tasks_resp = s.get(f"{API}/tasks")
    assert tasks_resp.status_code == 200, tasks_resp.text
    task_titles = [t.get("title", "") for t in tasks_resp.json()]
    assert any(task_title.lower() in t.lower() for t in task_titles), f"task not found in tasks list: {task_titles}"

    # Reminder
    rem_text = "call mom"
    _reply(s, conv_id, f"remind me {rem_text} in 1h")
    rem_resp = s.get(f"{API}/reminders")
    assert rem_resp.status_code == 200, rem_resp.text
    rem_contents = [r.get("content", "") for r in rem_resp.json()]
    assert any(rem_text.lower() in c.lower() for c in rem_contents), f"reminder not found in reminders list: {rem_contents}"
