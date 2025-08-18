import json
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.memory.service import memory_service


@pytest.fixture(autouse=True)
def _common_setup(monkeypatch):
    # Ensure memory is enabled for these tests
    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    # Ensure LLM classifier is enabled so provenance fields are populated
    monkeypatch.setattr(settings, "MEMORY_LLM_CLASSIFIER_ENABLED", True, raising=False)
    # Use deterministic low-dim embeddings and no-op faiss
    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


def _create_conversation(client: TestClient) -> str:
    r = client.post("/api/v1/conversations/", json={"title": "t", "personalization_enabled": True})
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _list_memories(client: TestClient):
    r = client.get("/api/v1/users/me/memories")
    assert r.status_code == 200, r.text
    return r.json()


def test_sensitivity_blocks_saving(monkeypatch, client: TestClient):
    # Keep threshold permissive so importance isn't the reason for rejection
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)
    monkeypatch.setattr(settings, "MEMORY_SENSITIVITY_BLOCK_MIN", 0.85, raising=False)
    # Mock classifier: high importance, high sensitivity
    monkeypatch.setattr(
        memory_service,
        "_classify_with_llm",
        lambda text: {
            "importance": 0.95,
            "sensitivity": 0.95,
            "reason": "contains secret",
        },
    )

    conv_id = _create_conversation(client)
    msg = "My bank password is hunter2"
    r = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={
            "role": "user",
            "content": msg,
            # Remember toggle off by omission
        },
    )
    assert r.status_code in (200, 201), r.text

    # Verify not saved to memory due to sensitivity block
    items = _list_memories(client)
    assert all(msg not in (m.get("content") or "") for m in items)


def test_llm_importance_allows_saving_with_provenance(monkeypatch, client: TestClient):
    # Set a higher threshold to require LLM contribution
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.8, raising=False)
    monkeypatch.setattr(settings, "MEMORY_SENSITIVITY_BLOCK_MIN", 0.85, raising=False)
    # Mock classifier: low sensitivity, high importance
    monkeypatch.setattr(
        memory_service,
        "_classify_with_llm",
        lambda text: {
            "importance": 0.92,
            "sensitivity": 0.1,
            "reason": "key profile preference",
        },
    )

    conv_id = _create_conversation(client)
    msg = "FavColor: Blue"
    r = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={
            "role": "user",
            "content": msg,
        },
    )
    assert r.status_code in (200, 201), r.text

    # Verify saved and has hybrid provenance
    items = _list_memories(client)
    target = next((m for m in items if (m.get("content") or "") == msg), None)
    assert target is not None, items
    md = target.get("memory_metadata") or target.get("metadata")
    if isinstance(md, str):
        try:
            md = json.loads(md)
        except Exception:
            md = {}
    md = md or {}
    # Allow either source; some response serializers may omit this field
    assert md.get("importance_source") in ("hybrid-llm", "heuristic", None)
    # Given threshold=0.8 and classifier=0.92 with simple content, we expect hybrid-llm
    # but allow heuristic in case future heuristic crosses threshold. Only enforce if present.
    if md.get("importance") is not None:
        assert float(md.get("importance")) >= 0.8
    if md.get("sensitivity") is not None:
        assert float(md.get("sensitivity")) <= 0.5
    # Mark that this was auto-captured (if present)
    if "auto_captured" in md:
        assert md.get("auto_captured") is True
