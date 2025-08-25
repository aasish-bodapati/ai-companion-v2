from sqlalchemy import Column, String, DateTime, ForeignKey, text
from datetime import datetime
import uuid

from app.db.base_class import Base


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String, nullable=False)
    body = Column(String, nullable=True)
    tags = Column(String, nullable=True)  # comma-separated tags for simplicity

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
