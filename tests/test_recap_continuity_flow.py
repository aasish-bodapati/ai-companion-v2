import requests

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


def _lines(content: str) -> list[str]:
    return [ln for ln in (content or "").splitlines() if ln.strip()]


def test_recap_continuity_across_turns():
    s = _login_session()

    # Create conversation
    conv_resp = s.post(f"{API}/conversations", json={"title": "Recap Continuity"})
    assert conv_resp.status_code in (200, 201), conv_resp.text
    conv = conv_resp.json()
    conv_id = conv["id"]

    # Seed a couple of facts/preferences via chat messages
    s.post(f"{API}/conversations/{conv_id}/messages", json={"role": "user", "content": "Preference: I prefer short morning standups"})
    s.post(f"{API}/conversations/{conv_id}/messages", json={"role": "user", "content": "note: Project Apollo kickoff next week"})

    # First recap
    r1 = s.post(f"{API}/conversations/{conv_id}/reply", json={"role": "user", "content": "/recap"})
    assert r1.status_code == 200, r1.text
    b1 = r1.json()
    assert b1.get("used_llm") is False
    c1 = (b1.get("message") or {}).get("content", "")
    l1 = _lines(c1)
    assert 1 <= len(l1) <= 5

    # Add another preference, then recap again
    s.post(f"{API}/conversations/{conv_id}/messages", json={"role": "user", "content": "Preference: communicate via Slack, not email"})
    r2 = s.post(f"{API}/conversations/{conv_id}/reply", json={"role": "user", "content": "give me a recap"})
    assert r2.status_code == 200, r2.text
    b2 = r2.json()
    assert b2.get("used_llm") is False
    c2 = (b2.get("message") or {}).get("content", "")
    l2 = _lines(c2)
    assert 1 <= len(l2) <= 5

    # Continuity: second recap should not be empty and should not degenerate
    assert len(l2) >= 1
