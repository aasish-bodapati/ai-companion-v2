import pytest
from unittest.mock import patch, MagicMock, Mock
from fastapi import HTTPException, Depends
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from uuid import uuid4

from app.api.deps import (
    get_db,
    get_current_user,
    get_current_active_user,
    get_current_active_superuser
)
from app.models.user import User
from app.schemas.user import TokenPayload


class TestGetDb:
    def test_get_db_success(self):
        """Test successful database session creation and cleanup."""
        with patch('app.api.deps.SessionLocal') as mock_session_local:
            mock_db = MagicMock()
            mock_session_local.return_value = mock_db
            
            # Test the generator
            db_gen = get_db()
            db = next(db_gen)
            
            assert db == mock_db
            mock_session_local.assert_called_once()
            
            # Test cleanup
            try:
                next(db_gen)
            except StopIteration:
                pass
            
            mock_db.close.assert_called_once()

    def test_get_db_exception_handling(self):
        """Test database session creation with exception handling."""
        with patch('app.api.deps.SessionLocal') as mock_session_local:
            mock_db = MagicMock()
            mock_session_local.return_value = mock_db
            mock_db.close.side_effect = Exception("Close error")
            
            # Test the generator
            db_gen = get_db()
            db = next(db_gen)
            
            assert db == mock_db
            
            # Test cleanup with exception - this is expected to raise the exception
            with pytest.raises(Exception) as exc_info:
                try:
                    next(db_gen)
                except StopIteration:
                    pass
            
            # Should still call close even if it raises an exception
            mock_db.close.assert_called_once()


class TestGetCurrentUser:
    def test_get_current_user_success(self):
        """Test successful user retrieval from token."""
        with patch('app.api.deps.jwt.decode') as mock_decode, \
             patch('app.api.deps.crud.user.get') as mock_get_user, \
             patch('app.api.deps.settings') as mock_settings:
            
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            
            # Mock token payload
            user_id = str(uuid4())
            token_payload = {"sub": user_id, "exp": 1234567890}
            mock_decode.return_value = token_payload
            
            # Mock user
            mock_user = MagicMock(spec=User)
            mock_get_user.return_value = mock_user
            
            # Mock dependencies
            mock_db = MagicMock(spec=Session)
            mock_token = "test-token"
            
            result = get_current_user(mock_db, mock_token)
            
            assert result == mock_user
            mock_decode.assert_called_once_with(
                mock_token, 
                "test-secret", 
                algorithms=["HS256"]
            )
            # The function converts the string to UUID, so we need to check the UUID version
            from uuid import UUID
            mock_get_user.assert_called_once_with(mock_db, id=UUID(user_id))

    def test_get_current_user_jwt_error(self):
        """Test user retrieval with JWT decode error."""
        with patch('app.api.deps.jwt.decode') as mock_decode, \
             patch('app.api.deps.settings') as mock_settings:
            
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            
            mock_decode.side_effect = JWTError("Invalid token")
            
            mock_db = MagicMock(spec=Session)
            mock_token = "invalid-token"
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(mock_db, mock_token)
            
            assert exc_info.value.status_code == 403
            assert exc_info.value.detail == "Could not validate credentials"

    def test_get_current_user_validation_error(self):
        """Test user retrieval with validation error."""
        with patch('app.api.deps.jwt.decode') as mock_decode, \
             patch('app.api.deps.settings') as mock_settings:
            
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            
            # Mock token payload that will cause validation error
            token_payload = {"sub": "not-a-uuid", "exp": 1234567890}
            mock_decode.return_value = token_payload
            
            mock_db = MagicMock(spec=Session)
            mock_token = "test-token"
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(mock_db, mock_token)
            
            assert exc_info.value.status_code == 403
            assert exc_info.value.detail == "Could not validate credentials"

    def test_get_current_user_not_found(self):
        """Test user retrieval when user doesn't exist."""
        with patch('app.api.deps.jwt.decode') as mock_decode, \
             patch('app.api.deps.crud.user.get') as mock_get_user, \
             patch('app.api.deps.settings') as mock_settings:
            
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            
            # Mock token payload
            user_id = str(uuid4())
            token_payload = {"sub": user_id, "exp": 1234567890}
            mock_decode.return_value = token_payload
            
            # Mock user not found
            mock_get_user.return_value = None
            
            mock_db = MagicMock(spec=Session)
            mock_token = "test-token"
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(mock_db, mock_token)
            
            assert exc_info.value.status_code == 404
            assert exc_info.value.detail == "User not found"


