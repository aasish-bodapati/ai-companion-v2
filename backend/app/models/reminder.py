from sqlalchemy import Column, String, DateTime, ForeignKey
from datetime import datetime
import uuid

from app.db.base_class import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    content = Column(String, nullable=False)
    trigger_at = Column(DateTime(timezone=True), nullable=True)
    channel = Column(String, nullable=True)  # e.g., app, email, sms

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
