"""
Holistic Memory Orchestrator - The Heart of Your AI Companion

This orchestrator implements the refined holistic memory design:
- Intent Detection (Action, Introspection, General Discussion)
- Holistic Context Fetch from all memory buckets
- Context Fusion into unified packages for AI
- Cross-Connection Analysis across life areas
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from enum import Enum
import logging
import json
import re

from app.models.memory import MemoryNode
from app.models.coaching import WorkoutLog, MealLog, HydrationLog, MoodLog, JournalEntry
from app.models.conversation import Conversation, Message
from app.memory.embeddings import get_embedding

logger = logging.getLogger(__name__)


class InteractionMode(Enum):
    """User interaction mode - explicit choice rather than intent detection"""
    ACTION = "action"           # Structured logging + tracking
    CONVERSATION = "conversation"  # Open dialogue, guidance, emotional support


class MemoryOrchestrator:
    """
    Holistic Memory Orchestrator that coordinates all memory operations
    and provides unified context for AI responses.
    """
    
    def __init__(self):
        # Intent detection patterns - Improved with more specific patterns
        self.action_patterns = [
            # Strong action verbs
            r'\b(?:log|add|track|record|save|mark|set|update|create|start|end|submit|upload|book)\b',
            # Action + object combinations
            r'\b(?:log my|add my|track my|record my|save my|mark my|set my|update my|create my)\b',
            # Specific action patterns
            r'\b(?:ate|eat|drank|workout|exercised|slept|took|logged|tracked|completed|finished)\b',
            # Action objects
            r'\b(?:meal|workout|sleep|mood|journal|water|task|reminder|profile|goal|timer|session|form|file|appointment)\b',
            # Additional action patterns
            r'\b(?:record my|track my|save my|mark my)\b',
            # Specific action phrases
            r'\b(?:record mood|track mood|log mood)\b'
        ]
        
        self.conversation_patterns = [
            # Emotional reflection patterns
            r'\b(?:why do i feel|i feel|i\'m feeling|feeling|emotion)\b',
            # Self-questioning patterns
            r'\b(?:what\'s wrong|why am i|how do i|am i|i wonder|i\'m not sure)\b',
            # Emotional state patterns
            r'\b(?:down|restless|tired|confused|lost|worried|overwhelmed|conflicted|stressed)\b',
            # Reflection patterns
            r'\b(?:reflect|reflection|think about|question|doubt|struggle|challenge|need to understand)\b',
            # Progress and motivation patterns
            r'\b(?:progress|motivation|consistency|burnout|maintain|improve|better)\b',
            # Information request patterns
            r'\b(?:tell me about|what is|how does|what are|can you explain|help me understand)\b',
            # Opinion and advice patterns
            r'\b(?:what\'s your opinion|what do you think|advice|suggestion|recommendation)\b',
            # Knowledge seeking patterns
            r'\b(?:benefits of|alternatives to|difference between|examples of|science behind)\b',
            # Learning patterns
            r'\b(?:how to|get started|typically|usually|generally|commonly)\b'
        ]
        
        # Caring keywords for memory relevance
        self.caring_keywords = [
            "remember", "know", "think", "feel", "like", "love", "hate", "want",
            "need", "hope", "worry", "excited", "tired", "happy", "sad", "stressed",
            "work", "family", "friends", "hobby", "goal", "dream", "fear", "strength"
        ]
        
        # Keywords for action mode processing
        self.action_keywords = ["log", "add", "track", "record", "save", "mark", "set", "update", "create", "start", "end", "submit", "upload", "book"]
    
    def process_action_mode(self, user_message: str) -> Dict[str, Any]:
        """
        Process user message in ACTION mode - structured logging and tracking.
        
        Args:
            user_message: User's input message for action mode
            
        Returns:
            Dict containing structured response and logging confirmation
        """
        try:
            message_lower = user_message.lower()
            
            # Extract action details from user message
            action_details = self._extract_action_details(message_lower)
            
            # Generate structured confirmation response
            response = self._generate_action_confirmation(action_details)
            
            return {
                "mode": "action",
                "response": response,
                "action_details": action_details,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error processing action mode: {e}")
            return {
                "mode": "action",
                "response": "❌ Sorry, I couldn't process that action. Please try again.",
                "error": str(e),
                "success": False
            }
    
    def process_conversation_mode(self, user_message: str) -> Dict[str, Any]:
        """
        Process user message in CONVERSATION mode - open dialogue and support.
        
        Args:
            user_message: User's input message for conversation mode
            
        Returns:
            Dict containing conversational response
        """
        try:
            # For conversation mode, we'll let the holistic service handle the response
            # This maintains the rich context and cross-connection analysis
            return {
                "mode": "conversation",
                "response": None,  # Will be filled by holistic service
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error processing conversation mode: {e}")
            return {
                "mode": "conversation",
                "response": "❌ Sorry, I'm having trouble with our conversation. Please try again.",
                "error": str(e),
                "success": False
            }
    
    def _extract_action_details(self, message_lower: str) -> Dict[str, Any]:
        """Extract structured action details from user message"""
        action_details = {
            "action_type": "unknown",
            "items": [],
            "notes": "",
            "timestamp": datetime.now().isoformat()
        }
        
        # Detect action type (order matters - check specific types first)
        if any(word in message_lower for word in ["water", "hydration", "glasses"]):
            action_details["action_type"] = "hydration"
        elif any(word in message_lower for word in ["mood", "feeling", "feel"]):
            action_details["action_type"] = "mood"
            # Extract mood indicators
            if any(word in message_lower for word in ["happy", "good", "great"]):
                action_details["mood"] = "positive"
            elif any(word in message_lower for word in ["sad", "bad", "tired"]):
                action_details["mood"] = "negative"
        elif any(word in message_lower for word in ["meal", "food", "ate", "eat", "drank"]):
            action_details["action_type"] = "meal"
            # Extract food items
            food_keywords = ["chicken", "rice", "salad", "pizza", "burger", "smoothie", "protein"]
            action_details["items"] = [word for word in food_keywords if word in message_lower]
        elif any(word in message_lower for word in ["workout", "exercise", "gym", "run", "walk"]):
            action_details["action_type"] = "workout"
            # Extract workout details
            if "strength" in message_lower:
                action_details["intensity"] = "strength"
            elif "cardio" in message_lower:
                action_details["intensity"] = "cardio"
        elif any(word in message_lower for word in ["journal", "entry", "reflection"]):
            action_details["action_type"] = "journal"
        
        # Extract notes (everything after common action words)
        action_words = ["log", "add", "track", "record", "save", "mark"]
        for word in action_words:
            if word in message_lower:
                parts = message_lower.split(word)
                if len(parts) > 1:
                    action_details["notes"] = parts[1].strip()
                    break
        
        return action_details
    
    def _generate_action_confirmation(self, action_details: Dict[str, Any]) -> str:
        """Generate structured confirmation response for actions"""
        action_type = action_details["action_type"]
        
        if action_type == "meal":
            items = action_details.get("items", [])
            if items:
                return f"✅ Meal logged: {' + '.join(items)}"
            else:
                return "✅ Meal logged successfully"
        elif action_type == "workout":
            intensity = action_details.get("intensity", "general")
            return f"✅ Workout logged: {intensity} training"
        elif action_type == "mood":
            mood = action_details.get("mood", "neutral")
            return f"✅ Mood logged: {mood}"
        elif action_type == "hydration":
            return "✅ Hydration logged successfully"
        elif action_type == "journal":
            return "✅ Journal entry saved"
        else:
            return "✅ Action logged successfully"
    
    def fetch_holistic_context(
        self,
        db: Session,
        user_id: str,
        user_message: str,
        conversation_id: Optional[str] = None,
        time_window_hours: int = 168
    ) -> Dict[str, Any]:
        """
        Fetch holistic context from all memory buckets and fuse into unified package.
        
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
            # Calculate time window
            cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
            
            # Fetch from all memory buckets
            logs_context = self._fetch_logs_context(db, user_id, cutoff_time)
            journals_context = self._fetch_journals_context(db, user_id, cutoff_time)
            chats_context = self._fetch_chats_context(db, user_id, cutoff_time, conversation_id)
            memories_context = self._fetch_memories_context(db, user_id, user_message)
            
            # Fuse context into unified package
            fused_context = self._fuse_context_package(
                logs_context,
                journals_context,
                chats_context,
                memories_context,
                user_message
            )
            
            # Add cross-connection analysis
            cross_connections = self._analyze_cross_connections(
                logs_context, journals_context, chats_context
            )
            fused_context["cross_connections"] = cross_connections
            
            return fused_context
            
        except Exception as e:
            logger.error(f"Error fetching holistic context: {e}")
            return {
                "error": str(e),
                "data_sources": {},
                "holistic_summary": {"user_state": "Unknown"}
            }
    
    def _fetch_logs_context(
        self, 
        db: Session, 
        user_id: str, 
        cutoff_time: datetime
    ) -> Dict[str, Any]:
        """Fetch structured logs context"""
        try:
            context = {
                "workouts": [],
                "meals": [],
                "hydration": [],
                "moods": [],
                "sleep": []
            }
            
            # Get recent workouts
            workouts = db.query(WorkoutLog).filter(
                WorkoutLog.user_id == user_id,
                WorkoutLog.when >= cutoff_time
            ).order_by(WorkoutLog.when.desc()).limit(5).all()
            
            for workout in workouts:
                context["workouts"].append({
                    "type": workout.type,
                    "duration": workout.duration_min,
                    "intensity": workout.intensity,
                    "timestamp": workout.when.isoformat(),
                    "notes": workout.notes
                })
            
            # Get recent meals
            meals = db.query(MealLog).filter(
                MealLog.user_id == user_id,
                MealLog.when >= cutoff_time
            ).order_by(MealLog.when.desc()).limit(5).all()
            
            for meal in meals:
                context["meals"].append({
                    "items": meal.items,
                    "timestamp": meal.when.isoformat(),
                    "notes": meal.notes
                })
            
            # Get recent moods
            moods = db.query(MoodLog).filter(
                MoodLog.user_id == user_id,
                MoodLog.when >= cutoff_time
            ).order_by(MoodLog.when.desc()).limit(5).all()
            
            for mood in moods:
                context["moods"].append({
                    "value": mood.val,
                    "scale": mood.scale,
                    "tags": mood.tags,
                    "timestamp": mood.when.isoformat(),
                    "notes": mood.notes
                })
            
            return context
            
        except Exception as e:
            logger.error(f"Error fetching logs context: {e}")
            return {}
    
    def _fetch_journals_context(
        self, 
        db: Session, 
        user_id: str, 
        cutoff_time: datetime
    ) -> Dict[str, Any]:
        """Fetch journal entries context"""
        try:
            journals = db.query(JournalEntry).filter(
                JournalEntry.user_id == user_id,
                JournalEntry.when >= cutoff_time
            ).order_by(JournalEntry.when.desc()).limit(5).all()
            
            context = []
            for journal in journals:
                context.append({
                    "title": journal.title,
                    "content": journal.content,
                    "timestamp": journal.when.isoformat(),
                    "tags": journal.tags
                })
            
            return {"entries": context}
            
        except Exception as e:
            logger.error(f"Error fetching journals context: {e}")
            return {"entries": []}
    
    def _fetch_chats_context(
        self, 
        db: Session, 
        user_id: str, 
        cutoff_time: datetime,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fetch chat conversation context"""
        try:
            # Get recent conversations
            query = db.query(Conversation).filter(
                Conversation.user_id == user_id,
                Conversation.created_at >= cutoff_time
            )
            
            if conversation_id:
                # Exclude current conversation to avoid redundancy
                query = query.filter(Conversation.id != conversation_id)
            
            conversations = query.order_by(Conversation.created_at.desc()).limit(3).all()
            
            context = []
            for conv in conversations:
                # Get last few messages from each conversation
                messages = db.query(Message).filter(
                    Message.conversation_id == conv.id
                ).order_by(Message.created_at.desc()).limit(3).all()
                
                conv_context = {
                    "conversation_id": conv.id,
                    "title": conv.title,
                    "timestamp": conv.created_at.isoformat(),
                    "messages": []
                }
                
                for msg in messages:
                    conv_context["messages"].append({
                        "role": msg.role,
                        "content": msg.content[:200] + "..." if len(msg.content) > 200 else msg.content,
                        "timestamp": msg.created_at.isoformat()
                    })
                
                context.append(conv_context)
            
            return {"conversations": context}
            
        except Exception as e:
            logger.error(f"Error fetching chats context: {e}")
            return {"conversations": []}
    
    def _fetch_memories_context(
        self, 
        db: Session, 
        user_id: str, 
        user_message: str
    ) -> Dict[str, Any]:
        """Fetch relevant memories using semantic search"""
        try:
            # This would integrate with your existing FAISS memory system
            # For now, return empty context
            return {"memories": []}
            
        except Exception as e:
            logger.error(f"Error fetching memories context: {e}")
            return {"memories": []}
    
    def _fuse_context_package(
        self,
        logs_context: Dict[str, Any],
        journals_context: Dict[str, Any],
        chats_context: Dict[str, Any],
        memories_context: Dict[str, Any],
        user_message: str
    ) -> Dict[str, Any]:
        """Fuse all context sources into unified package"""
        try:
            # Build holistic summary
            holistic_summary = self._build_holistic_summary(
                logs_context, journals_context, chats_context, user_message
            )
            
            # Create unified context package
            fused_context = {
                "data_sources": {
                    "logs": logs_context,
                    "journals": journals_context,
                    "chats": chats_context,
                    "memories": memories_context
                },
                "holistic_summary": holistic_summary,
                "user_message": user_message,
                "timestamp": datetime.now().isoformat()
            }
            
            return fused_context
            
        except Exception as e:
            logger.error(f"Error fusing context package: {e}")
            return {"error": str(e)}
    
    def _build_holistic_summary(
        self,
        logs_context: Dict[str, Any],
        journals_context: Dict[str, Any],
        chats_context: Dict[str, Any],
        user_message: str
    ) -> Dict[str, Any]:
        """Build holistic summary of user's current state"""
        try:
            summary = {
                "user_state": "Unknown",
                "recent_activity": [],
                "emotional_trends": [],
                "health_patterns": [],
                "conversation_themes": []
            }
            
            # Analyze recent activity from logs
            if logs_context.get("workouts"):
                summary["recent_activity"].append(f"Recent workout: {logs_context['workouts'][0]['type']}")
            
            if logs_context.get("meals"):
                summary["recent_activity"].append(f"Last meal: {logs_context['meals'][0]['items'][:50]}...")
            
            # Analyze emotional trends from journals and moods
            if logs_context.get("moods"):
                recent_mood_log = logs_context["moods"][0]["value"]
                summary["emotional_trends"].append(f"Recent mood: {recent_mood_log}/5")
            
            # Determine overall user state
            if summary["emotional_trends"]:
                if any("sad" in mood.lower() or "stressed" in mood.lower() for mood in summary["emotional_trends"]):
                    summary["user_state"] = "May need support"
                elif any("happy" in mood.lower() or "excited" in mood.lower() for mood in summary["emotional_trends"]):
                    summary["user_state"] = "Doing well"
                else:
                    summary["user_state"] = "Stable"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error building holistic summary: {e}")
            return {"user_state": "Unknown"}
    
    def _analyze_cross_connections(
        self,
        logs_context: Dict[str, Any],
        journals_context: Dict[str, Any],
        chats_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Analyze connections between different data types"""
        try:
            connections = []
            
            # Example: Connect workout intensity with mood
            if logs_context.get("workouts") and logs_context.get("moods"):
                recent_workout = logs_context["workouts"][0] if logs_context["workouts"] else None
                recent_mood = logs_context["moods"][0] if logs_context["moods"] else None
                
                if recent_workout and recent_mood:
                    connections.append({
                        "type": "workout_mood_connection",
                        "description": f"Recent {recent_workout['intensity']} workout followed by mood {recent_mood['value']}/5",
                        "insight": "Exercise intensity may be affecting mood patterns"
                    })
            
            # Example: Connect meal timing with energy levels
            if logs_context.get("meals") and logs_context.get("moods"):
                recent_meal = logs_context["meals"][0] if logs_context["meals"] else None
                recent_mood = logs_context["moods"][0] if logs_context["moods"] else None
                
                if recent_meal and recent_mood:
                    connections.append({
                        "type": "nutrition_energy_connection",
                        "description": f"After meal, mood was {recent_mood['value']}/5",
                        "insight": "Meal timing and nutrition may influence energy and mood"
                    })
            
            return connections
            
        except Exception as e:
            logger.error(f"Error analyzing cross connections: {e}")
            return []


# Global instance
memory_orchestrator = MemoryOrchestrator()
