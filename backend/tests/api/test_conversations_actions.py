import json
import re
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient
from app.api.endpoints import conversations_utils as conv_mod
from app.core.config import settings

# Skip entire module if streaming is disabled
pytestmark = pytest.mark.skipif(
    not getattr(settings, "STREAMING_ENABLED", False),
    reason="Streaming endpoints are disabled",
)


@pytest.fixture(autouse=True)
def _enable_actions_and_memory(monkeypatch):
    # Ensure flags are enabled for this suite
    from app.core.config import settings

    monkeypatch.setattr(settings, "ACTIONS_SUGGESTIONS_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)


def _create_conversation(client: TestClient, title: str = "Actions Stream Test") -> str:
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


def test_stream_emits_actions_event_and_fenced_block(client: TestClient, monkeypatch):
    # Force deterministic suggestions so assertions are stable

    fixed = [
        {
            "action": "nutrition.log_meal",
            "label": "Log meal",
            "params": {"description": "salad", "when": "now"},
        },
        {"action": "journal.add_entry", "label": "Save to journal", "params": {"text": "note"}},
    ]
    monkeypatch.setattr(conv_mod, "_suggest_actions_for", lambda _t: fixed, raising=False)

    conv_id = _create_conversation(client)
    _add_user_message(client, conv_id, "I ate a salad for lunch. Please remember it.")

    saw_actions_event = False
    saw_fenced_block = False

    with client.stream("POST", f"/api/v1/conversations/{conv_id}/reply/stream") as resp:
        assert resp.status_code == 200
        ctype = resp.headers.get("content-type", "")
        assert "text/event-stream" in ctype

        collected = []
        for idx, chunk in enumerate(resp.iter_text()):
            collected.append(chunk)
            if "event: actions" in chunk:
                # Validate JSON payload for actions event - extract only the first JSON array
                m = re.search(r"event: actions\s+data: (\[.*?\])", chunk, re.DOTALL)
                assert m, chunk
                json_str = m.group(1)
                # Handle potential extra data by finding the end of the first complete JSON array
                try:
                    parsed = json.loads(json_str)
                except json.JSONDecodeError:
                    # Try to extract just the first complete JSON array
                    bracket_count = 0
                    end_pos = 0
                    for i, char in enumerate(json_str):
                        if char == "[":
                            bracket_count += 1
                        elif char == "]":
                            bracket_count -= 1
                            if bracket_count == 0:
                                end_pos = i + 1
                                break
                    if end_pos > 0:
                        parsed = json.loads(json_str[:end_pos])
                    else:
                        raise
                assert isinstance(parsed, list) and len(parsed) == len(fixed)
                saw_actions_event = True
            if "```actions" in chunk:
                # Validate that the fenced block appears on a data line, even if preceded by other events
                assert re.search(r"(?:^|\n)data:\s*```actions", chunk) is not None, chunk
                saw_fenced_block = True
            # Stop once both are seen or after a reasonable number of chunks
            if saw_actions_event and saw_fenced_block:
                break
            if idx > 200:
                break

    # Assert both mechanisms were observed
    assert saw_actions_event, "Expected 'actions' SSE event to be emitted"
    assert saw_fenced_block, "Expected fenced ```actions block to appear in stream data"
