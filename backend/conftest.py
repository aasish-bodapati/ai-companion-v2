import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Force SQLite for tests before importing app/settings so global engine binds to SQLite
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.core.config import settings
from app.main import app
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.base_class import Base
from app.db.session import get_db  # Import the production dependency to override
from app.api import deps as api_deps  # Import API deps to override its get_db as well
from app.models.user import User

# Create test database engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create test database tables
Base.metadata.create_all(bind=engine)

# Test user data
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword"
TEST_USER_FULL_NAME = "Test User"

@pytest.fixture(scope="module")
def db():
    """Provide a shared SQLite in-memory session for tests."""
    session = TestingSessionLocal()

    # Clean up any existing test data
    session.query(User).filter(User.email == TEST_USER_EMAIL).delete()
    session.commit()

    # Create test user with hashed password
    test_user = User(
        email=TEST_USER_EMAIL,
        hashed_password=get_password_hash(TEST_USER_PASSWORD),
        full_name=TEST_USER_FULL_NAME,
        is_active=True,
        is_superuser=False
    )
    session.add(test_user)
    session.commit()
    session.refresh(test_user)

    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="module")
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="module")
def token(db):
    """Generate a JWT token for testing."""
    # Get the test user
    test_user = db.query(User).filter(User.email == TEST_USER_EMAIL).first()
    assert test_user is not None, "Test user not found in database"
    
    # Create token with user ID as subject
    access_token = create_access_token(
        subject=str(test_user.id)
    )
    return access_token

@pytest.fixture(scope="module")
def test_user(db):
    """Get the test user from the database."""
    user = db.query(User).filter(User.email == TEST_USER_EMAIL).first()
    if not user:
        # Create the user if not found (shouldn't happen with our db fixture)
        user = User(email=TEST_USER_EMAIL, hashed_password=TEST_USER_PASSWORD)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# Override FastAPI get_db dependency globally for tests to use the in-memory SQLite session
def override_get_db():
    """Yield a session without manual transaction management to avoid cross-rollbacks."""
    test_session = TestingSessionLocal()
    try:
        yield test_session
        # Commit at end of request to persist created records for subsequent requests
        test_session.commit()
    finally:
        test_session.close()

# Apply the override before any tests run
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[api_deps.get_db] = override_get_db
