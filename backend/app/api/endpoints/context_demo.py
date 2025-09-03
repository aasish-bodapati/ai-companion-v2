"""
Context Management Demo Endpoint

This endpoint demonstrates the new intelligent context management system
and allows testing of different context strategies.
"""

import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.services.context_manager import ContextManager, ContextStrategy, ConversationPhase
from app.memory.service import memory_service
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


class ContextDemoRequest(BaseModel):
    """Request model for context demo."""
    conversation_id: UUID = Field(..., description="ID of the conversation to analyze")
    current_message: str = Field(..., description="Current user message to analyze context for")


class ContextDemoResponse(BaseModel):
    """Response model for context demo."""
    strategy_used: str = Field(..., description="Context strategy that would be used")
    total_messages: int = Field(..., description="Total messages in conversation")
    conversation_phase: str = Field(..., description="Detected conversation phase")
    immediate_context_count: int = Field(..., description="Number of immediate context items")
    relevant_context_count: int = Field(..., description="Number of relevant context items")
    background_context_count: int = Field(..., description="Number of background context items")
    context_preview: str = Field(..., description="Preview of the context that would be used")


@router.post("/demo", response_model=ContextDemoResponse)
async def demo_context_management(
    request: ContextDemoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Demo the intelligent context management system.
    
    This endpoint shows what context strategy would be used for a given conversation
    and provides a preview of the context that would be built.
    """
    try:
        # Validate conversation ownership
        conversation = crud.conversation.get(db=db, id=request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=403, detail="Not enough permissions")

        # Initialize context manager
        context_manager = ContextManager(memory_service)
        
        # Build context
        context = context_manager.build_context(
            db=db,
            conversation_id=request.conversation_id,
            user_id=current_user.id,
            current_message=request.current_message,
            conversation_incognito=conversation.incognito_mode
        )
        
        # Format context for preview
        system_prompt_addition, conversation_history = context_manager.format_context_for_llm(context)
        
        # Create context preview (truncated for demo)
        context_preview = system_prompt_addition[:500] + "..." if len(system_prompt_addition) > 500 else system_prompt_addition
        
        return ContextDemoResponse(
            strategy_used=context.strategy_used.value,
            total_messages=context.total_messages,
            conversation_phase=context.conversation_phase.value,
            immediate_context_count=len(context.immediate_context),
            relevant_context_count=len(context.relevant_context),
            background_context_count=len(context.background_context),
            context_preview=context_preview
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Context demo failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to demo context management")


@router.get("/strategies")
async def get_context_strategies():
    """
    Get information about available context strategies.
    """
    return {
        "strategies": [
            {
                "name": "short",
                "description": "For conversations with < 20 messages",
                "immediate_context": 10,
                "relevant_context": 5,
                "background_context": 3,
                "use_case": "Short conversations where all messages are relevant"
            },
            {
                "name": "medium", 
                "description": "For conversations with 20-100 messages",
                "immediate_context": 15,
                "relevant_context": 8,
                "background_context": 5,
                "use_case": "Medium conversations with some summarization"
            },
            {
                "name": "long",
                "description": "For conversations with > 100 messages", 
                "immediate_context": 8,
                "relevant_context": 10,
                "background_context": 7,
                "use_case": "Long conversations with intelligent summarization"
            },
            {
                "name": "topic_shift",
                "description": "When a topic change is detected",
                "immediate_context": 5,
                "relevant_context": 12,
                "background_context": 5,
                "use_case": "Focus on new topic while maintaining some continuity"
            }
        ],
        "phases": [
            {
                "name": "opening",
                "description": "First few messages of a conversation"
            },
            {
                "name": "developing", 
                "description": "Building on a topic"
            },
            {
                "name": "deep_dive",
                "description": "Detailed discussion of a topic"
            },
            {
                "name": "topic_shift",
                "description": "Changing subjects"
            },
            {
                "name": "closing",
                "description": "Wrapping up the conversation"
            }
        ]
    }
