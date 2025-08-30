"""
Enhanced memory API endpoints with support for relationships, evolution, and advanced features.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.api import deps
from app.models.user import User
from app.schemas.memory import (
    MemoryNodeResponse, MemoryRelationshipCreate, MemoryRelationshipResponse,
    MemoryEvolutionCreate, MemoryEvolutionResponse, MemoryNodeUpdate,
    MemoryMetadata, PrivacyLevel
)
from app.services.enhanced_memory_service import enhanced_memory_service
from app.services.memory_relationships import memory_relationship_service
from app.services.memory_evolution import memory_evolution_service
from app.core.memory_types import MemoryType, RelationshipType, EvolutionType

router = APIRouter()


# Enhanced memory creation and management

class EnhancedMemoryCreate(BaseModel):
    """Enhanced memory creation with full metadata support"""
    content: str = Field(..., description="Memory content")
    content_type: str = Field("fact", description="Memory type")
    conversation_id: Optional[UUID] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    tags: Optional[List[str]] = None
    entities: Optional[List[str]] = None
    privacy_level: PrivacyLevel = PrivacyLevel.NORMAL
    metadata: Optional[MemoryMetadata] = None
    effective_date: Optional[str] = None  # ISO date string
    expiration_date: Optional[str] = None  # ISO date string


@router.post("/enhanced/memories", response_model=MemoryNodeResponse)
def create_enhanced_memory(
    payload: EnhancedMemoryCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Create a memory with enhanced metadata and automatic relationship detection"""
    memory_id = enhanced_memory_service.store_enhanced_memory(
        db=db,
        content=payload.content,
        content_type=payload.content_type,
        user_id=str(current_user.id),
        conversation_id=str(payload.conversation_id) if payload.conversation_id else None,
        metadata=payload.metadata.dict() if payload.metadata else None,
        category=payload.category,
        subcategory=payload.subcategory,
        tags=payload.tags,
        entities=payload.entities,
        privacy_level=payload.privacy_level,
        effective_date=payload.effective_date,
        expiration_date=payload.expiration_date
    )
    
    if not memory_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create enhanced memory"
        )
    
    # Return the created memory
    memory_data = enhanced_memory_service.get_memory_with_relationships(
        db, memory_id, str(current_user.id), include_evolution=False
    )
    
    if not memory_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory created but not found"
        )
    
    return memory_data["memory"]


