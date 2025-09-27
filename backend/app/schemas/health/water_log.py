from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class WaterLogBase(BaseModel):
    amount_ml: int = Field(..., gt=0, le=10000, description="Amount in milliliters")
    amount_oz: Optional[float] = Field(None, ge=0, description="Amount in ounces (calculated)")
    log_type: str = Field("manual", description="Type of log: manual, goal, reminder")
    notes: Optional[str] = None
    log_date: Optional[datetime] = None

class WaterLogCreate(WaterLogBase):
    pass

class WaterLogUpdate(BaseModel):
    amount_ml: Optional[int] = Field(None, gt=0, le=10000)
    amount_oz: Optional[float] = Field(None, ge=0)
    log_type: Optional[str] = None
    notes: Optional[str] = None
    log_date: Optional[datetime] = None

class WaterLog(WaterLogBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WaterLogStats(BaseModel):
    total_ml_today: int
    total_oz_today: float
    goal_ml: int
    goal_oz: float
    progress_percentage: float
    logs_today: int
    average_per_log: float

class WaterLogSummary(BaseModel):
    date: datetime
    total_ml: int
    total_oz: float
    logs_count: int
    goal_achieved: bool
