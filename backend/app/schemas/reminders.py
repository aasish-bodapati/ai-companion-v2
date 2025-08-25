from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ReminderBase(BaseModel):
    content: str
    trigger_at: Optional[datetime] = None
    channel: Optional[str] = None  # app, email, sms


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    content: Optional[str] = None
    trigger_at: Optional[datetime] = None
    channel: Optional[str] = None


class Reminder(ReminderBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    # Pydantic v2 config
    model_config = ConfigDict(from_attributes=True)
