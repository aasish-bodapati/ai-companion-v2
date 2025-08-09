from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, VECTOR
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base_class import Base

class Message(Base):
    """Represents a single message in a conversation with vector embedding."""
    __tablename__ = "messages"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        index=True
    )
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
    embedding = Column(VECTOR(1536), nullable=True)  # Vector embedding for semantic search
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

    # Index for faster similarity search
    __table_args__ = (
        Index('ix_messages_embedding', 'embedding', postgresql_using='ivfflat', 
              postgresql_with={'lists': 100}, 
              postgresql_ops={'embedding': 'vector_cosine_ops'}),
    )

    def __repr__(self):
        return f"<Message(id={self.id}, role='{self.role}', content_length={len(self.content)})>"