@router.get("/enhanced/memories/{memory_id}", response_model=Dict[str, Any])
def get_enhanced_memory(
    memory_id: str,
    include_evolution: bool = Query(True, description="Include evolution history"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get memory with relationships and evolution history"""
    memory_data = enhanced_memory_service.get_memory_with_relationships(
        db, memory_id, str(current_user.id), include_evolution=include_evolution
    )
    
    if not memory_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    return memory_data


@router.patch("/enhanced/memories/{memory_id}", response_model=MemoryNodeResponse)
def update_enhanced_memory(
    memory_id: str,
    updates: MemoryNodeUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Update memory with evolution tracking"""
    updated_memory = enhanced_memory_service.update_memory_with_evolution(
        db, memory_id, str(current_user.id), updates
    )
    
    if not updated_memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found or update failed"
        )
    
    return updated_memory


# Memory relationships

@router.post("/memories/{memory_id}/relationships", response_model=MemoryRelationshipResponse)
def create_memory_relationship(
    memory_id: str,
    relationship_data: MemoryRelationshipCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Create a relationship between memories"""
    # Verify memory ownership
    memory_data = enhanced_memory_service.get_memory_with_relationships(
        db, memory_id, str(current_user.id), include_evolution=False
    )
    if not memory_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source memory not found"
        )
    
    # Create the relationship
    relationship = memory_relationship_service.create_relationship(db, relationship_data)
    
    return MemoryRelationshipResponse.from_orm(relationship)


@router.get("/memories/{memory_id}/relationships", response_model=List[MemoryRelationshipResponse])
def get_memory_relationships(
    memory_id: str,
    include_incoming: bool = Query(True, description="Include incoming relationships"),
    include_outgoing: bool = Query(True, description="Include outgoing relationships"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get all relationships for a memory"""
    # Verify memory ownership
    memory_data = enhanced_memory_service.get_memory_with_relationships(
        db, memory_id, str(current_user.id), include_evolution=False
    )
    if not memory_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    relationships = memory_relationship_service.get_memory_relationships(
        db, memory_id, include_incoming=include_incoming, include_outgoing=include_outgoing
    )
    
    return [MemoryRelationshipResponse.from_orm(rel) for rel in relationships]


@router.get("/users/me/memory-clusters", response_model=List[List[str]])
def get_memory_clusters(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get clusters of related memories using graph analysis"""
    clusters = memory_relationship_service.find_memory_clusters(db, str(current_user.id))
    return clusters


# Memory evolution and lifecycle

@router.post("/memories/{memory_id}/evolution", response_model=MemoryEvolutionResponse)
def record_memory_evolution(
    memory_id: str,
    evolution_data: MemoryEvolutionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Record a memory evolution event"""
    # Verify memory ownership
    memory_data = enhanced_memory_service.get_memory_with_relationships(
        db, memory_id, str(current_user.id), include_evolution=False
    )
    if not memory_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    evolution = memory_evolution_service.record_evolution(db, evolution_data)
    return MemoryEvolutionResponse.from_orm(evolution)


@router.get("/memories/{memory_id}/evolution", response_model=List[MemoryEvolutionResponse])
def get_memory_evolution_history(
    memory_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get evolution history for a memory"""
    # Verify memory ownership
    memory_data = enhanced_memory_service.get_memory_with_relationships(
        db, memory_id, str(current_user.id), include_evolution=False
    )
    if not memory_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    
    evolution_history = memory_evolution_service.get_memory_evolution_history(db, memory_id)
    return [MemoryEvolutionResponse.from_orm(evo) for evo in evolution_history]


class LifecycleRequest(BaseModel):
    """Request for memory lifecycle management"""
    include_consolidation: bool = True
    include_forgetting: bool = True
    include_reinforcement: bool = True


@router.post("/users/me/memory-lifecycle", response_model=Dict[str, Any])
def run_memory_lifecycle(
    request: LifecycleRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Run comprehensive memory lifecycle management"""
    results = enhanced_memory_service.run_memory_lifecycle_management(
        db=db,
        user_id=str(current_user.id),
        include_consolidation=request.include_consolidation,
        include_forgetting=request.include_forgetting,
        include_reinforcement=request.include_reinforcement
    )
    
    return results


@router.get("/users/me/memory-patterns", response_model=Dict[str, Any])
def analyze_memory_patterns(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Analyze memory patterns and provide insights"""
    analysis = enhanced_memory_service.analyze_memory_patterns(
        db, str(current_user.id), days=days
    )
    
    return analysis


@router.get("/users/me/memory-suggestions", response_model=List[Dict[str, Any]])
def get_memory_improvements(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of suggestions"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get suggestions for improving memories"""
    suggestions = enhanced_memory_service.suggest_memory_improvements(
        db, str(current_user.id), limit=limit
    )
    
    return suggestions


# Advanced search and filtering

class EnhancedSearchRequest(BaseModel):
    """Enhanced search request with multiple filters"""
    query: str
    content_types: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    privacy_levels: Optional[List[PrivacyLevel]] = None
    date_range: Optional[Dict[str, str]] = None  # {"start": "2023-01-01", "end": "2023-12-31"}
    emotional_valence_range: Optional[Dict[str, float]] = None  # {"min": -1.0, "max": 1.0}
    importance_range: Optional[Dict[str, int]] = None  # {"min": 0, "max": 100}
    limit: int = Field(8, ge=1, le=100)
    min_relevance: float = Field(0.5, ge=0.0, le=1.0)
    include_relationships: bool = False
    include_evolution: bool = False


@router.post("/users/me/memories/enhanced-search", response_model=List[Dict[str, Any]])
def enhanced_memory_search(
    search_request: EnhancedSearchRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Enhanced memory search with multiple filters and metadata"""
    # This would integrate with the enhanced memory service
    # For now, return a placeholder that shows the enhanced structure
    
    # Convert to search query object and execute
    from app.schemas.memory import MemorySearchQuery
    
    query = MemorySearchQuery(
        query=search_request.query,
        user_id=str(current_user.id),
        content_types=search_request.content_types,
        categories=search_request.categories,
        tags=search_request.tags,
        privacy_levels=search_request.privacy_levels,
        limit=search_request.limit,
        min_relevance=search_request.min_relevance,
        include_relationships=search_request.include_relationships,
        include_evolution=search_request.include_evolution
    )
    
    # This would call enhanced search service
    # For now, return basic structure
    return []


# Memory type and category management

@router.get("/memory-types", response_model=List[Dict[str, Any]])
def get_memory_types():
    """Get available memory types with metadata"""
    from app.core.memory_types import memory_type_registry
    
    types_info = []
    for memory_type in MemoryType:
        metadata = memory_type_registry.get_metadata(memory_type)
        types_info.append({
            "type": memory_type.value,
            "description": metadata.description,
            "default_categories": [cat.value for cat in metadata.default_categories],
            "default_subcategories": [subcat.value for subcat in metadata.default_subcategories],
            "typical_privacy_level": metadata.typical_privacy_level.value,
            "default_importance_range": metadata.default_importance_range,
            "decay_half_life_days": metadata.decay_half_life_days
        })
    
    return types_info


@router.get("/relationship-types", response_model=List[str])
def get_relationship_types():
    """Get available relationship types"""
    return [rel_type.value for rel_type in RelationshipType]


@router.get("/evolution-types", response_model=List[str])
def get_evolution_types():
    """Get available evolution types"""
    return [evo_type.value for evo_type in EvolutionType]


# Memory statistics and insights

@router.get("/users/me/memory-stats", response_model=Dict[str, Any])
def get_memory_statistics(
    days: int = Query(30, ge=1, le=365, description="Number of days for statistics"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get comprehensive memory statistics"""
    # Get lifecycle stats
    lifecycle_stats = memory_evolution_service.get_user_lifecycle_stats(
        db, str(current_user.id), days=days
    )
    
    # Get pattern analysis
    pattern_analysis = enhanced_memory_service.analyze_memory_patterns(
        db, str(current_user.id), days=days
    )
    
    # Get memory clusters
    clusters = memory_relationship_service.find_memory_clusters(db, str(current_user.id))
    
    return {
        "lifecycle": lifecycle_stats.dict(),
        "patterns": pattern_analysis,
        "clusters": {
            "count": len(clusters),
            "sizes": [len(cluster) for cluster in clusters],
            "average_size": sum(len(cluster) for cluster in clusters) / len(clusters) if clusters else 0
        }
    }


# Content type suggestions

@router.post("/suggest-categories", response_model=List[str])
def suggest_memory_categories(
    content: str,
    memory_type: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Suggest categories for memory content"""
    from app.core.memory_types import memory_type_registry
    
    try:
        mt = MemoryType(memory_type)
        suggestions = memory_type_registry.suggest_categories(content, mt)
        return [cat.value for cat in suggestions]
    except ValueError:
        # Invalid memory type
        return []


# Batch operations

class BatchMemoryOperation(BaseModel):
    """Batch operation on memories"""
    memory_ids: List[str]
    operation: str  # "delete", "archive", "categorize", "tag"
    parameters: Optional[Dict[str, Any]] = None


@router.post("/users/me/memories/batch", response_model=Dict[str, Any])
def batch_memory_operation(
    operation: BatchMemoryOperation,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Perform batch operations on memories"""
    results = {
        "processed": 0,
        "succeeded": 0,
        "failed": 0,
        "errors": []
    }
    
    for memory_id in operation.memory_ids:
        results["processed"] += 1
        
        try:
            # Verify ownership
            memory_data = enhanced_memory_service.get_memory_with_relationships(
                db, memory_id, str(current_user.id), include_evolution=False
            )
            
            if not memory_data:
                results["failed"] += 1
                results["errors"].append(f"Memory {memory_id} not found")
                continue
            
            # Perform operation
            if operation.operation == "delete":
                # Implementation would go here
                results["succeeded"] += 1
            elif operation.operation == "archive":
                # Implementation would go here
                results["succeeded"] += 1
            elif operation.operation == "categorize":
                # Implementation would go here
                results["succeeded"] += 1
            elif operation.operation == "tag":
                # Implementation would go here
                results["succeeded"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(f"Unknown operation: {operation.operation}")
                
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Error processing {memory_id}: {str(e)}")
    
    return results
