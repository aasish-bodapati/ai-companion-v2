import requests

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


def test_auth_smoke_login_reply_protected():
    s = _login_session()

    # Create conversation
    conv_resp = s.post(f"{API}/conversations", json={"title": "Auth Smoke"})
    assert conv_resp.status_code in (200, 201), f"create conversation failed: {conv_resp.status_code} {conv_resp.text}"
    conv_id = conv_resp.json()["id"]

    # Reply to conversation
    reply_payload = {"role": "user", "content": "hello there"}
    reply_resp = s.post(f"{API}/conversations/{conv_id}/reply", json=reply_payload)
    assert reply_resp.status_code in (200, 201), f"reply failed: {reply_resp.status_code} {reply_resp.text}"

    # Access a protected route (tasks list)
    tasks_resp = s.get(f"{API}/tasks")
    assert tasks_resp.status_code == 200, f"protected route failed: {tasks_resp.status_code} {tasks_resp.text}"
