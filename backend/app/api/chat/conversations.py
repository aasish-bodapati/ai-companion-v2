"""
Conversations API endpoints - CRUD operations for conversations
"""

import logging
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.schemas.conversation import Conversation, ConversationCreate, ConversationUpdate, ConversationWithMessages

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[Conversation])
async def get_conversations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[Conversation]:
    """Get all conversations for the current user."""
    conversations = crud.conversation.get_multi_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return conversations

@router.get("/new", response_model=Conversation)
async def get_new_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Conversation:
    """Get or create a new conversation - for frontend compatibility."""
    # Create a new conversation if none exists
    conversation_in = ConversationCreate(
        title="New Conversation",
        personalization_enabled=True,
        incognito_mode=False
    )
    conversation = crud.conversation.create_with_user(
        db, obj_in=conversation_in, user_id=current_user.id
    )
    return conversation

@router.post("/new", response_model=Conversation)
async def create_new_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Conversation:
    """Create a new conversation with default settings."""
    conversation_in = ConversationCreate(
        title="New Conversation",
        personalization_enabled=True,
        incognito_mode=False
    )
    conversation = crud.conversation.create_with_user(
        db, obj_in=conversation_in, user_id=current_user.id
    )
    return conversation

@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> ConversationWithMessages:
    """Get a specific conversation with its messages."""
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages for this conversation
    messages = crud.message.get_multi_by_conversation(
        db, conversation_id=conversation_id, skip=0, limit=1000
    )
    
    return ConversationWithMessages(
        **conversation.__dict__,
        messages=messages
    )

@router.post("/", response_model=Conversation)
async def create_conversation(
    conversation_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Conversation:
    """Create a new conversation."""
    conversation = crud.conversation.create_with_user(
        db, obj_in=conversation_in, user_id=current_user.id
    )
    return conversation

@router.put("/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: UUID,
    conversation_in: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Conversation:
    """Update a conversation."""
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = crud.conversation.update(
        db, db_obj=conversation, obj_in=conversation_in
    )
    return conversation

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict:
    """Delete a conversation."""
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    crud.conversation.remove(db, id=conversation_id)
    return {"message": "Conversation deleted successfully"}

# CONVERSATIONS: Main router initialized with CRUD endpoints
