import re
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings

# Skip if streaming is disabled via settings
pytestmark = pytest.mark.skipif(
    not getattr(settings, "STREAMING_ENABLED", False),
    reason="Streaming endpoints are disabled",
)


def _create_conversation(client: TestClient, title: str = "Sensitive Stream Refusal Test") -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": title, "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _add_user_message(client: TestClient, conv_id: str, content: str):
    r = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "user", "content": content},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()


def test_sensitive_query_streams_refusal_and_done(client: TestClient):
    conv_id = _create_conversation(client)

    # Trigger sensitive path (password mention)
    _add_user_message(client, conv_id, "my password is hunter2")

    refusal_seen = False
    done_seen = False

    with client.stream("POST", f"/api/v1/conversations/{conv_id}/reply/stream") as resp:
        assert resp.status_code == 200
        ctype = resp.headers.get("content-type", "")
        assert "text/event-stream" in ctype

        # Accumulate up to a reasonable number of chunks
        for idx, chunk in enumerate(resp.iter_text()):
            # Normalize line endings and look only at data payloads
            for line in chunk.splitlines():
                if not line.strip():
                    continue
                # Accept either plain data lines or raw text (defensive)
                if line.startswith("data: "):
                    payload = line[len("data: "):].strip()
                else:
                    payload = line.strip()

                if payload == "[DONE]":
                    done_seen = True
                    break

                # Look for refusal semantics without matching secrets back
                if "sensitive credentials" in payload or "I can" in payload and "reset your password" in payload:
                    refusal_seen = True

            if refusal_seen and done_seen:
                break
            if idx > 200:
                break

    assert refusal_seen, "Expected refusal message to be streamed for sensitive query"
    assert done_seen, "Expected [DONE] terminator in SSE stream"
