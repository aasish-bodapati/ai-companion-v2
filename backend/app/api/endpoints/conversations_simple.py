"""
Simplified Conversation Endpoints
Fixed version to resolve 500 errors and provide stable functionality
"""

import logging
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.schemas.conversation import (
    Conversation,
    ConversationCreate,
    ConversationUpdate,
    ConversationWithMessages,
    Message,
    MessageCreate,
    AssistantReply,
)
from app.core.llm import generate_response
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[Conversation])
async def list_conversations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve conversations for the current user.
    """
    try:
        conversations = crud.conversation.get_multi_by_user(
            db=db, user_id=current_user.id, skip=skip, limit=limit
        )
        return conversations
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversations")

@router.post("/", response_model=Conversation, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    *,
    db: Session = Depends(deps.get_db),
    conversation_in: ConversationCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create new conversation.
    """
    try:
        conversation = crud.conversation.create_with_owner(
            db=db, obj_in=conversation_in, owner_id=current_user.id
        )
        return conversation
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    *,
    db: Session = Depends(deps.get_db),
    conversation_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get conversation by ID.
    """
    try:
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation")

@router.post("/{conversation_id}/messages", response_model=Message)
async def create_message(
    *,
    db: Session = Depends(deps.get_db),
    conversation_id: UUID,
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new message in a conversation.
    """
    try:
        # Validate conversation ownership
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        message = crud.message.create_with_owner(
            db=db,
            obj_in=message_in,
            owner_id=current_user.id,
            conversation_id=conversation_id,
        )
        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail="Failed to create message")

@router.post("/{conversation_id}/reply", response_model=AssistantReply)
async def reply_to_conversation_simple(
    conversation_id: UUID,
    request: Request,
    message_in: dict | None = Body(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Simplified AI reply to a conversation message.
    """
    try:
        # Validate conversation ownership
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        # Get recent conversation messages (simplified)
        try:
            recent_messages = crud.message.get_multi_by_conversation(
                db=db, conversation_id=conversation_id, limit=6
            ) or []
        except Exception as e:
            logger.error(f"Error getting recent messages: {e}")
            recent_messages = []

        # Build conversation history (simplified)
        conversation_history = []
        try:
            for msg in recent_messages:
                role = getattr(msg, "role", "user")
                content = getattr(msg, "content", "").strip()
                if content:
                    conversation_history.append({"role": role, "content": content})
        except Exception as e:
            logger.error(f"Error building conversation history: {e}")
            conversation_history = []

        # Create user message if provided
        user_message = None
        if message_in and isinstance(message_in, dict):
            content = message_in.get("content", "").strip()
            if content:
                try:
                    user_message = crud.message.create_with_owner(
                        db=db,
                        obj_in=MessageCreate(role="user", content=content),
                        owner_id=current_user.id,
                        conversation_id=conversation_id,
                    )
                    conversation_history.append({"role": "user", "content": content})
                except Exception as e:
                    logger.error(f"Error creating user message: {e}")

        # Build system prompt (enhanced)
        from app.core.prompts import MEMORY_FIRST_PROMPT
        system_prompt = MEMORY_FIRST_PROMPT
        
        # Add basic memory context if available
        try:
            if hasattr(conversation, 'personalization_enabled') and conversation.personalization_enabled:
                # Simple memory context - just add basic user info
                system_prompt += "\n\nYou remember information about the user from previous conversations."
        except Exception:
            pass

        # Generate response
        try:
            response_text = generate_response(
                model=settings.LLM_MODEL_DEFAULT,
                system_prompt=system_prompt,
                messages=conversation_history,
                max_tokens=500
            )
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate reply")

        # Create assistant message
        try:
            assistant_message = crud.message.create_with_owner(
                db=db,
                obj_in=MessageCreate(role="assistant", content=response_text),
                owner_id=current_user.id,
                conversation_id=conversation_id,
            )
        except Exception as e:
            logger.error(f"Error creating assistant message: {e}")
            raise HTTPException(status_code=500, detail="Failed to save reply")

        # Return response
        return AssistantReply(
            id=assistant_message.id,
            message=Message.model_validate(assistant_message),
            provenance=[],
            used_llm=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in reply endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate reply")
