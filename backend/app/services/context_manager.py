"""
Intelligent Context Management Service

This service provides adaptive context management for conversations,
scaling from simple short conversations to complex long discussions
with intelligent summarization and memory integration.
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

logger = logging.getLogger(__name__)


class ConversationPhase(Enum):
    """Different phases of a conversation that require different context strategies."""
    OPENING = "opening"  # First few messages
    DEVELOPING = "developing"  # Building on a topic
    DEEP_DIVE = "deep_dive"  # Detailed discussion
    TOPIC_SHIFT = "topic_shift"  # Changing subjects
    CLOSING = "closing"  # Wrapping up


class ContextStrategy(Enum):
    """Different context management strategies based on conversation state."""
    SHORT_CONVERSATION = "short"  # < 20 messages
    MEDIUM_CONVERSATION = "medium"  # 20-100 messages
    LONG_CONVERSATION = "long"  # > 100 messages
    TOPIC_SHIFT = "topic_shift"  # Detected topic change


@dataclass
class ContextItem:
    """Represents a piece of context with metadata."""
    content: str
    source: str  # "message", "summary", "memory", "profile"
    relevance_score: float
    timestamp: Optional[str] = None
    message_id: Optional[str] = None
    memory_id: Optional[str] = None


@dataclass
class ConversationContext:
    """Complete context for a conversation."""
    immediate_context: List[ContextItem]  # Last few messages
    relevant_context: List[ContextItem]  # Topic-specific context
    background_context: List[ContextItem]  # General user info
    strategy_used: ContextStrategy
    total_messages: int
    conversation_phase: ConversationPhase


class ContextManager:
    """Intelligent context management for conversations."""
    
    def __init__(self, memory_service: MemoryService):
        self.memory_service = memory_service
        
        # Strategy thresholds
        self.SHORT_THRESHOLD = 20
        self.MEDIUM_THRESHOLD = 100
        
        # Context limits for each strategy
        self.CONTEXT_LIMITS = {
            ContextStrategy.SHORT_CONVERSATION: {
                "immediate": 10,
                "relevant": 5,
                "background": 3
            },
            ContextStrategy.MEDIUM_CONVERSATION: {
                "immediate": 15,
                "relevant": 8,
                "background": 5
            },
            ContextStrategy.LONG_CONVERSATION: {
                "immediate": 8,
                "relevant": 10,
                "background": 7
            },
            ContextStrategy.TOPIC_SHIFT: {
                "immediate": 5,
                "relevant": 12,
                "background": 5
            }
        }

    def build_context(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        current_message: str,
        conversation_incognito: bool = False
    ) -> ConversationContext:
        """
        Build intelligent context for a conversation.
        
        Args:
            db: Database session
            conversation_id: ID of the conversation
            user_id: ID of the user
            current_message: The current user message
            conversation_incognito: Whether conversation is in incognito mode
            
        Returns:
            ConversationContext with all relevant context
        """
        try:
            # Get conversation metadata
            total_messages = self._get_conversation_message_count(db, conversation_id)
            conversation_phase = self._analyze_conversation_phase(db, conversation_id, current_message)
            
            # Determine strategy
            strategy = self._determine_strategy(total_messages, conversation_phase)
            
            # Build context based on strategy
            context = self._build_strategy_context(
                db, conversation_id, user_id, current_message, 
                strategy, conversation_incognito
            )
            
            # Add metadata
            context.strategy_used = strategy
            context.total_messages = total_messages
            context.conversation_phase = conversation_phase
            
            logger.info(
                f"Built context for conversation {conversation_id}: "
                f"strategy={strategy.value}, messages={total_messages}, "
                f"phase={conversation_phase.value}"
            )
            
            return context
            
        except Exception as e:
            logger.error(f"Error building context: {e}")
            # Return minimal context as fallback
            return self._build_fallback_context(db, conversation_id, user_id)

    def _get_conversation_message_count(self, db: Session, conversation_id: UUID) -> int:
        """Get total number of messages in conversation."""
        try:
            messages = crud.message.get_by_conversation(db, conversation_id, limit=1000)
            return len(messages) if messages else 0
        except Exception as e:
            logger.warning(f"Error getting message count: {e}")
            return 0

    def _analyze_conversation_phase(
        self, 
        db: Session, 
        conversation_id: UUID, 
        current_message: str
    ) -> ConversationPhase:
        """Analyze the current phase of the conversation."""
        try:
            # Get recent messages to analyze
            recent_messages = crud.message.get_by_conversation(
                db, conversation_id, limit=10
            )
            
            if not recent_messages or len(recent_messages) < 3:
                return ConversationPhase.OPENING
            
            # Simple heuristics for phase detection
            message_count = len(recent_messages)
            
            # Check for topic shift indicators
            if self._detect_topic_shift(recent_messages, current_message):
                return ConversationPhase.TOPIC_SHIFT
            
            # Check for closing indicators
            if self._detect_closing_indicators(current_message):
                return ConversationPhase.CLOSING
            
            # Check for deep dive indicators
            if self._detect_deep_dive(recent_messages):
                return ConversationPhase.DEEP_DIVE
            
            # Default to developing
            return ConversationPhase.DEVELOPING
            
        except Exception as e:
            logger.warning(f"Error analyzing conversation phase: {e}")
            return ConversationPhase.DEVELOPING

    def _detect_topic_shift(
        self, 
        recent_messages: List, 
        current_message: str
    ) -> bool:
        """Detect if there's a topic shift in the conversation."""
        # Simple keyword-based topic shift detection
        topic_shift_indicators = [
            "by the way", "speaking of", "on a different note",
            "changing topics", "let's talk about", "what about",
            "actually", "wait", "hold on"
        ]
        
        current_lower = current_message.lower()
        return any(indicator in current_lower for indicator in topic_shift_indicators)

    def _detect_closing_indicators(self, current_message: str) -> bool:
        """Detect if the conversation is closing."""
        closing_indicators = [
            "thanks", "thank you", "bye", "goodbye", "see you",
            "talk to you later", "gotta go", "have to go",
            "that's all", "that's it", "done", "finished"
        ]
        
        current_lower = current_message.lower()
        return any(indicator in current_lower for indicator in closing_indicators)

    def _detect_deep_dive(self, recent_messages: List) -> bool:
        """Detect if conversation is in a deep dive phase."""
        # Look for longer messages and detailed questions
        if len(recent_messages) < 3:
            return False
            
        recent_user_messages = [m for m in recent_messages[-3:] if m.role == "user"]
        if not recent_user_messages:
            return False
            
        # Check for longer, more detailed messages
        avg_length = sum(len(m.content or "") for m in recent_user_messages) / len(recent_user_messages)
        return avg_length > 100  # Longer than 100 characters on average

    def _determine_strategy(
        self, 
        total_messages: int, 
        conversation_phase: ConversationPhase
    ) -> ContextStrategy:
        """Determine the best context strategy based on conversation state."""
        if conversation_phase == ConversationPhase.TOPIC_SHIFT:
            return ContextStrategy.TOPIC_SHIFT
        elif total_messages < self.SHORT_THRESHOLD:
            return ContextStrategy.SHORT_CONVERSATION
        elif total_messages < self.MEDIUM_THRESHOLD:
            return ContextStrategy.MEDIUM_CONVERSATION
        else:
            return ContextStrategy.LONG_CONVERSATION

    def _build_strategy_context(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        current_message: str,
        strategy: ContextStrategy,
        conversation_incognito: bool
    ) -> ConversationContext:
        """Build context using the determined strategy."""
        limits = self.CONTEXT_LIMITS[strategy]
        
        # Build immediate context (recent messages)
        immediate_context = self._build_immediate_context(
            db, conversation_id, limits["immediate"]
        )
        
        # Build relevant context (memories, summaries)
        relevant_context = []
        if not conversation_incognito:
            relevant_context = self._build_relevant_context(
                db, user_id, current_message, conversation_id, 
                limits["relevant"], strategy
            )
        
        # Build background context (user profile, general info)
        background_context = []
        if not conversation_incognito:
            background_context = self._build_background_context(
                db, user_id, limits["background"]
            )
        
        return ConversationContext(
            immediate_context=immediate_context,
            relevant_context=relevant_context,
            background_context=background_context,
            strategy_used=strategy,
            total_messages=0,  # Will be set by caller
            conversation_phase=ConversationPhase.DEVELOPING  # Will be set by caller
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
            
            if not messages:
                return []
            
            context_items = []
            for msg in messages:
                # Compress long messages
                content = self._compress_message(msg.content or "")
                
                context_items.append(ContextItem(
                    content=content,
                    source="message",
                    relevance_score=1.0,  # Recent messages are highly relevant
                    timestamp=msg.created_at.isoformat() if msg.created_at else None,
                    message_id=str(msg.id)
                ))
            
            return context_items
            
        except Exception as e:
            logger.warning(f"Error building immediate context: {e}")
            return []

    def _build_relevant_context(
        self,
        db: Session,
        user_id: UUID,
        current_message: str,
        conversation_id: UUID,
        limit: int,
        strategy: ContextStrategy
    ) -> List[ContextItem]:
        """Build relevant context from memories and summaries."""
        context_items = []
        
        try:
            # Get relevant memories
            memories = self.memory_service.search_memories(
                db=db,
                query=current_message,
                user_id=str(user_id),
                limit=min(limit, 8)
            )
            
            for memory in memories:
                context_items.append(ContextItem(
                    content=memory.content,
                    source="memory",
                    relevance_score=memory.relevance_score,
                    memory_id=memory.memory_id
                ))
            
            # For long conversations, add conversation summaries
            if strategy == ContextStrategy.LONG_CONVERSATION:
                summary_context = self._get_conversation_summaries(
                    db, conversation_id, user_id
                )
                context_items.extend(summary_context)
            
        except Exception as e:
            logger.warning(f"Error building relevant context: {e}")
        
        return context_items

    def _build_background_context(
        self, 
        db: Session, 
        user_id: UUID, 
        limit: int
    ) -> List[ContextItem]:
        """Build background context from user profile and general info."""
        context_items = []
        
        try:
            # Get user profile memory
            profile_memory = self.memory_service.get_user_profile_memory(db, str(user_id))
            if profile_memory:
                context_items.append(ContextItem(
                    content=profile_memory,
                    source="profile",
                    relevance_score=0.8,  # High relevance for user profile
                ))
            
            # Get general user facts
            general_memories = self.memory_service.search_memories(
                db=db,
                query="user preferences facts about",
                user_id=str(user_id),
                content_types=["fact", "preference"],
                limit=limit - 1  # Reserve space for profile
            )
            
            for memory in general_memories:
                context_items.append(ContextItem(
                    content=memory.content,
                    source="memory",
                    relevance_score=memory.relevance_score * 0.7,  # Lower than direct relevance
                    memory_id=memory.memory_id
                ))
            
        except Exception as e:
            logger.warning(f"Error building background context: {e}")
        
        return context_items

    def _get_conversation_summaries(
        self, 
        db: Session, 
        conversation_id: UUID, 
        user_id: UUID
    ) -> List[ContextItem]:
        """Get conversation summaries for long conversations."""
        try:
            # Generate summary of recent conversation
            summary = generate_conversation_summary(
                db,
                conversation_id=conversation_id,
                user_id=user_id,
                limit_messages=30
            )
            
            if summary and summary != "(empty) No messages to summarize.":
                return [ContextItem(
                    content=f"Recent conversation summary: {summary}",
                    source="summary",
                    relevance_score=0.6
                )]
            
        except Exception as e:
            logger.warning(f"Error getting conversation summaries: {e}")
        
        return []

    def _compress_message(self, content: str) -> str:
        """Compress a message while preserving important information."""
        if not content:
            return ""
        
        # If message is short, return as-is
        if len(content) <= 200:
            return content
        
        # For longer messages, try to preserve key information
        # This is a simple compression - in production, you might use more sophisticated NLP
        sentences = content.split('. ')
        if len(sentences) <= 3:
            return content
        
        # Keep first and last sentences, plus middle if it's important
        compressed = sentences[0]
        if len(sentences) > 2:
            compressed += ". " + sentences[-1]
        
        # Add ellipsis if we compressed
        if len(compressed) < len(content) * 0.7:
            compressed += "..."
        
        return compressed

    def _build_fallback_context(
        self, 
        db: Session, 
        conversation_id: UUID, 
        user_id: UUID
    ) -> ConversationContext:
        """Build minimal fallback context when main context building fails."""
        try:
            # Get just the last few messages
            messages = crud.message.get_by_conversation(db, conversation_id, limit=5)
            immediate_context = []
            
            if messages:
                for msg in messages:
                    immediate_context.append(ContextItem(
                        content=msg.content or "",
                        source="message",
                        relevance_score=1.0,
                        message_id=str(msg.id)
                    ))
            
            return ConversationContext(
                immediate_context=immediate_context,
                relevant_context=[],
                background_context=[],
                strategy_used=ContextStrategy.SHORT_CONVERSATION,
                total_messages=len(messages) if messages else 0,
                conversation_phase=ConversationPhase.DEVELOPING
            )
            
        except Exception as e:
            logger.error(f"Error building fallback context: {e}")
            return ConversationContext(
                immediate_context=[],
                relevant_context=[],
                background_context=[],
                strategy_used=ContextStrategy.SHORT_CONVERSATION,
                total_messages=0,
                conversation_phase=ConversationPhase.DEVELOPING
            )

    def format_context_for_llm(self, context: ConversationContext) -> Tuple[str, List[Dict[str, str]]]:
        """
        Format the context for LLM consumption.
        
        Returns:
            Tuple of (system_prompt_addition, conversation_history)
        """
        system_parts = []
        conversation_history = []
        
        # Add background context to system prompt
        if context.background_context:
            background_text = "\n".join([item.content for item in context.background_context])
            system_parts.append(f"User Background: {background_text}")
        
        # Add relevant context to system prompt
        if context.relevant_context:
            relevant_text = "\n".join([item.content for item in context.relevant_context])
            system_parts.append(f"Relevant Information: {relevant_text}")
        
        # Add immediate context as conversation history
        for item in context.immediate_context:
            if item.source == "message":
                # Determine role from message content or metadata
                role = "user"  # Default, could be improved with actual role detection
                conversation_history.append({
                    "role": role,
                    "content": item.content
                })
        
        system_prompt_addition = "\n\n".join(system_parts) if system_parts else ""
        
        return system_prompt_addition, conversation_history
