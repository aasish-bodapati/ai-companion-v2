"""
Improved pytest configuration for AI companion testing
Focused on simplified architecture and deduplication features
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure the backend package is importable before importing app.*
# Resolve repo root by climbing until we find 'backend/'
REPO_ROOT = Path(__file__).resolve().parent
for _ in range(6):
    if (REPO_ROOT / "backend").exists():
        break
    REPO_ROOT = REPO_ROOT.parent

BACKEND_DIR = str(REPO_ROOT / "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.base_class import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User
from app.models.conversation import Conversation
from app.models.memory import MemoryNode as Memory
