"""
Calendar-specific streaming response handler.
"""

import logging
import asyncio
from typing import AsyncGenerator, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from .base import client_disconnected
from .message_persistence import persist_assistant_message

logger = logging.getLogger(__name__)


async def stream_calendar_response(
    conversation_id: UUID, calendar_response: str, db: Session, current_user: User
) -> AsyncGenerator[str, None]:
    """
    Stream calendar command response with proper persistence.

    Args:
        conversation_id: Conversation UUID
        calendar_response: Calendar response text to stream
        db: Database session
        current_user: Current user
    """
    accumulated_parts: List[str] = []

    try:
        logger.debug(
            "calendar.stream.start conv=%s len=%d", str(conversation_id), len(calendar_response)
        )

        # Stream the calendar response character by character
        for char in calendar_response:
            if await client_disconnected():
                logger.debug(
                    "Client disconnected during calendar stream conv=%s", str(conversation_id)
                )
                break
            yield f"data: {char}\n\n"
            await asyncio.sleep(0.01)  # Small delay for realistic streaming
            accumulated_parts.append(char)

        # Persist the calendar response
        await persist_assistant_message(
            db=db,
            conversation_id=conversation_id,
            accumulated_parts=accumulated_parts,
            message_type="calendar",
        )

        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(
            "calendar.stream.error conv=%s error=%s", str(conversation_id), str(e), exc_info=True
        )

        # Stream error message
        error_message = "I encountered an error processing your calendar request. Please try again."

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
            message_type="calendar_error",
        )

        yield "data: [DONE]\n\n"
