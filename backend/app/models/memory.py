from sqlalchemy import Column, String, Text, DateTime, Integer, Float
from sqlalchemy.sql import func
from app.db.base_class import Base
import uuid


class MemoryNode(Base):
    """Memory node for storing text content and metadata for FAISS retrieval."""
    
    __tablename__ = "memory_nodes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    faiss_id = Column(String(36), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)
    content_type = Column(String(50), nullable=False)  # "message", "onboarding", "fact", etc.
    user_id = Column(String(36), nullable=False, index=True)
    conversation_id = Column(String(36), nullable=True, index=True)  # null for onboarding/facts
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    relevance_score = Column(Float, default=1.0)  # for future weighted retrieval
    memory_metadata = Column(Text, nullable=True)  # JSON string for additional context
    
    def __repr__(self):
        return f"<MemoryNode(id={self.id}, type={self.content_type}, user_id={self.user_id})>"
