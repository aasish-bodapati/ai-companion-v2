#!/usr/bin/env python3
"""
Programmatically run Alembic upgrade to head with proper script_location
and sys.path ordering to avoid package shadowing. Works from any CWD.
"""
import sys
from pathlib import Path

# Ensure site-packages first, then allow app imports
sp = [p for p in sys.path if 'site-packages' in p]
sys.path = [*sp] + [p for p in sys.path if p not in sp]

# Resolve important paths
backend_dir = Path(__file__).resolve().parent
repo_root = backend_dir.parent

# Make sure backend package is importable
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

from alembic.config import Config
from alembic import command
from app.core.config import settings

print(f"Upgrading DB at: {settings.SQLALCHEMY_DATABASE_URI}")

# Use absolute paths so it works regardless of CWD
alembic_ini = str((backend_dir / 'alembic.ini').resolve())
alembic_script_location = str((backend_dir / 'alembic').resolve())

cfg = Config(alembic_ini)
cfg.set_main_option('script_location', alembic_script_location)

print(f"Using alembic.ini: {alembic_ini}")
print(f"Using script_location: {alembic_script_location}")

# Diagnostics: show history before upgrading
try:
    print("Alembic history (pre-upgrade):")
    command.history(cfg, verbose=True)
except Exception as ex:
    print("History error:", ex)

command.upgrade(cfg, 'head')
print("Alembic upgrade complete.")
