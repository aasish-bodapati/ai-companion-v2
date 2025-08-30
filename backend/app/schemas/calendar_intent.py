from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal, Optional


class IntentWindow(BaseModel):
    mode: Literal["next_week", "next_7_days", "date_range"]
    start_date: Optional[str] = None  # YYYY-MM-DD
    end_date: Optional[str] = None  # YYYY-MM-DD


class IntentRecurrence(BaseModel):
    type: Literal["none", "daily", "weekdays"] = "none"
    count: Optional[int] = None  # optional limit, e.g., 7


class CalendarIntent(BaseModel):
    action: Literal["create", "delete", "list"]
    title: Optional[str] = None
    time: Optional[str] = None  # HH:MM (24h)
    duration_minutes: Optional[int] = Field(default=None)
    timezone_hint: Optional[str] = None  # e.g., Asia/Kolkata
    window: Optional[IntentWindow] = None
    recurrence: Optional[IntentRecurrence] = None
    # Raw confidence if model provides it
    confidence: Optional[float] = None
