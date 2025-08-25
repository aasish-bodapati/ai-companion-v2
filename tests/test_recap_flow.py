import requests
import uuid

BASE_URL = "http://localhost:8000"
API = f"{BASE_URL}/api/v1"

TEST_USER = {"username": "test@example.com", "password": "testpassword123"}


def _login_session() -> requests.Session:
    s = requests.Session()
    r = s.post(f"{API}/login/access-token", data=TEST_USER)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token")
    assert token, f"no access token: {r.text}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def test_recap_fastpath_returns_bullets_without_llm():
    s = _login_session()
    # Create conversation
    conv_resp = s.post(f"{API}/conversations", json={"title": "Recap Flow Test"})
    assert conv_resp.status_code in (200, 201), conv_resp.text
    conv = conv_resp.json()
    conv_id = conv["id"]

    # Seed a preference and a note to have some memory
    s.post(f"{API}/conversations/{conv_id}/messages", json={"role": "user", "content": "Preference: I prefer morning workouts"})
    s.post(f"{API}/conversations/{conv_id}/messages", json={"role": "user", "content": "note: My goal is to improve mobility"})

    # Ask for recap via fast-path
    reply = s.post(f"{API}/conversations/{conv_id}/reply", json={"role": "user", "content": "/recap"})
    assert reply.status_code == 200, reply.text
    body = reply.json()

    # used_llm should be False for fast-path
    assert body.get("used_llm") is False

    # Message content should contain at most 5 bullets and be concise
    content = (body.get("message") or {}).get("content", "")
    assert content, body
    lines = [ln for ln in content.splitlines() if ln.strip()]
    assert 1 <= len(lines) <= 5
    # Each line should look like a bullet
    assert all(ln.strip().startswith("-") for ln in lines)
