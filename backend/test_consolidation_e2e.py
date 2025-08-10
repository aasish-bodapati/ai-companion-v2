import os
import pytest
from fastapi.testclient import TestClient

from app.memory.faiss_store import _try_import_faiss
from app.memory.service import memory_service
from app.core.config import settings


@pytest.mark.skipif(_try_import_faiss() is None, reason="faiss not installed")
def test_consolidation_updates_vector_and_retrieval(tmp_path, monkeypatch, client: TestClient, db, token, test_user):
    """
    End-to-end:
    - Create a conversation
    - Post two user messages with the same consolidation key (e.g., "email: ...")
    - The second should update the existing memory's content and FAISS vector
    - Retrieval using the updated value should return the consolidated memory reflecting the latest content
    """
    # Isolate FAISS artifacts to a temp directory
    monkeypatch.setenv("FAISS_DATA_DIR", str(tmp_path))

    headers = {"Authorization": f"Bearer {token}"}

    # 1) Create a conversation
    resp = client.post("/api/v1/conversations", json={"title": "Test"}, headers=headers)
    assert resp.status_code == 201
    convo = resp.json()
    conversation_id = convo["id"]

    # 2) Post first user message with consolidation key 'email'
    m1 = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        json={"content": "email: old@example.com", "role": "user"},
        headers=headers,
    )
    assert m1.status_code == 201

    # 3) Post second user message updating the same key 'email'
    m2 = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        json={"content": "email: new@example.com", "role": "user"},
        headers=headers,
    )
    assert m2.status_code == 201

    # 4) Retrieval via MemoryService should reflect the updated value
    # Use a strong query to bias toward the updated text
    results = memory_service.search_memories(
        db=db,
        query="new@example.com",
        user_id=str(test_user.id),
        content_types=["message"],
        limit=5,
        min_relevance=0.0,
    )

    assert results, "Expected at least one memory result"
    # The highest scoring result should contain the updated email value
    top = results[0]
    assert "new@example.com" in (top.content or ""), f"Top memory did not reflect update: {top.content}"
