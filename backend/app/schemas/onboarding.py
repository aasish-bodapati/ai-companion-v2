"""
Onboarding schemas
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class OnboardingProfileBase(BaseModel):
    """Base onboarding profile schema"""
    user_prompt: Optional[str] = None
    processed_summary: Optional[str] = None
    memory_chunks: Optional[Dict[str, Any]] = None
    structured_data: Optional[Dict[str, Any]] = None
    
    # Note: age, gender, height_cm, current_weight_kg, activity_level, primary_goal removed
    # These fields are now in user_health_profile table
    
    # Legacy fields (keeping for compatibility)
    daily_schedule: Optional[str] = None
    schedule_preferences: Optional[str] = None
    fitness_goals: Optional[str] = None
    nutrition_goals: Optional[str] = None
    dietary_preferences: Optional[str] = None
    communication_style: Optional[str] = None
    additional_preferences: Optional[str] = None
    
    completed: Optional[bool] = False


class OnboardingProfileCreate(OnboardingProfileBase):
    """Schema for creating onboarding profile"""
    pass


class OnboardingProfileUpdate(OnboardingProfileBase):
    """Schema for updating onboarding profile"""
    pass


class OnboardingProfile(OnboardingProfileBase):
    """Schema for returning onboarding profile"""
    id: str
    user_id: str
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SimpleOnboardingData(BaseModel):
    """Schema for simplified onboarding data"""
    # Note: All fields removed - onboarding data is now stored in user_health_profile
    pass


class OnboardingResponse(BaseModel):
    """Response schema for onboarding completion"""
    message: str
    completed: bool = True