"""Pytest configuration and shared fixtures for AI Companion MVP tests."""

import asyncio
import os
import tempfile
from typing import AsyncGenerator, Generator
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base_class import Base
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.models.conversation import Conversation
from app.models.memory import MemoryNode
from app.models.note import Note
from app.models.task import Task
from app.models.reminder import Reminder
from app.crud.user import user as user_crud
from app.core.security import get_password_hash


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session() -> Generator:
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
def client(db_session) -> Generator:
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    
    # Use context manager for proper cleanup
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def async_client(db_session) -> AsyncGenerator:
    """Create an async test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session) -> User:
    """Create a test user."""
    user_data = {
        "email": "test@example.com",
        "hashed_password": get_password_hash("testpassword123"),
        "full_name": "Test User",
        "is_active": True,
        "is_superuser": False,
    }
    user = User(**user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_user_2(db_session) -> User:
    """Create a second test user for isolation tests."""
    user_data = {
        "email": "test2@example.com",
        "hashed_password": get_password_hash("testpassword2"),
        "full_name": "Test User 2",
        "is_active": True,
        "is_superuser": False,
    }
    user = User(**user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(client) -> dict:
    """Get authentication headers for test user."""
    import uuid
    
    # Register a fresh test user with unique email
    unique_email = f"testuser-{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/v1/register", json={
        "email": unique_email,
        "password": "testpassword123",
        "full_name": "Test User"
    })
    
    # Login to get a JWT
    login_response = client.post(
        "/api/v1/login/access-token",
        data={"username": unique_email, "password": "testpassword123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def test_conversation(db_session, test_user) -> Conversation:
    """Create a test conversation."""
    conversation = Conversation(
        user_id=test_user.id,
        title="Test Conversation",
        incognito_mode=False,
        personalization_enabled=True
    )
    db_session.add(conversation)
    db_session.commit()
    db_session.refresh(conversation)
    return conversation


@pytest.fixture(scope="function")
def test_incognito_conversation(db_session, test_user) -> Conversation:
    """Create a test incognito conversation."""
    conversation = Conversation(
        user_id=test_user.id,
        title="Test Incognito Conversation",
        incognito_mode=True,
        personalization_enabled=False
    )
    db_session.add(conversation)
    db_session.commit()
    db_session.refresh(conversation)
    return conversation


@pytest.fixture(scope="function")
def test_memory(db_session, test_user) -> MemoryNode:
    """Create a test memory."""
    memory = MemoryNode(
        user_id=test_user.id,
        content="I live in Seattle",
        content_type="fact",
        category="location",
        importance_score=50,
        relevance_score=0.9
    )
    db_session.add(memory)
    db_session.commit()
    db_session.refresh(memory)
    return memory


@pytest.fixture(scope="function")
def test_note(db_session, test_user) -> Note:
    """Create a test note."""
    note = Note(
        user_id=test_user.id,
        title="Test Note",
        content="This is a test note content"
    )
    db_session.add(note)
    db_session.commit()
    db_session.refresh(note)
    return note


@pytest.fixture(scope="function")
def test_task(db_session, test_user) -> Task:
    """Create a test task."""
    task = Task(
        user_id=test_user.id,
        title="Test Task",
        description="This is a test task",
        status="pending"
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    return task


@pytest.fixture(scope="function")
def test_reminder(db_session, test_user) -> Reminder:
    """Create a test reminder."""
    from datetime import datetime, timedelta
    reminder = Reminder(
        user_id=test_user.id,
        title="Test Reminder",
        description="This is a test reminder",
        scheduled_time=datetime.utcnow() + timedelta(hours=1)
    )
    db_session.add(reminder)
    db_session.commit()
    db_session.refresh(reminder)
    return reminder


# Test data constants
TEST_MESSAGES = [
    "Hello, how are you?",
    "My name is Alex",
    "I live in Seattle",
    "I work in AI",
    "What's my name?",
    "Where do I live?",
    "What do I do for work?"
]

TEST_MEMORY_CONTENT = [
    "I live in Seattle",
    "My name is Alex",
    "I work in AI",
    "I like hiking on weekends",
    "My life goal is to wake up at 6AM daily"
]
