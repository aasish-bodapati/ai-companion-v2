"""
Body Type Goals Schemas
Pydantic schemas for body type goals API
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel


class BodyTypeGoalTargetAttributes(BaseModel):
    target_weight: float
    weight_change: float
    water_goal: int  # ml per day
    calorie_target: int
    protein_target: float  # g per kg body weight
    workout_frequency: int  # days per week
    cardio_minutes: int  # minutes per week
    timeline: int  # weeks to reach goal
    waist_to_height_ratio: Optional[float] = None  # Waist-to-height ratio
    fat_free_mass_index: Optional[float] = None  # Fat-Free Mass Index
    sleep_duration: Optional[float] = None  # hours per night
    daily_steps: Optional[int] = None  # steps per day
    recovery_days: Optional[int] = None  # rest days per week


class BodyTypeGoalBase(BaseModel):
    name: str
    description: str
    category: str = "body_type"
    icon: str
    color: str
    target_bmi: float
    target_body_fat: Optional[float] = None
    target_attributes: BodyTypeGoalTargetAttributes
    created_by: Optional[int] = None
    is_active: bool = True
    sort_order: int = 0


class BodyTypeGoalCreate(BodyTypeGoalBase):
    pass


class BodyTypeGoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    target_bmi: Optional[float] = None
    target_body_fat: Optional[float] = None
    target_attributes: Optional[BodyTypeGoalTargetAttributes] = None
    created_by: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class BodyTypeGoal(BodyTypeGoalBase):
    id: str

    class Config:
        from_attributes = True


class BodyTypeGoalList(BaseModel):
    body_type_goals: list[BodyTypeGoal]
    total: int
