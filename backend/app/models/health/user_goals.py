"""
User Health Goals and Targets Model
"""

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base


# OLD MODEL - DEPRECATED - Use UserHealthGoalsNew instead
# class UserHealthGoals(Base):
#     """User's health and fitness goals and targets"""
#     __tablename__ = "user_health_goals"
#     
#     id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
#     user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
#     
#     # Weight and Body Composition Goals
#     current_weight_kg = Column(Float, nullable=True)
#     target_weight_kg = Column(Float, nullable=True)
#     current_body_fat_percent = Column(Float, nullable=True)
#     target_body_fat_percent = Column(Float, nullable=True)
#     current_muscle_mass_kg = Column(Float, nullable=True)
#     target_muscle_mass_kg = Column(Float, nullable=True)
#     
#     # Calorie and Macro Goals
#     daily_calorie_target = Column(Integer, nullable=True)
#     daily_protein_target_g = Column(Float, nullable=True)
#     daily_carbs_target_g = Column(Float, nullable=True)
#     daily_fat_target_g = Column(Float, nullable=True)
#     daily_fiber_target_g = Column(Float, nullable=True)
#     daily_water_target_ml = Column(Integer, nullable=True)
#     
#     # Fitness Goals
#     weekly_workout_target = Column(Integer, nullable=True)  # number of workouts per week
#     daily_steps_target = Column(Integer, nullable=True)
#     weekly_cardio_minutes = Column(Integer, nullable=True)
#     weekly_strength_sessions = Column(Integer, nullable=True)
#     
#     # Sleep and Recovery Goals
#     target_sleep_hours = Column(Float, nullable=True)
#     target_sleep_quality = Column(Integer, nullable=True)  # 1-10 scale
#     
#     # Health Metrics Goals
#     target_blood_pressure_systolic = Column(Integer, nullable=True)
#     target_blood_pressure_diastolic = Column(Integer, nullable=True)
#     target_resting_heart_rate = Column(Integer, nullable=True)
#     
#     # Lifestyle Goals
#     stress_management_goal = Column(String(100), nullable=True)
#     mood_tracking_goal = Column(String(100), nullable=True)
#     habit_goals = Column(Text, nullable=True)  # JSON string of habit goals
#     
#     # Goal Settings
#     goal_priority = Column(String(20), nullable=True)  # weight_loss, muscle_gain, maintenance, general_health
#     timeline_weeks = Column(Integer, nullable=True)  # target timeline in weeks
#     is_active = Column(Boolean, default=True, nullable=False)
#     
#     # Timestamps
#     created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
#     updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
#     
#     # Relationships
#     user = relationship("User", back_populates="health_goals")


class UserHealthProfile(Base):
    """User's current health information and measurements"""
    __tablename__ = "user_health_profile"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Basic Measurements
    height_cm = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)  # male, female, other
    activity_level = Column(String(20), nullable=True)  # sedentary, lightly_active, moderately_active, very_active, extremely_active
    
    # Current Health Metrics (simplified)
    current_weight_kg = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="health_info")
