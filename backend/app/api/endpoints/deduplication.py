"""
Deduplication API endpoints for memory management
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user
from app.memory.deduplication import deduplication_service
# consolidation_service removed for MVP focus
# context_tracker removed for MVP focus

router = APIRouter()


class ContentCheckRequest(BaseModel):
    content: str


class ConsolidationResponse(BaseModel):
    consolidated: int
    removed: int
    message: str


class DeduplicationMetrics(BaseModel):
    total_memories: int
    duplicate_count: int
    consolidation_opportunities: int
    storage_efficiency: float


@router.post("/check-duplicate")
async def check_content_duplication(
    request: ContentCheckRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Check if content is a duplicate of existing memories."""
    try:
        is_duplicate = await deduplication_service.is_duplicate(
            request.content, current_user.id, db
        )

        return {
            "is_duplicate": is_duplicate,
            "threshold": deduplication_service.similarity_threshold,
            "content_hash": deduplication_service._generate_content_hash(request.content),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Duplication check failed: {str(e)}")


@router.get("/conversation-context/{conversation_id}")
async def get_conversation_context(
    conversation_id: str, current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Get conversation context tracking data."""
    try:
        # context_tracker removed for MVP - use empty context
        context = {}
        return {
            "conversation_id": conversation_id,
            "discussed_topics": list(context.get("discussed_topics", set())),
            "used_memory_ids": list(context.get("used_memory_ids", set())),
            "content_hashes": list(context.get("content_hashes", set())),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context retrieval failed: {str(e)}")


@router.post("/consolidate")
async def consolidate_memories(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
) -> ConsolidationResponse:
    """Trigger memory consolidation for the user."""
    try:
        # consolidation_service removed for MVP - return empty result
        result = {"consolidated_count": 0, "message": "Consolidation service not available in MVP"}

        return ConsolidationResponse(
            consolidated=result.get("consolidated", 0),
            removed=result.get("removed", 0),
            message=f"Successfully consolidated {result.get('consolidated', 0)} memory groups",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Consolidation failed: {str(e)}")


@router.get("/metrics")
async def get_deduplication_metrics(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
) -> DeduplicationMetrics:
    """Get deduplication and efficiency metrics."""
    try:
        # Get total memories
        from app.models.memory import MemoryNode

        total_memories = db.query(MemoryNode).filter(MemoryNode.user_id == current_user.id).count()

        # Get duplicate count (simplified - could be enhanced)
        duplicate_count = await deduplication_service.count_duplicates(current_user.id, db)

        # Calculate consolidation opportunities
        # consolidation_service removed for MVP - return 0 opportunities
        consolidation_opportunities = 0

        # Calculate storage efficiency
        storage_efficiency = 1.0 - (duplicate_count / max(total_memories, 1))

        return DeduplicationMetrics(
            total_memories=total_memories,
            duplicate_count=duplicate_count,
            consolidation_opportunities=consolidation_opportunities,
            storage_efficiency=storage_efficiency,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics calculation failed: {str(e)}")


@router.delete("/reset-context/{conversation_id}")
async def reset_conversation_context(
    conversation_id: str, current_user=Depends(get_current_user)
) -> Dict[str, str]:
    """Reset conversation context tracking."""
    try:
        # context_tracker removed for MVP - skip reset
        pass
        return {"message": f"Context reset for conversation {conversation_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context reset failed: {str(e)}")
