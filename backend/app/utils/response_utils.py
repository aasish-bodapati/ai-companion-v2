"""
Response utilities for consistent API responses and error handling.
"""

from typing import Any, Dict, List, Optional
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class ResponseUtils:
    """Utilities for building consistent API responses."""
    
    @staticmethod
    def build_error_response(message: str, status_code: int = 500, details: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Build a consistent error response.
        
        Args:
            message: Error message
            status_code: HTTP status code
            details: Additional error details
            
        Returns:
            Error response dictionary
        """
        error_response = {
            "error": True,
            "message": message,
            "status_code": status_code
        }
        
        if details:
            error_response["details"] = details
            
        return error_response
    
    @staticmethod
    def build_success_response(data: Any, message: Optional[str] = None) -> Dict[str, Any]:
        """
        Build a consistent success response.
        
        Args:
            data: Response data
            message: Optional success message
            
        Returns:
            Success response dictionary
        """
        response = {
            "success": True,
            "data": data
        }
        
        if message:
            response["message"] = message
            
        return response
    
    @staticmethod
    def build_paginated_response(
        items: List[Any], 
        total: int, 
        page: int, 
        size: int,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Build a paginated response.
        
        Args:
            items: List of items
            total: Total number of items
            page: Current page number
            size: Page size
            message: Optional message
            
        Returns:
            Paginated response dictionary
        """
        response = {
            "success": True,
            "data": items,
            "pagination": {
                "total": total,
                "page": page,
                "size": size,
                "pages": (total + size - 1) // size if size > 0 else 0
            }
        }
        
        if message:
            response["message"] = message
            
        return response
    
    @staticmethod
    def convert_logs_to_response(logs: List[Any], log_type: str) -> List[Dict[str, Any]]:
        """
        Convert log objects to response format.
        
        Args:
            logs: List of log objects
            log_type: Type of logs (fitness, nutrition, mood)
            
        Returns:
            List of formatted log dictionaries
        """
        formatted_logs = []
        
        for log in logs:
            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "updated_at": log.updated_at.isoformat() if hasattr(log, 'updated_at') and log.updated_at else None
            }
            
            # Add type-specific fields
            if log_type == "fitness":
                log_dict.update({
                    "activity_type": log.activity_type,
                    "activity_name": log.activity_name,
                    "duration_minutes": log.duration_minutes,
                    "calories_burned": log.calories_burned,
                    "notes": log.notes,
                    "activity_date": log.activity_date.isoformat() if log.activity_date else None,
                    "exercises": log.exercises,
                    "unit": log.unit
                })
            elif log_type == "nutrition":
                log_dict.update({
                    "meal_type": log.meal_type,
                    "meal_name": log.meal_name,
                    "total_calories": log.total_calories,
                    "protein_g": log.protein_g,
                    "carbs_g": log.carbs_g,
                    "fat_g": log.fat_g,
                    "notes": log.notes,
                    "meal_date": log.meal_date.isoformat() if log.meal_date else None,
                    "food_items": log.food_items
                })
            elif log_type == "mood":
                log_dict.update({
                    "mood_score": log.mood_score,
                    "mood_label": getattr(log, 'mood_label', None),
                    "mood_emoji": getattr(log, 'mood_emoji', None),
                    "energy_level": getattr(log, 'energy_level', None),
                    "stress_level": getattr(log, 'stress_level', None),
                    "notes": log.notes,
                    "log_date": log.log_date.isoformat() if log.log_date else None
                })
            
            formatted_logs.append(log_dict)
        
        return formatted_logs
    
    @staticmethod
    def handle_database_error(error: Exception, operation: str) -> HTTPException:
        """
        Handle database errors consistently.
        
        Args:
            error: The database error
            operation: Description of the operation that failed
            
        Returns:
            HTTPException with appropriate error details
        """
        logger.error(f"Database error during {operation}: {str(error)}")
        
        # Check for common database errors
        error_message = str(error).lower()
        
        if "not found" in error_message or "does not exist" in error_message:
            return HTTPException(status_code=404, detail=f"{operation} not found")
        elif "duplicate" in error_message or "unique constraint" in error_message:
            return HTTPException(status_code=409, detail=f"{operation} already exists")
        elif "foreign key" in error_message:
            return HTTPException(status_code=400, detail=f"Invalid reference in {operation}")
        elif "permission" in error_message or "access denied" in error_message:
            return HTTPException(status_code=403, detail=f"Access denied for {operation}")
        else:
            return HTTPException(status_code=500, detail=f"Failed to {operation}")
    
    @staticmethod
    def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
        """
        Validate that required fields are present in data.
        
        Args:
            data: Data dictionary to validate
            required_fields: List of required field names
            
        Raises:
            HTTPException: If required fields are missing
        """
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        
        if missing_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )
    
    @staticmethod
    def sanitize_log_data(log_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize log data by removing None values and empty strings.
        
        Args:
            log_data: Raw log data dictionary
            
        Returns:
            Sanitized log data dictionary
        """
        sanitized = {}
        
        for key, value in log_data.items():
            if value is not None and value != "":
                if isinstance(value, str) and value.strip():
                    sanitized[key] = value.strip()
                elif not isinstance(value, str):
                    sanitized[key] = value
        
        return sanitized


class HealthLogResponseFormatter:
    """Formatter for health log responses with consistent structure."""
    
    @staticmethod
    def format_fitness_log(log) -> Dict[str, Any]:
        """Format a fitness log for API response."""
        return {
            "id": log.id,
            "user_id": log.user_id,
            "activity_type": log.activity_type,
            "activity_name": log.activity_name,
            "duration_minutes": log.duration_minutes,
            "calories_burned": log.calories_burned,
            "notes": log.notes,
            "activity_date": log.activity_date.isoformat() if log.activity_date else None,
            "exercises": log.exercises,
            "unit": log.unit,
            "created_at": log.created_at.isoformat(),
            "updated_at": log.updated_at.isoformat()
        }
    
    @staticmethod
    def format_nutrition_log(log) -> Dict[str, Any]:
        """Format a nutrition log for API response."""
        return {
            "id": log.id,
            "user_id": log.user_id,
            "meal_type": log.meal_type,
            "meal_name": log.meal_name,
            "total_calories": log.total_calories,
            "notes": log.notes,
            "meal_date": log.meal_date.isoformat() if log.meal_date else None,
            "food_items": log.food_items,
            "created_at": log.created_at.isoformat(),
            "updated_at": log.updated_at.isoformat()
        }
    
    @staticmethod
    def format_mood_log(log) -> Dict[str, Any]:
        """Format a mood log for API response."""
        return {
            "id": log.id,
            "user_id": log.user_id,
            "mood_rating": log.mood_rating,
            "mood_label": getattr(log, 'mood_label', None),
            "mood_emoji": getattr(log, 'mood_emoji', None),
            "notes": log.notes,
            "log_date": log.log_date.isoformat(),
            "created_at": log.created_at.isoformat(),
            "updated_at": log.updated_at.isoformat()
        }
    
    @staticmethod
    def format_water_log(log) -> Dict[str, Any]:
        """Format a water log for API response."""
        return {
            "id": log.id,
            "user_id": log.user_id,
            "amount_ml": log.amount_ml,
            "amount_oz": log.amount_oz,
            "log_type": log.log_type,
            "notes": log.notes,
            "log_date": log.log_date.isoformat() if log.log_date else None,
            "created_at": log.created_at.isoformat(),
            "updated_at": log.updated_at.isoformat()
        }