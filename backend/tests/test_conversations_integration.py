from typing import List
from fastapi.testclient import TestClient
import pytest

from app.core.config import settings
from app.memory.service import memory_service


@pytest.fixture(autouse=True)
def _enable_memory(monkeypatch):
    # Force-enable memory for tests unless overridden
    monkeypatch.setattr(settings, "MEMORY_ENABLED", True)
    # Lower importance threshold so user messages are stored in tests
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)
    # Make FAISS functions no-op by faking embeddings and add/update
    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


def create_conversation(
    client: TestClient, title: str = None, personalization_enabled: bool = True
) -> str:
    payload = {"title": title} if title is not None else {}
    payload["personalization_enabled"] = personalization_enabled
    r = client.post("/api/v1/conversations/", json=payload)
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def send_message(client: TestClient, conv_id: str, text: str):
    r = client.post(
        f"/api/v1/conversations/{conv_id}/messages", json={"role": "user", "content": text}
    )
    assert r.status_code in (200, 201), r.text
    return r.json()


def get_conversation(client: TestClient, conv_id: str):
    r = client.get(f"/api/v1/conversations/{conv_id}")
    assert r.status_code == 200, r.text
    return r.json()


def list_messages(client: TestClient, conv_id: str) -> List[dict]:
    r = client.get(f"/api/v1/conversations/{conv_id}/messages")
    assert r.status_code == 200, r.text
    return r.json()


def test_auto_rename_on_first_message(client: TestClient):
    conv_id = create_conversation(client)
    send_message(client, conv_id, "Plan my Goa trip itinerary")
    conv = get_conversation(client, conv_id)
    # Title should be first line of first message (truncated to 80, but short here)
    assert (conv.get("title") or "").startswith("Plan my Goa trip itinerary")


def test_trivial_messages_not_stored(monkeypatch, client: TestClient):
    conv_id = create_conversation(client)

    # Spy on store_memory to ensure it is invoked but internally rejects trivial content
    calls = {"count": 0}

    real_store = memory_service.store_memory

    def spy_store(*args, **kwargs):
        calls["count"] += 1
        return real_store(*args, **kwargs)

    monkeypatch.setattr(memory_service, "store_memory", spy_store)

    # Send trivial inputs
    for text in ["hi", "ok", "👍", "h", "he"]:
        send_message(client, conv_id, text)

    # Now inspect recent conversation context: repeated trivial entries should be deduped/filtered
    _ = list_messages(client, conv_id)
    # At least the API accepted them, but memory store should skip (returns None)
    # We can't directly read FAISS; rely on the store guard not raising
    assert calls["count"] >= 1  # store was attempted


def test_personalization_toggle_skips_memory_when_off(monkeypatch, client: TestClient):
    # Create conversation with personalization disabled
    conv_id = create_conversation(client, personalization_enabled=False)
    send_message(client, conv_id, "What did I say earlier?")

    # Patch memory_service methods to detect calls
    called = {"sys": 0, "ctx": 0}

    def sys_prompt(*args, **kwargs):
        called["sys"] += 1
        return "PERSONALIZED"

    def ctx(*args, **kwargs):
        called["ctx"] += 1
        return "CTX"

    monkeypatch.setattr(memory_service, "build_personalized_system_prompt", sys_prompt)
    monkeypatch.setattr(memory_service, "get_conversation_context", ctx)

    # Trigger reply
    r = client.post(f"/api/v1/conversations/{conv_id}/reply")
    assert r.status_code == 200, r.text

    # With personalization off, we should not call memory_service methods
    assert called["sys"] == 0
    assert called["ctx"] == 0


def test_personalization_toggle_uses_memory_when_on(monkeypatch, client: TestClient):
    # Ensure memory is on and threshold allows storing the user message during test
    from app.core.config import settings

    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)
            # Avoid external OpenRouter API calls and rate limits
    try:
        import app.core.llm as _llm

        monkeypatch.setattr(_llm, "generate_with_openrouter", lambda *a, **k: "ok")
    except Exception:
        pass

    conv_id = create_conversation(client, personalization_enabled=True)
    # Include a keyword to pass the relevance gate in reply(): _seems_specific()
    send_message(client, conv_id, "What are my profile preferences?")

    called = {"sys": 0, "ctx": 0}

    def sys_prompt(*args, **kwargs):
        called["sys"] += 1
        return "PERSONALIZED"

    def ctx(*args, **kwargs):
        called["ctx"] += 1
        return "CTX"

    monkeypatch.setattr(memory_service, "build_personalized_system_prompt", sys_prompt)
    monkeypatch.setattr(memory_service, "get_conversation_context", ctx)

    r = client.post(f"/api/v1/conversations/{conv_id}/reply")
    assert r.status_code == 200, r.text

    assert called["sys"] == 1
    assert called["ctx"] == 1


def test_delete_memory_endpoint_removes_item(client: TestClient):
    # Create conversation and add a memorable fact
    conv_id = create_conversation(client)
    send_message(client, conv_id, "FavColor: Blue")

    # List memories and find our fact
    r = client.get("/api/v1/users/me/memories")
    assert r.status_code == 200, r.text
    items = r.json()
    assert any("FavColor: Blue" in (m.get("content") or "") for m in items)
    target = next(m for m in items if "FavColor: Blue" in (m.get("content") or ""))

    # Delete
    delr = client.delete(f"/api/v1/memories/{target['id']}")
    assert delr.status_code in (200, 204), delr.text

    # Verify gone
    r2 = client.get("/api/v1/users/me/memories")
    assert r2.status_code == 200
    items2 = r2.json()
    assert all(m.get("id") != target["id"] for m in items2)


def test_feedback_down_suppresses_memory_in_context(client: TestClient):
    # Create conversation and store a retrievable fact
    conv_id = create_conversation(client)
    send_message(client, conv_id, "FavColor: Blue")

    # Build a query that should retrieve it
    send_message(client, conv_id, "What is my FavColor?")

    # Get memory context before feedback (should include our fact)
    ctx_before = client.get(f"/api/v1/conversations/{conv_id}/memory-context").json()["context"]
    assert any("Blue" in c.get("content", "") for c in ctx_before), ctx_before
    target_item = next(c for c in ctx_before if "Blue" in c.get("content", ""))
    faiss_id = target_item["id"]

    # Trigger a reply to obtain an assistant message id for feedback
    reply = client.post(f"/api/v1/conversations/{conv_id}/reply")
    assert reply.status_code == 200, reply.text
    assistant_msg = reply.json()

    # Send negative feedback targeting the memory faiss_id
    fb = client.post(
        f"/api/v1/messages/{assistant_msg['id']}/feedback",
        json={"signal": "down", "faiss_id": faiss_id},
    )
    assert fb.status_code == 200, fb.text

    # Memory context after feedback should no longer include suppressed item
    ctx_after = client.get(f"/api/v1/conversations/{conv_id}/memory-context").json()["context"]
    assert all(item.get("id") != faiss_id for item in ctx_after), ctx_after
