from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from sqlalchemy import text

from app.db.base_class import Base

class Message(Base):
    """Represents a single message in a conversation. Embedding stored as float[] for portability."""
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role = Column(String(20), nullable=False)  # 'user', 'assistant', or 'system'
    content = Column(Text, nullable=False)
    # Use float[] to avoid requiring pgvector extension in local dev
    embedding = Column(ARRAY(item_type=float), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    user = relationship("User", back_populates="messages")

    # No DB-side similarity index by default; can be added via migration when pgvector is available

    def __repr__(self):
        return f"<Message(id={self.id}, role='{self.role}', content_length={len(self.content)})>"
