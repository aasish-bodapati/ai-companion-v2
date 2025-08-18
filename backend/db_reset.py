#!/usr/bin/env python3
"""
Drop and recreate the public schema in the configured Postgres database.
Use only when you want a fresh start. DESTRUCTIVE.
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

# Use AUTOCOMMIT to allow DROP SCHEMA outside a transaction
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, isolation_level="AUTOCOMMIT")

print(f"Resetting schema on: {settings.SQLALCHEMY_DATABASE_URI}")
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
    # optional: ensure search_path default
    try:
        conn.execute(text("ALTER DATABASE current_database() SET search_path TO public"))
    except Exception:
        pass
print("Schema reset complete.")
