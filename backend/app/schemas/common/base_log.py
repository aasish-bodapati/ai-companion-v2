"""
Common base schema fields for health logging.
Eliminates duplication of common fields across health log schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BaseHealthLog(BaseModel):
    """Base schema for all health log types with common fields."""
    
    notes: Optional[str] = Field(None, description="Additional notes for the log entry")
    log_date: Optional[datetime] = Field(None, description="Date and time of the log entry")
    
    class Config:
        from_attributes = True


class BaseHealthLogWithTimestamps(BaseHealthLog):
    """Base schema for health logs with timestamp fields."""
    
    created_at: datetime = Field(..., description="When the log was created")
    updated_at: datetime = Field(..., description="When the log was last updated")
    
    class Config:
        from_attributes = True


class BaseHealthLogCreate(BaseHealthLog):
    """Base schema for creating health log entries."""
    pass


class BaseHealthLogUpdate(BaseModel):
    """Base schema for updating health log entries."""
    
    notes: Optional[str] = Field(None, description="Additional notes for the log entry")
    log_date: Optional[datetime] = Field(None, description="Date and time of the log entry")
    
    class Config:
        from_attributes = True


class BaseHealthLogResponse(BaseHealthLogWithTimestamps):
    """Base schema for health log API responses."""
    
    id: int = Field(..., description="Unique identifier for the log entry")
    user_id: int = Field(..., description="ID of the user who created the log")
    
    class Config:
        from_attributes = True


class BaseHealthLogStats(BaseModel):
    """Base schema for health log statistics."""
    
    total_count: int = Field(0, description="Total number of log entries")
    current_streak: int = Field(0, description="Current streak in days")
    longest_streak: int = Field(0, description="Longest streak in days")
    
    class Config:
        from_attributes = True


class BaseHealthLogSummary(BaseModel):
    """Base schema for health log summaries."""
    
    date: datetime = Field(..., description="Date of the summary")
    total_entries: int = Field(0, description="Total number of entries for this date")
    
    class Config:
        from_attributes = True
