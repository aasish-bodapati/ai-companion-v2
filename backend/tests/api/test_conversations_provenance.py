import json
import re
from typing import Any, Dict

import pytest
from app.core.config import settings

# Skip entire module if streaming is disabled
pytestmark = pytest.mark.skipif(
    not getattr(settings, "STREAMING_ENABLED", False),
    reason="Streaming endpoints are disabled",
)
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _enable_memory_and_stubs(monkeypatch):
    # Ensure memory features are enabled and avoid heavy FAISS/embeddings
    from app.core.config import settings

    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)
    # Keep retrieval debug default True unless a test overrides
    monkeypatch.setattr(settings, "DEBUG_RETRIEVAL_ENABLED", True, raising=False)

    from app.memory import embeddings as _emb
    from app.memory import faiss_store as _faiss

    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
    monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
    monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)


def _create_conversation(client: TestClient, title: str = "Provenance Test") -> str:
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


def test_reply_returns_assistantreply_with_provenance(client: TestClient):
    conv_id = _create_conversation(client)
    _add_user_message(client, conv_id, "Please summarize my preferences from earlier.")

    # debug default False
    rep = client.post(f"/api/v1/conversations/{conv_id}/reply")
    assert rep.status_code == 200, rep.text
    payload = rep.json()

    # Should be the combined AssistantReply shape
    assert "message" in payload, payload
    assert "provenance" in payload, payload
    assert isinstance(payload["provenance"], list)

    msg = payload["message"]
    assert msg.get("role") == "assistant"
    assert isinstance(msg.get("content"), str)

    # When debug flag is not requested, provenance items must not expose _retrieval_debug
    for item in payload["provenance"]:
        md = item.get("memory_metadata") or {}
        assert "_retrieval_debug" not in md


def test_reply_debug_gating_respects_flag(client: TestClient, monkeypatch):
    conv_id = _create_conversation(client)
    _add_user_message(client, conv_id, "Add: I like basketball and hiking.")

    # Case 1: debug=true and server allows -> may include _retrieval_debug
    r1 = client.post(f"/api/v1/conversations/{conv_id}/reply", params={"debug": True})
    assert r1.status_code == 200, r1.text
    prov1 = r1.json().get("provenance", [])
    if prov1:
        # If we have any provenance, at least one item should include _retrieval_debug
        assert any(
            ((it.get("memory_metadata") or {}).get("_retrieval_debug") is not None) for it in prov1
        )

    # Case 2: server disallows even if client asks
    from app.core.config import settings

    monkeypatch.setattr(settings, "DEBUG_RETRIEVAL_ENABLED", False, raising=False)
    r2 = client.post(f"/api/v1/conversations/{conv_id}/reply", params={"debug": True})
    assert r2.status_code == 200, r2.text
    prov2 = r2.json().get("provenance", [])
    for it in prov2:
        md = it.get("memory_metadata") or {}
        assert "_retrieval_debug" not in md


def test_reply_stream_emits_provenance_event_first(client: TestClient):
    conv_id = _create_conversation(client)
    _add_user_message(client, conv_id, "What did I tell you about my favorite color yesterday?")

    # Use streaming to capture SSE frames; FastAPI TestClient supports stream context
    with client.stream(
        "POST", f"/api/v1/conversations/{conv_id}/reply/stream", params={"debug": True}
    ) as resp:
        assert resp.status_code == 200
        # Content-Type should be text/event-stream
        ctype = resp.headers.get("content-type", "")
        assert "text/event-stream" in ctype

        # Read a few chunks to capture the first named events
        chunks = []
        for idx, chunk in enumerate(resp.iter_text()):
            # Stop after getting some initial frames
            chunks.append(chunk)
            if idx > 20:  # safety bound
                break
            # We expect to see provenance event early; break once seen
            if "event: provenance" in chunk:
                break

    full = "\n".join(chunks)

    # Assert we saw a provenance event with a JSON object data line
    assert "event: provenance" in full
    # Find the data line for provenance; it follows as 'data: <json>'
    m = re.search(r"event: provenance\s+data: (\{.*\})", full, re.DOTALL)
    assert m, full
    # The data should parse as a JSON list payload inside an envelope or raw list. Handle both.
    data_str = m.group(1)
    # Some SSE writers may send the array directly as data; if it's an envelope, it will have 'provenance' key
    parsed = json.loads(data_str)
    if isinstance(parsed, dict) and "provenance" in parsed:
        prov = parsed["provenance"]
    else:
        prov = parsed
    assert isinstance(prov, list)
    # If present, provenance items should have required fields
    if prov:
        first = prov[0]
        assert {"faiss_id", "content", "content_type", "relevance_score"}.issubset(first.keys())
