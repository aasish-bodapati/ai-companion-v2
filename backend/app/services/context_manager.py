"""
Simplified Context Management Service

This service provides simple context management for conversations,
using a straightforward last-N-messages approach instead of complex strategies.
"""

from __future__ import annotations

import logging
from typing import List, Dict, Optional, Tuple, Any
from uuid import UUID
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session

from app import crud
from app.memory.service import MemoryService
from app.services.summarization import generate_conversation_summary
from app.services.error_tracker import error_tracker
from app.services.metrics import metrics_collector

logger = logging.getLogger(__name__)


class ContextStrategy(Enum):
    """Simplified context strategies."""
    SIMPLE = "simple"  # Just use last N messages


@dataclass
class ContextItem:
    """Represents a piece of context with metadata."""
    content: str
    role: str  # "user" or "assistant"
    timestamp: Optional[str] = None
    memory_id: Optional[str] = None


@dataclass
class ConversationContext:
    """Simplified conversation context."""
    immediate_context: List[ContextItem]  # Last few messages
    relevant_context: List[ContextItem]  # Relevant memories
    background_context: List[ContextItem]  # General user info
    strategy_used: ContextStrategy
    total_messages: int
    conversation_phase: str = "simple"


class ContextManager:
    """Simplified context management for conversations."""
    
    def __init__(self, memory_service: MemoryService):
        self.memory_service = memory_service
        
        # Simple context limits
        self.MAX_IMMEDIATE_CONTEXT = 15  # Last 15 messages
        self.MAX_RELEVANT_CONTEXT = 5    # Top 5 relevant memories
        self.MAX_BACKGROUND_CONTEXT = 3  # Top 3 background memories

    def build_context(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        current_message: str,
        conversation_incognito: bool = False
    ) -> ConversationContext:
        """Build simplified context for a conversation."""
        try:
            # Get total message count
            total_messages = crud.message.count_by_conversation(db, conversation_id)
            
            # Build immediate context (recent messages)
            immediate_context = self._build_immediate_context(
                db, conversation_id, self.MAX_IMMEDIATE_CONTEXT
            )
            
            # Build relevant context (memories)
            relevant_context = []
            if not conversation_incognito:
                relevant_context = self._build_relevant_context(
                    db, user_id, current_message, self.MAX_RELEVANT_CONTEXT
                )
            
            # Build background context (user profile)
            background_context = []
            if not conversation_incognito:
                background_context = self._build_background_context(
                    db, user_id, self.MAX_BACKGROUND_CONTEXT
                )
            
            context = ConversationContext(
                immediate_context=immediate_context,
                relevant_context=relevant_context,
                background_context=background_context,
                strategy_used=ContextStrategy.SIMPLE,
                total_messages=total_messages,
                conversation_phase="simple"
            )
            
            # Log context building result
            logger.info(f"🧠 CONTEXT: Built context for user {user_id} - {len(immediate_context)} messages, {len(relevant_context)} relevant, {len(background_context)} background (incognito: {conversation_incognito})")
            
            # Record metrics
            metrics_collector.increment_counter("context_built", tags={"user_id": str(user_id), "incognito": str(conversation_incognito)})
            metrics_collector.set_gauge("context_immediate_size", len(immediate_context), tags={"user_id": str(user_id)})
            metrics_collector.set_gauge("context_relevant_size", len(relevant_context), tags={"user_id": str(user_id)})
            metrics_collector.set_gauge("context_background_size", len(background_context), tags={"user_id": str(user_id)})
            
            return context
            
        except Exception as e:
            logger.error(f"❌ CONTEXT: Error building context for user {user_id}: {e}")
            error_tracker.record_error(
                error_type="context_building_failed",
                error_message=str(e),
                user_id=str(user_id),
                conversation_id=str(conversation_id),
                context={"current_message_length": len(current_message), "incognito": conversation_incognito}
            )
            # Return minimal context on error
            return ConversationContext(
                immediate_context=[],
                relevant_context=[],
                background_context=[],
                strategy_used=ContextStrategy.SIMPLE,
                total_messages=0,
                conversation_phase="simple"
            )

    def _build_immediate_context(
        self, 
        db: Session, 
        conversation_id: UUID, 
        limit: int
    ) -> List[ContextItem]:
        """Build immediate context from recent messages."""
        try:
            messages = crud.message.get_by_conversation(
                db, conversation_id, limit=limit
            )
            
            context_items = []
            for message in messages:
                context_items.append(ContextItem(
                    content=message.content or "",
                    role=message.role,
                    timestamp=str(message.created_at) if message.created_at else None
                ))
            
            return context_items
            
        except Exception as e:
            logger.error(f"Error building immediate context: {e}")
            return []

    def _build_relevant_context(
        self,
        db: Session,
        user_id: UUID,
        current_message: str,
        limit: int
    ) -> List[ContextItem]:
        """Build relevant context from user memories."""
        try:
            # Search for relevant memories
            search_results = self.memory_service.search_memories(
                db=db,
                user_id=str(user_id),
                query=current_message,
                limit=limit
            )
            
            context_items = []
            for result in search_results:
                context_items.append(ContextItem(
                    content=result.content,
                    role="memory",
                    memory_id=result.memory_id
                ))
            
            return context_items
            
        except Exception as e:
            logger.error(f"Error building relevant context: {e}")
            return []

    def _build_background_context(
        self,
        db: Session,
        user_id: UUID,
        limit: int
    ) -> List[ContextItem]:
        """Build background context from user profile and general memories."""
        try:
            # Get general user memories (not conversation-specific)
            search_results = self.memory_service.search_memories(
                db=db,
                user_id=str(user_id),
                query="user profile information",
                limit=limit
            )
            
            context_items = []
            for result in search_results:
                context_items.append(ContextItem(
                    content=result.content,
                    role="background",
                    memory_id=result.memory_id
                ))
            
            return context_items
            
        except Exception as e:
            logger.error(f"Error building background context: {e}")
            return []

    def format_context_for_llm(self, context: ConversationContext) -> Tuple[str, List[Dict[str, str]]]:
        """Format context for LLM consumption."""
        try:
            # Build system prompt addition
            system_prompt_parts = []
            
            if context.relevant_context:
                system_prompt_parts.append("Relevant memories:")
                for item in context.relevant_context:
                    system_prompt_parts.append(f"- {item.content}")
            
            if context.background_context:
                system_prompt_parts.append("Background information:")
                for item in context.background_context:
                    system_prompt_parts.append(f"- {item.content}")
            
            system_prompt_addition = "\n".join(system_prompt_parts)
            
            # Build conversation history
            conversation_history = []
            for item in context.immediate_context:
                conversation_history.append({
                    "role": item.role,
                    "content": item.content
                })
            
            return system_prompt_addition, conversation_history
            
        except Exception as e:
            logger.error(f"Error formatting context for LLM: {e}")
            return "", []

    def get_context_summary(self, context: ConversationContext) -> str:
        """Get a simple summary of the context."""
        return (
            f"Context: {len(context.immediate_context)} recent messages, "
            f"{len(context.relevant_context)} relevant memories, "
            f"{len(context.background_context)} background items "
            f"(strategy: {context.strategy_used.value})"
        )


# Create global instance
context_manager = ContextManager(MemoryService())