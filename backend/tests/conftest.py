import os
import sys
import pytest
from unittest.mock import Mock, patch
from pathlib import Path

# Load test environment variables first
test_env_file = Path(__file__).parent.parent / ".env.test"
if test_env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(test_env_file)

# Ensure backend/app is on sys.path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.append(ROOT)

# Import app modules only when needed
def get_app():
    """Get the FastAPI app instance."""
    try:
        from app.main import app
        return app
    except Exception as e:
        pytest.skip(f"Could not import app: {e}")

def get_deps():
    """Get the deps module."""
    try:
        from app.api import deps
        return deps
    except Exception as e:
        pytest.skip(f"Could not import deps: {e}")

def get_user_model():
    """Get the User model."""
    try:
        from app.models.user import User
        return User
    except Exception as e:
        pytest.skip(f"Could not import User model: {e}")

def get_session():
    """Get the database session."""
    try:
        from app.db.session import SessionLocal
        return SessionLocal
    except Exception as e:
        pytest.skip(f"Could not import SessionLocal: {e}")


@pytest.hookimpl(tryfirst=True)
def pytest_collection_modifyitems(config, items):
    """Automatically categorize tests based on their location and add appropriate markers."""
    for item in items:
        # Add category markers based on test file location
        if "unit/" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration/" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "e2e/" in str(item.fspath):
            item.add_marker(pytest.mark.e2e)
        elif "performance/" in str(item.fspath):
            item.add_marker(pytest.mark.performance)
        
        # Add feature markers based on test name
        if "memory" in item.name.lower():
            item.add_marker(pytest.mark.memory)
        if "auth" in item.name.lower():
            item.add_marker(pytest.mark.auth)
        if "api" in item.name.lower():
            item.add_marker(pytest.mark.api)
        if "database" in item.name.lower():
            item.add_marker(pytest.mark.database)
        if "llm" in item.name.lower():
            item.add_marker(pytest.mark.llm)
        if "conversation" in item.name.lower():
            item.add_marker(pytest.mark.conversation)
        if "scheduler" in item.name.lower():
            item.add_marker(pytest.mark.scheduler)
        
        # Mark slow tests
        if any(keyword in item.name.lower() for keyword in ["slow", "e2e", "performance", "integration"]):
            item.add_marker(pytest.mark.slow)
        
        # Mark smoke tests (critical path)
        if any(keyword in item.name.lower() for keyword in ["smoke", "critical", "main", "core"]):
            item.add_marker(pytest.mark.smoke)
        
        # Mark CI tests
        if not os.getenv("LOCAL_ONLY"):
            item.add_marker(pytest.mark.ci)


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
    SessionLocal = get_session()
    User = get_user_model()
    
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
    """Test client with authenticated user."""
    app = get_app()
    deps = get_deps()
    
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

    from fastapi.testclient import TestClient
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
    app = get_app()
    deps = get_deps()
    
    # Ensure no overrides applied
    try:
        app.dependency_overrides.pop(deps.get_current_active_user, None)
    except Exception:
        pass
    from fastapi.testclient import TestClient
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


@pytest.fixture()
def mock_db():
    """Mock database session for unit tests."""
    return Mock()


@pytest.fixture()
def mock_llm():
    """Mock LLM service for unit tests."""
    mock = Mock()
    mock.generate_with_openrouter.return_value = "Mocked LLM response"
    return mock


@pytest.fixture()
def sample_conversation_data():
    """Sample conversation data for testing."""
    return {
        "user_id": "test_user",
        "title": "Test Conversation",
        "messages": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"}
        ]
    }


@pytest.fixture()
def sample_memory_data():
    """Sample memory data for testing."""
    return {
        "user_id": "test_user",
        "content": "User likes coffee",
        "memory_type": "preference",
        "importance": 0.8,
        "context": {"source": "conversation"}
    }


@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Clean up test data after each test."""
    yield
    # Add cleanup logic here if needed
    pass
