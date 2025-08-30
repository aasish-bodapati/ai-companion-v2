"""Tests for User CRUD operations."""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.crud.user import CRUDUser, user
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class TestCRUDUser:
    """Test cases for CRUDUser class."""

    @pytest.fixture
    def crud_user(self):
        """Create CRUDUser instance for testing."""
        return CRUDUser(User)

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        db = Mock(spec=Session)
        db.query.return_value = db
        db.filter.return_value = db
        return db

    @pytest.fixture
    def sample_user(self):
        """Create sample user for testing."""
        return User(
            id="user-123",
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            is_active=True,
            is_superuser=False
        )

    def test_get_by_email_found(self, crud_user, mock_db, sample_user):
        """Test get_by_email when user exists."""
        mock_db.first.return_value = sample_user
        
        result = crud_user.get_by_email(mock_db, email="TEST@EXAMPLE.COM")
        
        assert result == sample_user
        mock_db.query.assert_called_once_with(User)

    def test_get_by_email_not_found(self, crud_user, mock_db):
        """Test get_by_email when user doesn't exist."""
        mock_db.first.return_value = None
        
        result = crud_user.get_by_email(mock_db, email="nonexistent@example.com")
        
        assert result is None

    def test_get_by_email_case_insensitive(self, crud_user, mock_db, sample_user):
        """Test get_by_email is case insensitive."""
        mock_db.first.return_value = sample_user
        
        result = crud_user.get_by_email(mock_db, email="  TEST@EXAMPLE.COM  ")
        
        assert result == sample_user

    @patch('app.crud.user.get_password_hash')
    def test_create_user(self, mock_hash, crud_user, mock_db):
        """Test creating a new user."""
        mock_hash.return_value = "hashed_password"
        user_create = UserCreate(
            email="  NEW@EXAMPLE.COM  ",
            password="password123",
            full_name="New User",
            is_superuser=True
        )
        
        result = crud_user.create(mock_db, obj_in=user_create)
        
        mock_hash.assert_called_once_with("password123")
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @patch('app.crud.user.get_password_hash')
    def test_update_user_with_password(self, mock_hash, crud_user, mock_db, sample_user):
        """Test updating user with password change."""
        mock_hash.return_value = "new_hashed_password"
        user_update = UserUpdate(
            full_name="Updated Name",
            password="new_password"
        )
        
        with patch('app.crud.base.jsonable_encoder') as mock_encoder:
            mock_encoder.return_value = {
                "id": "user-123",
                "email": "test@example.com",
                "full_name": "Test User"
            }
            
            result = crud_user.update(mock_db, db_obj=sample_user, obj_in=user_update)
            
            mock_hash.assert_called_once_with("new_password")
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()

    def test_update_user_without_password(self, crud_user, mock_db, sample_user):
        """Test updating user without password change."""
        user_update = UserUpdate(full_name="Updated Name")
        
        with patch('app.crud.base.jsonable_encoder') as mock_encoder:
            mock_encoder.return_value = {
                "id": "user-123",
                "email": "test@example.com",
                "full_name": "Test User"
            }
            
            result = crud_user.update(mock_db, db_obj=sample_user, obj_in=user_update)
            
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()

    def test_update_user_with_dict(self, crud_user, mock_db, sample_user):
        """Test updating user with dictionary input."""
        update_data = {"full_name": "Updated Name", "password": "new_password"}
        
        with patch('app.crud.user.get_password_hash') as mock_hash, \
             patch('app.crud.base.jsonable_encoder') as mock_encoder:
            mock_hash.return_value = "new_hashed_password"
            mock_encoder.return_value = {
                "id": "user-123",
                "email": "test@example.com",
                "full_name": "Test User"
            }
            
            result = crud_user.update(mock_db, db_obj=sample_user, obj_in=update_data)
            
            mock_hash.assert_called_once_with("new_password")

    @patch('app.crud.user.verify_password')
    def test_authenticate_success(self, mock_verify, crud_user, mock_db, sample_user):
        """Test successful authentication."""
        mock_verify.return_value = True
        mock_db.first.return_value = sample_user
        
        result = crud_user.authenticate(mock_db, email="test@example.com", password="password")
        
        assert result == sample_user
        mock_verify.assert_called_once_with("password", "hashed_password")

    @patch('app.crud.user.verify_password')
    def test_authenticate_wrong_password(self, mock_verify, crud_user, mock_db, sample_user):
        """Test authentication with wrong password."""
        mock_verify.return_value = False
        mock_db.first.return_value = sample_user
        
        result = crud_user.authenticate(mock_db, email="test@example.com", password="wrong")
        
        assert result is None

    def test_authenticate_user_not_found(self, crud_user, mock_db):
        """Test authentication when user doesn't exist."""
        mock_db.first.return_value = None
        
        result = crud_user.authenticate(mock_db, email="nonexistent@example.com", password="password")
        
        assert result is None

    def test_authenticate_case_insensitive(self, crud_user, mock_db, sample_user):
        """Test authentication is case insensitive for email."""
        with patch('app.crud.user.verify_password') as mock_verify:
            mock_verify.return_value = True
            mock_db.first.return_value = sample_user
            
            result = crud_user.authenticate(mock_db, email="  TEST@EXAMPLE.COM  ", password="password")
            
            assert result == sample_user

    def test_is_active_true(self, crud_user, sample_user):
        """Test is_active returns True for active user."""
        sample_user.is_active = True
        
        result = crud_user.is_active(sample_user)
        
        assert result is True

    def test_is_active_false(self, crud_user, sample_user):
        """Test is_active returns False for inactive user."""
        sample_user.is_active = False
        
        result = crud_user.is_active(sample_user)
        
        assert result is False

    def test_is_superuser_true(self, crud_user, sample_user):
        """Test is_superuser returns True for superuser."""
        sample_user.is_superuser = True
        
        result = crud_user.is_superuser(sample_user)
        
        assert result is True

    def test_is_superuser_false(self, crud_user, sample_user):
        """Test is_superuser returns False for regular user."""
        sample_user.is_superuser = False
        
        result = crud_user.is_superuser(sample_user)
        
        assert result is False

    def test_crud_user_instance(self):
        """Test that the user instance is properly configured."""
        assert isinstance(user, CRUDUser)
        assert user.model == User
