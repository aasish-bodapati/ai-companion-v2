from fastapi.testclient import TestClient
import pytest

from app.api.endpoints.conversations_messages import _sanitize_text_allergies


@pytest.fixture(autouse=True)
def _enable_memory_and_fast_paths(monkeypatch):
    # Ensure memory on and vector ops stubbed
    from app.core.config import settings
    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)
    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


# Phase 1: Core Safety — Allergy variants
@pytest.mark.parametrize(
    "text,expected",
    [
        ("I love peanut butter cookies", "I love allergen butter cookies"),
        ("Is this peanut-free?", "Is this allergen-safe?"),
        ("Is this peanut‑free?", "Is this allergen-safe?"),  # Unicode hyphen
        ("Contains peanuts and peanut oil", "Contains allergen and allergen oil"),
        ("No Peanuts", "No allergen"),
    ],
)
def test_allergy_safety_variants_unit(text, expected):
    # Directly verify sanitizer behavior for variants (db/user/conversation unused)
    out = _sanitize_text_allergies(None, "u", "c", text)
    assert out == expected


# Additional compound allergy coverage
@pytest.mark.parametrize(
    "text,expected",
    [
        ("I am allergic to tree nuts.", "I am allergic to tree-nut allergen."),
        ("Tree-Nuts trail mix", "tree-nut allergen trail mix"),
        ("Shellfish allergies are serious", "allergen allergies are serious"),
        ("Avoid shellfish please", "Avoid allergen please"),
    ],
)
def test_allergy_compound_terms(text, expected):
    out = _sanitize_text_allergies(None, "u", "c", text)
    assert out == expected


# Phase 2: UX — Temporal continuity resolution (ambiguous follow-up)
def test_ambiguous_temporal_references_continuity(client: TestClient):
    # Create conversation A and add a prior message with an appointment and time
    r = client.post("/api/v1/conversations/", json={"title": "A", "personalization_enabled": True})
    assert r.status_code in (200, 201)
    conv_id = r.json()["id"]

    # Add user message mentioning an appointment at 3pm
    m1 = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "user", "content": "I have a doctor appointment at 3pm today."},
    )
    assert m1.status_code in (200, 201)

    # Ambiguous follow-up: "remind me after that" should resolve to the prior time
    rep = client.post(
        f"/api/v1/conversations/{conv_id}/reply",
        json={"role": "user", "content": "Remind me right after that."},
    )
    assert rep.status_code == 200, rep.text
    msg = rep.json().get("message", {})
    content = (msg.get("content") or "").lower()
    # Expect it to reference the appointment and time
    assert "appointment" in content
    assert "3pm" in content


# Phase 2: UX — Clarify ambiguous "next Tuesday"
def test_ambiguous_next_tuesday_clarification(client: TestClient):
    r = client.post("/api/v1/conversations/", json={"title": "C", "personalization_enabled": True})
    assert r.status_code in (200, 201)
    conv_id = r.json()["id"]

    rep = client.post(
        f"/api/v1/conversations/{conv_id}/reply",
        json={"role": "user", "content": "Schedule a checkup next Tuesday"},
    )
    assert rep.status_code == 200, rep.text
    msg = rep.json().get("message", {})
    content = (msg.get("content") or "").lower()
    assert "when you say 'next tuesday'" in content
    assert "upcoming tuesday" in content or "following week" in content

# Phase 2: UX — Cross-conversation isolation (no context bleed)
def test_cross_conversation_context_isolated(client: TestClient):
    # Create conversation A with 4pm reference
    rA = client.post("/api/v1/conversations/", json={"title": "A", "personalization_enabled": True})
    assert rA.status_code in (200, 201)
    conv_a = rA.json()["id"]
    client.post(
        f"/api/v1/conversations/{conv_a}/messages",
        json={"role": "user", "content": "I have a meeting at 4pm."},
    )

    # Create conversation B with 5pm reference
    rB = client.post("/api/v1/conversations/", json={"title": "B", "personalization_enabled": True})
    assert rB.status_code in (200, 201)
    conv_b = rB.json()["id"]
    client.post(
        f"/api/v1/conversations/{conv_b}/messages",
        json={"role": "user", "content": "I have a standup at 5pm."},
    )

    # In B, ambiguous follow-up should resolve to 5pm (not 4pm from A)
    rep_b = client.post(
        f"/api/v1/conversations/{conv_b}/reply",
        json={"role": "user", "content": "remind me after that"},
    )
    assert rep_b.status_code == 200, rep_b.text
    content_b = (rep_b.json().get("message", {}).get("content") or "").lower()
    assert "5pm" in content_b
    assert "4pm" not in content_b
