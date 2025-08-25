#!/usr/bin/env python3
"""
Integration tests for Memory Audit logging and ownership enforcement.

Covers:
- Verify memory_audit table exists
- PATCH /memories/{faiss_id} creates 'update' audit row
- DELETE /memories/{faiss_id} creates 'soft_delete' audit row
- DELETE /memories/{faiss_id}/hard creates 'hard_delete' audit row
- Chat command "/mem search <q>" creates 'search' audit row with faiss_id='__search__'
- Ownership enforcement: user B cannot modify user A's memory and no audit row is written

Assumptions:
- Backend server is running at http://localhost:8000
- Test credentials exist or registration is enabled for: test@example.com / testpassword123
- SQLite DB path is data/minimal.db (default per settings)
"""
import json
import time
import uuid
import os
import sqlite3
from pathlib import Path
import sys
from typing import Dict, Any, Optional

import pytest
import requests

BASE_URL = "http://localhost:8000"
API = f"{BASE_URL}/api/v1"
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

# Resolve SQLite DB path:
# Prefer app settings (backend/app/core/config.py) if available, otherwise
# fall back to backend/data/minimal.db, and finally repo-root data/minimal.db.
BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
_settings = None
try:
    from app.core.config import settings as _settings  # type: ignore
except Exception:
    _settings = None

_db_path: Path | None = None
if not DATABASE_URL and _settings is not None:
    uri = getattr(_settings, "SQLALCHEMY_DATABASE_URI", "")
    if isinstance(uri, str) and uri.startswith("sqlite///"):
        _db_path = Path(uri.replace("sqlite:///", ""))
    elif isinstance(uri, str) and uri.startswith("sqlite:///"):
        _db_path = Path(uri.replace("sqlite:///", ""))

if _db_path is None:
    # Try backend/data/minimal.db first
    candidate = BACKEND_DIR / "data" / "minimal.db"
    if candidate.exists():
        _db_path = candidate
    else:
        _db_path = Path("data") / "minimal.db"

DB_PATH = _db_path


# --- Helpers -----------------------------------------------------------------

def ensure_user(session: requests.Session, email: str, password: str, full_name: str = "Test User") -> None:
    """Idempotently ensure a user exists via public /register (if enabled)."""
    try:
        session.post(
            f"{API}/register",
            json={
                "email": email,
                "password": password,
                "full_name": full_name,
                "is_superuser": False,
            },
            timeout=10,
        )
    except Exception:
        # It's fine if registration is disabled or user already exists.
        pass


def new_user_session(base_local_part: str = "test", domain: str = "example.com", password: str = "testpassword123") -> requests.Session:
    """Create a unique user and return an authenticated session.

    Uses a unique suffix to avoid collisions with previous runs.
    """
    sfx = f"audit_{int(time.time()*1000)}_{uuid.uuid4().hex[:8]}"
    email = f"{base_local_part}+{sfx}@{domain}"
    s = requests.Session()
    ensure_user(s, email, password, full_name=f"Audit {sfx}")
    r = s.post(
        f"{API}/login/access-token",
        data={"username": email, "password": password},
        timeout=15,
    )
    assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text}"
    token = r.json().get("access_token")
    assert token, "No access token returned"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def create_conversation(sess: requests.Session, title: str = "Audit Test") -> str:
    r = sess.post(f"{API}/conversations/", json={"title": title}, timeout=10)
    assert r.status_code in (200, 201), f"Create conversation failed: {r.status_code} {r.text}"
    return r.json()["id"]


def create_memory(sess: requests.Session, content: str = "audit test memory", content_type: str = "fact") -> Dict[str, Any]:
    r = sess.post(f"{API}/memories", json={
        "content": content,
        "content_type": content_type,
        "source": "test",
    }, timeout=10)
    assert r.status_code in (200, 201), f"Create memory failed: {r.status_code} {r.text}"
    return r.json()


def get_db_connection():
    """Return a DB connection to either SQLite (default) or Postgres (when DATABASE_URL provided).

    For Postgres, requires psycopg to be available. If not, tests that need DB are skipped.
    """
    if DATABASE_URL.lower().startswith("postgresql"):
        try:
            import psycopg
        except Exception as e:
            pytest.skip(f"psycopg not available for Postgres check: {e}")
        return psycopg.connect(DATABASE_URL)
    # Fallback to SQLite
    if not DB_PATH.exists():
        pytest.skip(f"SQLite DB not found at {DB_PATH}; set DATABASE_URL or run backend locally to create it.")
    return sqlite3.connect(str(DB_PATH))


def count_audit_rows(where_sql: str = "1=1", params: tuple = ()) -> int:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM memory_audit WHERE {where_sql}", params)
        (n,) = cur.fetchone()
        return int(n)
    finally:
        conn.close()


def fetch_one(sql: str, params: tuple = ()) -> Optional[tuple]:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur.fetchone()
    finally:
        conn.close()


def wait_for_audit(predicate_sql: str, params: tuple, timeout_s: float = 3.0) -> None:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            if count_audit_rows(predicate_sql, params) > 0:
                return
        except sqlite3.OperationalError:
            # Table may not be ready; brief wait and retry
            pass
        time.sleep(0.05)
    raise AssertionError(f"Expected audit row not found for: {predicate_sql} {params}")


# --- Tests -------------------------------------------------------------------

def test_memory_audit_table_exists():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        if DATABASE_URL.lower().startswith("postgresql"):
            cur.execute("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'")
            tables = [r[0] for r in cur.fetchall()]
        else:
            cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [r[0] for r in cur.fetchall()]
        assert "memory_audit" in tables, f"memory_audit table missing. Tables: {tables}"
    finally:
        conn.close()


