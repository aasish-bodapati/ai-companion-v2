from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
import json

from app.crud.common.user_logging import UserLoggingCRUD
from app.models.health.fitness_log import FitnessLog, NutritionLog, MoodLog
from app.schemas.health.fitness_log import (
    FitnessLogCreate, FitnessLogUpdate,
    NutritionLogCreate, NutritionLogUpdate,
    MoodLogCreate, MoodLogUpdate,
    DailySummary, WeeklySummary, LoggingInsight
)

class CRUDFitnessLog(UserLoggingCRUD[FitnessLog, FitnessLogCreate, FitnessLogUpdate]):
    """CRUD operations for FitnessLog using UserLoggingCRUD base class."""
    
    def __init__(self):
        super().__init__(FitnessLog, date_field="activity_date")
    
    def get_weekly_summary(self, db: Session, user_id: int, week_start: datetime) -> Dict[str, Any]:
        """Get weekly summary for fitness logs."""
        week_end = week_start + timedelta(days=7)

        logs = db.query(FitnessLog).filter(
            and_(
                FitnessLog.user_id == user_id,
                FitnessLog.activity_date >= week_start,
                FitnessLog.activity_date < week_end
            )
        ).all()

        total_workouts = len(logs)
        total_minutes = sum(log.duration_minutes for log in logs)
        total_calories = sum(log.calories_burned or 0 for log in logs)

        activity_types = {}
        for log in logs:
            activity_types[log.activity_type] = activity_types.get(log.activity_type, 0) + 1

        return {
            "total_workouts": total_workouts,
            "total_minutes": total_minutes,
            "total_calories_burned": total_calories,
            "activity_breakdown": activity_types,
            "average_workout_duration": total_minutes / total_workouts if total_workouts > 0 else 0
        }

class CRUDNutritionLog(UserLoggingCRUD[NutritionLog, NutritionLogCreate, NutritionLogUpdate]):
    """CRUD operations for NutritionLog using UserLoggingCRUD base class."""
    
    def __init__(self):
        super().__init__(NutritionLog, date_field="meal_date")
    
    def get_daily_summary(self, db: Session, user_id: int, date: datetime) -> Dict[str, Any]:
        """Get daily summary for nutrition logs."""
        logs = self.get_daily_logs(db, user_id, date)

        total_calories = sum(log.total_calories for log in logs)
        total_protein = sum(log.protein_g or 0 for log in logs)
        total_carbs = sum(log.carbs_g or 0 for log in logs)
        total_fat = sum(log.fat_g or 0 for log in logs)

        meal_breakdown = {}
        for log in logs:
            meal_breakdown[log.meal_type] = {
                "calories": log.total_calories,
                "protein": log.protein_g or 0,
                "carbs": log.carbs_g or 0,
                "fat": log.fat_g or 0
            }

        return {
            "total_calories": total_calories,
            "total_protein": total_protein,
            "total_carbs": total_carbs,
            "total_fat": total_fat,
            "meals_logged": len(logs),
            "meal_breakdown": meal_breakdown
        }

    def get_weekly_summary(self, db: Session, user_id: int, week_start: datetime) -> Dict[str, Any]:
        """Get weekly summary for nutrition logs."""
        week_end = week_start + timedelta(days=7)

        logs = db.query(NutritionLog).filter(
            and_(
                NutritionLog.user_id == user_id,
                NutritionLog.meal_date >= week_start,
                NutritionLog.meal_date < week_end
            )
        ).all()

        total_calories = sum(log.total_calories for log in logs)
        total_protein = sum(log.protein_g or 0 for log in logs)
        total_carbs = sum(log.carbs_g or 0 for log in logs)
        total_fat = sum(log.fat_g or 0 for log in logs)

        daily_averages = {
            "calories": total_calories / 7,
            "protein": total_protein / 7,
            "carbs": total_carbs / 7,
            "fat": total_fat / 7
        }

        return {
            "total_calories": total_calories,
            "total_protein": total_protein,
            "total_carbs": total_carbs,
            "total_fat": total_fat,
            "daily_averages": daily_averages,
            "meals_logged": len(logs)
        }

class CRUDMoodLog(UserLoggingCRUD[MoodLog, MoodLogCreate, MoodLogUpdate]):
    """CRUD operations for MoodLog using UserLoggingCRUD base class."""
    
    def __init__(self):
        super().__init__(MoodLog, date_field="log_date")
    
    def get_daily_log(self, db: Session, user_id: int, date: datetime) -> Optional[MoodLog]:
        """Get mood log for a specific day (only one per day)."""
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        return db.query(MoodLog).filter(
            and_(
                MoodLog.user_id == user_id,
                MoodLog.log_date >= start_of_day,
                MoodLog.log_date < end_of_day
            )
        ).first()

    def get_weekly_summary(self, db: Session, user_id: int, week_start: datetime) -> Dict[str, Any]:
        """Get weekly summary for mood logs."""
        week_end = week_start + timedelta(days=7)

        logs = db.query(MoodLog).filter(
            and_(
                MoodLog.user_id == user_id,
                MoodLog.log_date >= week_start,
                MoodLog.log_date < week_end
            )
        ).all()

        if not logs:
            return {
                "average_mood": 0,
                "average_energy": 0,
                "average_stress": 0,
                "average_sleep_quality": 0,
                "average_sleep_hours": 0,
                "total_water_ml": 0,
                "total_steps": 0,
                "logs_count": 0
            }

        return {
            "average_mood": sum(log.mood_rating for log in logs) / len(logs),
            "average_energy": sum(log.energy_level or 0 for log in logs) / len(logs),
            "average_stress": sum(log.stress_level or 0 for log in logs) / len(logs),
            "average_sleep_quality": sum(log.sleep_quality or 0 for log in logs) / len(logs),
            "average_sleep_hours": sum(log.sleep_hours or 0 for log in logs) / len(logs),
            "total_water_ml": sum(log.water_intake_ml or 0 for log in logs),
            "total_steps": sum(log.steps_count or 0 for log in logs),
            "logs_count": len(logs)
        }

# Create instances
fitness_log = CRUDFitnessLog()
nutrition_log = CRUDNutritionLog()
mood_log = CRUDMoodLog()
