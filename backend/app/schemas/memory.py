from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class MemoryNodeBase(BaseModel):
    """Base memory node schema."""
    faiss_id: str
    content: str
    content_type: str
    user_id: str
    conversation_id: Optional[str] = None
    relevance_score: float = 1.0
    memory_metadata: Optional[str] = None


class MemoryNodeCreate(MemoryNodeBase):
    """Schema for creating a memory node."""
    pass


class MemoryNodeUpdate(BaseModel):
    """Schema for updating a memory node."""
    content: Optional[str] = None
    relevance_score: Optional[float] = None
    memory_metadata: Optional[str] = None


class MemoryNodeResponse(MemoryNodeBase):
    """Schema for memory node responses."""
    id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


class MemorySearchQuery(BaseModel):
    """Schema for memory search queries."""
    query: str
    user_id: str
    content_types: Optional[list[str]] = None
    limit: int = 8
    min_relevance: float = 0.5


class MemorySearchResult(BaseModel):
    """Schema for memory search results."""
    faiss_id: str
    content: str
    content_type: str
    relevance_score: float
    timestamp: datetime
    memory_metadata: Optional[str] = None
    
    class Config:
        from_attributes = True
