#!/usr/bin/env python3
"""
Nudges and Check-ins Endpoint Tests

Uses env-based auth like existing tests. Run against a running backend.

Env vars:
- BASE_URL (default http://localhost:8000)
- TEST_USERNAME
- TEST_PASSWORD
- TEST_CONVERSATION_ID (optional; for auto-summarize test)
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


def get_auth_token() -> str | None:
    login_url = f"{BASE_URL}/api/v1/login/access-token"
    data = {
        "username": os.getenv("TEST_USERNAME"),
        "password": os.getenv("TEST_PASSWORD"),
        "grant_type": "password",
    }
    try:
        r = requests.post(
            login_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        r.raise_for_status()
        return r.json().get("access_token")
    except Exception as e:
        print(f"Auth failed: {e}")
        return None


def auth_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "accept": "application/json",
    }


def test_list_nudges():
    token = get_auth_token()
    assert token, "Missing auth token. Ensure TEST_USERNAME/TEST_PASSWORD are set"
    url = f"{BASE_URL}/api/v1/users/me/nudges"
    r = requests.get(url, headers=auth_headers(token), timeout=15)
    assert r.status_code == 200, f"Unexpected status: {r.status_code}, body={r.text}"
    data = r.json()
    assert isinstance(data, list), "Expected a list of nudges"
    # Validate placeholder item shape if present
    if data:
        n = data[0]
        for k in ["id", "nudge_type", "title", "message", "seen"]:
            assert k in n, f"Nudge missing key: {k}"


def test_create_checkin():
    token = get_auth_token()
    assert token, "Missing auth token. Ensure TEST_USERNAME/TEST_PASSWORD are set"
    url = f"{BASE_URL}/api/v1/users/me/checkins"
    body = {
        "content": "Testing daily check-in via automated test",
        "cadence": "daily",
        "prompt": "How's your morning?",
    }
    r = requests.post(url, json=body, headers=auth_headers(token), timeout=15)
    assert r.status_code in (200, 201), f"Unexpected status: {r.status_code}, body={r.text}"
    m = r.json()
    for k in ["id", "content", "user_id"]:
        assert k in m, f"Memory response missing key: {k}"
    # Basic metadata expectations
    meta = m.get("memory_metadata") or {}
    assert isinstance(meta, dict), "Expected memory_metadata to be a dict"


def test_auto_summarize_optional():
    """Optional test: only runs if TEST_CONVERSATION_ID is set."""
    conversation_id = os.getenv("TEST_CONVERSATION_ID")
    if not conversation_id:
        return  # skip silently
    token = get_auth_token()
    assert token, "Missing auth token. Ensure TEST_USERNAME/TEST_PASSWORD are set"
    url = f"{BASE_URL}/api/v1/conversations/{conversation_id}/auto-summarize"
    r = requests.post(url, json={}, headers=auth_headers(token), timeout=20)
    assert r.status_code in (200, 201), f"Unexpected status: {r.status_code}, body={r.text}"
    m = r.json()
    for k in ["id", "content", "user_id"]:
        assert k in m, f"Summary response missing key: {k}"
