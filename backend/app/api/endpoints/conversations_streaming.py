"""
Conversation Endpoints
Provides complete response replies (no streaming)
"""

import logging
import re
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.memory.service import MemoryService
from app.api.endpoints.streaming.llm_handler import stream_llm_response

logger = logging.getLogger(__name__)

router = APIRouter()


# Note: Removed hardcoded sensitive detection - AI now handles this naturally through enhanced system prompt
_RE_SECRET_LIKE = [
    re.compile(r"(?i)\b(pass(?:word)?|pwd)\b\s*[:=]\s*\S{3,}"),
    re.compile(r"(?i)\b(api[_-]?key|secret|token|bearer)\b\s*[:=]\s*[A-Za-z0-9_\-]{8,}"),
    re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bghp_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"(?i)aws(.{0,20})secret(.{0,5})key\s*[:=]\s*[A-Za-z0-9/+=]{30,}"),
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),  # SSN
    re.compile(r"\b(?:\d[ -]*?){13,19}\b"),   # credit card-ish
]
_RE_EMAIL = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_RE_PHONE = re.compile(r"\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}\b")


# Note: Removed hardcoded sensitive detection - AI now handles this naturally through enhanced system prompt


def _sanitize_chunk(text: str) -> str:
    try:
        t = text or ""
        # redact secrets aggressively
        for rx in _RE_SECRET_LIKE:
            try:
                if rx.search(t):
                    t = rx.sub("[REDACTED_SECRET]", t)
            except Exception:
                continue
        # redact low-risk identifiers
        try:
            t = _RE_EMAIL.sub("[REDACTED_EMAIL]", t)
        except Exception:
            pass
        try:
            t = _RE_PHONE.sub("[REDACTED_PHONE]", t)
        except Exception:
            pass
        return t
    except Exception:
        return text


@router.post("/{conversation_id}/reply")
async def reply_to_conversation(
    *,
    db: Session = Depends(deps.get_db),
    conversation_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
    request: Request,
):
    """
    Get complete AI reply to a conversation message (no streaming).
    """
    try:
        # Get conversation and verify ownership
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        # Get conversation messages (ordered by creation time)
        messages = crud.message.get_by_conversation(
            db=db, conversation_id=conversation_id, skip=0, limit=200
        )
        if not messages:
            raise HTTPException(status_code=400, detail="No messages in conversation")

        # Find the last user message
        last_user_message = None
        for message in reversed(messages):
            if message.role == "user":
                last_user_message = message
                break

        if not last_user_message:
            raise HTTPException(status_code=400, detail="No user message found")

        # Build conversation history for LLM
        conversation_history = []
        for msg in messages:
            conversation_history.append({"role": msg.role, "content": msg.content})

        # Build system prompt and conversation context using MemoryService (correct API)
        memory_service = MemoryService()
        base_prompt = memory_service.build_personalized_system_prompt(
            db=db, user_id=str(current_user.id)
        )
        conv_context = memory_service.get_conversation_context(
            db=db,
            user_id=str(current_user.id),
            conversation_id=str(conversation_id),
            current_message=last_user_message.content or "",
        )
        # Enhanced system prompt to guide AI on handling sensitive requests naturally
        security_guidance = """
IMPORTANT: You are a personal AI assistant who prioritizes user security and privacy. If a user asks for sensitive information like passwords, SSNs, credit card numbers, API keys, or other credentials, respond naturally and conversationally while firmly declining to provide such information. 

Instead of being robotic, explain why you can't help with sensitive data in a caring, personal way. Offer alternative solutions when appropriate, such as suggesting they use official account recovery methods or contact their service provider directly.

Maintain your personal assistant tone while ensuring security best practices.

CRITICAL: If the user's current message contains sensitive keywords (like "SSN", "password", "credit card", etc.), you MUST respond directly to that specific request and decline to provide such information. Do not respond to general conversation context when sensitive information is requested.
"""
        # Check if current message contains sensitive content
        current_message_lower = last_user_message.content.lower()
        sensitive_keywords = ['ssn', 'password', 'credit card', 'api key', 'secret', 'token', 'social security']
        is_sensitive_request = any(keyword in current_message_lower for keyword in sensitive_keywords)
        
        # Debug logging
        logger.info(f"Current message: '{last_user_message.content}'")
        logger.info(f"Current message lower: '{current_message_lower}'")
        logger.info(f"Is sensitive request: {is_sensitive_request}")
        
        if is_sensitive_request:
            # Force a specific response for sensitive requests
            system_prompt = f"""You are a personal AI assistant. The user has requested sensitive information: "{last_user_message.content}"

IMPORTANT: You must decline to provide any sensitive information like SSNs, passwords, credit cards, API keys, or other credentials. 

Respond naturally and conversationally while firmly declining. Explain why you can't help with sensitive data in a caring, personal way. Offer alternative solutions when appropriate.

DO NOT provide any sensitive information, even if you have it stored in memory. Focus ONLY on the current request and decline appropriately."""
        else:
            # Add explicit instruction about the current message
            current_message_instruction = f"\n\nCURRENT USER MESSAGE: {last_user_message.content}\n\nIMPORTANT: Respond directly to the current user message above. If it contains sensitive information requests, address those specifically."
            system_prompt = f"{base_prompt}\n\n{security_guidance}\n\nContext:\n{conv_context}{current_message_instruction}" if conv_context else f"{base_prompt}\n\n{security_guidance}{current_message_instruction}"

        # Get complete response
        try:
            full_response = ""
            async for chunk in stream_llm_response(
                conversation_id=conversation_id,
                message_content=last_user_message.content,
                db=db,
                current_user=current_user,
                system_prompt=system_prompt,
                conversation_history=conversation_history,
            ):
                # Accumulate the complete response
                sanitized = _sanitize_chunk(chunk)
                full_response += sanitized
            
            return {"content": full_response, "status": "success"}
        except Exception as e:
            logger.error(f"Error in response generation: {e}")
            raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in reply endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate reply")


logger.info("🔍 CONVERSATIONS: Reply router initialized")
