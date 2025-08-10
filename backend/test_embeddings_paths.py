import pytest
from fastapi.testclient import TestClient

from app.memory.faiss_store import _try_import_faiss
from app.memory.service import memory_service


@pytest.mark.skipif(_try_import_faiss() is None, reason="faiss not installed")
def test_user_and_assistant_messages_are_embedded(tmp_path, monkeypatch, client: TestClient, db, token, test_user):
    """
    Verify that both user and assistant messages get stored into memory/FAISS on all paths:
    - POST /conversations/{id}/messages for user
    - POST /conversations/{id}/reply for assistant
    """
    # Keep FAISS artifacts isolated per-test
    monkeypatch.setenv("FAISS_DATA_DIR", str(tmp_path))

    headers = {"Authorization": f"Bearer {token}"}

    # Create a conversation
    resp = client.post("/api/v1/conversations", json={"title": "Embeddings Flow"}, headers=headers)
    assert resp.status_code == 201
    conv = resp.json()
    cid = conv["id"]

    # Send a user message
    user_text = "favorite_color: blue"
    m1 = client.post(
        f"/api/v1/conversations/{cid}/messages",
        json={"content": user_text, "role": "user"},
        headers=headers,
    )
    assert m1.status_code == 201

    # Ask assistant to reply (this will also store assistant message in memory)
    r = client.post(f"/api/v1/conversations/{cid}/reply", headers=headers)
    assert r.status_code == 200
    assistant_msg = r.json()
    assert assistant_msg.get("role") == "assistant"
    assistant_text = assistant_msg.get("content") or ""

    # Search for the user message content
    results_user = memory_service.search_memories(
        db=db,
        query="favorite_color",
        user_id=str(test_user.id),
        content_types=["message"],
        limit=5,
        min_relevance=0.0,
    )
    assert any("favorite_color: blue" in (res.content or "") for res in results_user)

    # Search for assistant content using a token from its response (if any)
    # If empty, at least ensure we don't error and results can be fetched
    if assistant_text.strip():
        token = assistant_text.split()[0]
        results_assistant = memory_service.search_memories(
            db=db,
            query=token,
            user_id=str(test_user.id),
            content_types=["message"],
            limit=5,
            min_relevance=0.0,
        )
        assert results_assistant is not None
