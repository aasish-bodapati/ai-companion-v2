#!/usr/bin/env python3
"""
Regression tests for memory usage in conversations and neural visualization.
Covers:
- Conversations should leverage stored memories for profile-style queries
- No topic pivoting to unrelated memories
- Neural network endpoint returns meaningful, non-degenerate data
- Optimize (lifecycle) endpoint functions

Assumptions:
- Backend server is running locally (we do not start servers in tests)
- Default test user credentials are valid
"""
from __future__ import annotations

import os
import time
from typing import Any, Dict, List, Optional

import pytest
import requests

BASE_URL = os.environ.get("CHAT_API_BASE", "http://localhost:8000").rstrip("/")
API_PREFIX = "/api/v1"

USERNAME = os.environ.get("TEST_USERNAME", "test@example.com")
PASSWORD = os.environ.get("TEST_PASSWORD", "testpassword123")


@pytest.fixture(scope="module")
def api_session() -> requests.Session:
    s = requests.Session()
    r = s.post(
        f"{BASE_URL}{API_PREFIX}/login/access-token",
        data={"username": USERNAME, "password": PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok, "missing access token"
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


def _create_conversation(session: requests.Session, title: str = "Regression Test") -> str:
    r = session.post(f"{BASE_URL}{API_PREFIX}/conversations/", json={"title": title}, timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _send_message(session: requests.Session, conversation_id: str, content: str) -> Dict[str, Any]:
    # First, create the user message
    r = session.post(
        f"{BASE_URL}{API_PREFIX}/conversations/{conversation_id}/messages",
        json={"content": content},
        timeout=45,
    )
    assert r.status_code in (200, 201), r.text
    # Then, request the assistant's reply and return the assistant message payload
    r2 = session.post(
        f"{BASE_URL}{API_PREFIX}/conversations/{conversation_id}/reply",
        timeout=60,
    )
    assert r2.status_code in (200, 201), r2.text
    data = r2.json() or {}
    # The reply endpoint returns {{ id, message: {...}, used_llm }}
    return data.get("message", data)


def _create_memory(session: requests.Session, content: str, content_type: str = "preference") -> Dict[str, Any]:
    # Minimal payload for memory creation
    payload = {"content": content, "content_type": content_type}
    r = session.post(f"{BASE_URL}{API_PREFIX}/memory/memories", json=payload, timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()


def _optimize(session: requests.Session) -> Dict[str, Any]:
    r = session.post(f"{BASE_URL}{API_PREFIX}/memory/users/me/memories/lifecycle", json={}, timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()


def _fetch_neural(session: requests.Session) -> Dict[str, Any]:
    r = session.get(f"{BASE_URL}{API_PREFIX}/memory-visualization/neural-network", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.mark.integration
def test_profile_query_uses_memories(api_session: requests.Session):
    # Seed memories
    seed = [
        "I like vacations",
        "I like ships",
        "I like cars",
        "I like people",
    ]
    for s in seed:
        _create_memory(api_session, s)

    # Give backend a moment for any async indexing
    time.sleep(0.5)

    conv_id = _create_conversation(api_session, title="Profile Query Uses Memories")
    reply = _send_message(api_session, conv_id, "what do you know about me")

    text = (reply.get("content") or "").lower()
    # Should reference at least one seeded preference
    assert any(k in text for k in ["vacation", "car", "ship", "people"]), (
        f"Reply did not reference stored memories. reply={text!r}"
    )


@pytest.mark.integration
def test_no_topic_pivot_on_specific_query(api_session: requests.Session):
    conv_id = _create_conversation(api_session, title="No Pivot")
    reply = _send_message(api_session, conv_id, "i like vacations")
    text = (reply.get("content") or "").lower()
    # Should not pivot to cars/ships when user said vacations
    assert "car" not in text and "ship" not in text, (
        f"Unexpected topic pivot detected. reply={text!r}"
    )


@pytest.mark.integration
def test_neural_network_has_meaningful_edges(api_session: requests.Session):
    data = _fetch_neural(api_session)
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    insights = data.get("insights", {})

    # Basic structure
    assert isinstance(nodes, list) and isinstance(edges, list), "Invalid neural payload types"

    # Counters match
    assert insights.get("total_memories") == len(nodes)
    assert insights.get("total_connections") == len(edges)

    # If there are edges, strengths should not all be identical constants
    if edges:
        strengths = [e.get("strength", 0.0) for e in edges]
        assert any(s != strengths[0] for s in strengths[1:]), "Edge strengths look degenerate"


@pytest.mark.integration
def test_optimize_lifecycle_endpoint(api_session: requests.Session):
    res = _optimize(api_session)
    # Expect integer fields
    assert isinstance(res.get("suppressed"), int)
    assert isinstance(res.get("consolidated"), int)
