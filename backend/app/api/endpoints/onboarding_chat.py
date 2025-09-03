"""
Onboarding-focused chat endpoint for Milestone 1: Living Onboarding + Memory Test
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.memory.service import memory_service
from app.core.llm import SimpleLLMClient

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    used_memory: bool


@router.post("/chat", response_model=ChatResponse)
async def chat_with_memory(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chat endpoint that focuses on using onboarding memory.
    This is the core of Milestone 1: Living Onboarding + Memory Test.
    """
    try:
        user_id = str(current_user.id)
        user_message = request.message.strip()
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Get onboarding memories using database query instead of vector search
        from app.crud import memory as memory_crud
        
        # Get memories with onboarding content types
        onboarding_memories = memory_crud.get_user_memories(
            db=db, 
            user_id=user_id, 
            content_type="onboarding_briefing", 
            limit=3
        )
        
        # Also get onboarding_summary memories if we don't have enough
        if len(onboarding_memories) < 3:
            summary_memories = memory_crud.get_user_memories(
                db=db, 
                user_id=user_id, 
                content_type="onboarding_summary", 
                limit=3 - len(onboarding_memories)
            )
            onboarding_memories.extend(summary_memories)
        
        # Build memory context
        memory_context = ""
        used_memory = False
        
        if onboarding_memories:
            used_memory = True
            memory_context = "\n\nBased on what you told me about yourself:\n"
            for memory in onboarding_memories:
                memory_context += f"- {memory.content}\n"
        
        # Create focused system prompt
        system_prompt = f"""You are a helpful AI assistant that remembers what the user told you during onboarding.

Key principles:
- Be natural and conversational
- Use the user's onboarding information when relevant
- Keep responses concise but helpful
- Don't make up information you don't have
- When the user asks about their morning, routines, preferences, or goals, reference what they told you

{memory_context}

Respond to the user's message naturally and helpfully, using their onboarding information when relevant."""

        # Generate response using LLM
        llm_client = SimpleLLMClient()
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        ai_response = llm_client.generate_response(
            system_prompt=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            max_tokens=300
        )
        
        return ChatResponse(
            reply=ai_response,
            used_memory=used_memory
        )
        
    except HTTPException:
        # Re-raise HTTPExceptions (like validation errors) without modification
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@router.get("/test-memory")
async def test_memory_retrieval(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Test endpoint to verify onboarding memory is stored and retrievable.
    """
    try:
        user_id = str(current_user.id)
        
        # Get all onboarding memories using database query instead of vector search
        from app.crud import memory as memory_crud
        
        # Get memories with onboarding content types
        memories = memory_crud.get_user_memories(
            db=db, 
            user_id=user_id, 
            content_type="onboarding_briefing", 
            limit=10
        )
        
        # Also get onboarding_summary memories
        summary_memories = memory_crud.get_user_memories(
            db=db, 
            user_id=user_id, 
            content_type="onboarding_summary", 
            limit=10
        )
        memories.extend(summary_memories)
        
        return {
            "user_id": user_id,
            "memory_count": len(memories),
            "memories": [
                {
                    "content": memory.content,
                    "content_type": memory.content_type,
                    "importance": getattr(memory, 'importance_score', None)
                }
                for memory in memories
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve memories: {str(e)}")
