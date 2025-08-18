from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CalendarEventBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    all_day: Optional[bool] = None


class CalendarEvent(CalendarEventBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CalendarEventBulkItem(BaseModel):
    title: str
    start: datetime
    end: Optional[datetime] = None
    description: Optional[str] = None
    all_day: bool = False


class CalendarEventBulkCreate(BaseModel):
    events: list[CalendarEventBulkItem]


# --- Intent-based NL parsing and normalization (for Companion/Calendar unification) ---
class CalendarIntentRequest(BaseModel):
    text: str = Field(..., min_length=1)
    default_duration_minutes: int = Field(30, ge=5, le=24 * 60)
    persist: bool = False
    description: Optional[str] = None
    timezone_hint: Optional[str] = None  # reserved; parsing currently uses server local tz


class CalendarIntentNormalized(BaseModel):
    title: str
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False
    description: Optional[str] = None


class CalendarIntentResponse(BaseModel):
    items: List[CalendarIntentNormalized]
    persisted_event_ids: Optional[List[str]] = None
