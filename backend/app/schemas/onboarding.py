"""
Onboarding schemas
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class OnboardingProfileBase(BaseModel):
    """Base onboarding profile schema"""
    completed: Optional[bool] = False
    
    # Health Data - All fields from frontend onboarding
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    smm: Optional[float] = None  # Skeletal Muscle Mass
    body_fat_percentage: Optional[float] = None
    ffm: Optional[float] = None  # Fat-Free Mass
    workout_days_per_week: Optional[int] = None

    # Goals and Preferences
    body_type_goal: Optional[str] = None
    edited_body_type_goal: Optional[str] = None  # JSON string for custom goals
    goals: Optional[str] = None  # JSON string for array of goals
    preferences: Optional[str] = None  # JSON string for user preferences

    # Additional Data
    timezone: Optional[str] = 'UTC'
    notes: Optional[str] = None

class OnboardingProfileCreate(OnboardingProfileBase):
    """Schema for creating onboarding profile"""
    pass

class OnboardingProfileUpdate(OnboardingProfileBase):
    """Schema for updating onboarding profile"""
    pass

class OnboardingProfile(OnboardingProfileBase):
    """Schema for returning onboarding profile"""
    id: int
    user_id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SimpleOnboardingData(BaseModel):
    """Schema for simplified onboarding data"""
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    smm: Optional[float] = None  # Skeletal Muscle Mass
    body_fat_percentage: Optional[float] = None  # Body Fat Percentage
    ffm: Optional[float] = None  # Fat-Free Mass
    workout_days: Optional[int] = None  # Number of workout days per week
    bodyTypeGoal: Optional[str] = None
    editedBodyTypeGoal: Optional[Dict[str, Any]] = None  # Edited goal details
    timezone: Optional[str] = None  # User's timezone

class OnboardingResponse(BaseModel):
    """Response schema for onboarding completion"""
    message: str
    completed: bool = True
