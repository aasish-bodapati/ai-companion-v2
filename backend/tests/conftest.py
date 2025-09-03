"""
Test configuration and fixtures for AI Companion Backend tests.
"""

import pytest
import asyncio
from typing import Generator, AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from httpx import AsyncClient
import tempfile
import os
import uuid
from datetime import datetime, timezone

# Import app components
from app.main import app
from app.db.session import get_db
from app.db.base_class import Base
from app.models.user import User
from app.models.memory import MemoryNode
from app.models.onboarding import OnboardingProfile
from app.core.security import get_password_hash


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session: Session, test_user: User) -> Generator[TestClient, None, None]:
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    def override_get_current_user():
        return test_user
    
    # Override the database dependency (use the one from deps, not session)
    from app.api import deps
    app.dependency_overrides[deps.get_db] = override_get_db
    # Override the current user dependency
    from app.api.deps import get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clear the override after the test
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client_with_memory(db_session: Session, test_user: User) -> Generator[TestClient, None, None]:
    """Create a test client with database dependency override and test memory."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    def override_get_current_user():
        return test_user
    
    # Override the database dependency (use the one from deps, not session)
    from app.api import deps
    app.dependency_overrides[deps.get_db] = override_get_db
    # Override the current user dependency
    from app.api.deps import get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    # Create test memory in the same session that the API endpoint will use
    import json
    memory = MemoryNode(
        id=str(uuid.uuid4()),
        faiss_id=str(uuid.uuid4()),
        content="I wake up at 7 AM and run for 30 minutes",
        content_type="onboarding_briefing",
        user_id=str(test_user.id),
        relevance_score=1.0,
        importance_score=85,
        memory_metadata='{"source": "onboarding", "type": "user_briefing"}',
        timestamp=datetime.now(timezone.utc),
        access_count=0,
        is_core=False,
        privacy_level="normal",
        confidence_score=0.8,
        emotional_valence=0.5,
        related_memory_ids=json.dumps([]),
        tags=json.dumps([]),
        entities=json.dumps([]),
        created_via="test"
    )
    db_session.add(memory)
    db_session.commit()
    db_session.refresh(memory)
    
    # Also add the memory to the FAISS vector store for search functionality
    try:
        from app.memory.embeddings import get_embedding
        from app.memory.faiss_store import faiss_store
        
        # Generate embedding for the test memory
        embedding = get_embedding(memory.content)
        if embedding is not None:
            # Add to FAISS store
            faiss_store.add_vectors(str(test_user.id), [memory.faiss_id], [embedding])
    except Exception as e:
        # If FAISS setup fails, that's okay for tests - search will just return empty results
        pass
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clear the override after the test
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def async_client(db_session: Session) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    # Override the database dependency (use the one from deps, not session)
    from app.api import deps
    app.dependency_overrides[deps.get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_superuser=False,
        full_name="Test User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_2(db_session: Session) -> User:
    """Create a second test user."""
    user = User(
        id=str(uuid.uuid4()),
        email="test2@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_superuser=False,
        full_name="Test User 2"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(client: TestClient, test_user: User) -> dict:
    """Get authentication headers for test user."""
    # Create a valid JWT token
    from app.core.security import create_access_token
    from datetime import timedelta
    from app.core.config import settings
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(test_user.id, expires_delta=access_token_expires)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_memory(db_session: Session, test_user: User) -> MemoryNode:
    """Create a test memory."""
    memory = MemoryNode(
        id=str(uuid.uuid4()),
        faiss_id=str(uuid.uuid4()),
        content="I wake up at 7 AM and run for 30 minutes",
        content_type="onboarding_briefing",
        user_id=str(test_user.id),
        relevance_score=1.0,
        importance_score=85,
        memory_metadata='{"source": "onboarding", "type": "user_briefing"}'
    )
    db_session.add(memory)
    db_session.commit()
    db_session.refresh(memory)
    return memory


@pytest.fixture
def test_onboarding_profile(db_session: Session, test_user: User) -> OnboardingProfile:
    """Create a test onboarding profile."""
    profile = OnboardingProfile(
        id=str(uuid.uuid4()),
        user_id=str(test_user.id),
        user_prompt="I wake up at 7 and run for 30 minutes. I prefer healthy food and work from home.",
        processed_summary="User wakes up at 7 AM, runs for 30 minutes daily, prefers healthy food, works from home.",
        completed=True,
        daily_schedule="7 AM wake up, 7:30 AM run, 8 AM breakfast",
        fitness_goals="Daily 30-minute runs",
        nutrition_goals="Healthy food preferences",
        communication_style="Direct and helpful"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def sample_briefing_text() -> str:
    """Sample briefing text for testing."""
    return "I wake up at 7 and run for 30 minutes. I prefer healthy food and work from home. My goal is to stay fit and productive."


@pytest.fixture
def sample_memory_content() -> str:
    """Sample memory content for testing."""
    return "User wakes up at 7 AM and runs for 30 minutes daily"


@pytest.fixture
def sample_updated_memory_content() -> str:
    """Sample updated memory content for testing."""
    return "User wakes up at 6 AM and runs for 45 minutes daily"


# Mock LLM responses for consistent testing
@pytest.fixture
def mock_llm_response():
    """Mock LLM response for testing."""
    return {
        "summary": "User has a structured morning routine with exercise and healthy eating habits.",
        "structured_data": {
            "wake_up_time": "7 AM",
            "exercise": "30 minutes running",
            "diet": "healthy food preferences",
            "work_schedule": "from home"
        }
    }


# Test data for memory retrieval tests
@pytest.fixture
def memory_test_data():
    """Test data for memory retrieval tests."""
    return {
        "wake_up_time": "7 AM",
        "exercise_habit": "30 minutes running",
        "diet_preference": "healthy food",
        "work_location": "from home",
        "goal": "stay fit and productive"
    }
