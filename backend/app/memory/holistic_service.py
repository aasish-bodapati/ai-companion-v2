"""
Holistic Memory Service - Enhanced Memory Service with Orchestrator Integration

This service extends the existing MemoryService to provide holistic memory context
by integrating with the Memory Orchestrator for unified memory retrieval.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging
import json

from app.memory.orchestrator import memory_orchestrator, InteractionMode
from app.memory.service import MemoryService
from app.models.memory import MemoryNode, MemoryType
from app.models.conversation import Conversation, Message
from app.core.llm import generate_response
from app.core.config import settings

logger = logging.getLogger(__name__)


class HolisticMemoryService(MemoryService):
    """
    Enhanced Memory Service that provides holistic memory context
    by integrating with the Memory Orchestrator.
    """
    
    def __init__(self):
        super().__init__()
        self.orchestrator = memory_orchestrator
    
    def get_holistic_context(
        self,
        db: Session,
        user_id: str,
        user_message: str,
        conversation_id: Optional[str] = None,
        time_window_hours: int = 168
    ) -> Dict[str, Any]:
        """
        Get holistic memory context using the Memory Orchestrator.
        
        Args:
            db: Database session
            user_id: User identifier
            user_message: Current user message
            conversation_id: Current conversation ID
            time_window_hours: How far back to look for context
            
        Returns:
            Dict containing unified holistic context
        """
        try:
            # Fetch holistic context from orchestrator
            holistic_context = self.orchestrator.fetch_holistic_context(
                db=db,
                user_id=user_id,
                user_message=user_message,
                conversation_id=conversation_id,
                time_window_hours=time_window_hours
            )
            
            # Enhance context with existing memory service data
            enhanced_context = self._enhance_with_existing_memories(
                db, user_id, holistic_context
            )
            
            return enhanced_context
            
        except Exception as e:
            logger.error(f"Error getting holistic context: {e}")
            return {
                "error": str(e),
                "data_sources": {},
                "holistic_summary": {"user_state": "Unknown"}
            }
    
    def process_two_mode_interaction(
        self,
        db: Session,
        user_id: str,
        user_message: str,
        mode: InteractionMode,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process user interaction using the two-mode system.
        
        Args:
            db: Database session
            user_id: User identifier
            user_message: Current user message
            mode: Explicit interaction mode (ACTION or CONVERSATION)
            conversation_id: Current conversation ID
            
        Returns:
            Dict containing response and context based on mode
        """
        try:
            if mode == InteractionMode.ACTION:
                # Process in action mode - structured logging
                action_result = self.orchestrator.process_action_mode(user_message)
                
                # Store the action in memory
                if action_result["success"]:
                    self._store_action_memory(db, user_id, user_message, action_result["action_details"])
                
                return {
                    "mode": "action",
                    "response": action_result["response"],
                    "action_details": action_result.get("action_details"),
                    "context_used": {"mode": "action", "action_type": action_result.get("action_details", {}).get("action_type")}
                }
                
            elif mode == InteractionMode.CONVERSATION:
                # Process in conversation mode - rich AI response
                return self.generate_holistic_response(
                    db=db,
                    user_id=user_id,
                    user_message=user_message,
                    conversation_id=conversation_id
                )
            
            else:
                return {
                    "error": "Invalid interaction mode",
                    "mode": "unknown"
                }
                
        except Exception as e:
            logger.error(f"Error processing two-mode interaction: {e}")
            return {
                "error": str(e),
                "mode": mode.value if mode else "unknown"
            }
    
    def _store_action_memory(self, db: Session, user_id: str, user_message: str, action_details: Dict[str, Any]):
        """Store action in memory for future context"""
        try:
            # Create a memory node for the action
            memory_content = f"User logged: {action_details.get('action_type', 'action')} - {user_message}"
            
            memory_node = MemoryNode(
                user_id=user_id,
                content=memory_content,
                content_type=MemoryType.ACTION.value,
                category="action_logging",
                subcategory=action_details.get("action_type", "unknown"),
                memory_metadata=json.dumps(action_details),
                timestamp=datetime.now()
            )
            
            db.add(memory_node)
            db.commit()
            
        except Exception as e:
            logger.error(f"Error storing action memory: {e}")
    
    def generate_holistic_response(
        self,
        db: Session,
        user_id: str,
        user_message: str,
        conversation_id: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate AI response using holistic memory context.
        
        Args:
            db: Database session
            user_id: User identifier
            user_message: User's message
            conversation_id: Current conversation ID
            system_prompt: Optional custom system prompt
            
        Returns:
            Dict containing AI response and context used
        """
        try:
            # Get holistic context
            context = self.get_holistic_context(
                db, user_id, user_message, conversation_id
            )
            
            # Generate enhanced system prompt with context
            enhanced_prompt = self._build_enhanced_system_prompt(
                context, system_prompt
            )
            
            # Generate AI response
            ai_response = generate_response(
                enhanced_prompt,
                [{"role": "user", "content": user_message}]
            )
            
            # Store the interaction in memory
            self._store_holistic_interaction(
                db, user_id, user_message, ai_response, context, conversation_id
            )
            
            return {
                "mode": "conversation",
                "response": ai_response,
                "context_used": context,
                "intent": context.get("intent", {}),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating holistic response: {e}")
            return {
                "mode": "conversation",
                "error": str(e),
                "response": "I'm having trouble accessing your memory context right now. Let me help you with a fresh conversation.",
                "context_used": {},
                "timestamp": datetime.now().isoformat()
            }
    
    def get_memory_timeline(
        self,
        db: Session,
        user_id: str,
        days: int = 7,
        include_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get unified timeline view across all memory buckets.
        
        Args:
            db: Database session
            user_id: User identifier
            days: Number of days to look back
            include_types: Specific memory types to include
            
        Returns:
            Dict containing unified timeline data
        """
        try:
            cutoff_time = datetime.now() - timedelta(days=days)
            
            # Get holistic context for timeline
            context = self.orchestrator.fetch_holistic_context(
                db=db,
                user_id=user_id,
                user_message="timeline request",
                time_window_hours=days * 24
            )
            
            # Build unified timeline
            timeline = self._build_unified_timeline(context, cutoff_time)
            
            return {
                "timeline": timeline,
                "summary": context.get("holistic_summary", {}),
                "period": f"Last {days} days",
                "total_entries": len(timeline)
            }
            
        except Exception as e:
            logger.error(f"Error getting memory timeline: {e}")
            return {
                "error": str(e),
                "timeline": [],
                "summary": {},
                "period": f"Last {days} days",
                "total_entries": 0
            }
    
    def _calculate_mode_confidence(self, user_message: str, mode: InteractionMode) -> float:
        """Calculate confidence score for mode classification"""
        try:
            # Simple keyword-based confidence calculation
            message_lower = user_message.lower()
            confidence = 0.0
            
            if mode == InteractionMode.ACTION:
                action_keywords = ["log", "add", "track", "record", "save", "mark", "set", "update", "create"]
                matches = sum(1 for keyword in action_keywords if keyword in message_lower)
                confidence = min(1.0, matches / 2.0)  # Normalize to 0-1
                
            elif mode == InteractionMode.CONVERSATION:
                conversation_keywords = ["feel", "feeling", "why", "question", "doubt", "reflect", "wonder", "tell me", "explain", "what is", "how does", "opinion", "advice", "help"]
                matches = sum(1 for keyword in conversation_keywords if keyword in message_lower)
                confidence = min(1.0, matches / 2.0)
            
            return confidence
            
        except Exception as e:
            logger.error(f"Error calculating mode confidence: {e}")
            return 0.5
    
    def _enhance_with_existing_memories(
        self,
        db: Session,
        user_id: str,
        holistic_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhance holistic context with existing memory service data"""
        try:
            # Get recent memories from existing CRUD service
            from app.crud.memory import memory as memory_crud
            recent_memories = memory_crud.get_user_memories(
                db, user_id=user_id, limit=10
            )
            
            # Transform to expected format
            memory_data = []
            for memory in recent_memories:
                memory_data.append({
                    "id": memory.id,
                    "content": memory.content,
                    "content_type": memory.content_type,
                    "category": memory.category,
                    "subcategory": memory.subcategory,
                    "timestamp": memory.timestamp.isoformat() if memory.timestamp else None,
                    "importance_score": memory.importance_score,
                    "relevance_score": memory.relevance_score
                })
            
            # Add to holistic context
            holistic_context["existing_memories"] = {
                "recent_memories": memory_data,
                "memory_count": len(memory_data),
                "memory_types": list(set(m.get("content_type", "unknown") for m in memory_data))
            }
            
            return holistic_context
            
        except Exception as e:
            logger.error(f"Error enhancing with existing memories: {e}")
            holistic_context["existing_memories"] = {
                "recent_memories": [],
                "memory_count": 0,
                "memory_types": []
            }
            return holistic_context
    
    def _build_enhanced_system_prompt(
        self,
        context: Dict[str, Any],
        base_prompt: Optional[str] = None
    ) -> str:
        """Build enhanced system prompt with holistic memory context"""
        
        # Start with base prompt or default
        if base_prompt:
            prompt = base_prompt
        else:
            prompt = """You are an AI companion with access to the user's holistic memory context. 
            Use this context to provide personalized, insightful responses that show you remember 
            and understand the user's life patterns, emotions, and experiences."""
        
        # Add context summary
        holistic_summary = context.get("holistic_summary", {})
        if holistic_summary:
            prompt += f"\n\nUser Context Summary:\n"
            prompt += f"- Current State: {holistic_summary.get('user_state', 'Unknown')}\n"
            prompt += f"- Recent Activity: {holistic_summary.get('recent_activity', 'None')}\n"
            prompt += f"- Emotional Context: {holistic_summary.get('emotional_context', 'None')}\n"
            prompt += f"- Physical Context: {holistic_summary.get('physical_context', 'None')}\n"
        
        # Add cross-connections insights
        cross_connections = context.get("cross_connections", [])
        if cross_connections:
            prompt += f"\n\nKey Insights:\n"
            for connection in cross_connections[:3]:  # Top 3 connections
                prompt += f"- {connection.get('insight', 'Pattern detected')}\n"
        
        # Add recommendations
        recommendations = context.get("recommendations", [])
        if recommendations:
            prompt += f"\n\nConsider suggesting:\n"
            for rec in recommendations[:2]:  # Top 2 recommendations
                prompt += f"- {rec.get('suggestion', 'Activity suggestion')}\n"
        
        # Add instructions for using context
        prompt += f"\n\nInstructions:\n"
        prompt += f"- Reference specific details from their logs, journals, and conversations\n"
        prompt += f"- Connect current conversation to past patterns and experiences\n"
        prompt += f"- Show empathy and understanding of their emotional and physical state\n"
        prompt += f"- Provide actionable advice based on their history and current context\n"
        prompt += f"- Be conversational and companion-like, not just informative\n"
        
        return prompt
    
    def _store_holistic_interaction(
        self,
        db: Session,
        user_id: str,
        user_message: str,
        ai_response: str,
        context: Dict[str, Any],
        conversation_id: Optional[str]
    ):
        """Store the holistic interaction in memory for future reference"""
        try:
            # Create memory node for this interaction
            memory_data = {
                "content": f"User: {user_message}\nAI: {ai_response}",
                "content_type": MemoryType.CONVERSATION.value,
                "category": "holistic_interaction",
                "subcategory": context.get("intent", {}).get("type", "unknown"),
                "user_id": user_id,
                "conversation_id": conversation_id,
                "memory_metadata": json.dumps({
                    "intent": context.get("intent", {}),
                    "context_summary": context.get("holistic_summary", {}),
                    "cross_connections": len(context.get("cross_connections", [])),
                    "data_sources": list(context.get("data_sources", {}).keys())
                }),
                "tags": json.dumps([
                    "holistic_memory",
                    context.get("intent", {}).get("type", "unknown"),
                    "ai_companion"
                ]),
                "importance_score": 75,  # High importance for holistic interactions
                "emotional_valence": self._estimate_emotional_valence(user_message)
            }
            
            # Store using existing memory service
            self.store_memory(db, user_id, memory_data)
            
        except Exception as e:
            logger.error(f"Error storing holistic interaction: {e}")
    
    def _estimate_emotional_valence(self, user_message: str) -> Optional[float]:
        """Estimate emotional valence of user message (-1 to 1)"""
        try:
            message_lower = user_message.lower()
            
            # Positive indicators
            positive_words = ["happy", "excited", "great", "wonderful", "amazing", "grateful", "proud"]
            positive_score = sum(1 for word in positive_words if word in message_lower)
            
            # Negative indicators
            negative_words = ["sad", "angry", "frustrated", "worried", "anxious", "tired", "stressed"]
            negative_score = sum(1 for word in negative_words if word in message_lower)
            
            # Calculate valence
            if positive_score == 0 and negative_score == 0:
                return None
            
            total_score = positive_score + negative_score
            valence = (positive_score - negative_score) / total_score
            
            return max(-1.0, min(1.0, valence))
            
        except Exception as e:
            logger.error(f"Error estimating emotional valence: {e}")
            return None
    
    def _build_unified_timeline(
        self,
        context: Dict[str, Any],
        cutoff_time: datetime
    ) -> List[Dict[str, Any]]:
        """Build unified timeline from all memory sources"""
        timeline = []
        
        try:
            # Add logs to timeline
            logs = context.get("data_sources", {}).get("logs", {})
            
            # Workouts
            for workout in logs.get("recent_workouts", []):
                timeline.append({
                    "timestamp": workout["when"],
                    "type": "workout",
                    "title": f"Workout: {workout['type']}",
                    "description": f"{workout.get('duration_min', 'Unknown')} minutes",
                    "intensity": workout.get("intensity", "Unknown"),
                    "source": "logs"
                })
            
            # Meals
            for meal in logs.get("recent_meals", []):
                items = meal.get("items", [])
                title = f"Meal: {', '.join(items[:3])}" if items else "Meal logged"
                if len(items) > 3:
                    title += f" (+{len(items) - 3} more)"
                
                timeline.append({
                    "timestamp": meal["when"],
                    "type": "meal",
                    "title": title,
                    "description": f"{meal.get('calories', 'Unknown')} calories, {meal.get('protein_g', 'Unknown')}g protein",
                    "source": "logs"
                })
            
            # Mood
            for mood in logs.get("recent_mood", []):
                timeline.append({
                    "timestamp": mood["when"],
                    "type": "mood",
                    "title": f"Mood: {mood['value']}/{mood['scale']}",
                    "description": mood.get("notes", ""),
                    "tags": mood.get("tags", []),
                    "source": "logs"
                })
            
            # Add journal entries
            journals = context.get("data_sources", {}).get("journals", {})
            for entry in journals.get("recent_entries", []):
                timeline.append({
                    "timestamp": entry["when"],
                    "type": "journal",
                    "title": entry.get("title", "Journal Entry"),
                    "description": entry["content"][:100] + "..." if len(entry["content"]) > 100 else entry["content"],
                    "tags": entry.get("tags", []),
                    "source": "journals"
                })
            
            # Add chat interactions
            chats = context.get("data_sources", {}).get("chats", {})
            current_conv = chats.get("current_conversation", {})
            for msg in current_conv.get("recent_messages", []):
                timeline.append({
                    "timestamp": msg["when"],
                    "type": "chat",
                    "title": f"Chat: {msg['role'].title()}",
                    "description": msg["content"][:100] + "..." if len(msg["content"]) > 100 else msg["content"],
                    "source": "chats"
                })
            
            # Sort by timestamp (newest first)
            timeline.sort(key=lambda x: x["timestamp"], reverse=True)
            
            return timeline
            
        except Exception as e:
            logger.error(f"Error building unified timeline: {e}")
            return []


# Global holistic memory service instance
holistic_memory_service = HolisticMemoryService()
