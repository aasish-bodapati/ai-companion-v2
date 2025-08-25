"""
LLM streaming response handler.
"""

import logging
import asyncio
from typing import AsyncGenerator, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.llm import generate_with_openrouter_stream
from app.core.config import settings
from .base import client_disconnected
from .message_persistence import persist_assistant_message

logger = logging.getLogger(__name__)

def _is_trivial_greeting(text: str) -> bool:
    """Check if user input is a simple greeting."""
    if not text:
        return False
        
    lo_text = text.strip().lower()
    trivial_greetings = {"hi", "hello", "hey", "yo", "hola", "hi!", "hello!", "hey!"}
    
    if lo_text in trivial_greetings:
        return True
        
    try:
        import re
        return bool(re.match(r"^(hi|hello|hey)[\s!,.]*$", lo_text))
    except Exception:
        return False

async def stream_llm_response(
    conversation_id: UUID,
    message_content: str,
    db: Session,
    current_user: User,
    system_prompt: str,
    conversation_history: List[dict]
) -> AsyncGenerator[str, None]:
    """
    Stream LLM response with proper error handling and persistence.
    
    Args:
        conversation_id: Conversation UUID
        message_content: User message content
        db: Database session
        current_user: Current user
        system_prompt: System prompt for LLM
        conversation_history: Previous conversation messages
    """
    accumulated_parts: List[str] = []
    
    try:
        # Check for trivial greeting to adjust response length
        is_trivial = _is_trivial_greeting(message_content)
        
        # Adjust system prompt for greetings
        local_system_prompt = system_prompt
        if is_trivial:
            local_system_prompt = (
                f"{system_prompt}\n\n"
                "Guideline: If the user merely greets (e.g., 'hi', 'hello') without a question, "
                "reply in a single short friendly sentence."
            )
        
        # Set token limits based on message type
        max_tokens = 120 if is_trivial else 1000
        
        logger.debug(
            "llm.stream.start conv=%s history=%d model=%s max_tokens=%d trivial=%s",
            str(conversation_id), len(conversation_history), 
            settings.LLM_MODEL_DEFAULT, max_tokens, is_trivial
        )
        
        # Generate streaming response
        messages = conversation_history + [{"role": "user", "content": message_content}]
        
        async for chunk in generate_with_openrouter_stream(
            model=settings.LLM_MODEL_DEFAULT,
            system_prompt=local_system_prompt,
            messages=messages,
            max_tokens=max_tokens,
        ):
            if await client_disconnected():
                logger.debug("Client disconnected during LLM stream conv=%s", str(conversation_id))
                break
                
            if chunk and chunk.strip():
                logger.debug(
                    "llm.chunk conv=%s size=%d preview=%r",
                    str(conversation_id), len(chunk), chunk[:50]
                )
                yield f"data: {chunk}\n\n"
                await asyncio.sleep(0.01)  # Small delay for realistic streaming
                accumulated_parts.append(chunk)
        
        # Persist the complete response
        await persist_assistant_message(
            db=db,
            conversation_id=conversation_id,
            accumulated_parts=accumulated_parts,
            message_type="llm"
        )
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error(
            "llm.stream.error conv=%s error=%s", 
            str(conversation_id), str(e), exc_info=True
        )
        
        # Stream error message to user
        error_message = "I apologize, but I encountered an error while processing your request. Please try again."
        
        for char in error_message:
            if await client_disconnected():
                break
            yield f"data: {char}\n\n"
            await asyncio.sleep(0.01)
            accumulated_parts.append(char)
        
        # Try to persist error message
        await persist_assistant_message(
            db=db,
            conversation_id=conversation_id,
            accumulated_parts=accumulated_parts,
            message_type="error"
        )
        
        yield "data: [DONE]\n\n"
