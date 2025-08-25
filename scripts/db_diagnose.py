#!/usr/bin/env python3
"""
DB and migration diagnostic script.

- Prints SQLALCHEMY_DATABASE_URI resolved by app settings
- For SQLite: resolves file path and lists current tables
- For Postgres: lists public.tables (requires psycopg)
- Prints Alembic heads and current revision using backend/alembic.ini

Run from repo root:
  python scripts/db_diagnose.py
"""
from __future__ import annotations
import os
import sys
import json
from pathlib import Path

# Ensure backend package import
BACKEND_DIR = Path(__file__).resolve().parents[1] / 'backend'
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings  # type: ignore


def list_tables_sqlite(db_path: Path) -> list[str]:
    import sqlite3
    conn = sqlite3.connect(str(db_path))
    try:
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        return [r[0] for r in cur.fetchall()]
    finally:
        conn.close()


def list_tables_postgres(dsn: str) -> list[str]:
    try:
        import psycopg
    except Exception as e:  # pragma: no cover
        return [f"psycopg not available: {e}"]
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'")
            return [r[0] for r in cur.fetchall()]


def alembic_status() -> dict:
    """Return alembic heads and current revision, if possible."""
    out: dict[str, list[str] | str] = {}
    try:
        from alembic.config import Config
        from alembic import command
        import io
        import contextlib

        cfg_path = BACKEND_DIR / 'alembic.ini'
        if not cfg_path.exists():
            return {"error": f"alembic.ini not found at {cfg_path}"}
        cfg = Config(str(cfg_path))
        cfg.set_main_option('sqlalchemy.url', settings.SQLALCHEMY_DATABASE_URI)
        # Capture stdout from alembic commands
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            try:
                command.heads(cfg)
            except Exception as e:
                print(f"heads error: {e}")
            heads_out = buf.getvalue()
        buf.truncate(0); buf.seek(0)
        with contextlib.redirect_stdout(buf):
            try:
                command.current(cfg, verbose=True)
            except Exception as e:
                print(f"current error: {e}")
            current_out = buf.getvalue()
        out['heads'] = heads_out.strip().splitlines()
        out['current'] = current_out.strip().splitlines()
    except Exception as e:
        out['error'] = f"alembic status error: {e}"
    return out


def main() -> None:
    uri = settings.SQLALCHEMY_DATABASE_URI
    result: dict[str, object] = {"SQLALCHEMY_DATABASE_URI": uri}

    if uri.startswith('sqlite:///'):
        db_path = Path(uri.replace('sqlite:///',''))
        result['resolved_sqlite_path'] = str(db_path)
        result['sqlite_exists'] = db_path.exists()
        if db_path.exists():
            result['tables'] = list_tables_sqlite(db_path)
    elif uri.lower().startswith('postgresql'):
        result['tables'] = list_tables_postgres(uri)
    else:
        result['note'] = 'Unsupported DB scheme for table listing.'

    result['alembic'] = alembic_status()

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
