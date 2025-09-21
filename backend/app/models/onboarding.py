from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON, Integer, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid
from datetime import datetime

class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Note: age, gender, height_cm, current_weight_kg, activity_level, primary_goal removed
    # These fields are now in user_health_profile table

    # Simplified fields for fitness and nutrition logging

    # Common fields
    completed = Column(Boolean(), nullable=True)
    updated_at = Column(DateTime(), nullable=True, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="onboarding_profile")

    def __repr__(self):
        return f"<OnboardingProfile(id={self.id}, user_id={self.user_id})>"
