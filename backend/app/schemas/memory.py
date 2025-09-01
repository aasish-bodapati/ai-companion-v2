from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, ConfigDict, field_validator, Field
from datetime import datetime, date
from enum import Enum


class PrivacyLevel(str, Enum):
    """Privacy levels for memories"""
    PUBLIC = "public"
    NORMAL = "normal"
    PRIVATE = "private"
    SENSITIVE = "sensitive"


class MemoryMetadata(BaseModel):
    """Structured metadata for memories"""
    
    # Contextual information
    context: Optional[str] = None  # "work", "home", "social", etc.
    mood: Optional[str] = None  # "happy", "stressed", "excited", etc.
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    
    # Goal alignment
    goal_relevance: Dict[str, float] = Field(default_factory=dict)
    priority_level: Optional[str] = None  # "low", "medium", "high", "critical"
    
    # Relationships
    people_mentioned: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    activity_type: Optional[str] = None
    
    # Learning and adaptation
    learning_objective: Optional[str] = None
    skill_level: Optional[str] = None  # "beginner", "intermediate", "expert"
    
    # Privacy and sensitivity
    privacy_level: PrivacyLevel = PrivacyLevel.NORMAL
    sharing_preferences: List[str] = Field(default_factory=list)
    
    # Additional contextual data
    source_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    verification_status: Optional[str] = None  # "verified", "unverified", "disputed"


class MemoryNodeBase(BaseModel):
    """Enhanced base memory node schema."""

    faiss_id: str
    content: str
    content_type: str
    user_id: str
    conversation_id: Optional[str] = None
    
    # Enhanced categorization
    category: Optional[str] = None
    subcategory: Optional[str] = None
    
    # Temporal context
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    
    # Enhanced scoring
    relevance_score: Optional[float] = Field(1.0, ge=0.0, le=1.0)
    importance_score: Optional[int] = Field(0, ge=0, le=100)
    confidence_score: Optional[float] = Field(0.8, ge=0.0, le=1.0)
    emotional_valence: Optional[float] = Field(None, ge=-1.0, le=1.0)
    
    # Relationship modeling
    parent_memory_id: Optional[str] = None
    related_memory_ids: Optional[List[str]] = None
    
    # Enhanced metadata
    memory_metadata: Optional[Any] = None
    tags: Optional[List[str]] = None
    entities: Optional[List[str]] = None
    
    # Access patterns
    created_via: Optional[str] = None
    
    # Privacy and sensitivity
    privacy_level: Optional[PrivacyLevel] = Field(PrivacyLevel.NORMAL)
    is_core: Optional[bool] = Field(False)


class MemoryNodeCreate(MemoryNodeBase):
    """Schema for creating a memory node."""

    pass


class MemoryNodeUpdate(BaseModel):
    """Schema for updating a memory node."""

    content: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    relevance_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    importance_score: Optional[int] = Field(None, ge=0, le=100)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    emotional_valence: Optional[float] = Field(None, ge=-1.0, le=1.0)
    parent_memory_id: Optional[str] = None
    related_memory_ids: Optional[List[str]] = None
    memory_metadata: Optional[MemoryMetadata] = None
    tags: Optional[List[str]] = None
    entities: Optional[List[str]] = None
    privacy_level: Optional[PrivacyLevel] = None
    is_core: Optional[bool] = None


class MemoryNodeResponse(MemoryNodeBase):
    """Schema for memory node responses."""

    id: str
    timestamp: datetime
    access_count: Optional[int] = Field(0)
    last_accessed: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("memory_metadata", mode="before")
    @classmethod
    def _parse_metadata_field(cls, v: Any):
        # Accept DB string JSON, dict, or None
        if v is None or isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                import json
                parsed = json.loads(v)
                # Convert to MemoryMetadata if it's a dict
                if isinstance(parsed, dict):
                    return MemoryMetadata(**parsed)
                return parsed
            except Exception:
                return None
        return v

    @field_validator("tags", mode="before")
    @classmethod
    def _parse_tags_field(cls, v: Any):
        if v is None or isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
        return v

    @field_validator("entities", mode="before")
    @classmethod
    def _parse_entities_field(cls, v: Any):
        if v is None or isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
        return v

    @field_validator("related_memory_ids", mode="before")
    @classmethod
    def _parse_related_ids_field(cls, v: Any):
        if v is None or isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
        return v


