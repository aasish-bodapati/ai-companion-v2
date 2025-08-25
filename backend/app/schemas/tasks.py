from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TaskBase(BaseModel):
    title: str
    status: Optional[str] = None  # pending, in_progress, completed
    priority: Optional[str] = None  # low, medium, high
    tags: Optional[str] = None
    due_at: Optional[datetime] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[str] = None
    due_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class Task(TaskBase):
    id: str
    user_id: str
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Pydantic v2 config
    model_config = ConfigDict(from_attributes=True)
