"""
Exercise Database Models for comprehensive fitness tracking.
"""

from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON, Index, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid


class Exercise(Base):
    """Comprehensive exercise database with detailed metadata."""
    
    __tablename__ = "exercises"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic info
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # cardio, strength, flexibility, sports
    subcategory = Column(String(50), nullable=True)  # upper_body, lower_body, full_body, etc.
    
    # Physical attributes
    muscle_groups = Column(JSON, nullable=True)  # ["chest", "triceps", "shoulders"]
    equipment_needed = Column(JSON, nullable=True)  # ["dumbbells", "bench", "none"]
    difficulty_level = Column(String(20), nullable=False, default="beginner")  # beginner, intermediate, advanced
    
    # Metabolic data
    calories_per_minute = Column(Float, nullable=True)  # Average calories burned per minute
    met_value = Column(Float, nullable=True)  # Metabolic Equivalent of Task
    
    # Exercise details
    description = Column(Text, nullable=True)
    instructions = Column(JSON, nullable=True)  # Step-by-step instructions
    tips = Column(JSON, nullable=True)  # Form tips and safety notes
    variations = Column(JSON, nullable=True)  # Exercise variations
    
    # Tracking metadata
    is_popular = Column(Boolean, default=False, index=True)
    usage_count = Column(Integer, default=0)  # How many times it's been logged
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_exercises_category_difficulty', 'category', 'difficulty_level'),
        Index('ix_exercises_popular', 'is_popular', 'usage_count'),
        Index('ix_exercises_equipment', 'equipment_needed'),  # JSON index for equipment search
    )
    
    def __repr__(self):
        return f"<Exercise(id={self.id}, name={self.name}, category={self.category})>"


class UserExerciseHistory(Base):
    """Track user's exercise history and preferences."""
    
    __tablename__ = "user_exercise_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(String(36), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Usage statistics
    times_performed = Column(Integer, default=1)
    last_performed = Column(DateTime(timezone=True), nullable=False)
    avg_duration_minutes = Column(Float, nullable=True)
    avg_calories_burned = Column(Float, nullable=True)
    
    # Personal records
    max_weight_kg = Column(Float, nullable=True)
    max_reps = Column(Integer, nullable=True)
    max_distance_km = Column(Float, nullable=True)
    best_time_seconds = Column(Float, nullable=True)
    
    # Preferences
    preferred_intensity = Column(String(20), nullable=True)  # low, medium, high
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="exercise_history")
    exercise = relationship("Exercise")
    
    # Unique constraint
    __table_args__ = (
        Index('ix_user_exercise_unique', 'user_id', 'exercise_id', unique=True),
        Index('ix_user_exercise_last_performed', 'user_id', 'last_performed'),
    )
    
    def __repr__(self):
        return f"<UserExerciseHistory(user_id={self.user_id}, exercise={self.exercise.name if self.exercise else 'Unknown'})>"


class ExerciseTemplate(Base):
    """Pre-built exercise templates and workout combinations."""
    
    __tablename__ = "exercise_templates"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Template info
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)  # quick_cardio, strength_circuit, etc.
    difficulty_level = Column(String(20), nullable=False, default="beginner")
    estimated_duration_minutes = Column(Integer, nullable=True)
    
    # Template data
    exercises = Column(JSON, nullable=False)  # Array of exercise configs
    # Example: [{"exercise_id": "uuid", "duration_minutes": 10, "sets": 3, "reps": 12, "weight_kg": null}]
    
    # Metadata
    is_popular = Column(Boolean, default=False, index=True)
    usage_count = Column(Integer, default=0)
    created_by_system = Column(Boolean, default=True)  # True for system templates, False for user-created
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<ExerciseTemplate(id={self.id}, name={self.name}, category={self.category})>"
