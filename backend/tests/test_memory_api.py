import json
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings


@pytest.fixture(autouse=True)
def _memory_env(monkeypatch):
    # Ensure memory is enabled and thresholds permissive during these tests
    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)

    # Avoid external/vector side effects
    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


def _create_memory(client: TestClient, content: str, *, core: bool | None = None) -> dict:
    payload: dict = {"content": content, "content_type": "fact"}
    if core is not None:
        payload["core"] = core
    r = client.post("/api/v1/memories", json=payload)
    assert r.status_code in (200, 201), r.text
    return r.json()


def _list_memories(client: TestClient, **params) -> list[dict]:
    r = client.get("/api/v1/users/me/memories", params=params)
    assert r.status_code == 200, r.text
    return r.json()


def test_create_and_list_memories_basic(client: TestClient):
    node = _create_memory(client, "FavColor: Blue", core=False)
    assert node.get("faiss_id")
    assert node.get("content") == "FavColor: Blue"
    assert node.get("content_type") == "fact"
    assert isinstance(node.get("memory_metadata"), dict)

    items = _list_memories(client)
    assert any(m.get("id") == node["id"] for m in items)


def test_list_filter_core_and_limit(client: TestClient):
    # Seed: two non-core, one core
    a = _create_memory(client, "A1", core=False)
    b = _create_memory(client, "B1", core=False)
    c = _create_memory(client, "C1", core=True)

    # Filter core=true returns only C1
    core_items = _list_memories(client, core=True)
    assert all(m.get("memory_metadata", {}).get("core") is True for m in core_items)
    assert any(m.get("id") == c["id"] for m in core_items)

    # Filter core=false excludes the core item
    non_core = _list_memories(client, core=False)
    assert all(m.get("memory_metadata", {}).get("core") in (False, None) for m in non_core)
    assert all(m.get("id") != c["id"] for m in non_core)

    # Limit
    limited = _list_memories(client, limit=2)
    assert len(limited) <= 2


def test_patch_toggle_core_and_relevance(client: TestClient):
    node = _create_memory(client, "Toggle me", core=False)

    # Promote to core and set relevance
    r = client.patch(
        f"/api/v1/memories/{node['id']}",
        json={"core": True, "relevance_score": 0.9},
    )
    assert r.status_code == 200, r.text
    updated = r.json()
    if isinstance(updated, str):
        try:
            updated = json.loads(updated)
        except Exception:
            updated = {}
    md = updated.get("memory_metadata", {})
    if isinstance(md, str):
        try:
            md = json.loads(md)
        except Exception:
            md = {}
    assert (md or {}).get("core") is True
    assert pytest.approx(updated.get("relevance_score", 0.0), rel=1e-3) == 0.9

    # Demote back
    r2 = client.patch(
        f"/api/v1/memories/{node['id']}",
        json={"core": False},
    )
    assert r2.status_code == 200, r2.text
    updated2 = r2.json()
    if isinstance(updated2, str):
        try:
            updated2 = json.loads(updated2)
        except Exception:
            updated2 = {}
    md2 = updated2.get("memory_metadata", {})
    if isinstance(md2, str):
        try:
            md2 = json.loads(md2)
        except Exception:
            md2 = {}
    assert (md2 or {}).get("core") in (False, None)


def test_delete_memory_and_verify_removed(client: TestClient):
    node = _create_memory(client, "Delete me", core=False)

    # Delete
    delr = client.delete(f"/api/v1/memories/{node['id']}")
    assert delr.status_code in (200, 204), delr.text

    # Verify not present in list
    items = _list_memories(client)
    assert all(m.get("id") != node["id"] for m in items)


def test_auth_required_for_memory_endpoints(unauth_client: TestClient):
    # Without auth, requests should be unauthorized
    r1 = unauth_client.get("/api/v1/users/me/memories")
    assert r1.status_code in (401, 403)

    r2 = unauth_client.post("/api/v1/memories", json={"content": "x"})
    assert r2.status_code in (401, 403)

    # Even if we guess an id, PATCH/DELETE should be unauthorized
    r3 = unauth_client.patch("/api/v1/memories/some-id", json={"core": True})
    assert r3.status_code in (401, 403)
    r4 = unauth_client.delete("/api/v1/memories/some-id")
    assert r4.status_code in (401, 403)
