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
from app.core.config import settings
from app.memory import memory_enabled
from app.memory.embeddings import embed_texts
from app.memory.faiss_store import add as faiss_add
from app.memory.faiss_store import search as faiss_search
from app.core.llm import generate_with_together
from app.memory.service import memory_service

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

@router.put("/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: UUID,
    conversation_in: ConversationUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update conversation fields (e.g., title).
    """
    # Ensure the conversation exists and belongs to the user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    updated = crud.conversation.update(db, db_obj=conversation, obj_in=conversation_in)
    return updated

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Delete a conversation owned by the current user.
    """
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    crud.conversation.remove(db, id=str(conversation_id))
    return None

@router.get("/{conversation_id}/messages", response_model=List[Message])
async def list_messages(
    conversation_id: UUID,
    skip: int = 0,
    limit: int = 100,
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
    
    messages = crud.message.get_by_conversation(
        db, conversation_id=conversation_id, skip=skip, limit=limit
    )
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
    
    # Auto-title conversation on first user message if title is empty
    try:
        if message.role == 'user' and (conversation.title is None or str(conversation.title).strip() == ''):
            proposed = (message.content or '').strip().split('\n', 1)[0][:80]
            if proposed:
                from app.schemas.conversation import ConversationUpdate
                updated = crud.conversation.update(
                    db=db,
                    db_obj=conversation,
                    obj_in=ConversationUpdate(title=proposed)
                )
                conversation = updated
    except Exception as e:
        logger.warning(f"Failed to auto-title conversation: {e}")
    # Store message in memory system if enabled
    try:
        if memory_enabled():
            memory_service.store_memory(
                db=db,
                content=message.content,
                content_type="message",
                user_id=str(current_user.id),
                conversation_id=str(conversation_id),
                metadata={"message_id": str(message.id), "role": message.role}
            )
    except Exception as e:
        logger.warning(f"Failed to store message in memory: {e}")
        # Do not fail the request if memory operations fail

    return message


@router.post("/{conversation_id}/reply", response_model=Message)
async def reply(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Generate an assistant reply using Together AI.
    - Retrieves top-k memories from FAISS if enabled; otherwise falls back to recent messages.
    - Builds a personalized system prompt based on user's onboarding profile.
    - Always includes user profile context for personalized responses.
    """
    # Verify conversation belongs to user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Fetch recent messages for context and to build a query
    recent_msgs = crud.message.get_by_conversation(db, conversation_id=conversation_id, skip=0, limit=10)
    user_texts = [m.content for m in recent_msgs if m.role == "user"]
    last_user_input = user_texts[-1] if user_texts else ""

    # Get personalized system prompt and context from memory service if enabled
    system_prompt = ""
    context = ""
    
    if memory_enabled():
        try:
            # Build personalized system prompt based on user's onboarding profile
            system_prompt = memory_service.build_personalized_system_prompt(
                db=db, 
                user_id=str(current_user.id)
            )
            
            # Get conversation context including profile memory
            context = memory_service.get_conversation_context(
                db=db,
                user_id=str(current_user.id),
                conversation_id=str(conversation_id),
                recent_messages=settings.RETRIEVAL_RECENT_MESSAGES,
                memory_limit=settings.RETRIEVAL_TOP_K,
            )
        except Exception as e:
            logger.warning(f"Failed to retrieve memory context: {e}")
            # Fallback to basic system prompt
            system_prompt = "You are a helpful, attentive AI companion. Be concise, friendly, and context-aware."
            context = ""
    else:
        # Fallback when memory is disabled
        system_prompt = "You are a helpful, attentive AI companion. Be concise, friendly, and context-aware."
        context = ""
    
    # Add context to system prompt if available
    if context:
        system_prompt += f"\n\nContext:\n{context}"

    chat_messages = [
        {"role": m.role, "content": m.content} for m in recent_msgs[-6:]
    ]

    model = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    content = generate_with_together(model=model, system_prompt=system_prompt, messages=chat_messages)

    # Persist assistant message
    assistant = crud.message.create_with_conversation(
        db=db,
        obj_in=MessageCreate(role="assistant", content=content),
        conversation_id=conversation_id,
    )
    
    # Store assistant message in memory system if enabled
    try:
        if memory_enabled():
            memory_service.store_memory(
                db=db,
                content=content,
                content_type="message",
                user_id=str(current_user.id),
                conversation_id=str(conversation_id),
                metadata={"message_id": str(assistant.id), "role": "assistant"}
            )
    except Exception as e:
        logger.warning(f"Failed to store assistant message in memory: {e}")
        # Do not fail the request if memory operations fail
    
    return assistant
