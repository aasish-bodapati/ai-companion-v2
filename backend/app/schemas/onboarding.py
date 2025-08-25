from pydantic import BaseModel, ConfigDict
from typing import Optional


class OnboardingProfileBase(BaseModel):
    # Step 1 – Daily Schedule
    daily_schedule: Optional[str] = None
    schedule_preferences: Optional[str] = None

    # Step 2 – Fitness & Nutrition Goals
    fitness_goals: Optional[str] = None
    nutrition_goals: Optional[str] = None
    dietary_preferences: Optional[str] = None

    # Step 3 – Communication Style
    communication_style: Optional[str] = None
    additional_preferences: Optional[str] = None


class OnboardingProfileCreate(OnboardingProfileBase):
    pass


class OnboardingProfileUpdate(OnboardingProfileBase):
    pass


class OnboardingProfileInDB(OnboardingProfileBase):
    id: str
    user_id: str
    completed: bool
    
    # Pydantic v2 configuration
    model_config = ConfigDict(from_attributes=True)


class OnboardingProfile(OnboardingProfileBase):
    id: str
    user_id: str
    completed: bool
