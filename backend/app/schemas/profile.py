"""
Profile schemas for user profile data
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from .health.body_type_goals import BodyTypeGoal

class HealthProfile(BaseModel):
    age: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None
    smm: Optional[str] = None  # Skeletal Muscle Mass
    body_fat_percentage: Optional[str] = None  # Body Fat Percentage
    ffm: Optional[str] = None  # Fat-Free Mass
    workout_days_per_week: Optional[str] = None  # Workout days per week

class UserProfile(BaseModel):
    user_id: int
    email: str
    full_name: Optional[str] = None
    timezone: Optional[str] = None
    health_data: Optional[HealthProfile] = None
    goals: List[str] = []  # User's health goals
    bodyTypeGoal: Optional[str] = None
    bodyTypeGoals: Optional[List[BodyTypeGoal]] = None  # User's body type goals
    preferences: Dict[str, Any] = {}
    onboarding_completed: bool = False
