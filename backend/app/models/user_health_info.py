"""
User health information model for tracking health-related data.
"""

from sqlalchemy import Column, String, Text, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base


class UserHealthInfo(Base):
    """User health information model for tracking health data."""

    __tablename__ = "user_health_info"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
        nullable=False,
    )
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    activity_level = Column(String(20), nullable=True)  # sedentary, light, moderate, active, very_active
    medical_conditions = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    emergency_contact = Column(JSON, nullable=True)
    health_goals = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="health_info")

    def __repr__(self):
        return f"<UserHealthInfo(id={self.id}, user_id={self.user_id})>"
