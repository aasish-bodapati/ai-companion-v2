from typing import List, Dict
import json
import pytest
from app.core.config import settings

# Skip entire module if streaming is disabled
pytestmark = pytest.mark.skipif(
    not getattr(settings, "STREAMING_ENABLED", False),
    reason="Streaming endpoints are disabled",
)

from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _enable_auto_memory(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "AUTO_MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_CONSOLIDATION_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_IMPORTANCE_THRESHOLD", 0.0, raising=False)


def _create_conversation(client: TestClient, title: str) -> str:
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


def _reply_once(client: TestClient, conv_id: str) -> Dict:
    r = client.post(f"/api/v1/conversations/{conv_id}/reply")
    assert r.status_code == 200, r.text
    return r.json()


def _reply_stream_once(client: TestClient, conv_id: str) -> List[str]:
    chunks: List[str] = []
    with client.stream("POST", f"/api/v1/conversations/{conv_id}/reply/stream") as resp:
        assert resp.status_code == 200
        for idx, chunk in enumerate(resp.iter_text()):
            chunks.append(chunk)
            if idx > 100:
                break
    return chunks


def _list_messages(client: TestClient, conv_id: str) -> List[Dict]:
    r = client.get(f"/api/v1/conversations/{conv_id}/messages")
    assert r.status_code == 200, r.text
    return r.json()


def _list_memories(client: TestClient, limit: int = 200) -> List[Dict]:
    r = client.get("/api/v1/users/me/memories", params={"limit": limit})
    assert r.status_code == 200, r.text
    return r.json()


def test_inspect_messages_and_memories(client: TestClient):
    conv_id = _create_conversation(client, "Inspect Messages & Memories")

    # Send a few messages likely to be captured
    _add_user_message(client, conv_id, "My name is Alice.")
    _add_user_message(client, conv_id, "I like black coffee. Please remember it.")
    _add_user_message(client, conv_id, "What do you know about me?")

    # Trigger replies
    _reply_once(client, conv_id)
    _reply_stream_once(client, conv_id)

    # Fetch and print conversation messages
    msgs = _list_messages(client, conv_id)
    print("\n=== Conversation Messages ===")
    print(
        json.dumps(
            [
                {
                    "id": m.get("id"),
                    "role": m.get("role"),
                    "content": (m.get("content") or "")[:120],
                }
                for m in msgs
            ],
            indent=2,
        )
    )

    # Fetch and print memories (deduped)
    mems = _list_memories(client, 200)
    print("\n=== Memories (deduped) ===")
    print(
        json.dumps(
            [
                {
                    "id": it.get("id"),
                    "type": it.get("content_type"),
                    "content": (it.get("content") or "")[:160],
                    "importance_score": it.get("importance_score"),
                    "metadata": it.get("memory_metadata"),
                }
                for it in mems[:20]
            ],
            indent=2,
        )
    )

    # Basic sanity assertions
    assert any(m.get("role") == "assistant" for m in msgs), "No assistant messages persisted"
    assert any("alice" in (it.get("content", "").lower()) for it in mems), (
        "Expected 'Alice' in memories"
    )
    assert any("coffee" in (it.get("content", "").lower()) for it in mems), (
        "Expected 'coffee' in memories"
    )
