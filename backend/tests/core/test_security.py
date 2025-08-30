import pytest
from datetime import datetime, timedelta, UTC
from unittest.mock import patch, MagicMock
from jose import jwt, JWTError

from app.core.security import (
    create_access_token,
    decode_token,
    verify_password,
    get_password_hash
)


class TestCreateAccessToken:
    def test_create_access_token_with_default_expiry(self):
        """Test creating access token with default expiry."""
        with patch('app.core.security.settings') as mock_settings:
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
            mock_settings.SECRET_KEY = "test-secret-key"
            mock_settings.ALGORITHM = "HS256"
            
            with patch('app.core.security.jwt.encode') as mock_encode:
                mock_encode.return_value = "test-token"
                
                result = create_access_token("user123")
                
                assert result == "test-token"
                mock_encode.assert_called_once()
                call_args = mock_encode.call_args
                # Check the arguments: (payload, secret_key, algorithm)
                assert call_args[0][0]["sub"] == "user123"  # payload
                assert call_args[0][1] == "test-secret-key"  # secret_key
                assert call_args[1]["algorithm"] == "HS256"  # algorithm as keyword arg
                
                # Check the payload
                payload = call_args[0][0]
                assert payload["sub"] == "user123"
                assert "exp" in payload

    def test_create_access_token_with_custom_expiry(self):
        """Test creating access token with custom expiry."""
        with patch('app.core.security.settings') as mock_settings:
            mock_settings.SECRET_KEY = "test-secret-key"
            mock_settings.ALGORITHM = "HS256"
            
            with patch('app.core.security.jwt.encode') as mock_encode:
                mock_encode.return_value = "test-token"
                
                custom_expiry = timedelta(hours=2)
                result = create_access_token("user123", custom_expiry)
                
                assert result == "test-token"
                mock_encode.assert_called_once()
                
                # Check the payload
                payload = mock_encode.call_args[0][0]
                assert payload["sub"] == "user123"
                assert "exp" in payload

    def test_create_access_token_with_non_string_subject(self):
        """Test creating access token with non-string subject."""
        with patch('app.core.security.settings') as mock_settings:
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
            mock_settings.SECRET_KEY = "test-secret-key"
            mock_settings.ALGORITHM = "HS256"
            
            with patch('app.core.security.jwt.encode') as mock_encode:
                mock_encode.return_value = "test-token"
                
                # Test with integer subject
                result = create_access_token(123)
                
                assert result == "test-token"
                payload = mock_encode.call_args[0][0]
                assert payload["sub"] == "123"  # Should be converted to string

    def test_create_access_token_jwt_error(self):
        """Test creating access token when JWT encoding fails."""
        with patch('app.core.security.settings') as mock_settings:
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
            mock_settings.SECRET_KEY = "test-secret-key"
            mock_settings.ALGORITHM = "HS256"
            
            with patch('app.core.security.jwt.encode') as mock_encode:
                mock_encode.side_effect = JWTError("Encoding failed")
                
                with pytest.raises(JWTError):
                    create_access_token("user123")


class TestDecodeToken:
    def test_decode_token_success(self):
        """Test successful token decoding."""
        with patch('app.core.security.settings') as mock_settings:
            mock_settings.SECRET_KEY = "test-secret-key"
            mock_settings.ALGORITHM = "HS256"
            
            expected_payload = {"sub": "user123", "exp": 1234567890}
            
            with patch('app.core.security.jwt.decode') as mock_decode:
                mock_decode.return_value = expected_payload
                
                result = decode_token("test-token")
                
                assert result == expected_payload
                mock_decode.assert_called_once_with(
                    "test-token", 
                    "test-secret-key", 
                    algorithms=["HS256"]
                )

    def test_decode_token_jwt_error(self):
        """Test token decoding when JWT decoding fails."""
        with patch('app.core.security.settings') as mock_settings:
            mock_settings.SECRET_KEY = "test-secret-key"
            mock_settings.ALGORITHM = "HS256"
            
            with patch('app.core.security.jwt.decode') as mock_decode:
                mock_decode.side_effect = JWTError("Invalid token")
                
                with pytest.raises(JWTError):
                    decode_token("invalid-token")

    def test_decode_token_with_different_algorithms(self):
        """Test token decoding with different algorithms."""
        with patch('app.core.security.settings') as mock_settings:
            mock_settings.SECRET_KEY = "test-secret-key"
            mock_settings.ALGORITHM = "RS256"
            
            expected_payload = {"sub": "user123", "exp": 1234567890}
            
            with patch('app.core.security.jwt.decode') as mock_decode:
                mock_decode.return_value = expected_payload
                
                result = decode_token("test-token")
                
                assert result == expected_payload
                mock_decode.assert_called_once_with(
                    "test-token", 
                    "test-secret-key", 
                    algorithms=["RS256"]
                )


