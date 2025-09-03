"""
User goal model for tracking user objectives and progress.
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base


class UserGoal(Base):
    """User goal model for tracking objectives and progress."""

    __tablename__ = "user_goals"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
        nullable=False,
    )
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # e.g., "fitness", "health", "career"
    status = Column(String(20), default="active")  # active, completed, paused, cancelled
    priority = Column(String(10), default="medium")  # low, medium, high
    target_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="goals")

    def __repr__(self):
        return f"<UserGoal(id={self.id}, title='{self.title}', user_id={self.user_id})>"
