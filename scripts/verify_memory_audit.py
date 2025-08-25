#!/usr/bin/env python3
"""
Verify memory_audit table schema and sample data.
- Prints DB path detected
- Lists columns (checks request_ip, user_agent)
- Prints up to 5 recent rows (action, faiss_id, request_ip, user_agent prefix, created_at)

Usage:
  python scripts/verify_memory_audit.py
"""
import os
import sqlite3
import sys
import textwrap
from pathlib import Path


def main() -> int:
    # Detect DB file (SQLite) in common paths
    candidates = [
        Path('backend') / 'data' / 'minimal.db',
        Path('data') / 'minimal.db',
    ]
    db_path = next((p for p in candidates if p.exists()), None)
    if db_path is None:
        print('DB file not found. Expected backend/data/minimal.db or data/minimal.db', file=sys.stderr)
        return 2

    con = sqlite3.connect(str(db_path))
    con.row_factory = sqlite3.Row
    try:
        cols = [r[1] for r in con.execute('PRAGMA table_info(memory_audit)')]
        has_req_ip = 'request_ip' in cols
        has_ua = 'user_agent' in cols
        print(f'DB: {db_path}')
        print('Columns:', cols)
        print('Has request_ip:', has_req_ip)
        print('Has user_agent:', has_ua)

        print('\nRecent audit rows (up to 5):')
        for row in con.execute(
            'SELECT action, faiss_id, request_ip, substr(user_agent,1,80) AS ua, created_at '
            'FROM memory_audit ORDER BY created_at DESC LIMIT 5'
        ):
            line = f"{row['created_at']} | {row['action']} | {row['faiss_id']} | ip={row['request_ip']} | ua={row['ua']}"
            print(textwrap.shorten(line, width=160))
    finally:
        con.close()

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
