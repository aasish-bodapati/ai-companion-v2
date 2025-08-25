import re
from typing import Dict, List

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _enable_memory_and_autocapture(monkeypatch):
    from app.core.config import settings

    # Ensure memory + auto-capture + consolidation are enabled and permissive for tests
    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_CONSOLIDATION_ENABLED", True, raising=False)
    # Lower threshold to aggressively capture
    monkeypatch.setattr(settings, "AUTO_IMPORTANCE_THRESHOLD", 0.0, raising=False)


def _create_conversation(client: TestClient, title: str = "Varied Capture Test") -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": title, "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _add_user_message(client: TestClient, conv_id: str, content: str) -> Dict:
    r = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "user", "content": content},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()


def _list_memories(client: TestClient, limit: int = 200) -> List[Dict]:
    r = client.get(f"/api/v1/users/me/memories", params={"limit": limit})
    assert r.status_code == 200, r.text
    return r.json()


def _normalize_for_assertions(text: str) -> str:
    """Mirror server dedupe normalization: lowercase, remove boilerplate, strip non-alnum, collapse ws."""
    t = (text or "").strip().lower()
    boilerplate_patterns = [
        r"\bplease\s+remember\s+it\b",
        r"\bremember\s+this\b",
        r"\bremember\s+that\b",
        r"\bplease\s+remember\b",
        r"\bremember\b",
        r"\bplease\b",
        r"\bit\b",
    ]
    for pat in boilerplate_patterns:
        t = re.sub(pat, " ", t)
    t = re.sub(r"[^a-z0-9\s]+", " ", t)
    return " ".join(t.split())


def test_varied_messages_auto_capture_and_dedup(client: TestClient):
    conv_id = _create_conversation(client)

    messages = [
        "I like black coffee. Please remember it.",
        "i LIKE black coffee",
        "I like black coffee — remember this!",
        "My timezone is PST.",
        "Please remember: My name is Alice.",
    ]

    for msg in messages:
        _add_user_message(client, conv_id, msg)

    # Fetch memories
    mems = _list_memories(client, limit=300)

    # Build normalized counts
    counts: Dict[str, int] = {}
    for m in mems:
        norm = _normalize_for_assertions(m.get("content", ""))
        if not norm:
            continue
        counts[norm] = counts.get(norm, 0) + 1

    # Expect exactly one canonical memory for the black coffee fact
    assert counts.get("i like black coffee", 0) == 1, (
        f"Expected one deduped memory for 'i like black coffee', got {counts.get('i like black coffee', 0)}\n"
        f"All norms: {sorted((k, v) for k, v in counts.items() if 'black' in k or 'coffee' in k)}"
    )

    # Expect capture for other distinct facts (allow >=1 since capture can consolidate to newer)
    assert counts.get("my timezone is pst", 0) >= 1
    assert counts.get("my name is alice", 0) >= 1


def test_peanut_allergy_is_captured_in_memories_list(client: TestClient):
    """Deterministically verify that the peanut allergy statement is captured as a memory."""
    conv_id = _create_conversation(client, title="Allergy Capture Test")

    # Provide a distinct preference-like statement
    _add_user_message(client, conv_id, "Please remember that I am allergic to peanuts.")

    # Fetch memories and assert presence by normalized text
    mems = _list_memories(client, limit=300)
    joined = "\n".join([m.get("content", "") or "" for m in mems]).lower()
    assert ("peanut" in joined) or ("allergic to peanuts" in joined) or ("allerg" in joined)


def test_note_fast_capture_persists_fact(client: TestClient):
    conv_id = _create_conversation(client, title="Note Fast Capture Test")

    # Use both variants to ensure either form works; we assert on the latter which should be most recent
    _add_user_message(client, conv_id, "note: buy oat milk and bananas")
    _add_user_message(client, conv_id, "/note pick up dry cleaning tomorrow")

    mems = _list_memories(client, limit=300)
    # Find a memory that contains the latter note text (fast-captured as content_type=fact)
    hit = None
    for m in mems:
        if "pick up dry cleaning" in (m.get("content", "") or "").lower():
            hit = m
            break
    assert hit is not None, f"Expected a memory containing the note body, got: {[m.get('content') for m in mems[:5]]}"
    # Optionally verify it is typed as a fact
    assert (hit.get("content_type") or "").lower() == "fact"


def test_note_delete_flow(client: TestClient):
    conv_id = _create_conversation(client, title="Note Delete Test")
    body = "note: remember to water the plants at 6pm"
    _add_user_message(client, conv_id, body)

    mems = _list_memories(client, limit=300)
    # Identify the memory id for the captured note
    target_id = None
    for m in mems:
        if "water the plants" in (m.get("content", "") or "").lower():
            target_id = m.get("id")
            break
    assert target_id, f"Expected a captured note memory, found {len(mems)} items"

    # Delete it
    r = client.delete(f"/api/v1/memories/{target_id}")
    assert r.status_code in (200, 204), r.text

    # Verify it's gone
    mems2 = _list_memories(client, limit=300)
    joined2 = "\n".join([(m.get("content", "") or "").lower() for m in mems2])
    assert "water the plants" not in joined2
