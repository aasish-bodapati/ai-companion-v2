from fastapi.testclient import TestClient
import uuid
import pytest


@pytest.fixture(autouse=True)
def _enable_memory(monkeypatch):
    # Ensure memory is on and FAISS ops are no-ops for speed
    from app.core.config import settings

    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)
    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 384 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


def _create_conversation(client: TestClient, title: str = "t") -> str:
    r = client.post("/api/v1/conversations/", json={"title": title, "personalization_enabled": True})
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def test_conversation_crud_and_messages(client: TestClient):
    # Create
    conv_id = _create_conversation(client)

    # Get
    g = client.get(f"/api/v1/conversations/{conv_id}")
    assert g.status_code == 200
    assert g.json().get("id") == conv_id

    # Update
    u = client.put(f"/api/v1/conversations/{conv_id}", json={"title": "New Title"})
    assert u.status_code == 200
    assert (u.json().get("title") or "").startswith("New Title")

    # Messages list (empty)
    lm = client.get(f"/api/v1/conversations/{conv_id}/messages")
    assert lm.status_code == 200
    assert isinstance(lm.json(), list)

    # Add user message
    m1 = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "user", "content": "FavColor: Blue"},
    )
    assert m1.status_code in (200, 201), m1.text

    # Reply (LLM mocked in fixture)
    rep = client.post(f"/api/v1/conversations/{conv_id}/reply")
    assert rep.status_code == 200, rep.text

    # Memory context
    ctx = client.get(f"/api/v1/memory/conversations/{conv_id}/memory-context")
    assert ctx.status_code == 200
    payload = ctx.json()
    # Expect keys: context (list) and maybe meta fields
    assert "context" in payload
    assert isinstance(payload.get("context"), list)

    # Delete
    d = client.delete(f"/api/v1/conversations/{conv_id}")
    assert d.status_code in (200, 204)

    # Get after delete -> 404
    g2 = client.get(f"/api/v1/conversations/{conv_id}")
    assert g2.status_code == 404


def test_auth_errors_require_jwt(unauth_client: TestClient):
    # Unauthorized list
    r0 = unauth_client.get("/api/v1/conversations/")
    assert r0.status_code in (401, 403)

    # Unauthorized create
    r = unauth_client.post("/api/v1/conversations/", json={"title": "x"})
    assert r.status_code in (401, 403)


def test_missing_ids_return_404(client: TestClient):
    # 404s for bogus id
    bogus = str(uuid.uuid4())
    for path in [
        f"/api/v1/conversations/{bogus}",
        f"/api/v1/conversations/{bogus}/messages",
        f"/api/v1/memory/conversations/{bogus}/memory-context",
        f"/api/v1/conversations/{bogus}/reply",
    ]:
        if path.endswith("/messages"):
            resp = client.get(path)
        elif path.endswith("/reply"):
            resp = client.post(path)
        else:
            resp = client.get(path)
        assert resp.status_code == 404
