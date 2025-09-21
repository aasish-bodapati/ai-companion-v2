"""
Exercise Database Models for comprehensive fitness tracking.
"""

from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON, Index, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.health.exercise_logging_categories import ExerciseLoggingCategoryEnum
import uuid

class Exercise(Base):
    """Exercise database with logging attribute-based categorization."""

    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Basic info
    name = Column(String(200), nullable=False, index=True)
    logging_category = Column(Enum(ExerciseLoggingCategoryEnum), nullable=False, index=True)  # New attribute-based category
    difficulty_level = Column(String(20), nullable=False, default="beginner")  # beginner, intermediate, advanced

    # Essential data
    calories_per_minute = Column(Float, nullable=True)  # Average calories burned per minute
    description = Column(Text, nullable=True)
    
    # Muscle group classification (renamed from category)
    muscle_group = Column(String(50), nullable=True, index=True)  # abs, back, arms, shoulders, chest, legs, cardio, calves
    
    # Additional fields can be added here as needed

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    logging_category_ref = relationship("ExerciseLoggingCategory", foreign_keys=[logging_category], primaryjoin="Exercise.logging_category == ExerciseLoggingCategory.category")

    # Indexes
    __table_args__ = (
        Index('ix_exercises_logging_category', 'logging_category'),
        Index('ix_exercises_difficulty', 'difficulty_level'),
        Index('ix_exercises_muscle_group', 'muscle_group'),
    )

    def __repr__(self):
        return f"<Exercise(id={self.id}, name={self.name}, logging_category={self.logging_category})>"

class UserExerciseHistory(Base):
    """Simple user exercise history tracking."""

    __tablename__ = "user_exercise_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)

    # Basic usage tracking
    times_performed = Column(Integer, default=1)
    last_performed = Column(DateTime(timezone=True), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="exercise_history")
    exercise = relationship("Exercise")

    # Unique constraint
    __table_args__ = (
        Index('ix_user_exercise_unique', 'user_id', 'exercise_id', unique=True),
    )

    def __repr__(self):
        return f"<UserExerciseHistory(user_id={self.user_id}, exercise={self.exercise.name if self.exercise else 'Unknown'})>"

# Removed overly complex exercise template table
# This can be implemented later if needed with simpler structures
