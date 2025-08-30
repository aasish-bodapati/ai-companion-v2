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

