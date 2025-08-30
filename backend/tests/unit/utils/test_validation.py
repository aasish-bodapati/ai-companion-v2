"""
Unit tests for core utilities.

These tests are fast, isolated, and test individual functions without external dependencies.
"""

import pytest
from unittest.mock import Mock, patch
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.core.error_handler import create_error_response, handle_database_error, handle_validation_error


@pytest.mark.unit
class TestSecurity:
    """Test security utilities."""
    
    def test_password_hashing_and_verification(self):
        """Test password hashing and verification."""
        password = "test_password_123"
        
        # Hash the password
        hashed = get_password_hash(password)
        assert hashed != password
        assert len(hashed) > len(password)
        
        # Verify the password
        assert verify_password(password, hashed) is True
        assert verify_password("wrong_password", hashed) is False
    
    def test_access_token_creation_and_decoding(self):
        """Test JWT token creation and decoding."""
        user_id = "test_user_123"
        
        # Create token
        token = create_access_token(user_id)
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode token
        decoded = decode_token(token)
        assert decoded["sub"] == user_id
        assert "exp" in decoded
    
    def test_token_with_custom_expiry(self):
        """Test token creation with custom expiry."""
        from datetime import timedelta
        
        user_id = "test_user_123"
        custom_expiry = timedelta(hours=2)
        
        token = create_access_token(user_id, expires_delta=custom_expiry)
        decoded = decode_token(token)
        
        assert decoded["sub"] == user_id


@pytest.mark.unit
class TestErrorHandling:
    """Test error handling utilities."""
    
    def test_create_error_response_app_error(self):
        """Test creating error response for AppError."""
        from app.core.error_handler import AppError
        
        error = AppError("Test error", "TEST_ERROR")
        response = create_error_response(error)
        
        # Response is a JSONResponse object, check its content
        assert response.status_code == 500
        # The response body should contain the error details
        assert "Test error" in str(response.body)
    
    def test_create_error_response_http_exception(self):
        """Test creating error response for HTTPException."""
        from fastapi import HTTPException
        
        error = HTTPException(status_code=404, detail="Not found")
        response = create_error_response(error)
        
        # Response is a JSONResponse object, check its content
        assert response.status_code == 404
        # The response body should contain the error details
        assert "Not found" in str(response.body)
    
    def test_create_error_response_generic_exception(self):
        """Test creating error response for generic exception."""
        error = Exception("Generic error")
        response = create_error_response(error)
        
        # Response is a JSONResponse object, check its content
        assert response.status_code == 500
        # The response body should contain the error details
        assert "internal_error" in str(response.body)
    
    def test_handle_database_error_duplicate(self):
        """Test handling duplicate key error."""
        from sqlalchemy.exc import IntegrityError
        
        error = IntegrityError("duplicate key", None, None)
        result = handle_database_error(error)
        
        # Result is a ValidationError object, check its attributes
        assert "Resource already exists" in str(result)
    
    def test_handle_database_error_foreign_key(self):
        """Test handling foreign key error."""
        from sqlalchemy.exc import IntegrityError
        
        error = IntegrityError("foreign key", None, None)
        result = handle_database_error(error)
        
        # Result is a ValidationError object, check its attributes
        assert "Referenced resource does not exist" in str(result)
    
    def test_handle_validation_error_with_errors(self):
        """Test handling validation error with errors attribute."""
        from pydantic import ValidationError
        
        # Mock validation error
        mock_error = Mock(spec=ValidationError)
        mock_error.errors.return_value = [{"loc": ("field",), "msg": "Invalid value"}]
        
        result = handle_validation_error(mock_error)
        
        # Result is a ValidationError object, check its attributes
        assert "Validation failed" in str(result)


@pytest.mark.unit
class TestCoreFunctionality:
    """Test core functionality utilities."""
    
    def test_config_loading(self):
        """Test that configuration can be loaded."""
        from app.core.config import settings
        
        # Test that required settings exist
        assert hasattr(settings, "SECRET_KEY")
        assert hasattr(settings, "DATABASE_URL")
        assert hasattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES")
    
    def test_llm_service_availability(self):
        """Test that LLM service is available."""
        from app.core.llm import generate_response
        
        # Test that the function exists
        assert callable(generate_response)
    
    def test_conversation_flow_components(self):
        """Test conversation flow components."""
        from app.core.conversation_flow import ConversationFlow
        
        # Test that the class exists
        assert ConversationFlow is not None
