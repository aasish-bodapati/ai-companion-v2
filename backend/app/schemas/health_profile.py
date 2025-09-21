"""
Health Profile schemas
"""

from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class HealthProfileBase(BaseModel):
    """Base health profile schema"""
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    activity_level: Optional[str] = None

class HealthProfileCreate(HealthProfileBase):
    """Schema for creating health profile"""
    pass

class HealthProfileUpdate(HealthProfileBase):
    """Schema for updating health profile"""
    pass

class HealthProfile(HealthProfileBase):
    """Schema for returning health profile"""
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HealthProfileResponse(BaseModel):
    """Response schema for health profile operations"""
    message: str
    profile: Optional[HealthProfile] = None
