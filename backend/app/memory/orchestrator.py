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


class IntentType(Enum):
    """User message intent classification"""
    ACTION = "action"           # Logging meals, workouts, etc.
    INTROSPECTION = "introspection"  # Journaling, reflection, feelings
    DISCUSSION = "discussion"   # General chat, advice, companionship
    MIXED = "mixed"             # Multiple intents in one message


class MemoryOrchestrator:
    """
    Holistic Memory Orchestrator that coordinates all memory operations
    and provides unified context for AI responses.
    """
    
    def __init__(self):
        # Intent detection patterns
        self.action_patterns = [
            r'\b(?:ate|eat|drank|drank|workout|exercised|slept|took|logged|tracked|completed|finished)\b',
            r'\b(?:breakfast|lunch|dinner|snack|meal|food|drink|water|coffee|tea)\b',
            r'\b(?:workout|exercise|gym|run|walk|swim|bike|lift|cardio|strength)\b',
            r'\b(?:sleep|nap|rest|bed|wake|up|down)\b',
            r'\b(?:medication|medicine|pill|dose|took|prescribed)\b',
            r'\b(?:mood|feeling|emotion|happy|sad|stressed|anxious|excited)\b'
        ]
        
        self.introspection_patterns = [
            r'\b(?:feel|feeling|think|thought|reflect|reflection|wonder|question|struggle|challenge)\b',
            r'\b(?:lonely|sad|happy|excited|worried|anxious|stressed|overwhelmed|grateful|thankful)\b',
            r'\b(?:dream|hope|wish|want|need|desire|goal|aspiration|fear|concern)\b',
            r'\b(?:relationship|family|friend|work|career|life|future|past|present)\b'
        ]
        
        # Caring keywords for memory relevance
        self.caring_keywords = [
            "remember", "know", "think", "feel", "like", "love", "hate", "want",
            "need", "hope", "worry", "excited", "tired", "happy", "sad", "stressed",
            "work", "family", "friends", "hobby", "goal", "dream", "fear", "strength"
        ]
        
        # Intent keywords for classification
        self.intent_keywords = {
            IntentType.ACTION: ["ate", "eat", "drank", "workout", "exercised", "slept", "took", "logged"],
            IntentType.INTROSPECTION: ["feel", "feeling", "think", "thought", "reflect", "wonder", "struggle"],
            IntentType.DISCUSSION: ["what", "how", "why", "when", "where", "tell", "explain", "help"]
        }
    
    def detect_intent(self, user_message: str) -> IntentType:
        """
        Detect user intent using pattern matching and keyword analysis.
        
        Args:
            user_message: User's input message
            
        Returns:
            IntentType classification
        """
        try:
            message_lower = user_message.lower()
            
            # Check for action patterns first
            action_score = 0
            for pattern in self.action_patterns:
                if re.search(pattern, message_lower):
                    action_score += 1
            
            # Check for introspection patterns
            introspection_score = 0
            for pattern in self.introspection_patterns:
                if re.search(pattern, message_lower):
                    introspection_score += 1
            
            # Determine intent based on scores
            if action_score > 0 and introspection_score > 0:
                return IntentType.MIXED
            elif action_score > 0:
                return IntentType.ACTION
            elif introspection_score > 0:
                return IntentType.INTROSPECTION
            else:
                return IntentType.DISCUSSION
                
        except Exception as e:
            logger.error(f"Error detecting intent: {e}")
            return IntentType.DISCUSSION
    
    def extract_intent_keywords(self, user_message: str, intent: IntentType) -> List[str]:
        """Extract keywords that contributed to intent classification"""
        try:
            message_lower = user_message.lower()
            keywords = []
            
            if intent in self.intent_keywords:
                for keyword in self.intent_keywords[intent]:
                    if keyword in message_lower:
                        keywords.append(keyword)
            
            return keywords[:5]  # Return top 5 keywords
            
        except Exception as e:
            logger.error(f"Error extracting intent keywords: {e}")
            return []
    
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
