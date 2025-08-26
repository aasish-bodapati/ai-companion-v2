from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Optional

import pytest
import requests

BASE_URL = os.environ.get("CHAT_API_BASE", "http://localhost:8000").rstrip("/")
API_PREFIX = "/api/v1"


def _login(session: requests.Session) -> Optional[str]:
    try:
        r = session.post(
            f"{BASE_URL}{API_PREFIX}/login/access-token",
            data={"username": "test@example.com", "password": "testpassword123"},
            timeout=20,
        )
        if r.status_code == 200:
            token = r.json().get("access_token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
                return token
    except Exception:
        pass
    return None


def _create_conversation(session: requests.Session, title: str) -> Optional[str]:
    try:
        r = session.post(
            f"{BASE_URL}{API_PREFIX}/conversations/",
            json={"title": title},
            timeout=20,
        )
        if r.status_code == 201:
            return r.json().get("id")
    except Exception:
        pass
    return None


def _send_user(session: requests.Session, conversation_id: str, content: str, remember: bool = False) -> Optional[str]:
    """Send a user message (no AI reply). Returns the stored user message content."""
    try:
        payload = {"content": content}
        if remember:
            payload["remember"] = True
        r = session.post(
            f"{BASE_URL}{API_PREFIX}/conversations/{conversation_id}/messages",
            json=payload,
            timeout=30,
        )
        if r.status_code in (200, 201):
            data = r.json() or {}
            return data.get("content") or data.get("message", {}).get("content")
    except Exception:
        pass
    return None


def _ask(session: requests.Session, conversation_id: str, content: str) -> Optional[str]:
    """Send a prompt and get the assistant reply using POST /reply."""
    try:
        payload = {"content": content}
        r = session.post(
            f"{BASE_URL}{API_PREFIX}/conversations/{conversation_id}/reply",
            json=payload,
            timeout=60,
        )
        if r.status_code in (200, 201):
            data = r.json() or {}
            # AssistantReply schema: { id, message: { content, ... }, used_llm }
            msg = data.get("message") or {}
            return msg.get("content")
    except Exception:
        pass
    return None


@pytest.mark.integration
def test_seed_once_memory_recall_without_reasking():
    """
    Seed a fact once, then verify assistant uses it without re-asking for the same info.
    """
    s = requests.Session()
    if not _login(s):
        pytest.skip("Chat API not available for login")

    conv_id = _create_conversation(s, "Seed once recall")
    if not conv_id:
        pytest.skip("Could not create conversation")

    # Seed memory quietly
    _send_user(s, conv_id, "note: I prefer green tea in the morning.", remember=True)
    time.sleep(0.8)

    # Ask a question that should leverage the memory
    reply = _ask(s, conv_id, "What should I drink in the morning based on my preferences?")
    assert reply is not None and len(reply) > 0
    # Expect using the memory, and avoid re-asking the same preference
    assert "tea" in reply.lower() or "green tea" in reply.lower()
    assert "what do you prefer" not in reply.lower()


@pytest.mark.integration
def test_basic_repetition_guard():
    """
    Send the same request twice; the assistant should avoid verbatim repetition.
    We only check that the two replies are not identical strings.
    """
    s = requests.Session()
    if not _login(s):
        pytest.skip("Chat API not available for login")

    conv_id = _create_conversation(s, "No repeat regression")
    if not conv_id:
        pytest.skip("Could not create conversation")

    msg = "Give me a brief 2-bullet plan to start organizing my week."
    r1 = _ask(s, conv_id, msg)
    r2 = _ask(s, conv_id, msg)

    assert r1 is not None and r2 is not None and len(r1) > 0 and len(r2) > 0
    assert r1.strip() != r2.strip()


@pytest.mark.integration
def test_rolling_summary_continuity_across_turns():
    """
    Ensure topic continuity across 4+ turns using the rolling summary.
    We look for consistent topic references in later replies.
    """
    s = requests.Session()
    if not _login(s):
        pytest.skip("Chat API not available for login")

    conv_id = _create_conversation(s, "Rolling summary continuity")
    if not conv_id:
        pytest.skip("Could not create conversation")

    turns = [
        "I'm planning a home office setup for video calls.",
        "What should I prioritize first?",
        "How about lighting and camera?",
        "Any quick checklist I can follow?",
    ]

    replies = []
    for t in turns:
        r = _ask(s, conv_id, t)
        replies.append(r)
        if r is None:
            break

    # Basic validity
    assert all(r is not None and len(r) > 10 for r in replies)

    # Continuity: later replies should reference the topic
    joined = "\n".join(replies).lower()
    assert any(k in joined for k in ["office", "video", "lighting", "camera", "setup"])
