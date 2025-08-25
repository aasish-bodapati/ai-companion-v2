"""
Pytest configuration for repository-wide tests.
Ensures `backend/` is importable as `app.*` from tests.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Resolve repo root by climbing until we find 'backend/'
REPO_ROOT = Path(__file__).resolve().parent
for _ in range(4):
    if (REPO_ROOT / "backend").exists():
        break
    REPO_ROOT = REPO_ROOT.parent

BACKEND_DIR = str(REPO_ROOT / "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
