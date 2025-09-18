"""
Simplified conversation messages endpoint - Health-focused chat only
"""

import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session

from typing import List
from app import crud
from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.schemas.conversation import MessageCreate, AssistantReply, Message, ConversationCreate
from app.core.llm import SimpleLLMClient
from app.core.config import settings
from app.crud import conversation as crud_conversation
from app.crud.conversation import message as crud_message

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/{conversation_id}/messages", response_model=AssistantReply)
async def create_message(
    conversation_id: UUID,
    message_in: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> AssistantReply:
    """Create a new message in a conversation with health-focused AI coaching."""
    
    # Verify conversation belongs to user
    conversation = crud_conversation.get(db, id=conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create the user message
    user_message = crud_message.create(
        db, 
        obj_in={
            "content": message_in.content,
            "role": "user",
            "conversation_id": conversation_id
        }
    )
    
    # Get recent conversation history for context
    recent_messages = crud_message.get_recent_messages(
        db, 
        conversation_id=conversation_id, 
        limit=10
    )
    
    # Create health-focused system prompt
    system_prompt = f"""You are a health and fitness AI coach. Your role is to:

1. Help users track their health and fitness goals
2. Provide motivation and encouragement for healthy habits
3. Answer questions about nutrition, exercise, and wellness
4. Suggest improvements to their health routines
5. Be supportive and non-judgmental

User: {current_user.email}
Current conversation: {len(recent_messages)} messages

Keep responses focused on health, fitness, and wellness topics. Be encouraging and helpful."""
    
    # Generate AI response
    try:
        llm_client = SimpleLLMClient()
        
        # Build conversation context
        conversation_context = []
        for msg in recent_messages[-5:]:  # Last 5 messages for context
            conversation_context.append(f"{msg.role}: {msg.content}")
        
        context_text = "\n".join(conversation_context)
        
        # Generate response
        messages = [
            {"role": "user", "content": message_in.content}
        ]
        response = llm_client.generate_response(
            system_prompt=system_prompt,
            messages=messages
        )
        
        # Create assistant message
        assistant_message = crud_message.create(
            db,
            obj_in={
                "content": response,
                "role": "assistant", 
                "conversation_id": conversation_id
            }
        )
        
        return AssistantReply(
            id=assistant_message.id,
            message=assistant_message.content,
            message_id=assistant_message.id,
            provenance=[],
            used_llm=True
        )
        
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate response")

@router.get("/{conversation_id}/messages", response_model=List[Message])
async def get_messages(
    conversation_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[Message]:
    """Get messages from a conversation."""
    
    # Verify conversation belongs to user
    conversation = crud_conversation.get(db, id=conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = crud_message.get_multi_by_conversation(
        db, 
        conversation_id=conversation_id,
        skip=skip,
        limit=limit
    )
    
    return messages

@router.post("/{conversation_id}/reply", response_model=AssistantReply)
async def reply_to_conversation(
    conversation_id: UUID,
    message_in: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> AssistantReply:
    """Send a message and get an AI reply - simplified endpoint for frontend compatibility."""
    
    # Verify conversation belongs to user
    conversation = crud_conversation.get(db, id=conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create the user message
    user_message = crud_message.create(
        db, 
        obj_in={
            "content": message_in.content,
            "role": "user",
            "conversation_id": conversation_id
        }
    )
    
    # Get recent conversation history for context
    recent_messages = crud_message.get_recent_messages(
        db, 
        conversation_id=conversation_id, 
        limit=10
    )
    
    # Create health-focused system prompt
    system_prompt = f"""You are a health and fitness AI coach. Your role is to:

1. Help users track their health and fitness goals
2. Provide motivation and encouragement for healthy habits
3. Answer questions about nutrition, exercise, and wellness
4. Suggest improvements to their health routines
5. Be supportive and non-judgmental

User: {current_user.email}
Current conversation: {len(recent_messages)} messages

Keep responses focused on health, fitness, and wellness topics. Be encouraging and helpful."""
    
    # Generate AI response
    try:
        llm_client = SimpleLLMClient()
        
        # Build conversation context
        conversation_context = []
        for msg in recent_messages[-5:]:  # Last 5 messages for context
            conversation_context.append(f"{msg.role}: {msg.content}")
        
        context_text = "\n".join(conversation_context)
        
        # Generate response
        messages = [
            {"role": "user", "content": message_in.content}
        ]
        response = llm_client.generate_response(
            system_prompt=system_prompt,
            messages=messages
        )
        
        # Create assistant message
        assistant_message = crud_message.create(
            db,
            obj_in={
                "content": response,
                "role": "assistant", 
                "conversation_id": conversation_id
            }
        )
        
        return AssistantReply(
            id=assistant_message.id,
            message=assistant_message.content,
            message_id=assistant_message.id,
            provenance=[],
            used_llm=True
        )
        
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate response")

@router.get("/new/messages", response_model=List[Message])
async def get_new_conversation_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[Message]:
    """Get messages for a new conversation - returns empty list for frontend compatibility."""
    return []

@router.post("/new/messages-and-reply", response_model=AssistantReply)
async def create_new_conversation_and_reply(
    message_in: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> AssistantReply:
    """Create a new conversation and send the first message with AI reply."""
    
    # Create a new conversation
    conversation_in = ConversationCreate(
        title="New Conversation",
        personalization_enabled=True,
        incognito_mode=False
    )
    conversation = crud.conversation.create_with_user(
        db, obj_in=conversation_in, user_id=current_user.id
    )
    
    # Create the user message
    user_message = crud.message.create(
        db, 
        obj_in={
            "content": message_in.content,
            "role": "user",
            "conversation_id": conversation.id
        }
    )
    
    # Create health-focused system prompt
    system_prompt = f"""You are a health and fitness AI coach. Your role is to:

1. Help users track their health and fitness goals
2. Provide motivation and encouragement for healthy habits
3. Answer questions about nutrition, exercise, and wellness
4. Suggest improvements to their health routines
5. Be supportive and non-judgmental

User: {current_user.email}
This is a new conversation.

Keep responses focused on health, fitness, and wellness topics. Be encouraging and helpful."""
    
    # Generate AI response
    try:
        llm_client = SimpleLLMClient()
        
        # Generate response
        messages = [
            {"role": "user", "content": message_in.content}
        ]
        response = llm_client.generate_response(
            system_prompt=system_prompt,
            messages=messages
        )
        
        # Create assistant message
        assistant_message = crud.message.create(
            db,
            obj_in={
                "content": response,
                "role": "assistant", 
                "conversation_id": conversation.id
            }
        )
        
        return AssistantReply(
            message=assistant_message,
            conversation_id=conversation.id
        )
        
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate response")