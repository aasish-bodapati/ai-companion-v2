from fastapi.testclient import TestClient
import pytest


@pytest.fixture(autouse=True)
def _enable_memory_and_privacy_defaults(monkeypatch):
    from app.core.config import settings
    # Ensure memory on and disclosure disabled by default
    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "PROFILE_VERBATIM_DISCLOSURE_ALLOWED", False, raising=False)
    # Keep embeddings/FAISS fast and deterministic
    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


def _setup_onboarding(client: TestClient):
    # Minimal onboarding with identifiable values that would appear in the serialized profile
    up = client.put(
        "/api/v1/users/me/onboarding",
        json={
            "identity": {"name": "Alice Smith", "pronouns": "she/her", "location": "LA"},
            "fun": {"randomFact": "Won a chess tournament"},
        },
    )
    assert up.status_code in (200, 201), up.text
    done = client.post("/api/v1/users/me/onboarding/complete")
    assert done.status_code in (200, 201), done.text


def _create_conversation(client: TestClient) -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": "t", "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def test_memory_context_redacts_profile_for_self_referential_query(client: TestClient):
    _setup_onboarding(client)
    conv_id = _create_conversation(client)

    # Ask a self-referential question
    m = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "user", "content": "What do you know about me?"},
    )
    assert m.status_code in (200, 201), m.text

    ctx = client.get(f"/api/v1/conversations/{conv_id}/memory-context").json()["context"]
    # Find the profile item
    prof_items = [it for it in ctx if it.get("type") == "profile"]
    assert prof_items, ctx

    content = prof_items[0]["content"]
    # Redaction rules: should not include exact values; should be bullets of keys only
    assert "Alice Smith" not in content
    assert "she/her" not in content
    assert "LA" not in content
    # Expect keys only (e.g., '- Name', '- Pronouns', '- Location')
    assert "- Name" in content or "- Identity" in content


def test_memory_context_allows_verbatim_when_flag_enabled(client: TestClient, monkeypatch):
    from app.core.config import settings

    _setup_onboarding(client)
    conv_id = _create_conversation(client)

    # Enable disclosure explicitly
    monkeypatch.setattr(settings, "PROFILE_VERBATIM_DISCLOSURE_ALLOWED", True, raising=False)

    m = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "user", "content": "What do you know about me?"},
    )
    assert m.status_code in (200, 201), m.text

    ctx = client.get(f"/api/v1/conversations/{conv_id}/memory-context").json()["context"]
    prof_items = [it for it in ctx if it.get("type") == "profile"]
    assert prof_items, ctx

    content = prof_items[0]["content"]
    # With flag on, verbatim profile allowed
    assert "Alice Smith" in content
    assert "Pronouns:" in content
    assert "Location:" in content
