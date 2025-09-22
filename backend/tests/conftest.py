"""
Pytest configuration and shared fixtures.
"""

import pytest
import asyncio
from typing import Generator, AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.main import app
from app.db.session import get_db
from app.db.base_class import Base
from app.core.config import settings


# Test database URL - using PostgreSQL for tests
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/healthlog_test_db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_timeout=30,
    pool_recycle=3600,
    pool_size=5,
    max_overflow=10
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def async_client(db_session):
    """Create an async test client."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def sample_fitness_log_data():
    """Sample fitness log data for testing."""
    return {
        "exercise_type": "push-ups",
        "duration_minutes": 30,
        "calories_burned": 150,
        "notes": "Test workout"
    }


@pytest.fixture
def sample_nutrition_log_data():
    """Sample nutrition log data for testing."""
    return {
        "food_name": "Apple",
        "calories": 95,
        "protein": 0.5,
        "carbs": 25,
        "fat": 0.3,
        "quantity": 1,
        "unit": "medium"
    }
