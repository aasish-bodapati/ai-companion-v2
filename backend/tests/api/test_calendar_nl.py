import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _enable_memory(monkeypatch):
    # Ensure memory is enabled and FAISS ops are no-ops for speed
    from app.core.config import settings
    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)
    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


def _create_conversation(client: TestClient, title: str = "Calendar NL") -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": title, "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def test_calendar_nl_create_list_delete_happy_path(client: TestClient):
    # Create a conversation
    conv_id = _create_conversation(client)

    # 1) NL Create: should hit _handle_calendar_nl default create path
    msg = {
        "role": "user",
        "content": "Schedule Gym tomorrow at 1pm",
    }
    resp = client.post(f"/api/v1/conversations/{conv_id}/reply", json=msg)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "message" in data
    content = data["message"]["content"]
    assert "Added:" in content  # deterministic prefix from handler

    # 2) NL List: request upcoming events using list intent
    # We keep the phrasing explicit to improve intent detection reliability
    list_msg = {
        "role": "user",
        "content": "list my calendar events",
    }
    list_resp = client.post(f"/api/v1/conversations/{conv_id}/reply", json=list_msg)
    assert list_resp.status_code == 200, list_resp.text
    list_content = list_resp.json()["message"]["content"]
    # Either shows upcoming items or the clear message (should be upcoming after creation)
    assert (
        "Here's what's coming up:" in list_content
        or "Your calendar looks clear" in list_content
        or "Your Upcoming Schedule" in list_content
    )

    # 3) NL Delete: fetch events to get an id, then delete via NL
    ev = client.get("/api/v1/calendar/events")
    assert ev.status_code == 200
    events = ev.json()
    assert isinstance(events, list) and len(events) >= 1
    # Choose the most recent one
    target_id = events[0]["id"]

    del_msg = {
        "role": "user",
        # include the token "event" to satisfy calendar keyword detection
        "content": f"please delete event {target_id}",
    }
    del_resp = client.post(f"/api/v1/conversations/{conv_id}/reply", json=del_msg)
    assert del_resp.status_code == 200, del_resp.text
    del_content = del_resp.json()["message"]["content"]
    assert del_content in ("Deleted.", "Deleted: event removed from your calendar.")

    # Verify deletion by listing via API
    after = client.get("/api/v1/calendar/events")
    assert after.status_code == 200
    remaining_ids = {e["id"] for e in after.json()}
    assert target_id not in remaining_ids
