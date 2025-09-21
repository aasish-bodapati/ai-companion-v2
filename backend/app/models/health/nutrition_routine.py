from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class NutritionRoutine(Base):
    """Simplified nutrition routine with meal plans stored as JSON."""

    __tablename__ = "nutrition_routines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    # Routine metadata
    difficulty = Column(String(20), nullable=False, default="beginner")  # beginner, intermediate, advanced
    duration_weeks = Column(Integer, nullable=False, default=4)
    target_calories = Column(Integer, nullable=False, default=2000)

    # Simplified nutrition routine without complex meal plans

    # Routine type and ownership
    is_template = Column(Boolean, default=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    created_by_user = relationship("User", back_populates="nutrition_routines")
    user_progress = relationship("NutritionUserRoutineProgress", back_populates="routine", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<NutritionRoutine(id={self.id}, name='{self.name}', difficulty='{self.difficulty}')>"

class NutritionUserRoutineProgress(Base):
    """Simplified user progress tracking for nutrition routines."""

    __tablename__ = "nutrition_user_routine_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    routine_id = Column(Integer, ForeignKey("nutrition_routines.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Basic progress tracking
    is_active = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    days_completed = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    routine = relationship("NutritionRoutine", back_populates="user_progress")
    user = relationship("User", back_populates="nutrition_routine_progress")

    def __repr__(self):
        return f"<NutritionUserRoutineProgress(id={self.id}, routine_id={self.routine_id}, user_id={self.user_id}, active={self.is_active})>"
