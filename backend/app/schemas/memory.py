from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, field_validator, Field
from datetime import datetime


class MemoryNodeBase(BaseModel):
    """Base memory node schema."""

    faiss_id: str
    content: str
    content_type: str
    user_id: str
    conversation_id: Optional[str] = None
    relevance_score: float = 1.0
    importance_score: int = Field(0, ge=0, le=100)
    # Stored as JSON string in DB
    memory_metadata: Optional[str] = None


class MemoryNodeCreate(MemoryNodeBase):
    """Schema for creating a memory node."""

    pass


class MemoryNodeUpdate(BaseModel):
    """Schema for updating a memory node."""

    content: Optional[str] = None
    relevance_score: Optional[float] = None
    importance_score: Optional[int] = Field(None, ge=0, le=100)
    memory_metadata: Optional[str] = None


class MemoryNodeResponse(MemoryNodeBase):
    """Schema for memory node responses."""

    id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
    # Expose parsed metadata as dict in responses
    memory_metadata: Optional[Dict[str, Any]] = None

    @field_validator("memory_metadata", mode="before")
    @classmethod
    def _parse_metadata_field(cls, v: Any):
        # Accept DB string JSON, dict, or None
        if v is None or isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except Exception:
                return None
        return v


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
    memory_metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("memory_metadata", mode="before")
    @classmethod
    def _parse_metadata_field(cls, v: Any):
        if v is None or isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                import json

                return json.loads(v)
            except Exception:
                return None
        return v


# Back-compat schema used by tests expecting a simpler memory creation payload
class MemoryCreate(BaseModel):
    """Lightweight creation schema expected by legacy tests.

    Fields intentionally differ from `MemoryNodeCreate` and will be adapted by
    the CRUD layer:
    - importance_score: float in [0,1] (will be scaled to 0..100 int)
    - memory_metadata: dict (will be JSON-encoded by CRUD)
    - conversation_id: optional
    """

    content: str
    content_type: str
    user_id: str
    importance_score: float = 0.0
    memory_metadata: Optional[Dict[str, Any]] = None
    conversation_id: Optional[str] = None
