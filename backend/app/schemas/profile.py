"""
Profile schemas for user profile data
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class HealthProfile(BaseModel):
    age: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None

class UserProfile(BaseModel):
    user_id: int
    email: str
    full_name: Optional[str] = None
    timezone: Optional[str] = None
    health_data: Optional[HealthProfile] = None
    goals: List[str] = []
    preferences: Dict[str, Any] = {}
    onboarding_completed: bool = False
