from fastapi.testclient import TestClient
import pytest


@pytest.fixture(autouse=True)
def _weekly_env(monkeypatch):
    # Keep memory enabled and vector ops stubbed like other API tests
    from app.core.config import settings

    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)

    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


def _create_conversation(client: TestClient, title: str = "Weekly") -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": title, "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _add_message(client: TestClient, conv_id: str, role: str, content: str) -> dict:
    r = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": role, "content": content},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()


def _create_memory(client: TestClient, content: str) -> dict:
    r = client.post("/api/v1/memories", json={"content": content, "content_type": "fact"})
    assert r.status_code in (200, 201), r.text
    return r.json()


def test_weekly_digest_ok_basic(client: TestClient):
    # Seed: one conversation with a couple messages, and two memories
    conv_id = _create_conversation(client)
    _add_message(client, conv_id, "user", "Weekly digest test message A")
    _add_message(client, conv_id, "assistant", "Ack")

    _create_memory(client, "Highlight A\nDetails A")
    _create_memory(client, "Highlight B\nDetails B")

    # Request digest for default last 7 days
    r = client.get(
        "/api/v1/users/me/weekly-digest",
        params={"limit_conversations": 1, "limit_highlights": 2},
    )
    assert r.status_code == 200, r.text

    payload = r.json()
    assert isinstance(payload, dict)

    # Period
    period = payload.get("period") or {}
    assert isinstance(period.get("start"), str)
    assert isinstance(period.get("end"), str)

    # Summary
    assert "summary" in payload
    assert isinstance(payload.get("summary"), str)

    # Highlights
    highlights = payload.get("highlights")
    assert isinstance(highlights, list)
    assert len(highlights) <= 2
    for h in highlights:
        assert isinstance(h.get("title"), str)
        assert isinstance(h.get("detail"), str)
        # optional fields may be None/absent
        _ = h.get("faiss_id", None)
        _ = h.get("rank_boost", None)

    # Stats
    stats = payload.get("stats") or {}
    assert isinstance(stats.get("messages"), int)
    assert isinstance(stats.get("new_memories"), int)
    assert isinstance(stats.get("reinforced"), int)

    # Provenance
    prov = payload.get("provenance") or {}
    assert prov.get("source") == "weekly_digest"
    assert isinstance(prov.get("model"), str)
    assert isinstance(prov.get("user_id"), str)


def test_weekly_digest_auth_required(unauth_client: TestClient):
    r = unauth_client.get("/api/v1/users/me/weekly-digest")
    assert r.status_code in (401, 403)


def test_weekly_digest_with_explicit_dates(client: TestClient):
    # Seed minimal data
    conv_id = _create_conversation(client)
    _add_message(client, conv_id, "user", "Weekly digest date window check")
    _create_memory(client, "Weekly period memory")

    # Provide explicit date range (today to today)
    from datetime import datetime

    today = datetime.utcnow().date().isoformat()
    r = client.get(
        "/api/v1/users/me/weekly-digest",
        params={"start": today, "end": today, "limit_conversations": 1, "limit_highlights": 3},
    )
    assert r.status_code == 200, r.text
    payload = r.json()
    assert payload.get("period", {}).get("start") == today
    assert payload.get("period", {}).get("end") == today
