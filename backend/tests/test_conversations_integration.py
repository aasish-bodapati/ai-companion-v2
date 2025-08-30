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

    # Mock embeddings with deterministic but varied vectors
    def mock_embed_texts(texts):
        import hashlib
        import numpy as np

        results = []
        for text in texts:
            # Create a hash-based seed for deterministic but varied vectors
            hash_value = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
            np.random.seed(hash_value % (2**31))
            vector = np.random.normal(0, 1, 384).astype(float)
            # Normalize the vector (L2 normalization)
            norm = np.linalg.norm(vector)
            if norm > 0:
                vector = vector / norm
            results.append(vector.tolist())
        return results

    monkeypatch.setattr(_emb, "embed_texts", mock_embed_texts)
    # Don't mock FAISS add/update - let them work with our 384-dim vectors
    # monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    # monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


@pytest.fixture(autouse=True)
def _cleanup_database():
    """Clean up database state between tests to prevent interference."""
    yield
    # Cleanup happens after each test
    try:
        from app.db.session import SessionLocal
        from app.models.memory import Memory
        from app.models.conversation import Conversation
        from app.models.message import Message

        db = SessionLocal()
        try:
            # Delete all test data
            db.query(Memory).delete()
            db.query(Message).delete()
            db.query(Conversation).delete()
            db.commit()
        finally:
            db.close()
    except Exception:
        # Ignore cleanup errors
        pass

    # Also clean up FAISS indices
    try:
        import os
        import glob
        from app.core.config import settings

        # Find and remove FAISS index files
        faiss_dir = os.path.join(settings.FAISS_INDEX_DIR or "faiss_indices")
        if os.path.exists(faiss_dir):
            for faiss_file in glob.glob(os.path.join(faiss_dir, "*.faiss")):
                try:
                    os.remove(faiss_file)
                except Exception:
                    pass
            for faiss_file in glob.glob(os.path.join(faiss_dir, "*.ids")):
                try:
                    os.remove(faiss_file)
                except Exception:
                    pass
    except Exception:
        # Ignore FAISS cleanup errors
        pass


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

    # Spy on auto_capture_memory to ensure trivial content is filtered out
    calls = {"count": 0}

    from app.services.auto_memory import auto_memory_service

    real_auto_capture = auto_memory_service.auto_capture_memory

    def spy_auto_capture(*args, **kwargs):
        calls["count"] += 1
        return real_auto_capture(*args, **kwargs)

    monkeypatch.setattr(auto_memory_service, "auto_capture_memory", spy_auto_capture)

    # Send trivial inputs + one non-trivial to ensure the service is working
    for text in ["hi", "ok", "👍", "h", "he", "I work as a software engineer"]:
        send_message(client, conv_id, text)

    # Now inspect recent conversation context: trivial entries should be filtered, important ones kept
    _ = list_messages(client, conv_id)
    # Auto-capture should be attempted for all messages
    assert calls["count"] >= 6  # All messages attempted auto-capture

    # But only the non-trivial message should be stored in memory
    r = client.get("/api/v1/memory/users/me/memories")
    assert r.status_code == 200, r.text
    memories = r.json()
    # Should only have the important message, not the trivial ones
    important_memories = [
        m for m in memories if "software engineer" in (m.get("content") or "").lower()
    ]
    trivial_memories = [
        m
        for m in memories
        if any(trivial in (m.get("content") or "").lower() for trivial in ["hi", "ok", "👍"])
    ]

    assert len(important_memories) >= 1, "Important message should be stored"
    assert len(trivial_memories) == 0, (
        f"Trivial messages should not be stored, but found: {trivial_memories}"
    )


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
    r = client.get("/api/v1/memory/users/me/memories")
    assert r.status_code == 200, r.text
    items = r.json()
    assert any(
        "favcolor" in (m.get("content") or "").lower()
        and "blue" in (m.get("content") or "").lower()
        for m in items
    )
    target = next(
        m
        for m in items
        if "favcolor" in (m.get("content") or "").lower()
        and "blue" in (m.get("content") or "").lower()
    )

    # Delete
    delr = client.delete(f"/api/v1/memory/memories/{target['id']}")
    assert delr.status_code in (200, 204), delr.text

    # Verify gone
    r2 = client.get("/api/v1/memory/users/me/memories")
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
    ctx_before = client.get(f"/api/v1/memory/conversations/{conv_id}/memory-context").json()[
        "context"
    ]
    print(
        f"DEBUG: Memory context before feedback: {[item.get('content', '')[:50] for item in ctx_before]}"
    )

    # Find the fact memory (FavColor: Blue) from all memories, not just context
    # Add a more robust retry mechanism to handle potential race conditions
    import time

    max_retries = 10
    for attempt in range(max_retries):
        all_memories = client.get("/api/v1/memory/users/me/memories").json()
        print(
            f"DEBUG: Attempt {attempt + 1}, all_memories: {[m.get('content', '')[:50] for m in all_memories]}"
        )
        fact_memories = [
            m
            for m in all_memories
            if "favcolor" in (m.get("content") or "").lower()
            and "blue" in (m.get("content") or "").lower()
        ]
        if fact_memories:
            print(f"DEBUG: Found fact memory: {fact_memories[0].get('content', '')}")
            break
        if attempt < max_retries - 1:
            time.sleep(0.5)  # Longer delay before retry

    assert fact_memories, (
        f"No fact memory found in all memories after {max_retries} attempts: {all_memories}"
    )
    target_memory = fact_memories[0]
    faiss_id = target_memory["faiss_id"]

    # Trigger a reply to obtain an assistant message id for feedback
    reply = client.post(f"/api/v1/conversations/{conv_id}/reply")
    assert reply.status_code == 200, reply.text
    assistant_msg = reply.json()

    # Send negative feedback targeting the memory faiss_id
    fb = client.post(
        f"/api/v1/memory/messages/{assistant_msg['id']}/feedback",
        json={"signal": "down", "faiss_id": faiss_id},
    )
    assert fb.status_code == 200, fb.text

    # Memory context after feedback should no longer include suppressed item
    ctx_after = client.get(f"/api/v1/memory/conversations/{conv_id}/memory-context").json()[
        "context"
    ]
    assert all(item.get("id") != faiss_id for item in ctx_after), ctx_after
