"""
Specialized fitness logging endpoints with fitness-specific functionality.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.crud.health.fitness_log import CRUDFitnessLog
from app.schemas.health.fitness_log import FitnessLogCreate, FitnessLogUpdate
from app.api.common.logging_endpoints import HealthLoggingEndpoints
from app.services.common.statistics import HealthStatisticsCalculator
import json


class FitnessLoggingEndpoints(HealthLoggingEndpoints):
    """Specialized endpoints for fitness logging with fitness-specific functionality."""
    
    def __init__(self):
        super().__init__(
            crud=CRUDFitnessLog(),
            response_schema=None,  # We'll handle response formatting manually
            log_type_name="fitness"
        )
    
    def create_fitness_router(self) -> APIRouter:
        """Create a router with fitness-specific endpoints."""
        router = self.create_health_router()
        
        # GET /streak - Get workout streak information
        @router.get("/streak", response_model=Dict[str, Any])
        def get_workout_streak(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            """Get workout streak information."""
            try:
                logs = self.crud.get_user_logs(db, user_id=current_user.id)
                
                current_streak = self.crud.calculate_user_streak(db, current_user.id)
                longest_streak = self.crud.calculate_longest_streak(db, current_user.id)
                
                # Get last workout date
                last_workout_date = None
                if logs:
                    last_log = max(logs, key=lambda x: x.activity_date or x.created_at)
                    last_workout_date = (last_log.activity_date or last_log.created_at).isoformat()
                
                return {
                    "currentStreak": current_streak,
                    "longestStreak": longest_streak,
                    "lastWorkoutDate": last_workout_date
                }
                
            except Exception as e:
                raise HTTPException(status_code=500, detail="Failed to retrieve workout streak")
        
        return router
    
    def _calculate_stats(self, logs: List[Any]) -> Dict[str, Any]:
        """Calculate fitness-specific statistics."""
        if not logs:
            return {
                "totalWorkouts": 0,
                "totalDuration": 0,
                "totalCalories": 0,
                "averageDifficulty": 0,
                "currentStreak": 0
            }
        
        # Use the fitness statistics calculator
        stats = HealthStatisticsCalculator.calculate_fitness_stats(logs)
        
        return stats
    
    def _format_log_response(self, log: Any) -> Dict[str, Any]:
        """Format a fitness log for API response."""
        # Parse exercises JSON if it exists
        exercises = []
        if hasattr(log, 'exercises') and log.exercises:
            try:
                exercises = json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises
            except (json.JSONDecodeError, TypeError):
                exercises = []
        
        return {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "activity_type": log.activity_type,
            "activity_name": log.activity_name,
            "duration_minutes": log.duration_minutes,
            "calories_burned": log.calories_burned,
            "notes": log.notes,
            "exercises": exercises,
            "unit": getattr(log, 'unit', 'kg'),
            "activity_date": log.activity_date.isoformat() if log.activity_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "updated_at": log.updated_at.isoformat() if log.updated_at else None
        }


# Create the fitness endpoints instance
fitness_endpoints = FitnessLoggingEndpoints()
