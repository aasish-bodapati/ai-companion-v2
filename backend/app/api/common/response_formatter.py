"""
Generic response formatter for health logging endpoints.
Eliminates duplication of response formatting logic across API endpoints.
"""

from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import json


class HealthLogResponseFormatter:
    """Centralized response formatting for health logging endpoints."""
    
    @staticmethod
    def format_fitness_log_response(log: Any) -> Dict[str, Any]:
        """
        Format a fitness log for API response.
        
        Args:
            log: FitnessLog model instance
            
        Returns:
            Formatted dictionary for API response
        """
        # Parse exercises from JSON string
        exercises = []
        if log.exercises:
            try:
                exercises = json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises
            except (json.JSONDecodeError, TypeError):
                exercises = []
        
        return {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "routine_id": None,  # Not available in current structure
            "routine_name": None,  # Not available in current structure
            "workout_name": log.activity_name,  # Use activity_name as workout_name
            "activity_type": log.activity_type,
            "exercises": exercises,  # Include exercises data
            "unit": getattr(log, 'unit', 'kg'),  # Include unit field
            "duration_minutes": int(log.duration_minutes) if log.duration_minutes else 0,
            "calories_burned": int(log.calories_burned) if log.calories_burned else 0,
            "difficulty_rating": 0,  # Not tracked in current structure
            "notes": log.notes,
            "logged_at": log.activity_date.isoformat() if log.activity_date else None,
            "activity_date": log.activity_date.isoformat() if log.activity_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "updated_at": log.updated_at.isoformat() if log.updated_at else None
        }
    
    @staticmethod
    def format_nutrition_log_response(log: Any) -> Dict[str, Any]:
        """
        Format a nutrition log for API response.
        
        Args:
            log: NutritionLog model instance
            
        Returns:
            Formatted dictionary for API response
        """
        # Parse food_items from JSON string
        food_items = []
        if log.food_items:
            try:
                food_items = json.loads(log.food_items) if isinstance(log.food_items, str) else log.food_items
            except (json.JSONDecodeError, TypeError):
                food_items = []
        
        return {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "meal_type": log.meal_type,
            "meal_name": log.meal_name,
            "total_calories": log.total_calories,
            "protein_g": log.protein_g,
            "carbs_g": log.carbs_g,
            "fat_g": log.fat_g,
            "fiber_g": getattr(log, 'fiber_g', None),
            "sugar_g": getattr(log, 'sugar_g', None),
            "sodium_mg": getattr(log, 'sodium_mg', None),
            "food_items": food_items,
            "notes": log.notes,
            "meal_date": log.meal_date.isoformat() if log.meal_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "updated_at": log.updated_at.isoformat() if log.updated_at else None
        }
    
    @staticmethod
    def format_water_log_response(log: Any) -> Dict[str, Any]:
        """
        Format a water log for API response.
        
        Args:
            log: WaterLog model instance
            
        Returns:
            Formatted dictionary for API response
        """
        return {
            "id": log.id,
            "user_id": log.user_id,
            "amount_ml": log.amount_ml,
            "amount_oz": log.amount_oz,
            "log_type": log.log_type,
            "notes": log.notes,
            "log_date": log.log_date.isoformat() if log.log_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "updated_at": log.updated_at.isoformat() if log.updated_at else None
        }
    
    @staticmethod
    def format_mood_log_response(log: Any) -> Dict[str, Any]:
        """
        Format a mood log for API response.
        
        Args:
            log: MoodLog model instance
            
        Returns:
            Formatted dictionary for API response
        """
        return {
            "id": log.id,
            "user_id": log.user_id,
            "mood_rating": log.mood_rating,
            "mood_label": log.mood_label,
            "mood_emoji": log.mood_emoji,
            "notes": log.notes,
            "log_date": log.log_date.isoformat() if log.log_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "updated_at": log.updated_at.isoformat() if log.updated_at else None
        }
    
    @staticmethod
    def format_logs_response(logs: List[Any], log_type: str, stats: Optional[Dict] = None, 
                           pagination: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Format a list of logs with optional stats and pagination.
        
        Args:
            logs: List of log model instances
            log_type: Type of logs ('fitness', 'nutrition', 'water', 'mood')
            stats: Optional statistics dictionary
            pagination: Optional pagination dictionary
            
        Returns:
            Formatted response dictionary
        """
        # Format logs based on type
        if log_type == "fitness":
            formatted_logs = [HealthLogResponseFormatter.format_fitness_log_response(log) for log in logs]
        elif log_type == "nutrition":
            formatted_logs = [HealthLogResponseFormatter.format_nutrition_log_response(log) for log in logs]
        elif log_type == "water":
            formatted_logs = [HealthLogResponseFormatter.format_water_log_response(log) for log in logs]
        elif log_type == "mood":
            formatted_logs = [HealthLogResponseFormatter.format_mood_log_response(log) for log in logs]
        else:
            formatted_logs = []
        
        response = {
            "logs": formatted_logs
        }
        
        if stats:
            response["stats"] = stats
        
        if pagination:
            response["pagination"] = pagination
        
        return response
    
    @staticmethod
    def format_error_response(message: str, status_code: int = 500, details: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Format an error response.
        
        Args:
            message: Error message
            status_code: HTTP status code
            details: Optional additional details
            
        Returns:
            Formatted error response dictionary
        """
        response = {
            "error": message,
            "status_code": status_code
        }
        
        if details:
            response["details"] = details
        
        return response
    
    @staticmethod
    def format_success_response(message: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Format a success response.
        
        Args:
            message: Success message
            data: Optional data to include
            
        Returns:
            Formatted success response dictionary
        """
        response = {
            "message": message,
            "success": True
        }
        
        if data:
            response.update(data)
        
        return response
