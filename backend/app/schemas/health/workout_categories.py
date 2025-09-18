from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WorkoutCategoryBase(BaseModel):
    """Base schema for workout categories."""
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(None, description="Category description")
    is_active: bool = Field(True, description="Whether the category is active")


class WorkoutCategoryCreate(WorkoutCategoryBase):
    """Schema for creating workout categories."""
    pass


class WorkoutCategoryUpdate(BaseModel):
    """Schema for updating workout categories."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class WorkoutCategory(WorkoutCategoryBase):
    """Schema for workout category responses."""
    id: str = Field(..., description="Category ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True
