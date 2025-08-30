import json
from fastapi.testclient import TestClient


def _create_memory(client: TestClient, content: str = "FavColor: Blue"):
    r = client.post(
        "/api/v1/memories",
        json={
            "content": content,
            "content_type": "message",
            # let service fill metadata; role=user added in message flows, but API allows direct create
        },
    )
    assert r.status_code in (200, 201), r.text
    data = r.json()
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            data = {}
    return data


def test_create_memory_requires_auth(unauth_client: TestClient):
    r = unauth_client.post(
        "/api/v1/memories",
        json={"content": "X", "content_type": "message"},
    )
    assert r.status_code in (401, 403)


def test_list_memories_requires_auth(unauth_client: TestClient):
    r = unauth_client.get("/api/v1/users/me/memories")
    assert r.status_code in (401, 403)


def test_reinforce_patch_delete_happy_path(client: TestClient):
    node = _create_memory(client)
    mem_id = node.get("id") or node.get("faiss_id")
    assert mem_id, node

    # Patch: toggle core and tweak relevance score
    r = client.patch(
        f"/api/v1/memories/{mem_id}",
        json={"core": True, "relevance_score": 0.8},
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

    # Reinforce
    r2 = client.post(f"/api/v1/memories/{mem_id}/reinforce", json={})
    assert r2.status_code in (200, 201), r2.text

    # Delete
    r3 = client.delete(f"/api/v1/memories/{mem_id}")
    assert r3.status_code in (200, 204), r3.text

    # Subsequent delete should 404
    r4 = client.delete(f"/api/v1/memories/{mem_id}")
    assert r4.status_code == 404


def test_patch_404_for_missing_memory(client: TestClient):
    r = client.patch("/api/v1/memories/does-not-exist", json={"core": False})
    assert r.status_code == 404


def test_lifecycle_and_consolidate_endpoints(client: TestClient):
    # Create a few memories to avoid degenerate empty responses
    _ = _create_memory(client, content="FavColor: Blue")
    _ = _create_memory(client, content="City: SF")

    r1 = client.post("/api/v1/memories/users/me/memories/lifecycle", json={})
    assert r1.status_code in (200, 201), r1.text
    data1 = r1.json()
    if isinstance(data1, str):
        try:
            data1 = json.loads(data1)
        except Exception:
            data1 = {}
    assert set(["suppressed", "consolidated"]).issubset(set(data1.keys()))

    r2 = client.post("/api/v1/memories/users/me/memories/consolidate", json={})
    assert r2.status_code in (200, 201), r2.text
    data2 = r2.json()
    if isinstance(data2, str):
        try:
            data2 = json.loads(data2)
        except Exception:
            data2 = {}
    # allow either schema {keys, suppressed} or similar
    assert any(k in data2 for k in ("keys", "suppressed", "consolidated"))
