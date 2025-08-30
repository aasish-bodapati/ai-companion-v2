"""
Standardized error handling for the backend
"""

from typing import Any, Dict, Optional, Union
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class ErrorResponse(BaseModel):
    """Standardized error response model"""

    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    code: Optional[str] = None


class AppError(Exception):
    """Base application error with structured information"""

    def __init__(
        self,
        message: str,
        error_type: str = "application_error",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
        code: Optional[str] = None,
    ):
        self.message = message
        self.error_type = error_type
        self.status_code = status_code
        self.details = details or {}
        self.code = code
        super().__init__(message)


class ValidationError(AppError):
    """Validation error with 400 status"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type="validation_error",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
            code="VALIDATION_ERROR",
        )


class NotFoundError(AppError):
    """Resource not found error with 404 status"""

    def __init__(self, resource: str, identifier: str = ""):
        message = f"{resource} not found"
        if identifier:
            message += f": {identifier}"
        super().__init__(
            message=message,
            error_type="not_found_error",
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
        )


class AuthorizationError(AppError):
    """Authorization error with 403 status"""

    def __init__(self, message: str = "Access denied"):
        super().__init__(
            message=message,
            error_type="authorization_error",
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
        )


def create_error_response(
    error: Union[AppError, HTTPException, Exception], request_id: Optional[str] = None
) -> JSONResponse:
    """Create standardized error response"""

    if isinstance(error, AppError):
        response_data = ErrorResponse(
            error=error.error_type, message=error.message, details=error.details, code=error.code
        )
        status_code = error.status_code

        # Log application errors
        logger.error(
            f"Application error: {error.message}",
            extra={
                "error_type": error.error_type,
                "status_code": error.status_code,
                "details": error.details,
                "request_id": request_id,
            },
        )

    elif isinstance(error, HTTPException):
        response_data = ErrorResponse(
            error="http_error", message=error.detail, code=f"HTTP_{error.status_code}"
        )
        status_code = error.status_code

    else:
        # Generic exception
        response_data = ErrorResponse(
            error="internal_error", message="An unexpected error occurred", code="INTERNAL_ERROR"
        )
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

        # Log unexpected errors
        logger.exception(f"Unexpected error: {str(error)}", extra={"request_id": request_id})

    return JSONResponse(status_code=status_code, content=response_data.dict())


def handle_database_error(error: Exception) -> AppError:
    """Convert database errors to application errors"""
    error_msg = str(error).lower()

    if "duplicate" in error_msg or "unique constraint" in error_msg:
        return ValidationError("Resource already exists")
    elif "foreign key" in error_msg:
        return ValidationError("Referenced resource does not exist")
    elif "not null" in error_msg:
        return ValidationError("Required field is missing")
    else:
        logger.exception("Database error occurred")
        return AppError("Database operation failed", code="DATABASE_ERROR")


def handle_validation_error(error: Exception) -> ValidationError:
    """Convert validation errors to structured format"""
    if hasattr(error, "errors"):
        # Pydantic validation error
        details = {"validation_errors": error.errors()}
        return ValidationError("Validation failed", details=details)
    else:
        return ValidationError(str(error))
