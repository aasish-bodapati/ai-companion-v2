from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

class ActivityType(str, Enum):
    RUNNING = "running"
    WALKING = "walking"
    CYCLING = "cycling"
    WEIGHTLIFTING = "weightlifting"
    YOGA = "yoga"
    PILATES = "pilates"
    SWIMMING = "swimming"
    DANCING = "dancing"
    HIKING = "hiking"
    CARDIO = "cardio"
    STRENGTH_TRAINING = "strength_training"
    FLEXIBILITY = "flexibility"
    SPORTS = "sports"
    OTHER = "other"

class IntensityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"

class MoodLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    NEUTRAL = "neutral"
    HIGH = "high"
    VERY_HIGH = "very_high"

# Base schemas
class FitnessLogBase(BaseModel):
    activity_type: ActivityType
    activity_name: Optional[str] = None
    duration_minutes: int = Field(..., gt=0, le=1440)  # Max 24 hours
    intensity: Optional[IntensityLevel] = None
    calories_burned: Optional[int] = Field(None, ge=0)
    distance_km: Optional[float] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    reps: Optional[int] = Field(None, ge=0)
    sets: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    activity_date: Optional[datetime] = None

class FitnessLogCreate(FitnessLogBase):
    timezone_offset: Optional[int] = Field(None, description="Timezone offset in minutes from UTC")

class FitnessLogUpdate(BaseModel):
    activity_type: Optional[ActivityType] = None
    activity_name: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0, le=1440)
    intensity: Optional[IntensityLevel] = None
    calories_burned: Optional[int] = Field(None, ge=0)
    distance_km: Optional[float] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    reps: Optional[int] = Field(None, ge=0)
    sets: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    activity_date: Optional[datetime] = None

class FitnessLog(FitnessLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Nutrition schemas
class FoodItem(BaseModel):
    name: str
    quantity: str
    calories: int = Field(..., ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fat_g: Optional[float] = Field(None, ge=0)
    fiber_g: Optional[float] = Field(None, ge=0)
    sugar_g: Optional[float] = Field(None, ge=0)
    sodium_mg: Optional[float] = Field(None, ge=0)

class NutritionLogBase(BaseModel):
    meal_type: MealType
    meal_name: Optional[str] = None
    total_calories: int = Field(..., ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fat_g: Optional[float] = Field(None, ge=0)
    fiber_g: Optional[float] = Field(None, ge=0)
    sugar_g: Optional[float] = Field(None, ge=0)
    sodium_mg: Optional[float] = Field(None, ge=0)
    food_items: Optional[List[FoodItem]] = None
    notes: Optional[str] = None
    mood_before: Optional[str] = None
    mood_after: Optional[str] = None
    meal_date: datetime

class NutritionLogCreate(NutritionLogBase):
    pass

class NutritionLogUpdate(BaseModel):
    meal_type: Optional[MealType] = None
    meal_name: Optional[str] = None
    total_calories: Optional[int] = Field(None, ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fat_g: Optional[float] = Field(None, ge=0)
    fiber_g: Optional[float] = Field(None, ge=0)
    sugar_g: Optional[float] = Field(None, ge=0)
    sodium_mg: Optional[float] = Field(None, ge=0)
    food_items: Optional[List[FoodItem]] = None
    notes: Optional[str] = None
    mood_before: Optional[str] = None
    mood_after: Optional[str] = None
    meal_date: Optional[datetime] = None

class NutritionLog(NutritionLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Mood schemas
class MoodLogBase(BaseModel):
    mood_rating: int = Field(..., ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    water_intake_ml: Optional[int] = Field(None, ge=0)
    steps_count: Optional[int] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    activities: Optional[List[str]] = None
    log_date: datetime

class MoodLogCreate(MoodLogBase):
    pass

class MoodLogUpdate(BaseModel):
    mood_rating: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    water_intake_ml: Optional[int] = Field(None, ge=0)
    steps_count: Optional[int] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    activities: Optional[List[str]] = None
    log_date: Optional[datetime] = None

class MoodLog(MoodLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Analytics schemas
class DailySummary(BaseModel):
    date: datetime
    total_calories_consumed: int
    total_calories_burned: int
    net_calories: int
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    total_water_ml: int
    total_steps: int
    average_mood: float
    average_energy: float
    sleep_hours: Optional[float]
    fitness_activities: int
    meals_logged: int

class WeeklySummary(BaseModel):
    week_start: datetime
    week_end: datetime
    total_workouts: int
    total_workout_minutes: int
    average_daily_calories: float
    average_daily_protein: float
    average_mood: float
    average_energy: float
    average_sleep_hours: float
    weight_change_kg: Optional[float]
    goals_achieved: int
    total_goals: int

class LoggingInsight(BaseModel):
    type: str  # "trend", "recommendation", "achievement", "warning"
    title: str
    description: str
    data: Optional[Dict[str, Any]] = None
    actionable: bool = False
    priority: str = "medium"  # "low", "medium", "high"
