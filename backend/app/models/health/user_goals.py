"""
User Health Goals and Targets Model
"""

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base

# Deprecated model removed - using simplified UserGoal model instead

class UserHealthProfile(Base):
    """User's current health information and measurements"""
    __tablename__ = "user_health_profile"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Basic Measurements
    height_cm = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)  # male, female, other
    activity_level = Column(String(20), nullable=True)  # sedentary, lightly_active, moderately_active, very_active, extremely_active

    # Current Health Metrics (simplified)
    current_weight_kg = Column(Float, nullable=True)
    
    # Additional Health Metrics
    smm_kg = Column(Float, nullable=True)  # Skeletal Muscle Mass in kg
    body_fat_percentage = Column(Float, nullable=True)  # Body Fat Percentage
    workout_days_per_week = Column(Integer, nullable=True)  # Number of workout days per week

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="health_info")
