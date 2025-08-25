from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base
import uuid


class MemoryAudit(Base):
    """Audit trail for memory edits and deletions.

    Stores before/after snapshots with minimal necessary fields.
    """

    __tablename__ = "memory_audit"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    faiss_id = Column(String(36), index=True, nullable=False)
    action = Column(String(32), nullable=False)  # update|soft_delete|hard_delete
    source = Column(String(64), nullable=True)  # chat|api|system, etc.
    conversation_id = Column(String(36), nullable=True)
    message_id = Column(String(36), nullable=True)

    before_content = Column(Text, nullable=True)
    after_content = Column(Text, nullable=True)
    before_metadata = Column(Text, nullable=True)
    after_metadata = Column(Text, nullable=True)

    # Extended request metadata (nullable for backward compatibility)
    request_ip = Column(String(64), nullable=True)
    user_agent = Column(String(256), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
