import logging
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.schemas.conversation import Conversation, ConversationCreate, ConversationWithMessages, Message, MessageCreate
from app.core.config import settings
from app.memory import memory_enabled
from app.memory.embeddings import embed_texts
from app.memory.faiss_store import add as faiss_add
from app.memory.faiss_store import search as faiss_search
from app.core.llm import generate_with_together

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
    # Background-like: embed and index if memory enabled (synchronous for now; can move to BackgroundTasks)
    try:
        if memory_enabled():
            vecs = embed_texts([message.content])
            faiss_add(str(current_user.id), [str(message.id)], vecs)
    except Exception:
        # Do not fail the request if memory operations fail
        pass

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
    - Builds a simple system prompt; can be extended with onboarding persona later.
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

    retrieved_snippets: List[str] = []
    if memory_enabled() and last_user_input:
        try:
            qvec = embed_texts([last_user_input])[0]
            top_k = getattr(settings, "RETRIEVAL_TOP_K", 8)
            hits = faiss_search(str(current_user.id), qvec, top_k)
            # For now we only have ids; future: map ids -> texts via DB when adding memory nodes
            # As a simple interim, we can include recent user texts (already in recent_msgs)
        except Exception:
            pass

    # Build system prompt (can include onboarding persona later)
    system_prompt = (
        "You are a helpful, attentive AI companion. Be concise, friendly, and context-aware."
    )

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
    return assistant
