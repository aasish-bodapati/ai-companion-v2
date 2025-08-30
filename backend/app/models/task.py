from sqlalchemy import Column, String, DateTime, ForeignKey
from datetime import datetime
import uuid

from app.db.base_class import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, in_progress, completed
    priority = Column(String, nullable=True)  # low, medium, high
    tags = Column(String, nullable=True)

    due_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
