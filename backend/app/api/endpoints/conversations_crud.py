"""
Conversation CRUD operations - extracted from conversations.py
Handles basic conversation and message database operations.
"""

import logging
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
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
)
from app.services.auto_memory import auto_memory_service
from .conversations_utils import _normalize_user_text, _maybe_capture_preference

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


@router.put("/{conversation_id}", response_model=Conversation)
async def update_conversation(
    *,
    db: Session = Depends(deps.get_db),
    conversation_id: UUID,
    conversation_in: ConversationUpdate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update conversation.
    """
    try:
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")
        conversation = crud.conversation.update(db=db, db_obj=conversation, obj_in=conversation_in)
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to update conversation")


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    *,
    db: Session = Depends(deps.get_db),
    conversation_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Delete conversation.
    """
    try:
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")
        crud.conversation.remove(db=db, id=conversation_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")


@router.get("/{conversation_id}/messages", response_model=List[Message])
async def get_conversation_messages(
    *,
    db: Session = Depends(deps.get_db),
    conversation_id: UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get messages for a conversation.
    """
    try:
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        messages = crud.message.get_multi_by_conversation(
            db=db, conversation_id=conversation_id, skip=skip, limit=limit
        )
        return messages
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve messages")


@router.post(
    "/{conversation_id}/messages/raw", response_model=Message, status_code=status.HTTP_201_CREATED
)
async def create_message(
    *,
    db: Session = Depends(deps.get_db),
    conversation_id: UUID,
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a raw message in a conversation (low-level CRUD).
    Note: The primary chat send endpoint is defined in `conversations_messages.py` at
    `POST /{conversation_id}/messages` and includes rate limit, idempotency, and memory hooks.
    This raw endpoint avoids conflicts and is intended for internal/admin use.
    """
    try:
        # Validate conversation ownership
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        # Create the message
        message = crud.message.create_with_conversation(
            db=db, obj_in=message_in, conversation_id=conversation_id
        )

        # Auto-rename conversation title based on the first user message
        try:
            raw_title = (getattr(conversation, "title", "") or "").strip()
            is_default_title = raw_title == "" or raw_title == "New Conversation"
            is_user_msg = (message_in.role or "").lower() == "user"
            content = (message_in.content or "").strip()
            if is_default_title and is_user_msg and content:
                # Use the first line and truncate to 80 chars
                first_line = content.splitlines()[0].strip()
                new_title = (first_line[:80]) if len(first_line) > 80 else first_line
                if new_title:
                    crud.conversation.update(
                        db=db,
                        db_obj=conversation,
                        obj_in={"title": new_title},
                    )
        except Exception:
            # Title update should not break message creation
            pass
        # Trigger auto-capture only for user-authored messages
        try:
            content = (message_in.content or "").strip()
            if content and (message_in.role or "").lower() == "user":
                normalized_text = _normalize_user_text(content)
                # Preference capture (persists via store_preference)
                try:
                    _maybe_capture_preference(db, current_user, conversation_id, normalized_text)
                except Exception:
                    pass

                # Fast-capture notes: leading "note:" or "/note"
                try:
                    txt_lo = normalized_text.lower()
                    note_body = None
                    if txt_lo.startswith("note:"):
                        note_body = normalized_text[len("note:") :].strip()
                    elif txt_lo.startswith("/note"):
                        note_body = normalized_text[len("/note") :].strip()
                    if note_body:
                        ctx = {
                            "content_type": "fact",
                            "source": "chat:note",
                            "metadata": {"conversation_id": str(conversation_id)},
                        }
                        auto_memory_service.auto_capture_memory(
                            db,
                            user_id=str(current_user.id),
                            content=note_body,
                            context=ctx,
                        )
                        # If it's a note, skip generic capture to avoid duplicates
                        return message
                except Exception:
                    pass

                # Generic auto-capture for other messages
                try:
                    auto_memory_service.capture_from_message(
                        db,
                        user_id=str(current_user.id),
                        message=normalized_text,
                        conversation_id=str(conversation_id),
                    )
                except Exception:
                    pass
        except Exception:
            # Do not fail the API on capture issues
            pass
        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")
