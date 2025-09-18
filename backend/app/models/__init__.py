"""
Database models - Organized by functionality
"""

from app.db.base_class import Base
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.models.onboarding import OnboardingProfile
from app.models.health import (
    FitnessLog, NutritionLog, MoodLog, UserHealthProfile, 
    SimpleRoutine, SimpleUserRoutineProgress,
    WorkoutCategory, UserWeightLog
)
from app.models.health.exercise_database import Exercise, UserExerciseHistory, ExerciseTemplate
from app.models.health.food_database import Food, UserFoodHistory, MealTemplate, FoodAlternative

# This will make all models available for SQLAlchemy to discover
__all__ = [
    "Base",
    "User",
    "Conversation",
    "Message",
    "OnboardingProfile",
    "FitnessLog",
    "NutritionLog",
    "MoodLog",
    "UserHealthProfile",
    "SimpleRoutine",
    "SimpleUserRoutineProgress",
    "WorkoutCategory",
    "UserWeightLog",
    "Exercise",
    "UserExerciseHistory",
    "ExerciseTemplate",
    "Food",
    "UserFoodHistory", 
    "MealTemplate",
    "FoodAlternative",
]