"""
Simplified Routine Models - Only what we actually need
"""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean, JSON, Float
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base

class SimpleRoutine(Base):
    """Simplified workout routine templates"""
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    routine_type = Column(String(50), nullable=False)  # 'workout', 'nutrition'
    is_active = Column(Boolean, nullable=False, server_default=sa.text('false'))
    
    # JSON data for flexible routine structure
    workout_days = Column(JSON, nullable=True)  # Array of workout day objects
    exercises = Column(JSON, nullable=True)     # Array of exercise objects
    nutrition_plan = Column(JSON, nullable=True) # Nutrition routine data
    progress_data = Column(JSON, nullable=True)  # User progress tracking
    
    # Common fields
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # Store as JSON array instead of ARRAY

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    # Note: Other relationships removed as they don't exist in the current schema

    def __repr__(self):
        return f"<SimpleRoutine(id={self.id}, name='{self.name}', type='{self.routine_type}')>"

# class SimpleUserRoutineProgress(Base):
#     """Simplified user progress tracking for routines"""
#     __tablename__ = "simple_user_routine_progress"

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
#     routine_id = Column(Integer, ForeignKey("routines.id", ondelete="CASCADE"), nullable=False)
#     is_active = Column(Boolean, default=False, nullable=False)  # Currently following this routine
#     started_at = Column(DateTime(timezone=True), nullable=True)
#     completed_at = Column(DateTime(timezone=True), nullable=True)
#     workouts_completed = Column(Integer, default=0, nullable=False)
#     workouts_skipped = Column(Integer, default=0, nullable=False)
#     last_workout_date = Column(DateTime(timezone=True), nullable=True)

#     # Timestamps
#     created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
#     updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

#     # Relationships
#     user = relationship("User")
#     routine = relationship("SimpleRoutine", back_populates="user_progress")

#     def __repr__(self):
#         return f"<SimpleUserRoutineProgress(id={self.id}, user_id={self.user_id}, routine_id={self.routine_id}, active={self.is_active})>"

# class RoutineWorkoutDay(Base):
#     """Individual workout days within a routine"""
#     __tablename__ = "routine_workout_days"

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     routine_id = Column(Integer, ForeignKey("routines.id", ondelete="CASCADE"), nullable=False)
#     day_name = Column(String(20), nullable=False)  # Monday, Tuesday, etc.
#     day_order = Column(Integer, nullable=False)  # 1-7 for Monday-Sunday
#     workout_name = Column(String(100), nullable=False)  # Push, Pull, Legs, etc.
#     description = Column(Text, nullable=True)  # Optional description for the day

#     # Timestamps
#     created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
#     updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

#     # Relationships
#     routine = relationship("SimpleRoutine", back_populates="workout_days")
#     exercises = relationship("RoutineExercise", back_populates="workout_day", cascade="all, delete-orphan")

#     def __repr__(self):
#         return f"<RoutineWorkoutDay(id={self.id}, routine_id={self.routine_id}, day='{self.day_name}', workout='{self.workout_name}')>"

# class RoutineExercise(Base):
#     """Individual exercises within a workout day"""
#     __tablename__ = "routine_exercises"

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     workout_day_id = Column(Integer, ForeignKey("routine_workout_days.id", ondelete="CASCADE"), nullable=False)
#     exercise_name = Column(String(200), nullable=False)  # Seated Machine Chest Press
#     logging_category = Column(String(50), nullable=True)  # weighted, bodyweight, cardio_duration, etc.
    
#     # Exercise category and basic info only - sets/reps/weight are for workout logging, not routine planning
#     duration = Column(Float, nullable=True)  # 30.5 (minutes)
#     distance = Column(Float, nullable=True)  # 5.0
#     distance_unit = Column(String(20), nullable=True)  # "miles", "km"
#     intensity = Column(String(50), nullable=True)  # "moderate", "high", "low"
#     heart_rate = Column(Integer, nullable=True)  # 150 (bpm)
#     difficulty = Column(String(50), nullable=True)  # "easy", "medium", "hard"
#     total_reps = Column(Integer, nullable=True)  # 50
#     time = Column(Float, nullable=True)  # 2.5 (minutes)
#     pace = Column(String(50), nullable=True)  # "8:30/mile"
    
#     # Required fields for routine exercises
#     sets = Column(Integer, nullable=False, default=0)  # Number of sets
#     reps = Column(String(50), nullable=True)  # "10-12", "8-10", "AMRAP"
#     weight = Column(Float, nullable=True)  # Weight used
#     weight_unit = Column(String(20), nullable=True)  # "lbs", "kg"
    
#     # Legacy fields for backward compatibility
#     weight_notes = Column(String(200), nullable=True)  # "moderate weight", "bodyweight", etc.
#     rest_time = Column(String(50), nullable=True)  # "60-90 seconds", "2 minutes"
#     notes = Column(Text, nullable=True)  # "controlled, within pain-free ROM"
#     order_index = Column(Integer, nullable=False, default=0)  # Order within the workout

#     # Timestamps
#     created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
#     updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

#     # Relationships
#     workout_day = relationship("RoutineWorkoutDay", back_populates="exercises")

#     def __repr__(self):
#         return f"<RoutineExercise(id={self.id}, exercise='{self.exercise_name}', sets={self.sets}, reps='{self.reps}')>"
