"""
Simplified Routine Models - Only what we actually need
"""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base


class SimpleRoutine(Base):
    """Simplified workout routine templates"""
    __tablename__ = "simple_routines"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=False)  # beginner, intermediate, advanced
    duration_weeks = Column(Integer, nullable=False, default=4)
    tags = Column(JSON, nullable=True)  # Array of tag strings
    is_template = Column(Boolean, default=True, nullable=False)  # True for system templates, False for user-created
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Note: workout_schedule and total_workouts_per_week removed - 
    # workout details are now in routine_workout_days table
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    user_progress = relationship("SimpleUserRoutineProgress", back_populates="routine", cascade="all, delete-orphan")
    workout_days = relationship("RoutineWorkoutDay", back_populates="routine", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SimpleRoutine(id={self.id}, name='{self.name}', difficulty='{self.difficulty}')>"


class SimpleUserRoutineProgress(Base):
    """Simplified user progress tracking for routines"""
    __tablename__ = "simple_user_routine_progress"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    routine_id = Column(String(36), ForeignKey("simple_routines.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)  # Currently following this routine
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    workouts_completed = Column(Integer, default=0, nullable=False)
    last_workout_date = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")
    routine = relationship("SimpleRoutine", back_populates="user_progress")

    def __repr__(self):
        return f"<SimpleUserRoutineProgress(id={self.id}, user_id={self.user_id}, routine_id={self.routine_id}, active={self.is_active})>"


class RoutineWorkoutDay(Base):
    """Individual workout days within a routine"""
    __tablename__ = "routine_workout_days"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    routine_id = Column(String(36), ForeignKey("simple_routines.id", ondelete="CASCADE"), nullable=False)
    day_name = Column(String(20), nullable=False)  # Monday, Tuesday, etc.
    day_order = Column(Integer, nullable=False)  # 1-7 for Monday-Sunday
    workout_name = Column(String(100), nullable=False)  # Push, Pull, Legs, etc.
    description = Column(Text, nullable=True)  # Optional description for the day
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    routine = relationship("SimpleRoutine", back_populates="workout_days")
    exercises = relationship("RoutineExercise", back_populates="workout_day", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<RoutineWorkoutDay(id={self.id}, routine_id={self.routine_id}, day='{self.day_name}', workout='{self.workout_name}')>"


class RoutineExercise(Base):
    """Individual exercises within a workout day"""
    __tablename__ = "routine_exercises"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workout_day_id = Column(String(36), ForeignKey("routine_workout_days.id", ondelete="CASCADE"), nullable=False)
    exercise_name = Column(String(200), nullable=False)  # Seated Machine Chest Press
    sets = Column(Integer, nullable=False)  # 4
    reps = Column(String(50), nullable=True)  # "8-12" or "12-15"
    weight_notes = Column(String(200), nullable=True)  # "moderate weight", "bodyweight", etc.
    rest_time = Column(String(50), nullable=True)  # "60-90 seconds", "2 minutes"
    notes = Column(Text, nullable=True)  # "controlled, within pain-free ROM"
    order_index = Column(Integer, nullable=False, default=0)  # Order within the workout
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    workout_day = relationship("RoutineWorkoutDay", back_populates="exercises")

    def __repr__(self):
        return f"<RoutineExercise(id={self.id}, exercise='{self.exercise_name}', sets={self.sets}, reps='{self.reps}')>"
