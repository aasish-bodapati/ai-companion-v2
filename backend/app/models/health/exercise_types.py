"""
Exercise Type Models - Flexible polymorphic system for different exercise types
"""

from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid
import enum

class ExerciseTypeEnum(str, enum.Enum):
    """Exercise type categories"""
    STRENGTH = "strength"
    CARDIO = "cardio"
    FLEXIBILITY = "flexibility"
    SPORTS = "sports"
    FUNCTIONAL = "functional"

class EquipmentTypeEnum(str, enum.Enum):
    """Equipment types for strength exercises"""
    BARBELL = "barbell"
    DUMBBELL = "dumbbell"
    MACHINE = "machine"
    CABLE = "cable"
    BODYWEIGHT = "bodyweight"
    KETTLEBELL = "kettlebell"
    RESISTANCE_BAND = "resistance_band"
    NONE = "none"

class ExerciseType(Base):
    """Exercise type definitions with flexible attributes"""

    __tablename__ = "exercise_types"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Basic info
    name = Column(String(100), nullable=False, unique=True)  # "Shoulder Press", "Running", "Yoga"
    category = Column(Enum(ExerciseTypeEnum), nullable=False, index=True)
    subcategory = Column(String(50), nullable=True)  # "upper_body", "cardio", "flexibility"

    # Equipment requirements
    equipment_type = Column(Enum(EquipmentTypeEnum), nullable=True)
    equipment_required = Column(JSON, nullable=True)  # ["barbell", "bench", "plates"]

    # Muscle groups and movement patterns
    primary_muscles = Column(JSON, nullable=True)  # ["deltoids", "triceps"]
    secondary_muscles = Column(JSON, nullable=True)  # ["core", "trapezius"]
    movement_pattern = Column(String(50), nullable=True)  # "push", "pull", "squat", "hinge"

    # Exercise-specific attributes schema
    attributes_schema = Column(JSON, nullable=False)  # Defines what attributes this exercise type needs

    # Metadata
    description = Column(Text, nullable=True)
    instructions = Column(JSON, nullable=True)  # Step-by-step instructions
    tips = Column(JSON, nullable=True)  # Form tips and safety notes
    difficulty_level = Column(String(20), nullable=False, default="beginner")

    # Tracking
    is_active = Column(Boolean, default=True, nullable=False)
    usage_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    routine_exercises = relationship("RoutineExerciseV2", back_populates="exercise_type")
    workout_logs = relationship("WorkoutLogV2", back_populates="exercise_type")

    def __repr__(self):
        return f"<ExerciseType(id={self.id}, name='{self.name}', category='{self.category}')>"

class RoutineExerciseV2(Base):
    """Enhanced routine exercises with flexible attributes"""

    __tablename__ = "routine_exercises_v2"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    workout_day_id = Column(Integer, ForeignKey("routine_workout_days.id", ondelete="CASCADE"), nullable=False)
    exercise_type_id = Column(Integer, ForeignKey("exercise_types.id", ondelete="CASCADE"), nullable=False)

    # Flexible attributes stored as JSON
    attributes = Column(JSON, nullable=False)  # All exercise-specific data

    # Common attributes (for quick access)
    order_index = Column(Integer, nullable=False, default=0)
    rest_time_seconds = Column(Integer, nullable=True)  # Rest between sets
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    workout_day = relationship("RoutineWorkoutDay", back_populates="exercises_v2")
    exercise_type = relationship("ExerciseType", back_populates="routine_exercises")

    def __repr__(self):
        return f"<RoutineExerciseV2(id={self.id}, exercise_type_id={self.exercise_type_id})>"

class WorkoutLogV2(Base):
    """Enhanced workout logs with flexible attributes"""

    __tablename__ = "workout_logs_v2"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_type_id = Column(Integer, ForeignKey("exercise_types.id", ondelete="CASCADE"), nullable=False)

    # Flexible attributes stored as JSON
    attributes = Column(JSON, nullable=False)  # All exercise-specific data

    # Common attributes
    workout_date = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    calories_burned = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    # Context
    routine_id = Column(Integer, ForeignKey("simple_routines.id", ondelete="SET NULL"), nullable=True)
    workout_day_id = Column(Integer, ForeignKey("routine_workout_days.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="workout_logs_v2")
    exercise_type = relationship("ExerciseType", back_populates="workout_logs")
    routine = relationship("SimpleRoutine")
    workout_day = relationship("RoutineWorkoutDay")

    def __repr__(self):
        return f"<WorkoutLogV2(id={self.id}, exercise_type_id={self.exercise_type_id}, date={self.workout_date})>"
