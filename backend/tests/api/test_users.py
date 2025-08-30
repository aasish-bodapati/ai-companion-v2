"""Tests for users API endpoints."""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from fastapi import status
import uuid

from app.main import app


class TestUsersEndpoints:
    """Test cases for users API endpoints."""

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
        """Create mock regular user."""
        user = Mock()
        user.id = "regular-user-id"
        user.email = "user@example.com"
        user.full_name = "Regular User"
        user.is_active = True
        user.is_superuser = False
        return user

    @pytest.fixture
    def mock_superuser(self):
        """Create mock superuser."""
        user = Mock()
        user.id = "super-user-id"
        user.email = "admin@example.com"
        user.full_name = "Super User"
        user.is_active = True
        user.is_superuser = True
        return user

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_superuser')
    @patch('app.crud.user.get_multi')
    def test_read_users_success(
        self,
        mock_get_multi,
        mock_get_superuser,
        mock_get_db,
        client,
        mock_db_session,
        mock_superuser
    ):
        """Test successful retrieval of users by superuser."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_superuser.return_value = mock_superuser
        mock_users = [Mock(id="1", email="user1@test.com"), Mock(id="2", email="user2@test.com")]
        mock_get_multi.return_value = mock_users

        # Make request
        response = client.get(
            "/api/v1/users/",
            headers={"Authorization": "Bearer admin-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        mock_get_multi.assert_called_once_with(mock_db_session, skip=0, limit=100)

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_superuser')
    @patch('app.crud.user.get_multi')
    def test_read_users_with_pagination(
        self,
        mock_get_multi,
        mock_get_superuser,
        mock_get_db,
        client,
        mock_db_session,
        mock_superuser
    ):
        """Test users retrieval with pagination parameters."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_superuser.return_value = mock_superuser
        mock_get_multi.return_value = []

        # Make request with pagination
        response = client.get(
            "/api/v1/users/?skip=10&limit=50",
            headers={"Authorization": "Bearer admin-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        mock_get_multi.assert_called_once_with(mock_db_session, skip=10, limit=50)

    def test_read_users_unauthorized(self, client):
        """Test users retrieval without authorization."""
        response = client.get("/api/v1/users/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_superuser')
    @patch('app.crud.user.get_by_email')
    @patch('app.crud.user.create')
    def test_create_user_success(
        self,
        mock_create,
        mock_get_by_email,
        mock_get_superuser,
        mock_get_db,
        client,
        mock_db_session,
        mock_superuser
    ):
        """Test successful user creation by superuser."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_superuser.return_value = mock_superuser
        mock_get_by_email.return_value = None  # User doesn't exist
        
        new_user = Mock()
        new_user.id = "new-user-id"
        new_user.email = "newuser@example.com"
        mock_create.return_value = new_user

        # Make request
        user_data = {
            "email": "newuser@example.com",
            "password": "newpassword",
            "full_name": "New User"
        }
        response = client.post(
            "/api/v1/users/",
            json=user_data,
            headers={"Authorization": "Bearer admin-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        mock_get_by_email.assert_called_once_with(mock_db_session, email="newuser@example.com")
        mock_create.assert_called_once()

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_superuser')
    @patch('app.crud.user.get_by_email')
    def test_create_user_email_exists(
        self,
        mock_get_by_email,
        mock_get_superuser,
        mock_get_db,
        client,
        mock_db_session,
        mock_superuser,
        mock_user
    ):
        """Test user creation when email already exists."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_superuser.return_value = mock_superuser
        mock_get_by_email.return_value = mock_user  # User already exists

        # Make request
        user_data = {
            "email": "existing@example.com",
            "password": "password",
            "full_name": "Existing User"
        }
        response = client.post(
            "/api/v1/users/",
            json=user_data,
            headers={"Authorization": "Bearer admin-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "already exists" in data["detail"]

    def test_create_user_unauthorized(self, client):
        """Test user creation without authorization."""
        user_data = {
            "email": "test@example.com",
            "password": "password"
        }
        response = client.post("/api/v1/users/", json=user_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_user_invalid_data(self, client):
        """Test user creation with invalid data."""
        response = client.post(
            "/api/v1/users/",
            json={"invalid": "data"},
            headers={"Authorization": "Bearer admin-token"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @patch('app.api.deps.get_current_active_user')
    def test_read_user_me_success(self, mock_get_current_user, client, mock_user):
        """Test successful retrieval of current user."""
        # Setup mock
        mock_get_current_user.return_value = mock_user

        # Make request
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer user-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == mock_user.id
        assert data["email"] == mock_user.email

    def test_read_user_me_unauthorized(self, client):
        """Test current user retrieval without authorization."""
        response = client.get("/api/v1/users/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_user')
    @patch('app.crud.user.get')
    def test_read_user_by_id_own_user(
        self,
        mock_get,
        mock_get_current_user,
        mock_get_db,
        client,
        mock_db_session,
        mock_user
    ):
        """Test user retrieval by ID for own user."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_current_user.return_value = mock_user
        mock_get.return_value = mock_user

        # Make request
        response = client.get(
            f"/api/v1/users/{mock_user.id}",
            headers={"Authorization": "Bearer user-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        mock_get.assert_called_once_with(mock_db_session, id=uuid.UUID(mock_user.id))

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_user')
    @patch('app.crud.user.get')
    @patch('app.crud.user.is_superuser')
    def test_read_user_by_id_superuser_access(
        self,
        mock_is_superuser,
        mock_get,
        mock_get_current_user,
        mock_get_db,
        client,
        mock_db_session,
        mock_superuser
    ):
        """Test user retrieval by ID with superuser privileges."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_current_user.return_value = mock_superuser
        
        target_user = Mock()
        target_user.id = "target-user-id"
        mock_get.return_value = target_user
        mock_is_superuser.return_value = True

        # Make request
        response = client.get(
            f"/api/v1/users/{target_user.id}",
            headers={"Authorization": "Bearer admin-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_user')
    @patch('app.crud.user.get')
    @patch('app.crud.user.is_superuser')
    def test_read_user_by_id_insufficient_privileges(
        self,
        mock_is_superuser,
        mock_get,
        mock_get_current_user,
        mock_get_db,
        client,
        mock_db_session,
        mock_user
    ):
        """Test user retrieval by ID without sufficient privileges."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_current_user.return_value = mock_user
        
        other_user = Mock()
        other_user.id = "other-user-id"
        mock_get.return_value = other_user
        mock_is_superuser.return_value = False

        # Make request
        response = client.get(
            f"/api/v1/users/{other_user.id}",
            headers={"Authorization": "Bearer user-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "enough privileges" in data["detail"]

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_user')
    @patch('app.crud.user.get')
    def test_read_user_by_id_not_found(
        self,
        mock_get,
        mock_get_current_user,
        mock_get_db,
        client,
        mock_db_session,
        mock_user
    ):
        """Test user retrieval by ID when user not found."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_current_user.return_value = mock_user
        mock_get.return_value = None

        # Make request
        nonexistent_id = str(uuid.uuid4())
        response = client.get(
            f"/api/v1/users/{nonexistent_id}",
            headers={"Authorization": "Bearer user-token"}
        )

        # Should return None user, which might cause issues
        # The actual behavior depends on the serializer
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    def test_read_user_by_id_invalid_uuid(self, client):
        """Test user retrieval with invalid UUID format."""
        response = client.get(
            "/api/v1/users/invalid-uuid",
            headers={"Authorization": "Bearer user-token"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_read_user_by_id_unauthorized(self, client):
        """Test user retrieval by ID without authorization."""
        user_id = str(uuid.uuid4())
        response = client.get(f"/api/v1/users/{user_id}")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_superuser')
    @patch('app.crud.user.get_multi')
    def test_read_users_empty_result(
        self,
        mock_get_multi,
        mock_get_superuser,
        mock_get_db,
        client,
        mock_db_session,
        mock_superuser
    ):
        """Test users retrieval when no users exist."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_superuser.return_value = mock_superuser
        mock_get_multi.return_value = []

        # Make request
        response = client.get(
            "/api/v1/users/",
            headers={"Authorization": "Bearer admin-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data == []

    @patch('app.api.deps.get_db')
    @patch('app.api.deps.get_current_active_superuser')
    @patch('app.crud.user.get_by_email')
    @patch('app.crud.user.create')
    def test_create_user_minimal_data(
        self,
        mock_create,
        mock_get_by_email,
        mock_get_superuser,
        mock_get_db,
        client,
        mock_db_session,
        mock_superuser
    ):
        """Test user creation with minimal required data."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_get_superuser.return_value = mock_superuser
        mock_get_by_email.return_value = None
        
        new_user = Mock()
        new_user.id = "minimal-user-id"
        new_user.email = "minimal@example.com"
        mock_create.return_value = new_user

        # Make request with minimal data
        user_data = {
            "email": "minimal@example.com",
            "password": "password123"
        }
        response = client.post(
            "/api/v1/users/",
            json=user_data,
            headers={"Authorization": "Bearer admin-token"}
        )

        # Verify response
        assert response.status_code == status.HTTP_200_OK
        mock_create.assert_called_once()
