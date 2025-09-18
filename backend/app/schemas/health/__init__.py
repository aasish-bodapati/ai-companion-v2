"""
Health schemas - All health-related Pydantic schemas
"""

from .fitness_log import (
    FitnessLog, FitnessLogCreate, FitnessLogUpdate,
    NutritionLog, NutritionLogCreate, NutritionLogUpdate,
    MoodLog, MoodLogCreate, MoodLogUpdate,
    DailySummary, WeeklySummary, LoggingInsight
)
from .simple_routine import (
    SimpleRoutine, SimpleRoutineCreate, SimpleRoutineUpdate,
    SimpleUserRoutineProgress, SimpleUserRoutineProgressCreate, SimpleUserRoutineProgressUpdate,
    SimpleRoutineWithProgress, SimpleRoutineListResponse
)
from .workout_categories import (
    WorkoutCategory, WorkoutCategoryCreate, WorkoutCategoryUpdate
)
from .weight_logs import (
    UserWeightLog, UserWeightLogCreate, UserWeightLogUpdate
)

__all__ = [
    # Fitness logging
    "FitnessLog",
    "FitnessLogCreate", 
    "FitnessLogUpdate",
    "NutritionLog",
    "NutritionLogCreate",
    "NutritionLogUpdate", 
    "MoodLog",
    "MoodLogCreate",
    "MoodLogUpdate",
    "DailySummary",
    "WeeklySummary",
    "LoggingInsight",
    # Simplified Routines
    "SimpleRoutine",
    "SimpleRoutineCreate",
    "SimpleRoutineUpdate",
    "SimpleUserRoutineProgress",
    "SimpleUserRoutineProgressCreate",
    "SimpleUserRoutineProgressUpdate",
    "SimpleRoutineWithProgress",
    "SimpleRoutineListResponse",
    # Workout categories
    "WorkoutCategory",
    "WorkoutCategoryCreate",
    "WorkoutCategoryUpdate",
    # Weight logs
    "UserWeightLog",
    "UserWeightLogCreate",
    "UserWeightLogUpdate",
]
