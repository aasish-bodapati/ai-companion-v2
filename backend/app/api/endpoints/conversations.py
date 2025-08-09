import logging
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.schemas.conversation import Conversation, ConversationCreate, ConversationWithMessages, Message, MessageCreate

logger = logging.getLogger(__name__)
logger.info("Initializing conversations router...")

router = APIRouter()
logger.info("Created conversations router")

@router.get("/", response_model=List[Conversation])
async def list_conversations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    logger.info(f"List conversations endpoint called by user {current_user.id}")
    """
    Retrieve all conversations for the current user, ordered by most recently updated.
    """
    conversations = crud.conversation.get_multi_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return conversations

@router.post("/", response_model=Conversation, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_in: ConversationCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new conversation.
    """
    conversation = crud.conversation.create_with_owner(
        db=db, obj_in=conversation_in, owner_id=current_user.id
    )
    return conversation

@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get a specific conversation with all its messages.
    """
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return conversation

@router.get("/{conversation_id}/messages", response_model=List[Message])
async def list_messages(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get all messages for a specific conversation.
    """
    # Verify conversation exists and belongs to user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    messages = crud.message.get_by_conversation(db, conversation_id=conversation_id)
    return messages

@router.post(
    "/{conversation_id}/messages",
    response_model=Message,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    conversation_id: UUID,
    message_in: MessageCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new message in a conversation.
    """
    # Verify conversation exists and belongs to user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Create the message
    message = crud.message.create_with_conversation(
        db=db, obj_in=message_in, conversation_id=conversation_id
    )
    
    # Update conversation's updated_at timestamp (handled by SQLAlchemy's onupdate)
    
    return message
