"""
Standardized response formatting for health logging APIs.
Provides consistent response structures across all health endpoints.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import json


class LoggingResponseFormatter:
    """Standardized response formatting for health logs."""
    
    @staticmethod
    def format_logs_response(
        logs: List[Any], 
        stats: Dict[str, Any], 
        pagination: Dict[str, Any],
        log_type: str = "logs"
    ) -> Dict[str, Any]:
        """
        Format a standard logs listing response.
        
        Args:
            logs: List of log objects
            stats: Statistics dictionary
            pagination: Pagination information
            log_type: Type of logs (e.g., "logs", "meals", "workouts")
            
        Returns:
            Formatted response dictionary
        """
        return {
            log_type: logs,
            "stats": stats,
            "pagination": pagination
        }
    
    @staticmethod
    def format_log_detail(log: Any, additional_fields: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a single log detail response.
        
        Args:
            log: Log object
            additional_fields: Additional fields to include
            
        Returns:
            Formatted log detail dictionary
        """
        base_response = {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "updated_at": log.updated_at.isoformat() if log.updated_at else None
        }
        
        if additional_fields:
            base_response.update(additional_fields)
        
        return base_response
    
    @staticmethod
    def format_fitness_log(log: Any) -> Dict[str, Any]:
        """Format a fitness log for API response."""
        # Create exercise details from individual workout fields
        exercises = []
        if hasattr(log, 'weight_kg') and hasattr(log, 'reps') and hasattr(log, 'sets'):
            if log.weight_kg is not None or log.reps is not None or log.sets is not None:
                exercise_detail = {
                    "exercise_name": getattr(log, 'activity_name', None) or getattr(log, 'activity_type', None),
                    "sets": getattr(log, 'sets', None),
                    "reps": str(getattr(log, 'reps', 0)) if getattr(log, 'reps', None) else "0",
                    "weight_used": getattr(log, 'weight_kg', None),
                    "notes": getattr(log, 'notes', None)
                }
                exercises.append(exercise_detail)
        
        return LoggingResponseFormatter.format_log_detail(log, {
            "routine_id": getattr(log, 'routine_id', None),
            "routine_name": getattr(log, 'routine_name', None),
            "workout_name": getattr(log, 'activity_name', None) or getattr(log, 'activity_type', None),
            "exercises": exercises,
            "duration_minutes": getattr(log, 'duration_minutes', None),
            "calories_burned": getattr(log, 'calories_burned', None),
            "difficulty_rating": getattr(log, 'difficulty_rating', None),
            "notes": getattr(log, 'notes', None),
            "logged_at": getattr(log, 'activity_date', None).isoformat() if getattr(log, 'activity_date', None) else None,
            "activity_date": getattr(log, 'activity_date', None).isoformat() if getattr(log, 'activity_date', None) else None
        })
    
    @staticmethod
    def format_nutrition_log(log: Any) -> Dict[str, Any]:
        """Format a nutrition log for API response."""
        # Parse food_items if it's a JSON string
        food_items = []
        if hasattr(log, 'food_items') and log.food_items:
            try:
                if isinstance(log.food_items, str):
                    food_items = json.loads(log.food_items)
                else:
                    food_items = log.food_items
            except (json.JSONDecodeError, TypeError):
                food_items = []
        
        return LoggingResponseFormatter.format_log_detail(log, {
            "routine_id": getattr(log, 'routine_id', None),
            "routine_name": getattr(log, 'routine_name', None),
            "meal_name": getattr(log, 'meal_name', None) or getattr(log, 'meal_type', None),
            "meal_type": getattr(log, 'meal_type', None),
            "food_items": food_items,
            "total_calories": getattr(log, 'total_calories', None),
            "protein_g": getattr(log, 'protein_g', None),
            "carbs_g": getattr(log, 'carbs_g', None),
            "fat_g": getattr(log, 'fat_g', None),
            "fiber_g": getattr(log, 'fiber_g', None),
            "sugar_g": getattr(log, 'sugar_g', None),
            "sodium_mg": getattr(log, 'sodium_mg', None),
            "notes": getattr(log, 'notes', None),
            "mood_before": getattr(log, 'mood_before', None),
            "mood_after": getattr(log, 'mood_after', None),
            "logged_at": getattr(log, 'meal_date', None).isoformat() if getattr(log, 'meal_date', None) else None,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    
    @staticmethod
    def format_pagination_response(page: int, size: int, total: int) -> Dict[str, Any]:
        """Format pagination information."""
        return {
            "page": page,
            "size": size,
            "total": total,
            "totalPages": (total + size - 1) // size
        }
    
    @staticmethod
    def format_stats_response(stats: Dict[str, Any]) -> Dict[str, Any]:
        """Format statistics response with proper rounding."""
        formatted_stats = {}
        for key, value in stats.items():
            if isinstance(value, float):
                formatted_stats[key] = round(value, 1)
            else:
                formatted_stats[key] = value
        return formatted_stats


class ErrorResponseFormatter:
    """Standardized error response formatting."""
    
    @staticmethod
    def format_error_response(
        message: str, 
        status_code: int = 500, 
        details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Format a standardized error response."""
        error_response = {
            "error": True,
            "message": message,
            "status_code": status_code,
            "timestamp": datetime.now().isoformat()
        }
        
        if details:
            error_response["details"] = details
        
        return error_response
    
    @staticmethod
    def format_validation_error(errors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Format validation error response."""
        return ErrorResponseFormatter.format_error_response(
            "Validation failed",
            422,
            {"validation_errors": errors}
        )
