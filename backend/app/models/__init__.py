"""
Database models - Organized by functionality
"""

from app.db.base_class import Base
from app.models.user import User
from app.models.onboarding import OnboardingProfile
from app.models.health import (
    FitnessLog, NutritionLog, MoodLog, UserHealthProfile,
    SimpleRoutine, SimpleUserRoutineProgress,
    WorkoutCategory, UserWeightLog
)
from app.models.health.water_log import WaterLog
from app.models.health.exercise_database import Exercise, UserExerciseHistory
from app.models.health.food_database import Food, UserFoodHistory
from app.models.health.food_log_items import FoodLogItem
from app.models.health.user_goal import UserGoal

# This will make all models available for SQLAlchemy to discover
__all__ = [
    "Base",
    "User",
    "OnboardingProfile",
    "FitnessLog",
    "NutritionLog",
    "MoodLog",
    "UserHealthProfile",
    "SimpleRoutine",
    "SimpleUserRoutineProgress",
    "WorkoutCategory",
    "UserWeightLog",
    "WaterLog",
    "Exercise",
    "UserExerciseHistory",
    "Food",
    "UserFoodHistory",
    "FoodLogItem",
    "UserGoal",
]
