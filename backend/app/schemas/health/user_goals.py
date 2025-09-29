"""
Pydantic schemas for user health goals and information
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
# UUID import removed - using integer IDs

# Health Goals Schemas
class UserHealthGoalsBase(BaseModel):
    # Weight and Body Composition Goals
    current_weight_kg: Optional[float] = Field(None, ge=0, le=500, description="Current weight in kilograms")
    target_weight_kg: Optional[float] = Field(None, ge=0, le=500, description="Target weight in kilograms")
    current_body_fat_percent: Optional[float] = Field(None, ge=0, le=100, description="Current body fat percentage")
    target_body_fat_percent: Optional[float] = Field(None, ge=0, le=100, description="Target body fat percentage")
    current_muscle_mass_kg: Optional[float] = Field(None, ge=0, le=200, description="Current muscle mass in kilograms")
    target_muscle_mass_kg: Optional[float] = Field(None, ge=0, le=200, description="Target muscle mass in kilograms")

    # Calorie and Macro Goals
    daily_calorie_target: Optional[int] = Field(None, ge=500, le=10000, description="Daily calorie target")
    daily_protein_target_g: Optional[float] = Field(None, ge=0, le=500, description="Daily protein target in grams")
    daily_carbs_target_g: Optional[float] = Field(None, ge=0, le=1000, description="Daily carbs target in grams")
    daily_fat_target_g: Optional[float] = Field(None, ge=0, le=500, description="Daily fat target in grams")
    daily_fiber_target_g: Optional[float] = Field(None, ge=0, le=100, description="Daily fiber target in grams")
    daily_water_target_ml: Optional[int] = Field(None, ge=0, le=10000, description="Daily water target in milliliters")

    # Fitness Goals
    weekly_workout_target: Optional[int] = Field(None, ge=0, le=14, description="Target workouts per week")
    daily_steps_target: Optional[int] = Field(None, ge=0, le=50000, description="Daily steps target")
    weekly_cardio_minutes: Optional[int] = Field(None, ge=0, le=2000, description="Weekly cardio minutes target")
    weekly_strength_sessions: Optional[int] = Field(None, ge=0, le=10, description="Weekly strength training sessions")

    # Sleep and Recovery Goals
    target_sleep_hours: Optional[float] = Field(None, ge=0, le=24, description="Target sleep hours per night")
    target_sleep_quality: Optional[int] = Field(None, ge=1, le=10, description="Target sleep quality (1-10 scale)")

    # Health Metrics Goals
    target_blood_pressure_systolic: Optional[int] = Field(None, ge=70, le=200, description="Target systolic blood pressure")
    target_blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=120, description="Target diastolic blood pressure")
    target_resting_heart_rate: Optional[int] = Field(None, ge=30, le=200, description="Target resting heart rate")

    # Lifestyle Goals
    stress_management_goal: Optional[str] = Field(None, max_length=100, description="Stress management goal")
    mood_tracking_goal: Optional[str] = Field(None, max_length=100, description="Mood tracking goal")
    habit_goals: Optional[str] = Field(None, description="JSON string of habit goals")

    # Goal Settings
    goal_priority: Optional[str] = Field(None, description="Primary goal: weight_loss, muscle_gain, maintenance, general_health")
    timeline_weeks: Optional[int] = Field(None, ge=1, le=104, description="Target timeline in weeks")
    is_active: bool = Field(True, description="Whether goals are currently active")

class UserHealthGoalsCreate(UserHealthGoalsBase):
    pass

class UserHealthGoalsUpdate(BaseModel):
    # Weight and Body Composition Goals
    current_weight_kg: Optional[float] = Field(None, ge=0, le=500)
    target_weight_kg: Optional[float] = Field(None, ge=0, le=500)
    current_body_fat_percent: Optional[float] = Field(None, ge=0, le=100)
    target_body_fat_percent: Optional[float] = Field(None, ge=0, le=100)
    current_muscle_mass_kg: Optional[float] = Field(None, ge=0, le=200)
    target_muscle_mass_kg: Optional[float] = Field(None, ge=0, le=200)

    # Calorie and Macro Goals
    daily_calorie_target: Optional[int] = Field(None, ge=500, le=10000)
    daily_protein_target_g: Optional[float] = Field(None, ge=0, le=500)
    daily_carbs_target_g: Optional[float] = Field(None, ge=0, le=1000)
    daily_fat_target_g: Optional[float] = Field(None, ge=0, le=500)
    daily_fiber_target_g: Optional[float] = Field(None, ge=0, le=100)
    daily_water_target_ml: Optional[int] = Field(None, ge=0, le=10000)

    # Fitness Goals
    weekly_workout_target: Optional[int] = Field(None, ge=0, le=14)
    daily_steps_target: Optional[int] = Field(None, ge=0, le=50000)
    weekly_cardio_minutes: Optional[int] = Field(None, ge=0, le=2000)
    weekly_strength_sessions: Optional[int] = Field(None, ge=0, le=10)

    # Sleep and Recovery Goals
    target_sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    target_sleep_quality: Optional[int] = Field(None, ge=1, le=10)

    # Health Metrics Goals
    target_blood_pressure_systolic: Optional[int] = Field(None, ge=70, le=200)
    target_blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=120)
    target_resting_heart_rate: Optional[int] = Field(None, ge=30, le=200)

    # Lifestyle Goals
    stress_management_goal: Optional[str] = Field(None, max_length=100)
    mood_tracking_goal: Optional[str] = Field(None, max_length=100)
    habit_goals: Optional[str] = None

    # Goal Settings
    goal_priority: Optional[str] = None
    timeline_weeks: Optional[int] = Field(None, ge=1, le=104)
    is_active: Optional[bool] = None

class UserHealthGoals(UserHealthGoalsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Health Information Schemas
class UserHealthProfileBase(BaseModel):
    # Basic Measurements
    height_cm: Optional[float] = Field(None, ge=50, le=300, description="Height in centimeters")
    age: Optional[int] = Field(None, ge=13, le=120, description="Age in years")
    gender: Optional[str] = Field(None, description="Gender: male, female, other")
    activity_level: Optional[str] = Field(None, description="Activity level: sedentary, lightly_active, moderately_active, very_active, extremely_active")

    # Current Health Metrics
    current_weight_kg: Optional[float] = Field(None, ge=0, le=500, description="Current weight in kilograms")
    current_body_fat_percent: Optional[float] = Field(None, ge=0, le=100, description="Current body fat percentage")
    current_muscle_mass_kg: Optional[float] = Field(None, ge=0, le=200, description="Current muscle mass in kilograms")
    current_waist_circumference_cm: Optional[float] = Field(None, ge=0, le=200, description="Current waist circumference in centimeters")
    current_hip_circumference_cm: Optional[float] = Field(None, ge=0, le=200, description="Current hip circumference in centimeters")

    # Health Conditions
    has_diabetes: bool = Field(False, description="Has diabetes")
    has_hypertension: bool = Field(False, description="Has hypertension")
    has_heart_condition: bool = Field(False, description="Has heart condition")
    other_conditions: Optional[str] = Field(None, description="Other health conditions")

    # Dietary Preferences
    dietary_restrictions: Optional[str] = Field(None, description="JSON string of dietary restrictions")
    food_allergies: Optional[str] = Field(None, description="JSON string of food allergies")
    preferred_cuisine: Optional[str] = Field(None, max_length=50, description="Preferred cuisine type")

    # Fitness Preferences
    preferred_workout_times: Optional[str] = Field(None, description="Preferred workout times: morning, afternoon, evening")
    preferred_workout_types: Optional[str] = Field(None, description="JSON string of preferred workout types")
    gym_access: bool = Field(False, description="Has gym access")
    home_equipment: Optional[str] = Field(None, description="JSON string of available home equipment")

    # Lifestyle Information
    work_schedule: Optional[str] = Field(None, description="Work schedule: 9to5, shift_work, flexible, etc.")
    sleep_schedule: Optional[str] = Field(None, description="Sleep schedule: early_bird, night_owl, irregular")
    stress_level: Optional[int] = Field(None, ge=1, le=10, description="Current stress level (1-10 scale)")
    motivation_level: Optional[int] = Field(None, ge=1, le=10, description="Current motivation level (1-10 scale)")

class UserHealthProfileCreate(UserHealthProfileBase):
    pass

class UserHealthProfileUpdate(BaseModel):
    # Basic Measurements
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    age: Optional[int] = Field(None, ge=13, le=120)
    gender: Optional[str] = None
    activity_level: Optional[str] = None

    # Current Health Metrics
    current_weight_kg: Optional[float] = Field(None, ge=0, le=500)
    current_body_fat_percent: Optional[float] = Field(None, ge=0, le=100)
    current_muscle_mass_kg: Optional[float] = Field(None, ge=0, le=200)
    current_waist_circumference_cm: Optional[float] = Field(None, ge=0, le=200)
    current_hip_circumference_cm: Optional[float] = Field(None, ge=0, le=200)

    # Health Conditions
    has_diabetes: Optional[bool] = None
    has_hypertension: Optional[bool] = None
    has_heart_condition: Optional[bool] = None
    other_conditions: Optional[str] = None

    # Dietary Preferences
    dietary_restrictions: Optional[str] = None
    food_allergies: Optional[str] = None
    preferred_cuisine: Optional[str] = Field(None, max_length=50)

    # Fitness Preferences
    preferred_workout_times: Optional[str] = None
    preferred_workout_types: Optional[str] = None
    gym_access: Optional[bool] = None
    home_equipment: Optional[str] = None

    # Lifestyle Information
    work_schedule: Optional[str] = None
    sleep_schedule: Optional[str] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    motivation_level: Optional[int] = Field(None, ge=1, le=10)

class UserHealthProfile(UserHealthProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Combined onboarding schema
class OnboardingData(BaseModel):
    """Complete onboarding data including health info and goals"""
    health_info: UserHealthProfileCreate
    health_goals: UserHealthGoalsCreate

class OnboardingResponse(BaseModel):
    """Response after successful onboarding"""
    health_info: UserHealthProfile
    health_goals: UserHealthGoals
    message: str = "Onboarding completed successfully"
