#!/usr/bin/env python3
"""
Force a clean Alembic cycle against the configured DB:
- If unversioned: stamp base, then upgrade head
- Else: downgrade to base, then upgrade head
Prints diagnostics (history, current) along the way.
"""
import sys
from pathlib import Path

# Ensure site-packages first, then allow app imports
sp = [p for p in sys.path if 'site-packages' in p]
sys.path = [*sp] + [p for p in sys.path if p not in sp]

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory
from app.core.config import settings

print(f"DB URI: {settings.SQLALCHEMY_DATABASE_URI}")
ini = str((backend_dir / 'alembic.ini').resolve())
script_loc = str((backend_dir / 'alembic').resolve())
print(f"alembic.ini: {ini}")
print(f"script_location: {script_loc}")

cfg = Config(ini)
cfg.set_main_option('script_location', script_loc)

# Diagnostics
print("History:")
try:
    command.history(cfg, verbose=True)
except Exception as ex:
    print("history error:", ex)

# Determine current
current = []
try:
    # Capture current by walking ScriptDirectory
    sd = ScriptDirectory.from_config(cfg)
    # Use command.current to print to stdout; also try to get current heads
    command.current(cfg, verbose=True)
except Exception as ex:
    print("current error:", ex)

# Try a downgrade to base; if it fails due to unversioned, stamp base instead
try:
    print("Downgrading to base...")
    command.downgrade(cfg, 'base')
except Exception as ex:
    print("downgrade error:", ex)
    print("Stamping base (unversioned DB)...")
    command.stamp(cfg, 'base')

print("Upgrading to head...")
command.upgrade(cfg, 'head')
print("Force migration complete.")
