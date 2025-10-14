from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON, Integer, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid
from datetime import datetime

class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    completed = Column(Boolean(), nullable=True, default=False)

    # Health Data - All fields from frontend onboarding
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    height_cm = Column(Float, nullable=True)
    current_weight_kg = Column(Float, nullable=True)
    activity_level = Column(String(20), nullable=True)
    smm = Column(Float, nullable=True)  # Skeletal Muscle Mass
    body_fat_percentage = Column(Float, nullable=True)
    ffm = Column(Float, nullable=True)  # Fat-Free Mass
    workout_days_per_week = Column(Integer, nullable=True)

    # Goals and Preferences
    body_type_goal = Column(String(100), nullable=True)
    edited_body_type_goal = Column(Text, nullable=True)  # JSON string for custom goals
    goals = Column(Text, nullable=True)  # JSON string for array of goals
    preferences = Column(Text, nullable=True)  # JSON string for user preferences

    # Additional Data
    timezone = Column(String(50), nullable=True, default='UTC')
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(), nullable=True, default=datetime.utcnow)
    updated_at = Column(DateTime(), nullable=True, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="onboarding_profile")

    def __repr__(self):
        return f"<OnboardingProfile(id={self.id}, user_id={self.user_id}, completed={self.completed})>"
