from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base, BaseModel

class Document(Base, BaseModel):
    """
    Represents an uploaded document with its metadata and processing status.
    """
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)  # Original filename
    file_path = Column(String, nullable=False)  # Path in storage bucket
    file_type = Column(String, nullable=False)  # MIME type
    file_size = Column(Integer, nullable=False)  # Size in bytes
    title = Column(String, nullable=True)  # User-defined title
    description = Column(Text, nullable=True)  # User-defined description
    metadata_ = Column("metadata", JSON, default={})  # Additional metadata
    
    # Processing status
    is_processed = Column(Boolean, default=False, nullable=False)
    processing_error = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    chunks = relationship(
        "DocumentChunk", 
        back_populates="document", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    
    def __repr__(self):
        return f"<Document {self.file_name} (User: {self.user_id})>"
    
    def to_dict(self):
        """Convert the document to a dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "file_name": self.file_name,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "title": self.title,
            "description": self.description,
            "metadata": self.metadata_,
            "is_processed": self.is_processed,
            "processing_error": self.processing_error,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# Add relationship to User model
from .user import User
User.documents = relationship(
    "Document", 
    back_populates="user", 
    cascade="all, delete-orphan",
    passive_deletes=True
)

# Import DocumentChunk after Document to avoid circular imports
from .document_chunk import DocumentChunk