class TestVerifyPassword:
    def test_verify_password_success(self):
        """Test successful password verification."""
        with patch('app.core.security.pwd_context.verify') as mock_verify:
            mock_verify.return_value = True
            
            result = verify_password("plain_password", "hashed_password")
            
            assert result is True
            mock_verify.assert_called_once_with("plain_password", "hashed_password")

    def test_verify_password_failure(self):
        """Test failed password verification."""
        with patch('app.core.security.pwd_context.verify') as mock_verify:
            mock_verify.return_value = False
            
            result = verify_password("wrong_password", "hashed_password")
            
            assert result is False
            mock_verify.assert_called_once_with("wrong_password", "hashed_password")

    def test_verify_password_with_empty_strings(self):
        """Test password verification with empty strings."""
        with patch('app.core.security.pwd_context.verify') as mock_verify:
            mock_verify.return_value = False
            
            result = verify_password("", "")
            
            assert result is False
            mock_verify.assert_called_once_with("", "")

    def test_verify_password_with_special_characters(self):
        """Test password verification with special characters."""
        with patch('app.core.security.pwd_context.verify') as mock_verify:
            mock_verify.return_value = True
            
            special_password = "!@#$%^&*()_+-=[]{}|;:,.<>?"
            result = verify_password(special_password, "hashed_password")
            
            assert result is True
            mock_verify.assert_called_once_with(special_password, "hashed_password")


class TestGetPasswordHash:
    def test_get_password_hash_success(self):
        """Test successful password hashing."""
        with patch('app.core.security.pwd_context.hash') as mock_hash:
            mock_hash.return_value = "hashed_password_123"
            
            result = get_password_hash("plain_password")
            
            assert result == "hashed_password_123"
            mock_hash.assert_called_once_with("plain_password")

    def test_get_password_hash_with_empty_password(self):
        """Test password hashing with empty password."""
        with patch('app.core.security.pwd_context.hash') as mock_hash:
            mock_hash.return_value = "hashed_empty"
            
            result = get_password_hash("")
            
            assert result == "hashed_empty"
            mock_hash.assert_called_once_with("")

    def test_get_password_hash_with_special_characters(self):
        """Test password hashing with special characters."""
        with patch('app.core.security.pwd_context.hash') as mock_hash:
            mock_hash.return_value = "hashed_special"
            
            special_password = "!@#$%^&*()_+-=[]{}|;:,.<>?"
            result = get_password_hash(special_password)
            
            assert result == "hashed_special"
            mock_hash.assert_called_once_with(special_password)

    def test_get_password_hash_with_long_password(self):
        """Test password hashing with long password."""
        with patch('app.core.security.pwd_context.hash') as mock_hash:
            mock_hash.return_value = "hashed_long"
            
            long_password = "a" * 1000  # Very long password
            result = get_password_hash(long_password)
            
            assert result == "hashed_long"
            mock_hash.assert_called_once_with(long_password)


class TestSecurityIntegration:
    def test_password_hash_and_verify_roundtrip(self):
        """Test that hashing and verifying a password works correctly."""
        with patch('app.core.security.pwd_context.hash') as mock_hash, \
             patch('app.core.security.pwd_context.verify') as mock_verify:
            
            mock_hash.return_value = "hashed_password"
            mock_verify.return_value = True
            
            # Hash a password
            hashed = get_password_hash("test_password")
            assert hashed == "hashed_password"
            
            # Verify the password
            is_valid = verify_password("test_password", hashed)
            assert is_valid is True
            
            # Verify wrong password
            mock_verify.return_value = False
            is_valid = verify_password("wrong_password", hashed)
            assert is_valid is False

    def test_token_creation_and_decoding_roundtrip(self):
        """Test that creating and decoding a token works correctly."""
        with patch('app.core.security.settings') as mock_settings, \
             patch('app.core.security.jwt.encode') as mock_encode, \
             patch('app.core.security.jwt.decode') as mock_decode:
            
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
            mock_settings.SECRET_KEY = "test-secret-key"
            mock_settings.ALGORITHM = "HS256"
            
            expected_payload = {"sub": "user123", "exp": 1234567890}
            mock_encode.return_value = "test-token"
            mock_decode.return_value = expected_payload
            
            # Create token
            token = create_access_token("user123")
            assert token == "test-token"
            
            # Decode token
            payload = decode_token(token)
            assert payload == expected_payload
