import pytest
import logging
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from typing import Any
import os

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from app.main import app
from app.models.user import User
from app.core.security import get_password_hash, create_access_token
from app.db.base_class import Base
from app.db.session import get_db
from app.core.config import settings

# Test user data
TEST_ADMIN_EMAIL = "admin@example.com"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "testpassword"
TEST_USER_FULL_NAME = "Test User"
TEST_ADMIN_ID = "00000000-0000-0000-0000-000000000000"

# Create admin token for testing
ADMIN_TOKEN = create_access_token(TEST_ADMIN_ID)

def test_health_check(client: TestClient):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200, f"Health check failed: {response.text}"
    assert response.json() == {"status": "ok"}

def test_root(client: TestClient):
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_openapi_schema(client: TestClient):
    """Test that the OpenAPI schema is available."""
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    assert "openapi" in response.json()

def test_admin_user_creation(client: TestClient, db: Session):
    """Test admin user creation."""
    try:
        # Clean up any existing test users
        db.query(User).filter(User.email.in_([TEST_USER_EMAIL, TEST_ADMIN_EMAIL])).delete()
        
        # Create admin user directly in the database
        hashed_password = get_password_hash(TEST_USER_PASSWORD)
        admin_user = User(
            id=TEST_ADMIN_ID,
            email=TEST_ADMIN_EMAIL,
            hashed_password=hashed_password,
            full_name="Admin User",
            is_active=True,
            is_superuser=True
        )
        db.add(admin_user)
        db.commit()
        
        # Get admin token
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "username": TEST_ADMIN_EMAIL,
                "password": TEST_USER_PASSWORD,
                "grant_type": "password"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        admin_token = response.json()["access_token"]
        
        # Create regular user using admin token
        user_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": TEST_USER_FULL_NAME,
            "is_active": True
        }
        
        response = client.post(
            "/api/v1/users/",
            json=user_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to create user: {response.text}"
        
        user = response.json()
        assert user["email"] == TEST_USER_EMAIL
        assert "id" in user
        assert "hashed_password" not in user  # Password should not be returned
    finally:
        db.rollback()

def test_user_login(client: TestClient, db: Session):
    """Test user login and token generation."""
    try:
        # Clean up any existing test user
        db.query(User).filter(User.email == TEST_USER_EMAIL).delete()
        db.commit()
        
        # Create test user
        hashed_password = get_password_hash(TEST_USER_PASSWORD)
        logger.debug(f"Hashed password: {hashed_password}")
        
        db_user = User(
            email=TEST_USER_EMAIL,
            hashed_password=hashed_password,
            full_name=TEST_USER_FULL_NAME,
            is_active=True,
            is_superuser=False
        )
        db.add(db_user)
        db.commit()
        
        # Verify the user was created
        created_user = db.query(User).filter(User.email == TEST_USER_EMAIL).first()
        logger.debug(f"Created user in DB: {created_user}")
        logger.debug(f"Created user password hash: {created_user.hashed_password}")
        
        # Test login with form data (as expected by OAuth2)
        login_data = {
            "username": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "grant_type": "password"
        }
        logger.debug(f"Attempting login with: {login_data}")
        
        response = client.post(
            "/api/v1/login/access-token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        logger.debug(f"Login response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        token_data = response.json()
        assert "access_token" in token_data
        assert "token_type" in token_data
        assert token_data["token_type"].lower() == "bearer"
        
        # Test the token works by accessing a protected endpoint
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        response = client.get("/api/v1/users/me", headers=headers)
        logger.debug(f"User me response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed to access protected endpoint: {response.text}"
        
        user_data = response.json()
        assert user_data["email"] == TEST_USER_EMAIL
    finally:
        # Verify the user is still in the database
        db.rollback()
        db_user = db.query(User).filter(User.email == TEST_USER_EMAIL).first()
        logger.debug(f"User after test: {db_user}")
