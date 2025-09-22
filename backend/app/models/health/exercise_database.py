"""
Exercise Database models for storing exercise information and user history.
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Exercise(Base):
    """Exercise database model for storing exercise information."""

    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    logging_category = Column(String(50), nullable=True)  # This matches the database schema
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    # Relationships - commented out to avoid circular import issues
    # user_history = relationship("UserExerciseHistory", back_populates="exercise")

    def __repr__(self):
        return f"<Exercise(id={self.id}, name={self.name}, category={self.category})>"


class UserExerciseHistory(Base):
    """User exercise history for tracking personal exercise performance."""

    __tablename__ = "user_exercise_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(String, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Performance tracking
    times_performed = Column(Integer, default=1, nullable=False)
    last_performed = Column(DateTime(timezone=True), nullable=False)
    avg_duration_minutes = Column(Float, nullable=True)
    avg_calories_burned = Column(Float, nullable=True)
    personal_best_duration = Column(Float, nullable=True)
    personal_best_calories = Column(Float, nullable=True)
    
    # User preferences
    is_favorite = Column(Boolean, default=False, nullable=False)
    difficulty_rating = Column(Integer, nullable=True)  # 1-5 scale
    enjoyment_rating = Column(Integer, nullable=True)  # 1-5 scale
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships - commented out to avoid circular import issues
    # user = relationship("User", back_populates="exercise_history")
    # exercise = relationship("Exercise", back_populates="user_history")

    def __repr__(self):
        return f"<UserExerciseHistory(user_id={self.user_id}, exercise_id={self.exercise_id}, times={self.times_performed})>"
