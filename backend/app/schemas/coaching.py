from __future__ import annotations
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date


# ---- Goals ----
class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1)
    category: Literal["fitness", "nutrition", "mood", "journal", "other"] = "fitness"
    target_date: Optional[date] = None
    notes: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None


class Goal(BaseModel):
    id: str
    name: str
    category: str
    status: Literal["active", "paused", "completed", "archived"] = "active"
    target_date: Optional[date] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[Literal["active", "paused", "completed", "archived"]] = None
    notes: Optional[str] = None
    target_date: Optional[date] = None


# ---- Routines ----
class RoutineSchedule(BaseModel):
    days: List[Literal["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]]
    time: Optional[str] = Field(None, pattern=r"^([01]?\d|2[0-3]):[0-5]\d$")  # HH:MM 24h
    tz: Optional[str] = None


class RoutineCreate(BaseModel):
    name: str
    category: Literal["fitness", "nutrition", "mood", "journal", "other"] = "fitness"
    schedule: RoutineSchedule
    goal_id: Optional[str] = None
    notes: Optional[str] = None


class Routine(BaseModel):
    id: str
    name: str
    category: str
    schedule: RoutineSchedule
    goal_id: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    schedule: Optional[RoutineSchedule] = None
    notes: Optional[str] = None


# ---- Trackers ----
class WorkoutLogCreate(BaseModel):
    when: datetime
    type: str
    duration_min: Optional[int] = Field(None, ge=1, le=600)
    distance_km: Optional[float] = Field(None, ge=0, le=200.0)
    intensity: Optional[Literal["easy", "moderate", "hard"]] = None
    notes: Optional[str] = None


class MealLogCreate(BaseModel):
    when: datetime
    items: List[str]
    est_protein_g: Optional[int] = Field(None, ge=0, le=300)
    est_kcal: Optional[int] = Field(None, ge=0, le=4000)
    notes: Optional[str] = None


class HydrationLogCreate(BaseModel):
    when: datetime
    amount_ml: int = Field(..., ge=10, le=2000)


class MoodLogCreate(BaseModel):
    when: datetime
    val: int = Field(..., ge=1, le=5)
    scale: int = Field(5, ge=3, le=10)
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class JournalEntryCreate(BaseModel):
    when: datetime
    title: Optional[str] = None
    content: str
    tags: Optional[List[str]] = None


class CreatedId(BaseModel):
    id: str


# ---- Plans ----
class WorkoutPlanCreate(BaseModel):
    title: str
    summary_md: str
    structured: Optional[dict] = None
    source: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9_-]+$")


class WorkoutPlan(BaseModel):
    id: str
    title: str
    summary_md: str
    structured: Optional[dict] = None
    status: Literal["active", "archived"] = "active"
    source: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NutritionPlanCreate(BaseModel):
    title: str
    summary_md: str
    structured: Optional[dict] = None
    source: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9_-]+$")


class NutritionPlan(BaseModel):
    id: str
    title: str
    summary_md: str
    structured: Optional[dict] = None
    status: Literal["active", "archived"] = "active"
    source: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---- Reviews ----
class QuietHours(BaseModel):
    from_: str = Field(alias="from", pattern=r"^([01]?\d|2[0-3]):[0-5]\d$")
    to: str = Field(pattern=r"^([01]?\d|2[0-3]):[0-5]\d$")
    tz: Optional[str] = None


class DailyNudgeRequest(BaseModel):
    date: date
    quiet_hours: Optional[QuietHours] = None


class DailyNudgeResponse(BaseModel):
    suggestions: List[str]


class WeeklyReviewRequest(BaseModel):
    week_start: date
    domains: Optional[List[str]] = None


class WeeklyReviewResponse(BaseModel):
    summary: str
    adjustments: Optional[List[Dict[str, Any]]] = None
    insights: Optional[List[str]] = None


# ---- Actions (Tool Invocation) ----
class ActionExecuteRequest(BaseModel):
    action: str
    params: Dict[str, Any]
    conversation_id: Optional[str] = None
    client_action_id: Optional[str] = None


class ActionExecuteError(BaseModel):
    detail: str
    message: str
    errors: Optional[List[Dict[str, Any]]] = None


class ActionExecuteResponse(BaseModel):
    ok: bool
    action: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[ActionExecuteError] = None
