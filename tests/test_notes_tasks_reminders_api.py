import requests
from datetime import datetime, timedelta, timezone

BASE_URL = "http://localhost:8000"
TEST_USER = {"username": "test@example.com", "password": "testpassword123"}


def _login_session() -> requests.Session:
    s = requests.Session()
    resp = s.post(f"{BASE_URL}/api/v1/login/access-token", data=TEST_USER)
    assert resp.status_code == 200, f"login failed: {resp.status_code} {resp.text}"
    token = resp.json().get("access_token")
    assert token, f"no access token in response: {resp.text}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def test_notes_crud_smoke():
    s = _login_session()

    # Create
    create = s.post(
        f"{BASE_URL}/api/v1/notes",
        json={"title": "Test Note", "body": "Body text", "tags": "x,y"},
    )
    assert create.status_code == 201, create.text
    note = create.json()
    note_id = note["id"]

    # List
    lst = s.get(f"{BASE_URL}/api/v1/notes?limit=5")
    assert lst.status_code == 200, lst.text
    assert any(n["id"] == note_id for n in lst.json())

    # Update
    upd = s.patch(
        f"{BASE_URL}/api/v1/notes/{note_id}",
        json={"body": "Updated", "tags": "x,z"},
    )
    assert upd.status_code == 200, upd.text
    assert upd.json()["body"] == "Updated"

    # Delete
    dele = s.delete(f"{BASE_URL}/api/v1/notes/{note_id}")
    assert dele.status_code == 204, dele.text


def test_tasks_crud_smoke():
    s = _login_session()

    due_at = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()

    # Create
    create = s.post(
        f"{BASE_URL}/api/v1/tasks",
        json={"title": "Test Task", "priority": "high", "due_at": due_at},
    )
    assert create.status_code == 201, create.text
    task = create.json()
    task_id = task["id"]

    # List
    lst = s.get(f"{BASE_URL}/api/v1/tasks?limit=5")
    assert lst.status_code == 200, lst.text
    assert any(t["id"] == task_id for t in lst.json())

    # Update
    upd = s.patch(
        f"{BASE_URL}/api/v1/tasks/{task_id}",
        json={"status": "completed"},
    )
    assert upd.status_code == 200, upd.text
    assert upd.json()["status"] == "completed"

    # Delete
    dele = s.delete(f"{BASE_URL}/api/v1/tasks/{task_id}")
    assert dele.status_code == 204, dele.text


def test_reminders_crud_smoke():
    s = _login_session()

    trigger_at = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()

    # Create
    create = s.post(
        f"{BASE_URL}/api/v1/reminders",
        json={"content": "Ping me soon", "trigger_at": trigger_at, "channel": "app"},
    )
    assert create.status_code == 201, create.text
    rem = create.json()
    rem_id = rem["id"]

    # List
    lst = s.get(f"{BASE_URL}/api/v1/reminders?limit=5")
    assert lst.status_code == 200, lst.text
    assert any(r["id"] == rem_id for r in lst.json())

    # Update
    upd = s.patch(
        f"{BASE_URL}/api/v1/reminders/{rem_id}",
        json={"channel": "app"},
    )
    assert upd.status_code == 200, upd.text

    # Delete
    dele = s.delete(f"{BASE_URL}/api/v1/reminders/{rem_id}")
    assert dele.status_code == 204, dele.text
