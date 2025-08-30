"""Tests for login API endpoints."""

import pytest
from unittest.mock import Mock, patch
from datetime import timedelta
from fastapi.testclient import TestClient
from fastapi import status

from app.main import app
from app.core.config import settings


class TestLoginEndpoints:
    """Test cases for login API endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        return Mock()

    @pytest.fixture
    def mock_user(self):
        """Create mock user."""
        user = Mock()
        user.id = "test-user-id"
        user.email = "test@example.com"
        user.is_active = True
        user.is_superuser = False
        return user

    @patch('app.api.deps.get_db')
    @patch('app.crud.user.authenticate')
    @patch('app.crud.user.is_active')
    @patch('app.core.security.create_access_token')
    @patch('app.middleware.auth_cookies.set_auth_cookies')
    def test_login_access_token_success(
        self,
        mock_set_cookies,
        mock_create_token,
        mock_is_active,
        mock_authenticate,
        mock_get_db,
        client,
        mock_db_session,
        mock_user
    ):
        """Test successful login with valid credentials."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_authenticate.return_value = mock_user
        mock_is_active.return_value = True
        mock_create_token.return_value = "test-access-token"

        # Make request
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "username": "test@example.com",
                "password": "testpassword"
            }
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["access_token"] == "test-access-token"
        assert data["token_type"] == "bearer"

        # Verify mocks called correctly
        mock_authenticate.assert_called_once_with(
            mock_db_session, 
            email="test@example.com", 
            password="testpassword"
        )
        mock_is_active.assert_called_once_with(mock_user)
        mock_create_token.assert_called_once()
        mock_set_cookies.assert_called_once()

    @patch('app.api.deps.get_db')
    @patch('app.crud.user.authenticate')
    def test_login_access_token_invalid_credentials(
        self,
        mock_authenticate,
        mock_get_db,
        client,
        mock_db_session
    ):
        """Test login with invalid credentials."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_authenticate.return_value = None  # Invalid credentials

        # Make request
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "username": "invalid@example.com",
                "password": "wrongpassword"
            }
        )

        # Verify response
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["detail"] == "Incorrect email or password"

    @patch('app.api.deps.get_db')
    @patch('app.crud.user.authenticate')
    @patch('app.crud.user.is_active')
    def test_login_access_token_inactive_user(
        self,
        mock_is_active,
        mock_authenticate,
        mock_get_db,
        client,
        mock_db_session,
        mock_user
    ):
        """Test login with inactive user."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_authenticate.return_value = mock_user
        mock_is_active.return_value = False  # User is inactive

        # Make request
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "username": "test@example.com",
                "password": "testpassword"
            }
        )

        # Verify response
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["detail"] == "Inactive user"

    @patch('app.api.deps.get_db')
    @patch('app.crud.user.authenticate')
    @patch('app.crud.user.is_active')
    @patch('app.core.security.create_access_token')
    @patch('app.middleware.auth_cookies.set_auth_cookies')
    @patch('app.core.config.settings')
    def test_login_access_token_uses_settings_expiry(
        self,
        mock_settings,
        mock_set_cookies,
        mock_create_token,
        mock_is_active,
        mock_authenticate,
        mock_get_db,
        client,
        mock_db_session,
        mock_user
    ):
        """Test that login uses settings for token expiry."""
        # Setup mocks
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_get_db.return_value = mock_db_session
        mock_authenticate.return_value = mock_user
        mock_is_active.return_value = True
        mock_create_token.return_value = "test-token"

        # Make request
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "username": "test@example.com",
                "password": "testpassword"
            }
        )

        # Verify token creation called with correct expiry
        assert response.status_code == status.HTTP_200_OK
        mock_create_token.assert_called_once()
        call_args = mock_create_token.call_args
        assert call_args[0][0] == mock_user.id  # user_id
        expires_delta = call_args[1]['expires_delta']
        assert isinstance(expires_delta, timedelta)

    def test_login_access_token_missing_username(self, client):
        """Test login with missing username."""
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "password": "testpassword"
            }
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_access_token_missing_password(self, client):
        """Test login with missing password."""
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "username": "test@example.com"
            }
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_access_token_empty_credentials(self, client):
        """Test login with empty credentials."""
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "username": "",
                "password": ""
            }
        )

        # Should still process but likely fail authentication
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY]

    @patch('app.api.deps.get_current_user')
    def test_test_token_success(self, mock_get_current_user, client, mock_user):
        """Test successful token validation."""
        # Setup mock
        mock_get_current_user.return_value = mock_user

        # Make request with Authorization header
        response = client.post(
            "/api/v1/login/test-token",
            headers={"Authorization": "Bearer test-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == mock_user.id
        assert data["email"] == mock_user.email

    def test_test_token_no_authorization(self, client):
        """Test token validation without authorization header."""
        response = client.post("/api/v1/login/test-token")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_test_token_invalid_token(self, client):
        """Test token validation with invalid token."""
        response = client.post(
            "/api/v1/login/test-token",
            headers={"Authorization": "Bearer invalid-token"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('app.api.deps.get_current_user')
    def test_test_token_returns_user_data(self, mock_get_current_user, client):
        """Test that test-token endpoint returns complete user data."""
        # Create detailed mock user
        mock_user = Mock()
        mock_user.id = "user-123"
        mock_user.email = "detailed@example.com"
        mock_user.full_name = "Test User"
        mock_user.is_active = True
        mock_user.is_superuser = False
        mock_user.memory_enabled = True
        
        mock_get_current_user.return_value = mock_user

        response = client.post(
            "/api/v1/login/test-token",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "user-123"
        assert data["email"] == "detailed@example.com"
        assert data["full_name"] == "Test User"
        assert data["is_active"] is True
        assert data["is_superuser"] is False

    @patch('app.api.deps.get_db')
    @patch('app.crud.user.authenticate')
    @patch('app.crud.user.is_active')
    @patch('app.core.security.create_access_token')
    @patch('app.middleware.auth_cookies.set_auth_cookies')
    def test_login_sets_cookies_with_request_context(
        self,
        mock_set_cookies,
        mock_create_token,
        mock_is_active,
        mock_authenticate,
        mock_get_db,
        client,
        mock_db_session,
        mock_user
    ):
        """Test that login passes request context to cookie setter."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_authenticate.return_value = mock_user
        mock_is_active.return_value = True
        mock_create_token.return_value = "test-token"

        # Make request
        response = client.post(
            "/api/v1/login/access-token",
            data={
                "username": "test@example.com",
                "password": "testpassword"
            }
        )

        assert response.status_code == status.HTTP_200_OK
        
        # Verify set_auth_cookies called with response, token, and request
        mock_set_cookies.assert_called_once()
        call_args = mock_set_cookies.call_args[0]
        assert len(call_args) == 3  # response, access_token, request
        assert call_args[1] == "test-token"  # access_token
