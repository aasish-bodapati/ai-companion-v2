"""
Message persistence utilities for streaming responses.
"""

import logging
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session

from app import crud
from app.schemas.conversation import MessageCreate

logger = logging.getLogger(__name__)

async def persist_assistant_message(
    db: Session,
    conversation_id: UUID,
    accumulated_parts: List[str],
    message_type: str = "assistant"
) -> bool:
    """
    Persist accumulated streaming response as an assistant message.
    
    Args:
        db: Database session
        conversation_id: Conversation UUID
        accumulated_parts: List of text chunks to join
        message_type: Type of message for logging
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        final_text = "".join(accumulated_parts).strip()
        if not final_text:
            logger.warning(
                "persist.empty_content conv=%s type=%s", 
                str(conversation_id), message_type
            )
            return False
            
        logger.debug(
            "persist.%s conv=%s len=%d preview=%r",
            message_type, str(conversation_id), len(final_text), final_text[:80]
        )
        
        crud.message.create_with_conversation(
            db=db,
            obj_in=MessageCreate(role="assistant", content=final_text),
            conversation_id=conversation_id,
        )
        return True
        
    except Exception as e:
        logger.warning(
            "persist.failed conv=%s type=%s error=%s", 
            str(conversation_id), message_type, str(e)
        )
        return False
