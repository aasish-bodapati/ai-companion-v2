from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class OnboardingProfileBase(BaseModel):
    """Base onboarding profile schema."""
    # New onboarding flow fields
    user_prompt: Optional[str] = None  # Raw user input
    processed_summary: Optional[str] = None  # LLM-processed summary
    memory_chunks: Optional[List[str]] = None  # Structured memory chunks
    structured_data: Optional[Dict[str, Any]] = None  # Extracted structured data
    
    # Personal assistant focused fields (current schema based on migrations)
    daily_schedule: Optional[str] = None
    schedule_preferences: Optional[str] = None
    fitness_goals: Optional[str] = None
    nutrition_goals: Optional[str] = None
    dietary_preferences: Optional[str] = None
    communication_style: Optional[str] = None
    additional_preferences: Optional[str] = None
    completed: Optional[bool] = False


class OnboardingProfileCreate(OnboardingProfileBase):
    """Schema for creating an onboarding profile."""
    user_id: str


class OnboardingProfileUpdate(OnboardingProfileBase):
    """Schema for updating an onboarding profile."""
    pass


class OnboardingProfileIn(OnboardingProfileBase):
    """Schema for onboarding profile input (used by frontend)."""
    user_blueprint: Optional[str] = None  # Complete user narrative


class OnboardingProfile(OnboardingProfileBase):
    """Schema for onboarding profile response."""
    id: str
    user_id: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
