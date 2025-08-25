"""
Advanced Contextual Intelligence Engine
Provides deep, human-like understanding of conversation context and memory integration.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import re

from app.memory.neural_system import neural_memory_system
from app.services.personality_engine import personality_engine

logger = logging.getLogger(__name__)

class ContextIntelligence:
    """
    Advanced contextual intelligence that makes the AI feel genuinely human.
    Understands deep conversation threads, weaves memories naturally, and maintains
    consistent personality across interactions.
    """
    
    def __init__(self):
        self.conversation_threads = {}  # Track ongoing conversation themes
        self.context_layers = {}  # Multi-layered context understanding
        self.memory_connections = {}  # Track how memories connect to conversations
        self.emotional_arcs = {}  # Track emotional progression in conversations
        
    def analyze_deep_context(self, user_message: str, conversation_history: List[Dict], 
                           user_id: str) -> Dict[str, Any]:
        """
        Perform deep contextual analysis that goes beyond surface-level detection.
        """
        try:
            context = {
                "surface_context": self._analyze_surface_context(user_message),
                "conversation_thread": self._identify_conversation_thread(user_message, conversation_history),
                "emotional_progression": self._analyze_emotional_progression(conversation_history),
                "memory_connections": self._find_deep_memory_connections(user_message, user_id),
                "personality_context": self._get_personality_context(user_message),
                "relationship_context": self._analyze_relationship_context(conversation_history, user_id),
                "life_context": self._analyze_life_context(user_message, conversation_history),
                "response_context": self._determine_response_context(user_message, conversation_history)
            }
            
            # Integrate all context layers
            context["integrated_understanding"] = self._integrate_context_layers(context)
            
            return context
            
        except Exception as e:
            logger.error(f"Error in analyze_deep_context: {e}")
            # Return basic context to avoid complete failure
            return {
                "surface_context": self._analyze_surface_context(user_message),
                "conversation_thread": {"thread_id": None, "theme": "general", "evolution": []},
                "emotional_progression": {"arc": "neutral", "progression": [], "current_state": "neutral"},
                "memory_connections": {"primary_connection": None, "secondary_connections": [], "total_connections": 0},
                "personality_context": {"active_traits": [], "emotional_state": "caring", "response_elements": []},
                "relationship_context": {"depth": "new", "trust_level": 0.5, "shared_experiences": 0},
                "life_context": {"active_life_areas": [], "support_needs": []},
                "response_context": {"response_type": "conversational", "should_reference_memory": False, "should_show_personality": True},
                "integrated_understanding": {"primary_focus": "general", "requires_deep_understanding": False}
            }
    
    def _analyze_surface_context(self, user_message: str) -> Dict[str, Any]:
        """Analyze the immediate, surface-level context of the message."""
        message_lower = user_message.lower()
        
        # Enhanced domain detection
        domains = []
        if any(word in message_lower for word in ["workout", "exercise", "gym", "fitness", "routine", "strength", "cardio", "training"]):
            domains.append("fitness")
        if any(word in message_lower for word in ["food", "meal", "nutrition", "diet", "eating", "weight", "lose", "gain", "calories"]):
            domains.append("nutrition")
        if any(word in message_lower for word in ["stress", "anxiety", "worried", "overwhelmed", "pressure", "tension", "nervous", "frustrated"]):
            domains.append("stress")
        if any(word in message_lower for word in ["sleep", "tired", "rest", "bed", "exhausted", "fatigue"]):
            domains.append("sleep")
        if any(word in message_lower for word in ["schedule", "time", "plan", "organize", "calendar", "appointment", "meeting"]):
            domains.append("scheduling")
        if any(word in message_lower for word in ["health", "medical", "doctor", "wellness", "symptoms", "presentation", "work", "performance", "upcoming", "professional"]):
            domains.append("health")
        
        # Emotional state detection
        emotional_state = "neutral"
        if any(word in message_lower for word in ["happy", "excited", "great", "wonderful"]):
            emotional_state = "positive"
        elif any(word in message_lower for word in ["sad", "frustrated", "angry", "worried"]):
            emotional_state = "negative"
        
        # Urgency detection
        urgency = "normal"
        if any(word in message_lower for word in ["need", "must", "urgent", "help", "problem"]):
            urgency = "high"
        
        return {
            "detected_domains": domains,
            "emotional_state": emotional_state,
            "urgency_level": urgency,
            "message_type": self._classify_message_type(user_message)
        }
    
    def _identify_conversation_thread(self, user_message: str, 
                                    conversation_history: List[Dict]) -> Dict[str, Any]:
        """Identify the ongoing conversation thread and its evolution."""
        if not conversation_history:
            return {"thread_id": None, "theme": "new_conversation", "evolution": []}
        
        # Analyze recent messages for thread continuity
        recent_messages = conversation_history[-5:]  # Last 5 messages
        
        # Extract key themes and topics
        themes = []
        for msg in recent_messages:
            if msg.get("role") == "user":
                content = msg.get("content", "")
                themes.extend(self._extract_themes(content))
        
        # Identify the main thread
        main_theme = self._identify_main_theme(themes)
        
        # Track thread evolution
        evolution = []
        for i, msg in enumerate(recent_messages):
            if msg.get("role") == "user":
                evolution.append({
                    "step": i + 1,
                    "theme": self._extract_themes(msg.get("content", "")),
                    "emotion": self._detect_emotion(msg.get("content", "")),
                    "timestamp": msg.get("timestamp", datetime.now())
                })
        
        return {
            "thread_id": f"thread_{hash(main_theme) % 1000}",
            "theme": main_theme,
            "sub_themes": list(set(themes)),
            "evolution": evolution,
            "continuity_score": self._calculate_continuity_score(evolution)
        }
    
    def _analyze_emotional_progression(self, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Analyze how emotions have progressed throughout the conversation."""
        if not conversation_history:
            return {"arc": "neutral", "progression": [], "current_state": "neutral"}
        
        emotional_progression = []
        for msg in conversation_history:
            if msg.get("role") == "user":
                emotion = self._detect_emotion(msg.get("content", ""))
                emotional_progression.append({
                    "emotion": emotion,
                    "intensity": self._detect_emotion_intensity(msg.get("content", "")),
                    "timestamp": msg.get("timestamp", datetime.now())
                })
        
        # Determine emotional arc
        if len(emotional_progression) >= 2:
            start_emotion = emotional_progression[0]["emotion"]
            end_emotion = emotional_progression[-1]["emotion"]
            
            if start_emotion == "negative" and end_emotion == "positive":
                arc = "recovery"
            elif start_emotion == "positive" and end_emotion == "negative":
                arc = "decline"
            elif start_emotion == end_emotion:
                arc = "stable"
            else:
                arc = "fluctuating"
        else:
            arc = "single_message"
        
        return {
            "arc": arc,
            "progression": emotional_progression,
            "current_state": emotional_progression[-1]["emotion"] if emotional_progression else "neutral",
            "stability": self._calculate_emotional_stability(emotional_progression)
        }
    
    def _find_deep_memory_connections(self, user_message: str, user_id: str) -> Dict[str, Any]:
        """Find deep, meaningful connections to past memories."""
        try:
            # Get relevant memories from neural system
            relevant_memories = neural_memory_system.activate_memory_network(
                query=user_message,
                user_id=user_id,
                conversation_context={"current_message": user_message}
            )
            
            # Analyze memory relevance and connection strength
            memory_connections = []
            for memory in relevant_memories[:5]:  # Top 5 most relevant
                connection_strength = self._calculate_memory_connection_strength(
                    user_message, memory.content, memory.categories
                )
                
                if connection_strength > 0.3:  # Only include meaningful connections
                    memory_connections.append({
                        "memory_id": memory.memory_id,
                        "content": memory.content,
                        "categories": memory.categories,
                        "connection_strength": connection_strength,
                        "connection_type": self._classify_memory_connection(
                            user_message, memory.content
                        ),
                        "emotional_relevance": self._assess_emotional_relevance(
                            user_message, memory.content
                        )
                    })
            
            # Sort by connection strength
            memory_connections.sort(key=lambda x: x["connection_strength"], reverse=True)
            
            return {
                "primary_connection": memory_connections[0] if memory_connections else None,
                "secondary_connections": memory_connections[1:3] if len(memory_connections) > 1 else [],
                "total_connections": len(memory_connections),
                "connection_patterns": self._identify_connection_patterns(memory_connections)
            }
            
        except Exception as e:
            logger.error(f"Error finding deep memory connections: {e}")
            return {"primary_connection": None, "secondary_connections": [], "total_connections": 0}
    
    def _get_personality_context(self, user_message: str) -> Dict[str, Any]:
        """Get personality-driven context for the response."""
        # Get personality response from personality engine
        personality_response = personality_engine.get_personality_response(
            context={"detected_domains": self._analyze_surface_context(user_message)["detected_domains"]},
            user_message=user_message
        )
        
        return {
            "active_traits": personality_response.get("personality_traits", []),
            "emotional_state": personality_response.get("emotional_state", "caring"),
            "communication_style": personality_response.get("communication_style", {}),
            "response_elements": personality_response.get("response_elements", []),
            "personality_adaptation": self._determine_personality_adaptation(user_message)
        }
    
    def _analyze_relationship_context(self, conversation_history: List[Dict], 
                                   user_id: str) -> Dict[str, Any]:
        """Analyze the relationship context and depth."""
        if not conversation_history:
            return {"depth": "new", "trust_level": 0.5, "shared_experiences": 0}
        
        # Count interactions
        interaction_count = len([msg for msg in conversation_history if msg.get("role") == "user"])
        
        # Analyze conversation depth
        depth_indicators = 0
        for msg in conversation_history:
            content = msg.get("content", "")
            if any(word in content.lower() for word in ["feel", "think", "believe", "worry", "hope"]):
                depth_indicators += 1
            if any(word in content.lower() for word in ["remember", "before", "always", "never"]):
                depth_indicators += 1
        
        # Determine relationship depth
        if interaction_count < 5:
            depth = "new"
        elif depth_indicators < 3:
            depth = "casual"
        elif depth_indicators < 6:
            depth = "developing"
        else:
            depth = "deep"
        
        # Calculate trust level based on interaction patterns
        trust_level = min(1.0, 0.5 + (depth_indicators * 0.1) + (interaction_count * 0.02))
        
        return {
            "depth": depth,
            "trust_level": trust_level,
            "shared_experiences": depth_indicators,
            "interaction_count": interaction_count,
            "vulnerability_shown": depth_indicators > 2
        }
    
    def _analyze_life_context(self, user_message: str, 
                            conversation_history: List[Dict]) -> Dict[str, Any]:
        """Analyze the broader life context and patterns."""
        # Extract life areas mentioned
        life_areas = set()
        for msg in conversation_history[-3:]:  # Last 3 messages
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                if any(word in content for word in ["work", "job", "career", "office"]):
                    life_areas.add("work")
                if any(word in content for word in ["family", "friend", "relationship", "partner"]):
                    life_areas.add("relationships")
                if any(word in content for word in ["health", "fitness", "nutrition", "sleep"]):
                    life_areas.add("health")
                if any(word in content for word in ["money", "finance", "budget", "expense"]):
                    life_areas.add("finance")
        
        # Add current message
        message_lower = user_message.lower()
        if any(word in message_lower for word in ["work", "job", "career", "office"]):
            life_areas.add("work")
        if any(word in message_lower for word in ["family", "friend", "relationship", "partner"]):
            life_areas.add("relationships")
        if any(word in message_lower for word in ["health", "fitness", "nutrition", "sleep"]):
            life_areas.add("health")
        if any(word in message_lower for word in ["money", "finance", "budget", "expense"]):
            life_areas.add("finance")
        
        return {
            "active_life_areas": list(life_areas),
            "life_balance": self._assess_life_balance(conversation_history),
            "stress_factors": self._identify_stress_factors(conversation_history),
            "support_needs": self._identify_support_needs(user_message, conversation_history)
        }
    
    def _determine_response_context(self, user_message: str, 
                                  conversation_history: List[Dict]) -> Dict[str, Any]:
        """Determine the appropriate response context and style."""
        # Analyze what kind of response is needed
        response_type = "conversational"
        
        if any(word in user_message.lower() for word in ["help", "advice", "suggestion"]):
            response_type = "supportive"
        elif any(word in user_message.lower() for word in ["question", "what", "how", "why"]):
            response_type = "informative"
        elif any(word in user_message.lower() for word in ["feel", "think", "believe"]):
            response_type = "empathetic"
        elif any(word in user_message.lower() for word in ["remember", "before", "always"]):
            response_type = "reflective"
        elif any(word in user_message.lower() for word in ["thank", "appreciate", "grateful"]):
            response_type = "gratitude"
        else:
            response_type = "statement"
        
        # Determine response depth
        response_depth = "surface"
        if len(conversation_history) > 3:
            response_depth = "moderate"
        if len(conversation_history) > 10:
            response_depth = "deep"
        
        return {
            "response_type": response_type,
            "response_depth": response_depth,
            "should_reference_memory": response_type in ["empathetic", "reflective"],
            "should_show_personality": response_type in ["conversational", "empathetic"],
            "should_provide_guidance": response_type == "supportive"
        }
    
    def _integrate_context_layers(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Integrate all context layers into a coherent understanding."""
        try:
            # Combine surface and deep context with safe access
            integrated = {
                "primary_focus": context.get("surface_context", {}).get("detected_domains", [None])[0] if context.get("surface_context", {}).get("detected_domains") else "general",
                "emotional_context": {
                    "user_state": context.get("surface_context", {}).get("emotional_state", "neutral"),
                    "progression": context.get("emotional_progression", {}).get("arc", "neutral"),
                    "stability": context.get("emotional_progression", {}).get("stability", 0.5)
                },
                "conversation_context": {
                    "thread": context.get("conversation_thread", {}).get("theme", "general"),
                    "continuity": context.get("conversation_thread", {}).get("continuity_score", 0.0),
                    "evolution": context.get("conversation_thread", {}).get("evolution", [])
                },
                "memory_context": {
                    "primary_connection": context.get("memory_connections", {}).get("primary_connection"),
                    "connection_patterns": context.get("memory_connections", {}).get("connection_patterns", [])
                },
                "relationship_context": {
                    "depth": context.get("relationship_context", {}).get("depth", "new"),
                    "trust_level": context.get("relationship_context", {}).get("trust_level", 0.5),
                    "vulnerability_shown": context.get("relationship_context", {}).get("vulnerability_shown", False)
                },
                "response_guidance": {
                    "type": context.get("response_context", {}).get("response_type", "conversational"),
                    "depth": context.get("response_context", {}).get("response_depth", "normal"),
                    "personality_expression": context.get("response_context", {}).get("should_show_personality", True),
                    "memory_integration": context.get("response_context", {}).get("should_reference_memory", False)
                }
            }
            
            # Calculate overall context complexity with safe access
            complexity_factors = [
                len(context.get("surface_context", {}).get("detected_domains", [])),
                context.get("conversation_thread", {}).get("continuity_score", 0.0),
                context.get("memory_connections", {}).get("total_connections", 0),
                context.get("relationship_context", {}).get("depth", "new") != "new"
            ]
            
            integrated["complexity_level"] = sum(complexity_factors)
            integrated["requires_deep_understanding"] = integrated["complexity_level"] > 3
            
            return integrated
            
        except Exception as e:
            logger.error(f"Error integrating context layers: {e}")
            # Return basic integrated context on error
            return {
                "primary_focus": "general",
                "emotional_context": {"user_state": "neutral", "progression": "neutral", "stability": 0.5},
                "conversation_context": {"thread": "general", "continuity": 0.0, "evolution": []},
                "memory_context": {"primary_connection": None, "connection_patterns": []},
                "relationship_context": {"depth": "new", "trust_level": 0.5, "vulnerability_shown": False},
                "response_guidance": {"type": "conversational", "depth": "normal", "personality_expression": True, "memory_integration": False},
                "complexity_level": 0,
                "requires_deep_understanding": False
            }
    
    # Helper methods
    def _extract_themes(self, content: str) -> List[str]:
        """Extract key themes from content."""
        themes = []
        content_lower = content.lower()
        
        theme_keywords = {
            "fitness": ["workout", "exercise", "gym", "fitness", "routine"],
            "nutrition": ["food", "meal", "diet", "eating", "nutrition"],
            "stress": ["stress", "anxiety", "worried", "overwhelmed"],
            "work": ["work", "job", "career", "office", "meeting"],
            "relationships": ["family", "friend", "relationship", "partner"],
            "health": ["health", "sleep", "tired", "rest"]
        }
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                themes.append(theme)
        
        return themes
    
    def _identify_main_theme(self, themes: List[str]) -> str:
        """Identify the main theme from a list of themes."""
        if not themes:
            return "general"
        
        # Count theme frequency
        theme_counts = {}
        for theme in themes:
            theme_counts[theme] = theme_counts.get(theme, 0) + 1
        
        # Return most frequent theme
        return max(theme_counts.items(), key=lambda x: x[1])[0]
    
    def _detect_emotion(self, content: str) -> str:
        """Detect the primary emotion in content."""
        content_lower = content.lower()
        
        positive_words = ["happy", "excited", "great", "wonderful", "love", "enjoy"]
        negative_words = ["sad", "frustrated", "angry", "worried", "scared", "tired"]
        
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _detect_emotion_intensity(self, content: str) -> float:
        """Detect the intensity of emotion in content."""
        intensity_indicators = ["really", "very", "extremely", "so", "much", "terribly"]
        content_lower = content.lower()
        
        intensity = 0.5  # Base intensity
        for indicator in intensity_indicators:
            if indicator in content_lower:
                intensity += 0.2
        
        return min(1.0, intensity)
    
    def _calculate_continuity_score(self, evolution: List[Dict]) -> float:
        """Calculate how continuous the conversation thread is."""
        if len(evolution) < 2:
            return 1.0
        
        continuity_score = 1.0
        for i in range(1, len(evolution)):
            current_themes = set(evolution[i]["theme"])
            previous_themes = set(evolution[i-1]["theme"])
            
            if current_themes.intersection(previous_themes):
                continuity_score += 0.2
            else:
                continuity_score -= 0.1
        
        return max(0.0, min(1.0, continuity_score))
    
    def _calculate_memory_connection_strength(self, user_message: str, 
                                           memory_content: str, 
                                           memory_categories: List[str]) -> float:
        """Calculate how strongly a memory connects to the current message."""
        # Simple semantic similarity (in production, use embeddings)
        user_words = set(user_message.lower().split())
        memory_words = set(memory_content.lower().split())
        
        # Word overlap
        overlap = len(user_words.intersection(memory_words))
        total_words = len(user_words.union(memory_words))
        
        if total_words == 0:
            return 0.0
        
        word_similarity = overlap / total_words
        
        # Category relevance
        category_relevance = 0.0
        if memory_categories:
            # This would be more sophisticated in production
            category_relevance = 0.3
        
        return (word_similarity * 0.7) + (category_relevance * 0.3)
    
    def _classify_memory_connection(self, user_message: str, memory_content: str) -> str:
        """Classify the type of memory connection."""
        user_lower = user_message.lower()
        memory_lower = memory_content.lower()
        
        if any(word in user_lower for word in ["remember", "before", "last time"]):
            return "explicit_reference"
        elif any(word in user_lower for word in ["similar", "like", "same"]):
            return "similarity"
        elif any(word in user_message.lower() for word in ["different", "unlike", "opposite"]):
            return "contrast"
        else:
            return "implicit_connection"
    
    def _assess_emotional_relevance(self, user_message: str, memory_content: str) -> float:
        """Assess how emotionally relevant a memory is to the current message."""
        # Simple emotional word matching
        emotional_words = ["happy", "sad", "angry", "worried", "excited", "frustrated", "love", "hate"]
        
        user_emotion_words = [word for word in user_message.lower().split() if word in emotional_words]
        memory_emotion_words = [word for word in memory_content.lower().split() if word in emotional_words]
        
        if not user_emotion_words or not memory_emotion_words:
            return 0.0
        
        # Check for emotional congruence
        user_emotions = set(user_emotion_words)
        memory_emotions = set(memory_emotion_words)
        
        if user_emotions.intersection(memory_emotions):
            return 0.8  # High emotional relevance
        else:
            return 0.3  # Lower emotional relevance
    
    def _identify_connection_patterns(self, memory_connections: List[Dict]) -> List[str]:
        """Identify patterns in memory connections."""
        patterns = []
        
        if len(memory_connections) > 1:
            # Check for temporal patterns
            if any("time" in conn["connection_type"] for conn in memory_connections):
                patterns.append("temporal_recurrence")
            
            # Check for emotional patterns
            if any(conn["emotional_relevance"] > 0.6 for conn in memory_connections):
                patterns.append("emotional_continuity")
            
            # Check for domain patterns
            domains = set()
            for conn in memory_connections:
                domains.update(conn.get("categories", []))
            if len(domains) > 1:
                patterns.append("cross_domain_connection")
        
        return patterns
    
    def _calculate_emotional_stability(self, emotional_progression: List[Dict]) -> float:
        """Calculate emotional stability throughout the conversation."""
        try:
            if not emotional_progression or len(emotional_progression) < 2:
                return 1.0
            
            changes = 0
            first_emotion = emotional_progression[0].get("emotion", "neutral")
            for msg in emotional_progression[1:]:  # Skip first message to avoid comparing to itself
                if msg.get("emotion", "neutral") != first_emotion:
                    changes += 1
            
            # Avoid division by zero
            if len(emotional_progression) <= 1:
                return 1.0
            
            stability = 1.0 - (changes / len(emotional_progression))
            return max(0.0, min(1.0, stability))
        except Exception as e:
            logger.error(f"Error calculating emotional stability: {e}")
            return 0.8  # Default stable value
    
    def _assess_life_balance(self, conversation_history: List[Dict]) -> str:
        """Assess the user's life balance based on conversation patterns."""
        life_areas = set()
        for msg in conversation_history:
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                if any(word in content for word in ["work", "job", "career"]):
                    life_areas.add("work")
                if any(word in content for word in ["family", "friend", "relationship"]):
                    life_areas.add("relationships")
                if any(word in content for word in ["health", "fitness", "sleep"]):
                    life_areas.add("health")
        
        if len(life_areas) >= 3:
            return "balanced"
        elif len(life_areas) == 2:
            return "moderately_balanced"
        else:
            return "focused"
    
    def _identify_stress_factors(self, conversation_history: List[Dict]) -> List[str]:
        """Identify potential stress factors in the conversation."""
        stress_factors = []
        
        for msg in conversation_history:
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                if any(word in content for word in ["deadline", "urgent", "pressure"]):
                    stress_factors.append("time_pressure")
                if any(word in content for word in ["conflict", "argument", "disagreement"]):
                    stress_factors.append("interpersonal_conflict")
                if any(word in content for word in ["uncertainty", "unknown", "unclear"]):
                    stress_factors.append("uncertainty")
                if any(word in content for word in ["overwhelmed", "too_much", "can't_handle"]):
                    stress_factors.append("overload")
        
        return list(set(stress_factors))
    
    def _identify_support_needs(self, user_message: str, 
                               conversation_history: List[Dict]) -> List[str]:
        """Identify what kind of support the user needs."""
        support_needs = []
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ["help", "advice", "suggestion"]):
            support_needs.append("guidance")
        if any(word in message_lower for word in ["listen", "hear", "understand"]):
            support_needs.append("emotional_support")
        if any(word in message_lower for word in ["plan", "organize", "figure_out"]):
            support_needs.append("planning_support")
        if any(word in message_lower for word in ["motivate", "encourage", "push"]):
            support_needs.append("motivation")
        
        return support_needs
    
    def _classify_message_type(self, user_message: str) -> str:
        """Classify the type of message."""
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ["?"]):
            return "question"
        elif any(word in message_lower for word in ["help", "advice", "suggestion"]):
            return "request_for_help"
        elif any(word in message_lower for word in ["feel", "think", "believe"]):
            return "sharing_thoughts"
        elif any(word in message_lower for word in ["remember", "before", "always"]):
            return "reflection"
        elif any(word in message_lower for word in ["thank", "appreciate", "grateful"]):
            return "gratitude"
        else:
            return "statement"
    
    def _determine_personality_adaptation(self, user_message: str) -> Dict[str, Any]:
        """Determine how the personality should adapt to this message."""
        message_type = self._classify_message_type(user_message)
        
        adaptations = {
            "question": {"humor": 0.3, "directness": 0.8, "empathy": 0.6},
            "request_for_help": {"humor": 0.2, "directness": 0.9, "empathy": 0.9},
            "sharing_thoughts": {"humor": 0.4, "directness": 0.6, "empathy": 0.9},
            "reflection": {"humor": 0.5, "directness": 0.7, "empathy": 0.8},
            "gratitude": {"humor": 0.6, "directness": 0.5, "empathy": 0.7},
            "statement": {"humor": 0.5, "directness": 0.6, "empathy": 0.7}
        }
        
        return adaptations.get(message_type, {"humor": 0.5, "directness": 0.6, "empathy": 0.7})

# Global instance
context_intelligence = ContextIntelligence()
