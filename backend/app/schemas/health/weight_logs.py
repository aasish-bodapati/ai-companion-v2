from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserWeightLogBase(BaseModel):
    """Base schema for user weight logs - simplified to core tracking only."""
    weight_kg: float = Field(..., gt=0, le=500, description="Weight in kilograms")
    notes: Optional[str] = Field(None, description="Additional notes")
    log_date: datetime = Field(..., description="Date and time of the measurement")

class UserWeightLogCreate(UserWeightLogBase):
    """Schema for creating weight logs."""
    pass

class UserWeightLogUpdate(BaseModel):
    """Schema for updating weight logs - simplified to core tracking only."""
    weight_kg: Optional[float] = Field(None, gt=0, le=500)
    notes: Optional[str] = None
    log_date: Optional[datetime] = None

class UserWeightLog(UserWeightLogBase):
    """Schema for weight log responses."""
    id: str = Field(..., description="Log ID")
    user_id: str = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
