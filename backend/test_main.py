import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, get_db, Base, User, get_password_hash

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Fixtures
@pytest.fixture(scope="module")
def test_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop all tables after tests
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(test_db):
    # Override the database dependency
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    # Clear overrides
    app.dependency_overrides = {}

# Test data
TEST_USER = {
    "email": "test@example.com",
    "password": "testpassword123",
    "full_name": "Test User"
}

def test_register_user(client):
    """Test user registration"""
    response = client.post(
        "/register",
        json=TEST_USER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == TEST_USER["email"]
    assert data["full_name"] == TEST_USER["full_name"]
    assert "id" in data
    assert "hashed_password" not in data

def test_register_duplicate_user(client):
    """Test that duplicate registration fails"""
    response = client.post(
        "/register",
        json=TEST_USER
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

def test_login_success(client):
    """Test successful login"""
    response = client.post(
        "/token",
        data={
            "username": TEST_USER["email"],
            "password": TEST_USER["password"],
            "grant_type": "password"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    return data["access_token"]

def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post(
        "/token",
        data={
            "username": TEST_USER["email"],
            "password": "wrongpassword",
            "grant_type": "password"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_protected_route(client):
    """Test accessing a protected route"""
    # First get a token
    token = test_login_success(client)
    
    # Access protected route with token
    response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == TEST_USER["email"]
    assert data["full_name"] == TEST_USER["full_name"]

def test_protected_route_no_token(client):
    """Test accessing a protected route without a token"""
    response = client.get("/users/me")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]

def test_invalid_token(client):
    """Test accessing a protected route with an invalid token"""
    response = client.get(
        "/users/me",
        headers={"Authorization": "Bearer invalidtoken123"}
    )
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]