# Relationship schemas
class MemoryRelationshipCreate(BaseModel):
    """Schema for creating memory relationships"""
    
    source_memory_id: str
    target_memory_id: str
    relationship_type: str  # From RelationshipType enum
    strength: float = Field(1.0, ge=0.0, le=1.0)
    context: Optional[str] = None
    created_by: Optional[str] = None


class MemoryRelationshipResponse(BaseModel):
    """Schema for memory relationship responses"""
    
    id: str
    source_memory_id: str
    target_memory_id: str
    relationship_type: str
    strength: float
    context: Optional[str] = None
    created_at: datetime
    created_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Evolution schemas
class MemoryEvolutionCreate(BaseModel):
    """Schema for creating memory evolution records"""
    
    memory_id: str
    evolution_type: str  # From EvolutionType enum
    old_content: Optional[str] = None
    new_content: Optional[str] = None
    old_metadata: Optional[Dict[str, Any]] = None
    new_metadata: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None
    confidence: float = Field(0.8, ge=0.0, le=1.0)
    triggered_by: Optional[str] = None


class MemoryEvolutionResponse(BaseModel):
    """Schema for memory evolution responses"""
    
    id: str
    memory_id: str
    evolution_type: str
    old_content: Optional[str] = None
    new_content: Optional[str] = None
    old_metadata: Optional[Dict[str, Any]] = None
    new_metadata: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None
    confidence: float
    timestamp: datetime
    triggered_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("old_metadata", "new_metadata", mode="before")
    @classmethod
    def _parse_metadata_fields(cls, v: Any):
        if v is None or isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return None
        return v


# Enhanced search schemas
class MemorySearchQuery(BaseModel):
    """Enhanced schema for memory search queries"""

    query: str
    user_id: str
    content_types: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    privacy_levels: Optional[List[PrivacyLevel]] = None
    date_range: Optional[Dict[str, date]] = None  # {"start": date, "end": date}
    emotional_valence_range: Optional[Dict[str, float]] = None  # {"min": -1.0, "max": 1.0}
    importance_range: Optional[Dict[str, int]] = None  # {"min": 0, "max": 100}
    limit: int = Field(8, ge=1, le=100)
    min_relevance: float = Field(0.5, ge=0.0, le=1.0)
    include_relationships: bool = False
    include_evolution: bool = False


class MemorySearchResult(BaseModel):
    """Enhanced schema for memory search results"""

    faiss_id: str
    content: str
    content_type: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    relevance_score: float
    importance_score: int
    confidence_score: float
    emotional_valence: Optional[float] = None
    timestamp: datetime
    effective_date: Optional[date] = None
    tags: Optional[List[str]] = None
    entities: Optional[List[str]] = None
    privacy_level: PrivacyLevel
    memory_metadata: Optional[MemoryMetadata] = None
    relationships: Optional[List[MemoryRelationshipResponse]] = None
    evolution_history: Optional[List[MemoryEvolutionResponse]] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("memory_metadata", mode="before")
    @classmethod
    def _parse_metadata_field(cls, v: Any):
        if v is None or isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                import json
                parsed = json.loads(v)
                if isinstance(parsed, dict):
                    return MemoryMetadata(**parsed)
                return parsed
            except Exception:
                return None
        return v

    @field_validator("tags", "entities", mode="before")
    @classmethod
    def _parse_list_fields(cls, v: Any):
        if v is None or isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
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
