"""
Tests for error handling functionality.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
import logging

from app.core.error_handler import (
    ErrorResponse,
    AppError,
    ValidationError,
    NotFoundError,
    AuthorizationError,
    create_error_response,
    handle_database_error,
    handle_validation_error
)


class TestErrorResponse:
    """Test ErrorResponse model."""

    def test_error_response_creation(self):
        """Test creating an error response."""
        error_response = ErrorResponse(
            error="test_error",
            message="Test error message",
            details={"field": "value"},
            code="TEST_ERROR"
        )
        
        assert error_response.error == "test_error"
        assert error_response.message == "Test error message"
        assert error_response.details == {"field": "value"}
        assert error_response.code == "TEST_ERROR"

    def test_error_response_optional_fields(self):
        """Test error response with optional fields."""
        error_response = ErrorResponse(
            error="simple_error",
            message="Simple error"
        )
        
        assert error_response.error == "simple_error"
        assert error_response.message == "Simple error"
        assert error_response.details is None
        assert error_response.code is None


class TestAppError:
    """Test AppError base class."""

    def test_app_error_creation(self):
        """Test creating an application error."""
        error = AppError(
            message="Test error message",
            error_type="test_error",
            status_code=400,
            details={"field": "value"},
            code="TEST_ERROR"
        )
        
        assert error.message == "Test error message"
        assert error.error_type == "test_error"
        assert error.status_code == 400
        assert error.details == {"field": "value"}
        assert error.code == "TEST_ERROR"

    def test_app_error_defaults(self):
        """Test app error with default values."""
        error = AppError("Simple error message")
        
        assert error.message == "Simple error message"
        assert error.error_type == "application_error"
        assert error.status_code == 500
        assert error.details == {}
        assert error.code is None

    def test_app_error_inheritance(self):
        """Test that AppError inherits from Exception."""
        error = AppError("Test error")
        assert isinstance(error, Exception)


class TestValidationError:
    """Test ValidationError class."""

    def test_validation_error_creation(self):
        """Test creating a validation error."""
        error = ValidationError(
            message="Validation failed",
            details={"field": "invalid value"}
        )
        
        assert error.message == "Validation failed"
        assert error.error_type == "validation_error"
        assert error.status_code == 400
        assert error.details == {"field": "invalid value"}
        assert error.code == "VALIDATION_ERROR"

    def test_validation_error_default_details(self):
        """Test validation error with default details."""
        error = ValidationError("Validation failed")
        
        assert error.message == "Validation failed"
        assert error.error_type == "validation_error"
        assert error.status_code == 400
        assert error.details == {}
        assert error.code == "VALIDATION_ERROR"


class TestNotFoundError:
    """Test NotFoundError class."""

    def test_not_found_error_creation(self):
        """Test creating a not found error."""
        error = NotFoundError("User", "123")
        
        assert error.message == "User not found: 123"
        assert error.error_type == "not_found_error"
        assert error.status_code == 404
        assert error.code == "NOT_FOUND"

    def test_not_found_error_no_identifier(self):
        """Test not found error without identifier."""
        error = NotFoundError("Resource")
        
        assert error.message == "Resource not found"
        assert error.error_type == "not_found_error"
        assert error.status_code == 404
        assert error.code == "NOT_FOUND"


class TestAuthorizationError:
    """Test AuthorizationError class."""

    def test_authorization_error_creation(self):
        """Test creating an authorization error."""
        error = AuthorizationError("Custom access denied message")
        
        assert error.message == "Custom access denied message"
        assert error.error_type == "authorization_error"
        assert error.status_code == 403
        assert error.code == "FORBIDDEN"

    def test_authorization_error_default_message(self):
        """Test authorization error with default message."""
        error = AuthorizationError()
        
        assert error.message == "Access denied"
        assert error.error_type == "authorization_error"
        assert error.status_code == 403
        assert error.code == "FORBIDDEN"


class TestCreateErrorResponse:
    """Test create_error_response function."""

    def test_create_error_response_app_error(self, caplog):
        """Test creating error response for AppError."""
        with caplog.at_level(logging.ERROR):
            error = ValidationError("Test validation error")
            response = create_error_response(error, "req-123")
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 400
        
        content = response.body.decode()
        assert "test validation error" in content.lower()
        assert "validation_error" in content
        assert "VALIDATION_ERROR" in content
        
        # Check logging
        assert "Application error: Test validation error" in caplog.text
        assert "req-123" in caplog.text

    def test_create_error_response_http_exception(self):
        """Test creating error response for HTTPException."""
        error = HTTPException(status_code=404, detail="Resource not found")
        response = create_error_response(error, "req-456")
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 404
        
        content = response.body.decode()
        assert "resource not found" in content.lower()
        assert "http_error" in content
        assert "HTTP_404" in content

    def test_create_error_response_generic_exception(self, caplog):
        """Test creating error response for generic exception."""
        with caplog.at_level(logging.ERROR):
            error = ValueError("Generic value error")
            response = create_error_response(error, "req-789")
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 500
        
        content = response.body.decode()
        assert "unexpected error occurred" in content.lower()
        assert "internal_error" in content
        assert "INTERNAL_ERROR" in content
        
        # Check logging
        assert "Unexpected error: Generic value error" in caplog.text
        assert "req-789" in caplog.text

    def test_create_error_response_no_request_id(self, caplog):
        """Test creating error response without request ID."""
        with caplog.at_level(logging.ERROR):
            error = AppError("Test error")
            response = create_error_response(error)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 500
        
        # Check logging without request ID
        assert "Application error: Test error" in caplog.text

    def test_create_error_response_app_error_with_details(self, caplog):
        """Test creating error response for AppError with details."""
        with caplog.at_level(logging.ERROR):
            error = AppError(
                message="Complex error",
                details={"field": "value", "nested": {"key": "value"}},
                code="COMPLEX_ERROR"
            )
            response = create_error_response(error)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 500
        
        content = response.body.decode()
        assert "complex error" in content.lower()
        assert "complex_error" in content
        assert "COMPLEX_ERROR" in content

    def test_create_error_response_http_exception_no_request_id(self):
        """Test creating error response for HTTPException without request ID."""
        error = HTTPException(status_code=500, detail="Internal server error")
        response = create_error_response(error)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 500
        
        content = response.body.decode()
        assert "internal server error" in content.lower()
        assert "http_error" in content
        assert "HTTP_500" in content


class TestHandleDatabaseError:
    """Test handle_database_error function."""

    def test_handle_database_error_duplicate(self, caplog):
        """Test handling duplicate key error."""
        with caplog.at_level(logging.INFO):
            error = Exception("duplicate key value violates unique constraint")
            result = handle_database_error(error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Resource already exists"
        assert result.status_code == 400

    def test_handle_database_error_unique_constraint(self, caplog):
        """Test handling unique constraint error."""
        with caplog.at_level(logging.INFO):
            error = Exception("UNIQUE constraint failed")
            result = handle_database_error(error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Resource already exists"
        assert result.status_code == 400

    def test_handle_database_error_foreign_key(self, caplog):
        """Test handling foreign key error."""
        with caplog.at_level(logging.INFO):
            error = Exception("FOREIGN KEY constraint failed")
            result = handle_database_error(error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Referenced resource does not exist"
        assert result.status_code == 400

    def test_handle_database_error_not_null(self, caplog):
        """Test handling not null constraint error."""
        with caplog.at_level(logging.INFO):
            error = Exception("NOT NULL constraint failed")
            result = handle_database_error(error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Required field is missing"
        assert result.status_code == 400

    def test_handle_database_error_generic(self, caplog):
        """Test handling generic database error."""
        with caplog.at_level(logging.ERROR):
            error = Exception("Connection timeout")
            result = handle_database_error(error)
        
        assert isinstance(result, AppError)
        assert result.message == "Database operation failed"
        assert result.code == "DATABASE_ERROR"
        assert result.status_code == 500
        
        # Check logging
        assert "Database error occurred" in caplog.text

    def test_handle_database_error_case_insensitive(self, caplog):
        """Test that database error handling is case insensitive."""
        with caplog.at_level(logging.INFO):
            error = Exception("DUPLICATE KEY VALUE")
            result = handle_database_error(error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Resource already exists"


class TestHandleValidationError:
    """Test handle_validation_error function."""

    def test_handle_validation_error_with_errors_attribute(self):
        """Test handling validation error with errors attribute."""
        mock_error = MagicMock()
        mock_error.errors.return_value = [
            {"loc": ("field",), "msg": "Field is required", "type": "missing"}
        ]
        
        result = handle_validation_error(mock_error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Validation failed"
        assert result.details == {
            "validation_errors": [
                {"loc": ("field",), "msg": "Field is required", "type": "missing"}
            ]
        }

    def test_handle_validation_error_without_errors_attribute(self):
        """Test handling validation error without errors attribute."""
        error = Exception("Simple validation error")
        result = handle_validation_error(error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Simple validation error"
        assert result.details == {}

    def test_handle_validation_error_empty_errors(self):
        """Test handling validation error with empty errors."""
        mock_error = MagicMock()
        mock_error.errors.return_value = []
        
        result = handle_validation_error(mock_error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Validation failed"
        assert result.details == {"validation_errors": []}

    def test_handle_validation_error_complex_errors(self):
        """Test handling validation error with complex error structure."""
        mock_error = MagicMock()
        mock_error.errors.return_value = [
            {"loc": ("user", "email"), "msg": "Invalid email format", "type": "value_error"},
            {"loc": ("user", "age"), "msg": "Age must be positive", "type": "value_error"}
        ]
        
        result = handle_validation_error(mock_error)
        
        assert isinstance(result, ValidationError)
        assert result.message == "Validation failed"
        assert len(result.details["validation_errors"]) == 2
        assert "Invalid email format" in str(result.details["validation_errors"])
        assert "Age must be positive" in str(result.details["validation_errors"])


class TestErrorHandlerIntegration:
    """Test error handler integration scenarios."""

    def test_full_error_handling_flow(self, caplog):
        """Test complete error handling flow."""
        with caplog.at_level(logging.ERROR):
            # Create an app error
            error = NotFoundError("User", "123")
            
            # Create error response
            response = create_error_response(error, "req-test")
            
            # Verify response
            assert isinstance(response, JSONResponse)
            assert response.status_code == 404
            
            content = response.body.decode()
            assert "user not found: 123" in content.lower()
            assert "not_found_error" in content
            assert "NOT_FOUND" in content
            
            # Check logging
            assert "Application error: User not found: 123" in caplog.text

    def test_database_error_to_response_flow(self, caplog):
        """Test database error to response flow."""
        with caplog.at_level(logging.ERROR):
            # Simulate database error
            db_error = Exception("duplicate key value")
            
            # Handle database error
            app_error = handle_database_error(db_error)
            
            # Create response
            response = create_error_response(app_error, "req-db")
            
            # Verify response
            assert isinstance(response, JSONResponse)
            assert response.status_code == 400
            
            content = response.body.decode()
            assert "resource already exists" in content.lower()
            assert "validation_error" in content

    def test_validation_error_to_response_flow(self, caplog):
        """Test validation error to response flow."""
        with caplog.at_level(logging.ERROR):
            # Simulate validation error
            mock_validation_error = MagicMock()
            mock_validation_error.errors.return_value = [
                {"loc": ("email",), "msg": "Invalid email", "type": "value_error"}
            ]
            
            # Handle validation error
            app_error = handle_validation_error(mock_validation_error)
            
            # Create response
            response = create_error_response(app_error, "req-val")
            
            # Verify response
            assert isinstance(response, JSONResponse)
            assert response.status_code == 400
            
            content = response.body.decode()
            assert "validation failed" in content.lower()
            assert "validation_error" in content
            assert "VALIDATION_ERROR" in content
