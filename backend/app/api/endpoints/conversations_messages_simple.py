"""
Simplified Conversation Reply Endpoint
Fixed version to resolve 500 errors in multi-turn conversations
"""

import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.schemas.conversation import (
    Message,
    MessageCreate,
    AssistantReply,
)
from app.core.llm import generate_response
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


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
            recent_messages = (
                crud.message.get_multi_by_conversation(
                    db=db, conversation_id=conversation_id, limit=6
                )
                or []
            )
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
        if message_in and isinstance(message_in, dict):
            content = message_in.get("content", "").strip()
            if content:
                try:
                    crud.message.create_with_owner(
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
            if (
                hasattr(conversation, "personalization_enabled")
                and conversation.personalization_enabled
            ):
                # Enhanced memory context with anti-hallucination protection
                try:
                    from app.memory import memory_service
                    
                    # Get actual user memories
                    memory_results = memory_service.search_memories(
                        db, query="", user_id=str(current_user.id), limit=3
                    )
                    if memory_results:
                        memory_context = "\n".join([f"- {result.content}" for result in memory_results])
                        system_prompt += f"\n\nRELEVANT MEMORIES ABOUT THE USER (ONLY USE THESE - DO NOT MAKE UP ANYTHING ELSE):\n{memory_context}"
                        system_prompt += "\n\nCRITICAL REMINDER: The above memories are ALL you know about this user. Do NOT reference any other information, preferences, or details not explicitly listed above."
                    else:
                        system_prompt += "\n\nNO MEMORIES FOUND: You have no stored information about this user. Do NOT make up any personal details, preferences, or past conversations."
                except Exception:
                    system_prompt += "\n\nMEMORY SERVICE UNAVAILABLE: You have no access to user memories. Do NOT make up any personal details, preferences, or past conversations."
            else:
                system_prompt += "\n\nPERSONALIZATION DISABLED: You have no access to user memories. Do NOT make up any personal details, preferences, or past conversations."
        except Exception:
            system_prompt += "\n\nMEMORY ACCESS ERROR: You have no access to user memories. Do NOT make up any personal details, preferences, or past conversations."

        # Generate response
        try:
            response_text = generate_response(
                model=settings.LLM_MODEL_DEFAULT,
                system_prompt=system_prompt,
                messages=conversation_history,
                max_tokens=500,
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
            used_llm=True,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in reply endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate reply")
