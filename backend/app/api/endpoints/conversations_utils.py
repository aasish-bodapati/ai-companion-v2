"""
Conversation utility functions - extracted from conversations.py
Handles text normalization, preference capture, memory building, and action suggestions.
"""

import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.memory.service import memory_service
from app.services.auto_memory import auto_memory_service

logger = logging.getLogger(__name__)

def _add_proactive_context(db: Session, user_id: str, conversation_id: str, system_prompt: str) -> str:
    """
    Augment the system prompt with lightweight proactive context.

    This helper is intentionally conservative so that streaming never fails if
    optional services are unavailable. It currently acts as a safe no-op that
    can be expanded later to stitch in conversation state (themes, emotions,
    ongoing goals) or other hints. Any exception is swallowed and the original
    prompt is returned unchanged.
    """
    try:
        # Future hook: incorporate conversation_state_manager signals if present.
        # We keep behavior minimal to avoid changing tone unexpectedly.
        _ = (db, user_id, conversation_id)  # suppress unused warnings
        return system_prompt
    except Exception:
        return system_prompt

def _normalize_user_text(text: str) -> str:
    """
    Lightweight normalization for common benign typos.

    - "inlike" -> "i like"
    - "ilike" -> "i like"
    - collapse multiple spaces
    - trim
    """
    s = (text or "")
    if not s:
        return s
    t = s.strip()
    lo = t.lower()
    # Only apply if it's not a slash command
    if lo.startswith("/"):
        return t
    # Specific safe corrections
    lo = re.sub(r"\binlike\b", "i like", lo)
    lo = re.sub(r"\bilike\b", "i like", lo)
    # Collapse repeated spaces
    lo = re.sub(r"\s+", " ", lo).strip()
    return lo

def _maybe_capture_preference(db: Session, user: User, conversation_id: UUID, text: str) -> Tuple[Optional[str], bool]:
    """
    Detect simple preference statements and store them.

    Returns (subject, is_pure):
      - subject: the extracted liked thing, or None
      - is_pure: True if the whole message is just the preference statement, False if it's embedded
    """
    try:
        s = (text or "").strip()
        if not s:
            return None, False
            
        # Look for simple "I like X" patterns
        like_patterns = [
            r"^i\s+like\s+(.+)$",
            r"^i\s+love\s+(.+)$",
            r"^i\s+enjoy\s+(.+)$",
            r"^i\s+prefer\s+(.+)$",
            r"^i\s+am\s+into\s+(.+)$",
        ]
        
        for pattern in like_patterns:
            match = re.match(pattern, s.lower())
            if match:
                subject = _clean_subject(match.group(1))
                if subject:
                    # Store the preference
                    try:
                        auto_memory_service.store_preference(
                            user_id=str(user.id),
                            conversation_id=str(conversation_id),
                            subject=subject,
                            context=text,
                            db=db,
                        )
                        return subject, True
                    except Exception as e:
                        logger.warning(f"Failed to store preference: {e}")
                        return subject, True
                        
        # Look for embedded preferences
        embedded_patterns = [
            r"\bi\s+like\s+([^.]+)",
            r"\bi\s+love\s+([^.]+)",
            r"\bi\s+enjoy\s+([^.]+)",
        ]
        
        for pattern in embedded_patterns:
            match = re.search(pattern, s.lower())
            if match:
                subject = _clean_subject(match.group(1))
                if subject:
                    # Store the preference
                    try:
                        auto_memory_service.store_preference(
                            user_id=str(user.id),
                            conversation_id=str(conversation_id),
                            subject=subject,
                            context=text,
                            db=db,
                        )
                        return subject, False
                    except Exception as e:
                        logger.warning(f"Failed to store embedded preference: {e}")
                        return subject, False
                        
        return None, False
        
    except Exception as e:
        logger.warning(f"Error in preference capture: {e}")
        return None, False

def _clean_subject(subj: str) -> str:
    """
    Clean up extracted subject text.
    """
    try:
        if not subj:
            return ""
        # Remove common trailing words
        subj = re.sub(r"\s+(?:a\s+lot|very\s+much|so\s+much|really)\s*$", "", subj, flags=re.IGNORECASE)
        # Remove punctuation at the end
        subj = re.sub(r"[.!?,\s]+$", "", subj)
        # Remove leading articles
        subj = re.sub(r"^(?:the\s+|a\s+|an\s+)", "", subj, flags=re.IGNORECASE)
        return subj.strip()
    except Exception:
        return subj.strip() if subj else ""

