import random
import string
import re
from typing import Dict, List

import pytest
from app.core.config import settings

# Skip entire module if streaming is disabled
pytestmark = pytest.mark.skipif(
    not getattr(settings, "STREAMING_ENABLED", False),
    reason="Streaming endpoints are disabled",
)
from fastapi.testclient import TestClient


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
    data = r.json()
    # shape: AssistantReply -> { id, message, provenance }
    assert "message" in data and isinstance(data["message"], dict)
    return data


def _reply_stream_once(client: TestClient, conv_id: str) -> List[str]:
    chunks: List[str] = []
    with client.stream("POST", f"/api/v1/conversations/{conv_id}/reply/stream") as resp:
        assert resp.status_code == 200
        for idx, chunk in enumerate(resp.iter_text()):
            chunks.append(chunk)
            # avoid excessively long waits in CI
            if idx > 200:
                break
    return chunks


def _list_memories(client: TestClient, limit: int = 1000) -> List[Dict]:
    r = client.get("/api/v1/users/me/memories", params={"limit": limit})
    assert r.status_code == 200, r.text
    return r.json()


def _norm(text: str) -> str:
    t = (text or "").strip().lower()
    for pat in [
        r"\bplease\s+remember\s+it\b",
        r"\bremember\s+this\b",
        r"\bremember\s+that\b",
        r"\bplease\s+remember\b",
        r"\bremember\b",
        r"\bplease\b",
        r"\bit\b",
    ]:
        t = re.sub(pat, " ", t)
    t = re.sub(r"[^a-z0-9\s]+", " ", t)
    return " ".join(t.split())


def _random_noise(n: int = 8) -> str:
    return "".join(random.choice(string.ascii_letters + string.digits) for _ in range(n))


def test_long_diverse_conversation_memory_capture(client: TestClient):
    conv_id = _create_conversation(client, title="Long Diverse Conversation Test")

    # Seed topics to generate diversity and some duplicates/near-duplicates
    preferences = [
        "I like black coffee.",
        "I like green tea.",
        "I like pizza.",
        "I like hiking.",
        "I like jazz music.",
    ]
    facts = [
        "My timezone is PST.",
        "My name is Alice.",
        "I live in San Francisco.",
        "I work as a developer.",
        "I am allergic to peanuts.",
    ]
    questions = [
        "What do you know about me?",
        "Can you summarize what you remember about me?",
        "What is my timezone?",
        "What did I say I like?",
        "Do you recall my name?",
    ]
    commands = [
        "/calendar add 2025-08-13 09:00-10:00 Standup",
        "/calendar list today",
        "/calendar delete 00000000-0000-0000-0000-000000000000",  # likely not found
    ]
    prompts = [
        "Please remember it.",
        "Remember this!",
        "Note this down",
        "Write this to memory",
    ]

    # Create 120 user messages mixing categories
    total_msgs = 120
    for i in range(total_msgs):
        kind = i % 6
        if kind == 0:
            msg = random.choice(preferences)
        elif kind == 1:
            msg = random.choice(facts)
        elif kind == 2:
            msg = random.choice(questions)
        elif kind == 3:
            msg = random.choice(commands)
        elif kind == 4:
            # combine preference/fact with a prompt variant to exercise normalization
            base = random.choice(preferences + facts)
            msg = f"{base} {random.choice(prompts)}"
        else:
            # noise/typo style to test normalization and non-capture cases
            msg = f"{random.choice(preferences)} inlike {_random_noise()}"
        _add_user_message(client, conv_id, msg)

        # Periodically ask for assistant replies (both streaming and non-streaming)
        if i % 15 == 5:
            _reply_once(client, conv_id)
        if i % 15 == 10:
            _reply_stream_once(client, conv_id)

    # Fetch memories and evaluate capture & dedup
    mems = _list_memories(client, limit=2000)
    assert isinstance(mems, list)

    # Expect a decent number of captures given aggressive threshold; allow room across environments
    # We sent many messages, but not all are capturable (commands/noise). Ensure at least 10 unique items.
    assert len(mems) >= 10, f"Too few memories captured: {len(mems)}"

    # Build normalized index to verify dedup for a few canonical facts
    counts: Dict[str, int] = {}
    for m in mems:
        norm = _norm(m.get("content", ""))
        if not norm:
            continue
        counts[norm] = counts.get(norm, 0) + 1

    # Dedup checks for a handful of repeated items
    assert counts.get("i like black coffee", 0) <= 1
    assert counts.get("my timezone is pst", 0) <= 1
    assert counts.get("my name is alice", 0) <= 1

    # Ensure at least one of the seeded items is present
    present_any = any(
        counts.get(k, 0) >= 1
        for k in [
            "i like black coffee",
            "i like green tea",
            "my timezone is pst",
            "my name is alice",
            "i am allergic to peanuts",
        ]
    )
    assert present_any, f"Expected at least one seeded memory present. Counts: {counts}"
