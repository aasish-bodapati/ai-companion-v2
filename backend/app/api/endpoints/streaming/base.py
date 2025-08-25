"""
Base streaming functionality and utilities.
"""

import logging
import asyncio
from typing import AsyncGenerator, Optional
from uuid import UUID

logger = logging.getLogger(__name__)

async def client_disconnected() -> bool:
    """
    Check if the client has disconnected.
    TODO: Implement proper connection state checking.
    """
    try:
        # Placeholder - in production, check actual connection state
        return False
    except Exception:
        return True

async def stream_text_chunks(
    text: str, 
    conversation_id: UUID, 
    chunk_delay: float = 0.01
) -> AsyncGenerator[str, None]:
    """
    Stream text character by character with SSE formatting.
    
    Args:
        text: Text to stream
        conversation_id: Conversation UUID for logging
        chunk_delay: Delay between chunks in seconds
    """
    logger.debug(
        "streaming text conv=%s len=%d", 
        str(conversation_id), len(text)
    )
    
    for char in text:
        if await client_disconnected():
            logger.debug("Client disconnected, stopping stream conv=%s", str(conversation_id))
            break
        yield f"data: {char}\n\n"
        await asyncio.sleep(chunk_delay)

async def finalize_stream() -> AsyncGenerator[str, None]:
    """Send stream completion marker."""
    yield "data: [DONE]\n\n"
