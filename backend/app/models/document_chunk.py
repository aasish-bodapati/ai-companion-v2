from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from .base import Base, BaseModel

class DocumentChunk(Base, BaseModel):
    """
    Represents a chunk of text from a document along with its embedding vector.
    """
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)  # Order of the chunk in the document
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=True)  # Number of tokens in the chunk
    embedding = Column(JSON, nullable=True)  # Store embedding as JSON array of floats
    metadata_ = Column("metadata", JSON, default={})  # Additional metadata (e.g., page number)
    
    # Relationships
    document = relationship("Document", back_populates="chunks")
    
    def __repr__(self):
        return f"<DocumentChunk {self.id} (Doc: {self.document_id}, Chunk: {self.chunk_index})>"
    
    @property
    def embedding_vector(self):
        """Return the embedding as a Python list of floats"""
        return self.embedding if self.embedding else None
    
    @embedding_vector.setter
    def embedding_vector(self, vector):
        """Set the embedding from a list of floats"""
        self.embedding = vector if vector is not None else None
    
    def to_dict(self):
        """Convert the chunk to a dictionary"""
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "content": self.content,
            "token_count": self.token_count,
            "metadata": self.metadata_,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
