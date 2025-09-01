from sqlalchemy import Column, String, Text, DateTime, Float, Integer, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid
from enum import Enum


class MemoryType(Enum):
    """Enhanced memory types with semantic meaning"""
    # Core types (existing)
    CONVERSATION = "conversation"
    PROFILE = "profile"
    PREFERENCE = "preference"
    FACT = "fact"
    MESSAGE = "message"
    ONBOARDING = "onboarding"
    
    # Action types for two-mode UI
    ACTION = "action"
    
    # New semantic types
    GOAL = "goal"
    HABIT = "habit"
    ACHIEVEMENT = "achievement"
    CHALLENGE = "challenge"
    LEARNING = "learning"
    EMOTIONAL_STATE = "emotional_state"
    DECISION = "decision"
    PLANNING = "planning"
    REFLECTION = "reflection"
    FEEDBACK = "feedback"


class RelationshipType(Enum):
    """Types of relationships between memories"""
    CONTRADICTS = "contradicts"
    SUPPORTS = "supports"
    ELABORATES = "elaborates"
    FOLLOWS = "follows"
    REPLACES = "replaces"
    CONFIRMS = "confirms"
    UPDATES = "updates"


class EvolutionType(Enum):
    """Types of memory evolution"""
    CONSOLIDATION = "consolidation"
    FORGETTING = "forgetting"
    REINFORCEMENT = "reinforcement"
    CORRECTION = "correction"
    MERGE = "merge"
    SPLIT = "split"


class MemoryNode(Base):
    """Enhanced memory node for storing text content and rich metadata for FAISS retrieval."""

    __tablename__ = "memory_nodes"

    # Core fields
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    faiss_id = Column(String(36), unique=True, nullable=True, index=True)  # Made nullable for now
    content = Column(Text, nullable=False)
    
    # Enhanced categorization
    content_type = Column(String(50), nullable=False)  # Primary type
    category = Column(String(100), nullable=True, index=True)  # Semantic category
    subcategory = Column(String(100), nullable=True)  # More specific grouping
    
    # User and context
    user_id = Column(String(36), nullable=False, index=True)
    conversation_id = Column(String(36), nullable=True, index=True)
    
    # Temporal context
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    effective_date = Column(Date, nullable=True)  # When this memory is relevant
    expiration_date = Column(Date, nullable=True)  # When to consider forgetting
    
    # Enhanced scoring
    relevance_score = Column(Float, default=1.0, index=True)
    importance_score = Column(Integer, default=0, nullable=False, index=True)  # UI-facing 0..100
    confidence_score = Column(Float, default=0.8)  # How certain we are about this memory
    emotional_valence = Column(Float, nullable=True)  # Positive/negative sentiment (-1 to 1)
    
    # Relationship modeling
    parent_memory_id = Column(String(36), nullable=True, index=True)
    related_memory_ids = Column(Text, nullable=True)  # JSON array of related IDs
    
    # Enhanced metadata (structured)
    memory_metadata = Column(Text, nullable=True)  # JSON with validated structure
    tags = Column(Text, nullable=True)  # JSON array of semantic tags
    entities = Column(Text, nullable=True)  # JSON array of extracted entities
    
    # Access patterns
    access_count = Column(Integer, default=0)
    last_accessed = Column(DateTime(timezone=True), nullable=True)
    created_via = Column(String(50), nullable=True)  # How memory was created
    
    # Privacy and sensitivity
    privacy_level = Column(String(20), default="normal")  # "public", "normal", "private", "sensitive"
    is_core = Column(Integer, default=0, nullable=False)  # Core memory flag
    
    # Relationships
    relationships_from = relationship("MemoryRelationship", foreign_keys="MemoryRelationship.source_memory_id", back_populates="source_memory")
    relationships_to = relationship("MemoryRelationship", foreign_keys="MemoryRelationship.target_memory_id", back_populates="target_memory")
    evolution_history = relationship("MemoryEvolution", back_populates="memory")

    def __repr__(self):
        return f"<MemoryNode(id={self.id}, type={self.content_type}, category={self.category}, user_id={self.user_id})>"


class MemoryRelationship(Base):
    """Relationships between memories for better context understanding"""
    
    __tablename__ = "memory_relationships"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_memory_id = Column(String(36), ForeignKey("memory_nodes.id"), nullable=False, index=True)
    target_memory_id = Column(String(36), ForeignKey("memory_nodes.id"), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False)  # RelationshipType enum values
    strength = Column(Float, default=1.0)  # Relationship strength 0-1
    context = Column(String(200), nullable=True)  # Additional context for the relationship
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(50), nullable=True)  # "system", "user", "llm"
    
    # Relationships
    source_memory = relationship("MemoryNode", foreign_keys=[source_memory_id], back_populates="relationships_from")
    target_memory = relationship("MemoryNode", foreign_keys=[target_memory_id], back_populates="relationships_to")

    def __repr__(self):
        return f"<MemoryRelationship(source={self.source_memory_id}, target={self.target_memory_id}, type={self.relationship_type})>"


class MemoryEvolution(Base):
    """Track how memories change and evolve over time"""
    
    __tablename__ = "memory_evolution"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    memory_id = Column(String(36), ForeignKey("memory_nodes.id"), nullable=False, index=True)
    evolution_type = Column(String(50), nullable=False)  # EvolutionType enum values
    old_content = Column(Text, nullable=True)
    new_content = Column(Text, nullable=True)
    old_metadata = Column(Text, nullable=True)  # JSON
    new_metadata = Column(Text, nullable=True)  # JSON
    reason = Column(String(500), nullable=True)
    confidence = Column(Float, default=0.8)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    triggered_by = Column(String(50), nullable=True)  # "consolidation", "user_correction", "llm_refinement"
    
    # Relationships
    memory = relationship("MemoryNode", back_populates="evolution_history")

    def __repr__(self):
        return f"<MemoryEvolution(memory_id={self.memory_id}, type={self.evolution_type}, timestamp={self.timestamp})>"
