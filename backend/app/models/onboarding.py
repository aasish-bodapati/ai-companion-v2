from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
import uuid

from app.db.base_class import Base

class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    # Step 1 – Basic Identity
    name = Column(String, nullable=True)
    nickname = Column(String, nullable=True)
    pronouns = Column(String, nullable=True)
    birthday = Column(String, nullable=True)  # ISO date string
    location = Column(String, nullable=True)

    # Step 2 – Interests & Passions
    topics_json = Column(Text, nullable=True)  # JSON array as string
    hobbies = Column(Text, nullable=True)
    favorites = Column(Text, nullable=True)

    # Step 3 – Communication Style
    response_style = Column(String, nullable=True)  # Concise|Detailed|Balanced
    tone_json = Column(Text, nullable=True)         # JSON array as string
    small_talk_level = Column(Integer, nullable=True)  # 0..2

    # Step 4 – Goals & Use Cases
    primary_reason = Column(String, nullable=True)
    personal_goals = Column(Text, nullable=True)
    checkins_enabled = Column(Boolean, default=False)

    # Step 5 – Boundaries & Sensitivities
    avoid_topics = Column(Text, nullable=True)
    memory_policy = Column(String, nullable=True)   # RememberAll|ImportantOnly|NoMemory
    recall_enabled = Column(Boolean, default=True)

    # Step 6 – Fun
    dream_trip = Column(String, nullable=True)
    random_fact = Column(Text, nullable=True)
    ai_persona = Column(Text, nullable=True)

    completed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="onboarding_profile")
