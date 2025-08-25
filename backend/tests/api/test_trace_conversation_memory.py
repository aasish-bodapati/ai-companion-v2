import json
from typing import Dict, List, Set

import pytest
from app.core.config import settings

# Skip entire module if streaming is disabled
pytestmark = pytest.mark.skipif(
    not getattr(settings, "STREAMING_ENABLED", False),
    reason="Streaming endpoints are disabled",
)
from fastapi.testclient import TestClient


# Force-enable auto memory and low thresholds so we can observe captures clearly
@pytest.fixture(autouse=True)
def _enable_memory_features(monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
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
            if idx > 100:  # avoid long streams in CI
                break
    return chunks


def _list_messages(client: TestClient, conv_id: str) -> List[Dict]:
    r = client.get(f"/api/v1/conversations/{conv_id}/messages")
    assert r.status_code == 200, r.text
    return r.json()


def _list_memories(client: TestClient, limit: int = 1000) -> List[Dict]:
    r = client.get("/api/v1/users/me/memories", params={"limit": limit})
    assert r.status_code == 200, r.text
    return r.json()


def _memory_ids(items: List[Dict]) -> Set[str]:
    return {str(it.get("id")) for it in items if it.get("id")}


def _short(s: str, n: int = 140) -> str:
    s = s or ""
    return s if len(s) <= n else s[: n - 3] + "..."


def test_trace_conversation_memory(client: TestClient):
    conv_id = _create_conversation(client, "Trace Conversation & Memory Capture")

    user_inputs = [
        "My name is Alice.",
        "I like black coffee. Please remember it.",
        "I live in San Francisco.",
        "What do you know about me?",
        "/calendar add 2025-08-13 09:00-10:00 Standup",
        "I am allergic to peanuts.",
        "My timezone is PST.",
        "I like hiking.",
        "Summarize what you remember about me.",
        "I enjoy jazz music.",
    ]

    prev_mems = _list_memories(client, 200)
    prev_ids = _memory_ids(prev_mems)

    print("\n=== Trace Start ===")
    for i, text in enumerate(user_inputs):
        # 1) Add user message
        _add_user_message(client, conv_id, text)

        # 2) Trigger assistant reply (alternate non-stream/stream)
        if i % 2 == 0:
            reply = _reply_once(client, conv_id)
            reply_content = reply.get("message", {}).get("content", "")
            reply_mode = "reply"
        else:
            chunks = _reply_stream_once(client, conv_id)
            # best-effort stitch of last non-empty chunk for display
            stitched = "".join([c for c in chunks if c and "data:" in c])
            reply_content = stitched[-200:] if stitched else "(streamed)"
            reply_mode = "reply/stream"

        # 3) Collect new messages and memories
        msgs = _list_messages(client, conv_id)
        mems = _list_memories(client, 200)
        cur_ids = _memory_ids(mems)
        new_ids = list(cur_ids - prev_ids)
        new_mems = [m for m in mems if str(m.get("id")) in new_ids]

        # 4) Print a compact trace row
        print("\n-- Step", i + 1)
        print("User:", _short(text))
        print("Assistant (", reply_mode, "):", _short(reply_content))
        print("New memories:")
        print(json.dumps([
            {
                "id": m.get("id"),
                "type": m.get("content_type"),
                "content": _short(m.get("content", ""), 160),
                "importance_score": m.get("importance_score"),
                "metadata": m.get("memory_metadata"),
            } for m in new_mems
        ], indent=2))

        # Prepare for next iteration
        prev_ids = cur_ids

    # Final summary
    final_mems = _list_memories(client, 500)
    print("\n=== Final Memory Count:", len(final_mems), "===")
    assert len(final_mems) >= 5, "Expected at least 5 memories captured overall"
