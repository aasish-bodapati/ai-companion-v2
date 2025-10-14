from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.common.health_enums import (
    ActivityType, IntensityLevel, MealType, MoodLevel
)

# Base schemas
class FitnessLogBase(BaseModel):
    activity_type: Union[ActivityType, str] = Field(..., description="Type of activity", min_length=1, max_length=50)
    activity_name: Optional[str] = Field(None, max_length=100)
    duration_minutes: int = Field(..., gt=0, le=1440, description="Duration in minutes (max 24 hours)")
    calories_burned: Optional[int] = Field(None, ge=0, le=10000, description="Calories burned (max 10,000)")
    notes: Optional[str] = Field(None, max_length=500)
    activity_date: Optional[datetime] = None
    exercises: Optional[Union[str, list]] = Field(None, description="JSON string or list containing exercise data")
    unit: Optional[str] = Field(None, max_length=20, description="Unit for weight measurements")
    
    def __init__(self, **data):
        # Convert string activity_type to enum if needed
        if 'activity_type' in data and isinstance(data['activity_type'], str):
            try:
                data['activity_type'] = ActivityType(data['activity_type'])
            except ValueError:
                # If not a valid enum value, use OTHER
                data['activity_type'] = ActivityType.OTHER
        super().__init__(**data)

class FitnessLogCreate(FitnessLogBase):
    timezone_offset: Optional[int] = Field(None, description="Timezone offset in minutes from UTC")

class FitnessLogUpdate(BaseModel):
    activity_type: Optional[Union[ActivityType, str]] = Field(None, min_length=1, max_length=50)
    activity_name: Optional[str] = Field(None, max_length=100)
    duration_minutes: Optional[int] = Field(None, gt=0, le=1440)
    calories_burned: Optional[int] = Field(None, ge=0, le=10000)
    notes: Optional[str] = Field(None, max_length=500)
    activity_date: Optional[datetime] = None
    exercises: Optional[Union[str, list]] = Field(None, description="JSON string or list containing exercise data")
    unit: Optional[str] = Field(None, max_length=20, description="Unit for weight measurements")
    
    def __init__(self, **data):
        # Convert string activity_type to enum if needed
        if 'activity_type' in data and isinstance(data['activity_type'], str):
            try:
                data['activity_type'] = ActivityType(data['activity_type'])
            except ValueError:
                # If not a valid enum value, use OTHER
                data['activity_type'] = ActivityType.OTHER
        super().__init__(**data)

class FitnessLog(FitnessLogBase):
    id: int
    user_id: int
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
    total_calories: float = Field(..., ge=0)
    notes: Optional[str] = None
    meal_date: Optional[datetime] = None
    food_items: Optional[Union[list, str]] = None

class NutritionLogCreate(NutritionLogBase):
    pass

class NutritionLogUpdate(BaseModel):
    meal_type: Optional[MealType] = None
    meal_name: Optional[str] = None
    total_calories: Optional[float] = Field(None, ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fat_g: Optional[float] = Field(None, ge=0)
    fiber_g: Optional[float] = Field(None, ge=0)
    sugar_g: Optional[float] = Field(None, ge=0)
    sodium_mg: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    meal_date: Optional[datetime] = None
    food_items: Optional[Union[list, str]] = None

class NutritionLog(NutritionLogBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Mood schemas
class MoodLogBase(BaseModel):
    mood_rating: int = Field(..., ge=1, le=10)
    mood_label: Optional[str] = Field(None, max_length=50)
    mood_emoji: Optional[str] = Field(None, max_length=10)
    notes: Optional[str] = None
    log_date: datetime

class MoodLogCreate(MoodLogBase):
    pass

class MoodLogUpdate(BaseModel):
    mood_rating: Optional[int] = Field(None, ge=1, le=10)
    mood_label: Optional[str] = Field(None, max_length=50)
    mood_emoji: Optional[str] = Field(None, max_length=10)
    notes: Optional[str] = None
    log_date: Optional[datetime] = None

class MoodLog(MoodLogBase):
    id: int
    user_id: int
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

# Response schemas - defined after all base classes
class FitnessLogResponse(FitnessLog):
    """Response schema for fitness log endpoints"""
    pass

class NutritionLogResponse(NutritionLog):
    """Response schema for nutrition log endpoints"""
    pass

class MoodLogResponse(MoodLog):
    """Response schema for mood log endpoints"""
    pass
