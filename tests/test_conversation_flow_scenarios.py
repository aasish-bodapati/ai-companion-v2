import os
import requests

BASE_URL = os.environ.get("CHAT_API_BASE", "http://localhost:8000")
API = f"{BASE_URL}/api/v1"

TEST_USER = {"username": "test@example.com", "password": "testpassword123"}


def _login_session() -> requests.Session:
    s = requests.Session()
    r = s.post(f"{API}/login/access-token", data=TEST_USER, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token")
    assert token, f"no access token: {r.text}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def _create_conversation(s: requests.Session, title: str) -> str:
    r = s.post(f"{API}/conversations", json={"title": title}, timeout=15)
    assert r.status_code in (200, 201), r.text
    return (r.json() or {}).get("id")


def _reply(s: requests.Session, conv_id: str, content: str) -> dict:
    r = s.post(
        f"{API}/conversations/{conv_id}/reply",
        json={"role": "user", "content": content},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    return r.json() or {}


def _msg_text(reply_body: dict) -> str:
    try:
        return ((reply_body.get("message") or {}).get("content")) or ""
    except Exception:
        return reply_body.get("ai_response") or ""


def test_schedule_flow_continuity_accuracy_relevance():
    s = _login_session()
    conv_id = _create_conversation(s, "Schedule Flow")

    # Seed a fact
    _ = _reply(s, conv_id, "My doctor's appointment is next Friday at 3pm.")

    # Follow-up referencing previous fact
    r2 = _reply(s, conv_id, "Remind me to pick up meds after that.")
    t2 = _msg_text(r2).lower()

    # Continuity & accuracy: refers to appointment and time
    assert "doctor" in t2 or "appointment" in t2
    assert "3pm" in t2 or "3 pm" in t2

    # Relevance: should not inject unrelated content
    assert "stocks" not in t2 and "bitcoin" not in t2

    # Recap mid-convo
    r3 = _reply(s, conv_id, "/recap")
    t3 = _msg_text(r3)
    assert t3.strip() != ""
    # Expect at least one bullet
    lines = [ln for ln in t3.splitlines() if ln.strip()]
    assert len(lines) >= 1


def test_fitness_flow_user_preference_respected():
    s = _login_session()
    conv_id = _create_conversation(s, "Fitness Flow")

    _ = _reply(s, conv_id, "I don't like running.")
    r2 = _reply(s, conv_id, "Suggest me a workout plan.")
    t2 = _msg_text(r2).lower()

    # Should respect dislike of running
    assert "run" not in t2 or "avoid" in t2 or "alternative" in t2


def test_health_flow_allergy_context_persists():
    s = _login_session()
    conv_id = _create_conversation(s, "Health Flow")

    _ = _reply(s, conv_id, "I'm allergic to peanuts.")
    r2 = _reply(s, conv_id, "Can you suggest a lunch option?")
    t2 = _msg_text(r2).lower()

    # Should not recommend peanuts and ideally mention allergy-aware options
    assert "peanut" not in t2
    assert ("allergy" in t2) or ("avoid" in t2) or ("nut-free" in t2)
