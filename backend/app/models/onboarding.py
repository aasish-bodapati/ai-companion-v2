from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON, Integer, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid
from datetime import datetime


class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Note: age, gender, height_cm, current_weight_kg, activity_level, primary_goal removed
    # These fields are now in user_health_profile table
    
    # Legacy fields (keeping for compatibility)
    user_prompt = Column(Text(), nullable=True)  # Raw user input
    processed_summary = Column(Text(), nullable=True)  # LLM-processed summary
    memory_chunks = Column(JSON, nullable=True)  # Structured memory chunks
    structured_data = Column(JSON, nullable=True)  # Extracted structured data
    daily_schedule = Column(String(), nullable=True)
    schedule_preferences = Column(Text(), nullable=True)
    fitness_goals = Column(String(), nullable=True)
    nutrition_goals = Column(String(), nullable=True)
    dietary_preferences = Column(Text(), nullable=True)
    communication_style = Column(String(), nullable=True)
    additional_preferences = Column(Text(), nullable=True)
    
    # Common fields
    completed = Column(Boolean(), nullable=True)
    updated_at = Column(DateTime(), nullable=True, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="onboarding_profile")

    def __repr__(self):
        return f"<OnboardingProfile(id={self.id}, user_id={self.user_id})>"