def _polish_ai_response(text: str, user_text: str) -> str:
    """
    Light post-processor to keep replies concise and human-like.

    - Trim whitespace
    - Limit to ~12 lines to avoid verbosity
    - Allow at most one question (keep the first; convert others to statements)
    """
    try:
        t = (text or "").strip()
        if not t:
            return t
        lines = t.splitlines()
        # Preserve small code blocks, but overall cap output length
        if len(lines) > 12:
            lines = lines[:12]
        new_lines: List[str] = []
        q_used = 0
        for ln in lines:
            if "?" in ln:
                if q_used == 0:
                    new_lines.append(ln)
                    q_used = 1
                else:
                    new_lines.append(ln.replace("?", "."))
            else:
                new_lines.append(ln)
        return "\n".join(new_lines).strip()
    except Exception:
        return (text or "").strip()

def _suggest_actions_for(text: str) -> List[Dict[str, Any]]:
    """
    Suggest relevant actions based on the user's message.
    """
    try:
        suggestions = []
        text_lower = text.lower()
        
        # Calendar suggestions
        if any(word in text_lower for word in ["meeting", "appointment", "schedule", "calendar", "event"]):
            suggestions.append({
                "type": "calendar",
                "action": "add_event",
                "description": "Add this to your calendar",
                "icon": "📅"
            })
        
        # Memory suggestions
        if any(word in text_lower for word in ["remember", "remind", "note", "save"]):
            suggestions.append({
                "type": "memory",
                "action": "save_memory",
                "description": "Save this to memory",
                "icon": "💾"
            })
        
        # Task suggestions
        if any(word in text_lower for word in ["todo", "task", "action", "do", "need to"]):
            suggestions.append({
                "type": "task",
                "action": "create_task",
                "description": "Create a task",
                "icon": "✅"
            })
        
        return suggestions
        
    except Exception as e:
        logger.warning(f"Error suggesting actions: {e}")
        return []

def _seems_specific(text: str) -> bool:
    """
    Check if the text seems like a specific request or statement.
    """
    try:
        if not text:
            return False
            
        text_lower = text.lower()
        
        # Specific patterns
        specific_indicators = [
            r"\b\d{1,2}:\d{2}\s*(?:am|pm)\b",  # Time
            r"\b(?:today|tomorrow|yesterday|next\s+week|this\s+weekend)\b",  # Date
            r"\b(?:meeting|appointment|call|lunch|dinner|breakfast)\b",  # Event types
            r"\b(?:with\s+\w+)\b",  # People
            r"\b(?:at\s+\w+)\b",  # Location
        ]
        
        for pattern in specific_indicators:
            if re.search(pattern, text_lower):
                return True
                
        # Check for specific nouns and proper names
        if re.search(r"\b[A-Z][a-z]+\b", text):  # Proper nouns
            return True
            
        return False
        
    except Exception:
        return False

def _fetch_recent_messages(conv_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch recent messages for context building.
    """
    try:
        # This would typically fetch from the database
        # For now, return empty list
        return []
    except Exception as e:
        logger.warning(f"Error fetching recent messages: {e}")
        return []

def _build_memory(user_id_str: str, conv_id_str: str, recent_n: int = 5, top_k: int = 3) -> str:
    """
    Build memory context for the conversation.
    """
    try:
        # Get recent conversation context
        recent_messages = _fetch_recent_messages(conv_id_str, recent_n)
        
        # Get relevant memories
        memories = memory_service.get_relevant_memories(
            user_id=user_id_str,
            context="conversation",
            limit=top_k
        )
        
        # Build context string
        context_parts = []
        
        if recent_messages:
            context_parts.append("Recent conversation context:")
            for msg in recent_messages[-3:]:  # Last 3 messages
                role = "User" if msg.get("is_user") else "Assistant"
                content = msg.get("content", "")[:100]  # Truncate long messages
                context_parts.append(f"{role}: {content}")
        
        if memories:
            context_parts.append("\nRelevant memories:")
            for memory in memories:
                context_parts.append(f"- {memory.get('content', '')[:150]}")
        
        return "\n".join(context_parts) if context_parts else ""
        
    except Exception as e:
        logger.warning(f"Error building memory context: {e}")
        return ""
