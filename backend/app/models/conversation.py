from sqlalchemy import Column, String, DateTime, ForeignKey, text
from sqlalchemy import Boolean
from sqlalchemy.dialects.sqlite import BLOB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base_class import Base


# SQLite UUID type


class GUID(BLOB):
    """Platform-independent GUID type for SQLite MVP."""

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(BLOB())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(value) if value else None
        if value is not None:
            return value.bytes
        return None

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif isinstance(value, uuid.UUID):
            return value
        elif isinstance(value, bytes):
            return uuid.UUID(bytes=value)
        else:
            return uuid.UUID(value)


class Conversation(Base):
    """Represents a conversation between a user and the AI."""

    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    personalization_enabled = Column(
        Boolean,
        nullable=False,
        server_default=text("true"),
        default=True,
    )

    # Relationships
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )
    user = relationship("User", back_populates="conversations")

    def __repr__(self):
        return f"<Conversation(id={self.id}, title='{self.title}')>"


class Message(Base):
    """Represents a single message in a conversation."""

    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    conversation_id = Column(
        String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, role='{self.role}', content='{self.content[:30]}...')>"
