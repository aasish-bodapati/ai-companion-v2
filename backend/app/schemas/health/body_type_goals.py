"""
Body Type Goals Schemas
Pydantic schemas for body type goals API
"""

from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, field_validator
import json


class RangeValue(BaseModel):
    """Represents a range of values with min, max, and recommended values"""
    min: float
    max: float
    recommended: float
    unit: str

class BodyTypeGoalTargetAttributes(BaseModel):
    # Weight targets (ranges)
    target_weight: RangeValue
    weight_change: RangeValue  # kg per week
    
    # Nutrition targets (ranges)
    water_goal: RangeValue  # ml per day
    calorie_target: RangeValue  # calories per day
    protein_target: RangeValue  # g per kg body weight
    
    # Exercise targets (ranges)
    workout_frequency: RangeValue  # days per week
    cardio_minutes: RangeValue  # minutes per week
    strength_sessions: RangeValue  # strength training sessions per week
    
    # Body composition (ranges)
    waist_to_height_ratio: Optional[RangeValue] = None
    fat_free_mass_index: Optional[RangeValue] = None
    target_body_fat_range: Optional[RangeValue] = None
    
    # Lifestyle (ranges)
    sleep_duration: Optional[RangeValue] = None  # hours per night
    daily_steps: Optional[RangeValue] = None  # steps per day
    recovery_days: Optional[RangeValue] = None  # rest days per week


class BodyTypeGoalBase(BaseModel):
    name: str
    description: str
    category: str = "body_type"
    icon: str
    color: str
    target_bmi: float
    target_body_fat: Optional[float] = None
    target_attributes: Union[BodyTypeGoalTargetAttributes, str, Dict[str, Any]]
    created_by: Optional[int] = None
    is_active: bool = True
    sort_order: int = 0
    
    @field_validator('target_attributes', mode='before')
    @classmethod
    def parse_target_attributes(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON in target_attributes: {v}")
        return v


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
