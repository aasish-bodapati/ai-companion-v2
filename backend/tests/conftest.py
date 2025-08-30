import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend/app is on sys.path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.append(ROOT)

from app.api import deps
from app.models.user import User
from app.main import app
from app.db.session import SessionLocal


@pytest.hookimpl(tryfirst=True)
def pytest_collection_modifyitems(config, items):
    """Conditionally skip slow/LLM-timing dependent tests when FREE_TIER is enabled."""
    free_tier = os.getenv("FREE_TIER", "").lower() in {"1", "true", "yes"}
    if not free_tier:
        return
    skip_marker = pytest.mark.skip(reason="Skipped on FREE_TIER: timing/latency-sensitive")
    for item in items:
        # Respect tests explicitly marked as slow
        if "slow" in item.keywords:
            item.add_marker(skip_marker)

@pytest.fixture(scope="session", autouse=True)
def _apply_migrations():
    """Ensure DB schema is up-to-date before running tests."""
    try:
        from alembic.config import Config
        from alembic import command

        ini_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
        if os.path.exists(ini_path):
            cfg = Config(ini_path)
            # Ensure URL is taken from settings if not set in ini
            try:
                from app.core.config import settings as _settings

                db_url = getattr(_settings, "SQLALCHEMY_DATABASE_URI", None) or getattr(
                    _settings, "DATABASE_URL", None
                )
                if db_url:
                    cfg.set_main_option("sqlalchemy.url", db_url)
            except Exception:
                pass
            command.upgrade(cfg, "head")
    except Exception:
        # Do not fail tests if migrations cannot run; tests may still pass for in-memory cases
        pass


def _ensure_test_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(email="test@example.com", hashed_password="x", full_name="Test User")
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


@pytest.fixture()
def client():
    user = _ensure_test_user()

    def override_get_current_active_user():
        return user

    app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user

    # Stub OpenRouter API to avoid network during tests unless explicitly opting into real LLM
    orig = None
    use_real_llm = os.getenv("USE_REAL_LLM", "").lower() in {"1", "true", "yes"}
    if not use_real_llm:
        try:
            from app.core import llm as _llm

            if not hasattr(_llm, "_orig_generate"):
                _llm._orig_generate = _llm.generate_with_openrouter  # type: ignore[attr-defined]
            orig = _llm.generate_with_openrouter
            _llm.generate_with_openrouter = lambda model, system_prompt, messages: "TEST_REPLY"
        except Exception:
            pass

    with TestClient(app) as c:
        try:
            yield c
        finally:
            # Restore original if we mocked
            try:
                if not use_real_llm and orig is not None:
                    from app.core import llm as _llm

                    _llm.generate_with_openrouter = orig
            except Exception:
                pass


@pytest.fixture()
def unauth_client():
    """Test client without auth overrides, to assert 401 responses."""
    # Ensure no overrides applied
    try:
        app.dependency_overrides.pop(deps.get_current_active_user, None)
    except Exception:
        pass
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def test_user():
    """Get the test user."""
    return _ensure_test_user()


@pytest.fixture()
def auth_headers():
    """Get authentication headers for testing."""
    return {"Authorization": "Bearer test-token"}