def test_audit_update_soft_hard_and_search_and_ownership():
    # User A session (unique per run)
    sA = new_user_session(base_local_part="test")

    # Create a memory
    mem = create_memory(sA, content="alpha bravo charlie")
    faiss_id = mem.get("faiss_id") or mem.get("faissId") or mem.get("id")
    assert faiss_id, f"No faiss_id in response: {json.dumps(mem)}"

    # Update memory (PATCH) and expect 'update' audit
    r_up = sA.patch(f"{API}/memories/{faiss_id}", json={"content": "alpha BRAVO updated", "source": "test"}, timeout=10)
    assert r_up.status_code in (200, 201), f"Update failed: {r_up.status_code} {r_up.text}"
    wait_for_audit("faiss_id=? AND action='update'", (faiss_id,))
    # Validate request metadata capture for update
    row = fetch_one(
        "SELECT request_ip, user_agent FROM memory_audit WHERE faiss_id=? AND action='update' ORDER BY created_at DESC LIMIT 1",
        (faiss_id,),
    )
    assert row is not None
    req_ip, ua = row
    assert (req_ip or "").strip() != "", "request_ip should be populated for update"
    assert (ua or "").strip() != "", "user_agent should be populated for update"

    # Soft delete and expect 'soft_delete'
    r_sd = sA.delete(f"{API}/memories/{faiss_id}", timeout=10)
    assert r_sd.status_code in (200, 201), f"Soft delete failed: {r_sd.status_code} {r_sd.text}"
    wait_for_audit("faiss_id=? AND action='soft_delete'", (faiss_id,))
    # Validate request metadata capture for soft_delete
    row = fetch_one(
        "SELECT request_ip, user_agent FROM memory_audit WHERE faiss_id=? AND action='soft_delete' ORDER BY created_at DESC LIMIT 1",
        (faiss_id,),
    )
    assert row is not None
    req_ip, ua = row
    assert (req_ip or "").strip() != ""
    assert (ua or "").strip() != ""

    # Recreate a memory to hard delete (ensures exists)
    mem2 = create_memory(sA, content="to be hard deleted")
    faiss2 = mem2.get("faiss_id") or mem2.get("faissId") or mem2.get("id")
    assert faiss2

    r_hd = sA.delete(f"{API}/memories/{faiss2}/hard", timeout=10)
    assert r_hd.status_code in (200, 201), f"Hard delete failed: {r_hd.status_code} {r_hd.text}"
    wait_for_audit("faiss_id=? AND action='hard_delete'", (faiss2,))
    # Validate request metadata capture for hard_delete
    row = fetch_one(
        "SELECT request_ip, user_agent FROM memory_audit WHERE faiss_id=? AND action='hard_delete' ORDER BY created_at DESC LIMIT 1",
        (faiss2,),
    )
    assert row is not None
    req_ip, ua = row
    assert (req_ip or "").strip() != ""
    assert (ua or "").strip() != ""

    # Chat search command creates '__search__' 'search' audit
    conv_id = create_conversation(sA)
    r_msg = sA.post(f"{API}/conversations/{conv_id}/reply", json={"content": "/mem search alpha"}, timeout=15)
    assert r_msg.status_code in (200, 201), f"/mem search failed: {r_msg.status_code} {r_msg.text}"
    wait_for_audit("faiss_id='__search__' AND action='search'", ())
    # Validate request metadata capture for search (chat)
    row = fetch_one(
        "SELECT request_ip, user_agent, after_metadata FROM memory_audit WHERE faiss_id='__search__' AND action='search' ORDER BY created_at DESC LIMIT 1",
        (),
    )
    assert row is not None
    req_ip, ua, after_meta = row
    assert (req_ip or "").strip() != ""
    assert (ua or "").strip() != ""
    assert isinstance(after_meta, str) and "\"query\"" in after_meta

    # Ownership enforcement: user B cannot delete user A's memory
    sB = new_user_session(base_local_part="other")
    # Try soft delete A's mem2
    r_forbid = sB.delete(f"{API}/memories/{faiss2}", timeout=10)
    assert r_forbid.status_code in (400, 403, 404), f"Expected failure for cross-user delete, got {r_forbid.status_code}"

    # Ensure no audit row was added for user B's attempt on A's faiss2
    before = count_audit_rows("faiss_id=?", (faiss2,))
    time.sleep(0.3)
    after = count_audit_rows("faiss_id=?", (faiss2,))
    assert after == before, "Audit row should not be created for unauthorized action"

    # --- GET /memories/{faiss_id}/audit ---
    # Create multiple updates to generate >1 log rows
    for i in range(3):
        r = sA.patch(f"{API}/memories/{faiss_id}", json={"content": f"update batch {i}", "source": "test"}, timeout=10)
        assert r.status_code in (200, 201)
        wait_for_audit("faiss_id=? AND action='update'", (faiss_id,))

    # Page 1
    r_page1 = sA.get(f"{API}/memories/{faiss_id}/audit?skip=0&limit=2", timeout=10)
    assert r_page1.status_code == 200, r_page1.text
    data1 = r_page1.json()
    assert "items" in data1 and "total" in data1
    assert isinstance(data1["items"], list) and len(data1["items"]) <= 2
    total = int(data1["total"])
    assert total >= 3, "Expected at least 3 audit entries after batch updates"

    # Page 2
    r_page2 = sA.get(f"{API}/memories/{faiss_id}/audit?skip=2&limit=2", timeout=10)
    assert r_page2.status_code == 200, r_page2.text
    data2 = r_page2.json()
    assert isinstance(data2["items"], list)

    # Ownership enforced for GET audit endpoint
    r_own = sB.get(f"{API}/memories/{faiss_id}/audit", timeout=10)
    assert r_own.status_code in (403, 404), f"Expected forbidden/not-found for cross-user audit fetch, got {r_own.status_code}"
