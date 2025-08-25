from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
import uuid

from app.db.base_class import Base


class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Step 1 – Daily Schedule
    daily_schedule = Column(String, nullable=True)
    schedule_preferences = Column(Text, nullable=True)

    # Step 2 – Fitness & Nutrition Goals
    fitness_goals = Column(String, nullable=True)
    nutrition_goals = Column(String, nullable=True)
    dietary_preferences = Column(Text, nullable=True)

    # Step 3 – Communication Style
    communication_style = Column(String, nullable=True)
    additional_preferences = Column(Text, nullable=True)

    completed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="onboarding_profile")
