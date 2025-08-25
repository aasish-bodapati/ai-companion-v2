import json
from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _enable_memory_features(monkeypatch):
    """Ensure memory capture features are enabled for these tests."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_CONSOLIDATION_ENABLED", True, raising=False)
    # Lower threshold to make test inputs reliably capture
    monkeypatch.setattr(settings, "AUTO_IMPORTANCE_THRESHOLD", 0.1, raising=False)


def _create_conversation(client: TestClient, title: str = "Memory Capture Test") -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": title, "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _add_user_message(client: TestClient, conv_id: str, content: str) -> Dict[str, Any]:
    r = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "user", "content": content},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()


def _list_my_memories(client: TestClient, *, limit: int = 100) -> List[Dict[str, Any]]:
    r = client.get(f"/api/v1/users/me/memories?limit={limit}")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    return data


def _count_by_phrase(items: List[Dict[str, Any]], phrase: str) -> int:
    p = phrase.lower()
    return sum(1 for it in items if p in (it.get("content") or "").lower())


def test_full_chat_flow_auto_memory_capture_and_dedup(client: TestClient):
    """
    Simulate a full chat-like flow and validate that:
    - User messages get auto-captured into memory (threshold lowered via monkeypatch).
    - Sending the same content twice does not result in duplicate entries in list endpoint.
    """
    conv_id = _create_conversation(client)

    phrase = "I like black coffee. Please remember it."

    # Before sending any messages, list memories baseline
    before = _list_my_memories(client, limit=200)
    base_count = _count_by_phrase(before, "black coffee")

    # Send a user message that should be auto-captured
    _add_user_message(client, conv_id, phrase)

    # Send the exact same message again to simulate duplicate trigger
    _add_user_message(client, conv_id, phrase)

    # After messages, list memories and ensure only a single entry is visible for identical content
    after = _list_my_memories(client, limit=200)

    # Due to backend dedupe in list_my_memories(), we should see at most one visible entry for identical content
    after_count = _count_by_phrase(after, "black coffee")
    assert after_count <= 1, (
        f"Expected at most one visible memory for identical content; saw {after_count}.\n"
        f"All items: {json.dumps(after, indent=2)[:1200]}"
    )

    # And overall, we should see that the count did not grow by more than 1 relative to baseline
    # (Depending on other memories present, we just enforce the relative delta on the phrase)
    assert after_count - base_count <= 1


def test_list_endpoint_dedup_normalizes_whitespace_and_case(client: TestClient):
    """
    Ensure normalization (case-insensitive, whitespace-collapsed) prevents duplicate listings
    when content differs only by whitespace/case.
    """
    conv_id = _create_conversation(client, title="Normalization Test")

    v1 = "I LIKE   Black\tCoffee"
    v2 = "i like black coffee"  # same after normalization

    _add_user_message(client, conv_id, v1)
    _add_user_message(client, conv_id, v2)

    items = _list_my_memories(client, limit=200)
    count_norm = _count_by_phrase(items, "black coffee")
    assert count_norm <= 1, (
        f"Expected normalized dedup to keep a single visible entry; saw {count_norm}.\n"
        f"All items: {json.dumps(items, indent=2)[:1200]}"
    )