class TestGetCurrentActiveUser:
    def test_get_current_active_user_success(self):
        """Test successful active user retrieval."""
        with patch('app.api.deps.crud.user.is_active') as mock_is_active:
            mock_user = MagicMock(spec=User)
            mock_is_active.return_value = True
            
            result = get_current_active_user(mock_user)
            
            assert result == mock_user
            mock_is_active.assert_called_once_with(mock_user)

    def test_get_current_active_user_inactive(self):
        """Test active user retrieval with inactive user."""
        with patch('app.api.deps.crud.user.is_active') as mock_is_active:
            mock_user = MagicMock(spec=User)
            mock_is_active.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_active_user(mock_user)
            
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "Inactive user"
            mock_is_active.assert_called_once_with(mock_user)


class TestGetCurrentActiveSuperuser:
    def test_get_current_active_superuser_success(self):
        """Test successful superuser retrieval."""
        with patch('app.api.deps.crud.user.is_superuser') as mock_is_superuser:
            mock_user = MagicMock(spec=User)
            mock_is_superuser.return_value = True
            
            result = get_current_active_superuser(mock_user)
            
            assert result == mock_user
            mock_is_superuser.assert_called_once_with(mock_user)

    def test_get_current_active_superuser_not_superuser(self):
        """Test superuser retrieval with non-superuser."""
        with patch('app.api.deps.crud.user.is_superuser') as mock_is_superuser:
            mock_user = MagicMock(spec=User)
            mock_is_superuser.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_active_superuser(mock_user)
            
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "The user doesn't have enough privileges"
            mock_is_superuser.assert_called_once_with(mock_user)


class TestDepsIntegration:
    def test_dependency_chain_success(self):
        """Test the full dependency chain working together."""
        with patch('app.api.deps.jwt.decode') as mock_decode, \
             patch('app.api.deps.crud.user.get') as mock_get_user, \
             patch('app.api.deps.crud.user.is_active') as mock_is_active, \
             patch('app.api.deps.crud.user.is_superuser') as mock_is_superuser, \
             patch('app.api.deps.settings') as mock_settings:
            
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            
            # Mock token payload
            user_id = str(uuid4())
            token_payload = {"sub": user_id, "exp": 1234567890}
            mock_decode.return_value = token_payload
            
            # Mock user
            mock_user = MagicMock(spec=User)
            mock_get_user.return_value = mock_user
            mock_is_active.return_value = True
            mock_is_superuser.return_value = True
            
            mock_db = MagicMock(spec=Session)
            mock_token = "test-token"
            
            # Test the chain: get_current_user -> get_current_active_user -> get_current_active_superuser
            current_user = get_current_user(mock_db, mock_token)
            active_user = get_current_active_user(current_user)
            superuser = get_current_active_superuser(active_user)
            
            assert superuser == mock_user
            mock_decode.assert_called_once()
            mock_get_user.assert_called_once()
            mock_is_active.assert_called_once()
            mock_is_superuser.assert_called_once()

    def test_dependency_chain_with_inactive_user(self):
        """Test the dependency chain with inactive user."""
        with patch('app.api.deps.jwt.decode') as mock_decode, \
             patch('app.api.deps.crud.user.get') as mock_get_user, \
             patch('app.api.deps.crud.user.is_active') as mock_is_active, \
             patch('app.api.deps.settings') as mock_settings:
            
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            
            # Mock token payload
            user_id = str(uuid4())
            token_payload = {"sub": user_id, "exp": 1234567890}
            mock_decode.return_value = token_payload
            
            # Mock user
            mock_user = MagicMock(spec=User)
            mock_get_user.return_value = mock_user
            mock_is_active.return_value = False  # Inactive user
            
            mock_db = MagicMock(spec=Session)
            mock_token = "test-token"
            
            # Test the chain stops at get_current_active_user
            current_user = get_current_user(mock_db, mock_token)
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_active_user(current_user)
            
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "Inactive user"

    def test_dependency_chain_with_non_superuser(self):
        """Test the dependency chain with non-superuser."""
        with patch('app.api.deps.jwt.decode') as mock_decode, \
             patch('app.api.deps.crud.user.get') as mock_get_user, \
             patch('app.api.deps.crud.user.is_active') as mock_is_active, \
             patch('app.api.deps.crud.user.is_superuser') as mock_is_superuser, \
             patch('app.api.deps.settings') as mock_settings:
            
            mock_settings.SECRET_KEY = "test-secret"
            mock_settings.ALGORITHM = "HS256"
            
            # Mock token payload
            user_id = str(uuid4())
            token_payload = {"sub": user_id, "exp": 1234567890}
            mock_decode.return_value = token_payload
            
            # Mock user
            mock_user = MagicMock(spec=User)
            mock_get_user.return_value = mock_user
            mock_is_active.return_value = True
            mock_is_superuser.return_value = False  # Not a superuser
            
            mock_db = MagicMock(spec=Session)
            mock_token = "test-token"
            
            # Test the chain stops at get_current_active_superuser
            current_user = get_current_user(mock_db, mock_token)
            active_user = get_current_active_user(current_user)
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_active_superuser(active_user)
            
            assert exc_info.value.status_code == 400
            assert exc_info.value.detail == "The user doesn't have enough privileges"
