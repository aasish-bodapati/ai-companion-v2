"""
LLM streaming response handler.
"""

import logging
import asyncio
from typing import AsyncGenerator, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.llm import generate_response_stream
from app.core.config import settings
from .base import client_disconnected
from .message_persistence import persist_assistant_message
from app.services.web_search import web_search_service

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

def _needs_web_search(text: str) -> bool:
    """Check if the user's message requires web search."""
    if not text:
        return False
        
    lo_text = text.strip().lower()
    
    # Patterns that indicate web search is needed
    web_search_patterns = [
        "latest", "recent", "current", "today", "news", "weather", "stock price",
        "what's happening", "what happened", "search for", "look up", "find information",
        "what's new", "breaking news", "today's", "this week", "this month"
    ]
    
    return any(pattern in lo_text for pattern in web_search_patterns)

async def _perform_web_search(query: str, max_results: int = 3) -> str:
    """Perform web search and format results for LLM context."""
    try:
        results = await web_search_service.search_web(query, max_results)
        
        if not results:
            return "No recent information found on this topic."
        
        formatted_results = []
        for result in results:
            formatted_results.append(
                f"• {result['title']}\n  {result['snippet']}\n  Source: {result['source']}"
            )
        
        return f"Here's what I found:\n\n" + "\n\n".join(formatted_results)
        
    except Exception as e:
        logger.error(f"Web search failed: {e}")
        return "I'm unable to search for current information right now."

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
        
        # Check if web search is needed
        needs_search = _needs_web_search(message_content)
        
        # Perform web search if needed
        search_context = ""
        if needs_search:
            logger.debug(f"Performing web search for: {message_content}")
            search_context = await _perform_web_search(message_content)
        
        # Adjust system prompt for greetings and web search
        local_system_prompt = system_prompt
        if is_trivial:
            local_system_prompt = (
                f"{system_prompt}\n\n"
                "Guideline: If the user merely greets (e.g., 'hi', 'hello') without a question, "
                "reply in a single short friendly sentence."
            )
        elif search_context:
            local_system_prompt = (
                f"{system_prompt}\n\n"
                f"Current web search results:\n{search_context}\n\n"
                "Use this current information to answer the user's question. "
                "Be helpful and informative while citing the sources when relevant."
            )
        
        # Set token limits based on message type
        max_tokens = 120 if is_trivial else 1000
        
        logger.debug(
            "llm.stream.start conv=%s history=%d model=%s max_tokens=%d trivial=%s",
            str(conversation_id), len(conversation_history), 
            settings.LLM_MODEL_DEFAULT, max_tokens, is_trivial
        )
        
        # Generate response using real streaming
        messages = conversation_history + [{"role": "user", "content": message_content}]
        
        async for chunk in generate_response_stream(
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
