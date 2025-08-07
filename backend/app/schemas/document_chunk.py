from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentChunkBase(BaseModel):
    """Base schema for document chunks"""
    chunk_index: int = Field(..., description="Order of the chunk in the document")
    content: str = Field(..., description="Text content of the chunk")
    token_count: Optional[int] = Field(None, description="Number of tokens in the chunk")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata for the chunk")

class DocumentChunkCreate(DocumentChunkBase):
    """Schema for creating a new document chunk"""
    document_id: int = Field(..., description="ID of the parent document")
    embedding: Optional[List[float]] = Field(None, description="Vector embedding of the chunk text")

class DocumentChunkUpdate(DocumentChunkBase):
    """Schema for updating a document chunk"""
    content: Optional[str] = Field(None, description="Updated text content of the chunk")
    token_count: Optional[int] = Field(None, description="Updated token count")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Updated metadata")

class DocumentChunkInDBBase(DocumentChunkBase):
    """Base schema for document chunks in the database"""
    id: int
    document_id: int
    created_at: datetime
    updated_at: datetime
    embedding: Optional[List[float]] = None

    class Config:
        orm_mode = True

class DocumentChunk(DocumentChunkInDBBase):
    """Schema for document chunks (API response)"""
    pass

class DocumentChunkInDB(DocumentChunkInDBBase):
    """Schema for document chunks in the database (internal use)"""
    pass

class DocumentChunkWithScore(DocumentChunk):
    """Schema for document chunks with similarity score"""
    score: float = Field(..., description="Similarity score (0-1)")
