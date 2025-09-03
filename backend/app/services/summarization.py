from __future__ import annotations

from typing import List, Dict, Optional, Tuple
from uuid import UUID, uuid4
import logging
import time
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session

from app.core.llm import generate_response
from app.core.config import settings
from app import crud

logger = logging.getLogger(__name__)


# Model can be overridden via env: settings.LLM_MODEL_SUMMARY or fallback to default
MODEL = (
    getattr(settings, "LLM_MODEL_SUMMARY", None)
    or getattr(settings, "LLM_MODEL_DEFAULT", None)
    or "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
).strip()
TEMPERATURE = 0.7
MAX_TOKENS = 1024  # enforced in core.llm.generate_response


def _build_system_prompt(user_id: str, conversation_id: str) -> str:
    # Include required identifiers to comply with AI Integration Rules
    return (
        "You are an AI assistant generating a concise conversation summary.\n"
        "- Always consider safety and do not fabricate content.\n"
        "- Keep it objective and short (3-6 bullet points or ~120-180 words).\n"
        "- Highlight goals, decisions, and follow-ups.\n"
        f"- user_id: {user_id}\n"
        f"- conversation_id: {conversation_id}\n"
    )


def _build_messages(transcript: List[Dict[str, str]]) -> List[Dict[str, str]]:
    # transcript is expected as [{"role": "user"|"assistant", "content": str}, ...]
    # We add a final instruction to summarize.
    
    messages = []
    for entry in transcript:
        messages.append({
            "role": entry["role"],
            "content": entry["content"]
        })
    
    # Add the summarization instruction
    messages.append({
        "role": "user",
        "content": "Please provide a concise summary of this conversation, highlighting key points, decisions, and any follow-up actions."
    })
    
    return messages


def generate_conversation_summary(
    db: Session,
    *,
    conversation_id: UUID,
    user_id: UUID,
    limit_messages: int = 30,
) -> str:
    """
    Generate a concise summary of a conversation.
    
    This is the simplified version that only provides basic conversation summarization.
    """
    try:
        # Get recent messages from the conversation
        messages = crud.message.get_by_conversation(
            db, conversation_id, limit=limit_messages
        )
        
        if not messages:
            return "(empty) No messages to summarize."
        
        # Build transcript
        transcript = []
        for message in messages:
            role = "user" if message.role == "user" else "assistant"
            content = (message.content or "").strip()
            if content:
                # Cap extremely long content to avoid token limits
                if len(content) > 4000:
                    content = content[:4000] + " …"
                transcript.append({
                    "role": role,
                    "content": content
                })
        
        if not transcript:
            return "(empty) No content to summarize."
        
        # Build system prompt
        system_prompt = _build_system_prompt(str(user_id), str(conversation_id))
        
        # Generate summary
        summary = generate_response(
            model=MODEL,
            system_prompt=system_prompt,
            messages=_build_messages(transcript)
        )
        
        return (summary or "").strip() or "(stub) Summarization failed; using fallback."
        
    except Exception as e:
        logger.error(
            f"Error generating conversation summary for conversation {conversation_id}: {e}",
            exc_info=True,
        )
        return "(stub) Summarization failed; using fallback."


# Simplified summarization - removed complex IntelligentSummarizer
# Only basic conversation summarization is kept for essential functionality