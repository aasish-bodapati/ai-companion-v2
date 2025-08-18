from __future__ import annotations
from sqlalchemy import Column, String, Text, DateTime, Integer, Float
from sqlalchemy.sql import func
from app.db.base_class import Base
import uuid


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="active", index=True)
    target_date = Column(String(10), nullable=True)  # ISO date string YYYY-MM-DD
    notes = Column(Text, nullable=True)
    metrics = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    summary_md = Column(Text, nullable=False)
    structured = Column(Text, nullable=True)  # JSON string of typed plan structure
    status = Column(String(20), nullable=False, default="active", index=True)  # active|archived
    source = Column(String(30), nullable=True)  # chat|upload|manual
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class NutritionPlan(Base):
    __tablename__ = "nutrition_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    summary_md = Column(Text, nullable=False)
    structured = Column(Text, nullable=True)  # JSON string of typed plan structure
    status = Column(String(20), nullable=False, default="active", index=True)  # active|archived
    source = Column(String(30), nullable=True)  # chat|upload|manual
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Routine(Base):
    __tablename__ = "routines"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    schedule = Column(Text, nullable=False)  # JSON string {days[], time, tz}
    goal_id = Column(String(36), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    when = Column(DateTime(timezone=True), nullable=False)
    type = Column(String(50), nullable=False)
    duration_min = Column(Integer, nullable=True)
    distance_km = Column(Float, nullable=True)
    intensity = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MealLog(Base):
    __tablename__ = "meal_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    when = Column(DateTime(timezone=True), nullable=False)
    items = Column(Text, nullable=False)  # JSON string list
    est_protein_g = Column(Integer, nullable=True)
    est_kcal = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class HydrationLog(Base):
    __tablename__ = "hydration_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    when = Column(DateTime(timezone=True), nullable=False)
    amount_ml = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    when = Column(DateTime(timezone=True), nullable=False)
    val = Column(Integer, nullable=False)
    scale = Column(Integer, nullable=False, default=5)
    tags = Column(Text, nullable=True)  # JSON string list
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    when = Column(DateTime(timezone=True), nullable=False)
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    tags = Column(Text, nullable=True)  # JSON string list
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
