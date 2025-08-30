"""
Natural Conversation Flow Engine

This service manages natural conversation flow, topic transitions, and organic
conversation patterns to make conversations feel effortless and human-like.
"""

import logging
import random
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
from collections import deque

logger = logging.getLogger(__name__)


class ConversationStage(Enum):
    """Stages of conversation flow."""
    OPENING = "opening"
    BUILDING = "building"
    EXPLORING = "exploring"
    DEEPENING = "deepening"
    TRANSITIONING = "transitioning"
    WRAPPING = "wrapping"
    CLOSING = "closing"


class TopicRelation(Enum):
    """How topics relate to each other."""
    SAME = "same"
    RELATED = "related"
    ADJACENT = "adjacent"
    UNRELATED = "unrelated"
    OPPOSITE = "opposite"


@dataclass
class ConversationTopic:
    """Represents a conversation topic."""
    name: str
    keywords: List[str]
    depth_level: float  # 0.0 (surface) to 1.0 (deep)
    emotional_weight: float  # How emotionally charged the topic is
    user_interest: float  # User's interest level in this topic
    last_discussed: Optional[datetime] = None
    discussion_count: int = 0


@dataclass
class ConversationTransition:
    """Represents a transition between topics or conversation stages."""
    from_topic: str
    to_topic: str
    transition_type: str
    transition_phrase: str
    naturalness_score: float
    context: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ConversationFlow:
    """Tracks the overall flow of a conversation."""
    user_id: str
    current_stage: ConversationStage
    current_topic: ConversationTopic
    topic_history: deque = field(default_factory=lambda: deque(maxlen=10))
    conversation_depth: float = 0.5
    flow_quality: float = 0.7
    energy_level: float = 0.5
    pacing: str = "moderate"  # slow, moderate, fast
    last_transition: Optional[ConversationTransition] = None
    conversation_start: datetime = field(default_factory=datetime.now)


class NaturalConversationFlowEngine:
    """
    Engine for managing natural conversation flow and smooth topic transitions.
    """
    
    def __init__(self):
        # Topic relationship mapping
        self.topic_relationships = {
            "work": ["career", "goals", "stress", "achievement", "technology"],
            "health": ["fitness", "wellness", "food", "sleep", "stress"],
            "relationships": ["family", "friends", "love", "communication", "trust"],
            "hobbies": ["creativity", "entertainment", "learning", "goals", "free_time"],
            "travel": ["adventure", "culture", "food", "experiences", "goals"],
            "technology": ["work", "learning", "entertainment", "future", "productivity"],
            "food": ["health", "culture", "creativity", "social", "experiences"],
            "learning": ["goals", "work", "curiosity", "books", "growth"],
            "entertainment": ["hobbies", "relaxation", "social", "creativity", "culture"],
            "goals": ["work", "health", "relationships", "learning", "future"]
        }
        
        # Transition phrases for different relationship types
        self.transition_phrases = {
            TopicRelation.SAME: [
                "Speaking more about {topic}...",
                "That reminds me of another aspect of {topic}...",
                "Building on what you said about {topic}...",
                "I'm curious to dive deeper into {topic}..."
            ],
            TopicRelation.RELATED: [
                "That connects to something I've been thinking about regarding {new_topic}...",
                "Speaking of {old_topic}, it makes me think about {new_topic}...",
                "You know, {new_topic} is really connected to what we were discussing about {old_topic}...",
                "That's interesting - it actually relates to {new_topic} in a way..."
            ],
            TopicRelation.ADJACENT: [
                "On a related note, I'm curious about {new_topic}...",
                "That reminds me - have you thought much about {new_topic}?",
                "Shifting gears slightly to {new_topic}...",
                "That brings up an interesting point about {new_topic}..."
            ],
            TopicRelation.UNRELATED: [
                "You know what? Let me ask you something completely different about {new_topic}...",
                "I'm curious to switch directions for a moment - what about {new_topic}?",
                "On a totally different note, I've been wondering about {new_topic}...",
                "Let's explore something else for a moment - {new_topic}..."
            ]
        }
        
        # Conversation stage transitions
        self.stage_transitions = {
            ConversationStage.OPENING: {
                "natural_progression": ConversationStage.BUILDING,
                "phrases": [
                    "I'd love to hear more about that...",
                    "That sounds really interesting - tell me more...",
                    "I'm curious to understand that better..."
                ]
            },
            ConversationStage.BUILDING: {
                "natural_progression": ConversationStage.EXPLORING,
                "phrases": [
                    "That's fascinating - let's explore that further...",
                    "I can see why that would be important to you...",
                    "There's so much to unpack there..."
                ]
            },
            ConversationStage.EXPLORING: {
                "natural_progression": ConversationStage.DEEPENING,
                "phrases": [
                    "I sense there's something deeper here...",
                    "What does that really mean to you?",
                    "I'm getting a better picture of this..."
                ]
            },
            ConversationStage.DEEPENING: {
                "natural_progression": ConversationStage.TRANSITIONING,
                "phrases": [
                    "This has given me a lot to think about...",
                    "I really appreciate you sharing that with me...",
                    "That's given me such good insight..."
                ]
            }
        }
        
        # Flow quality indicators
        self.flow_quality_factors = {
            "smooth_transitions": 0.3,
            "appropriate_depth": 0.25,
            "topic_relevance": 0.2,
            "emotional_attunement": 0.15,
            "pacing_match": 0.1
        }
        
        # Conversation pacing patterns
        self.pacing_patterns = {
            "slow": {
                "depth_increase_rate": 0.1,
                "topic_change_frequency": 0.1,
                "reflection_frequency": 0.3
            },
            "moderate": {
                "depth_increase_rate": 0.2,
                "topic_change_frequency": 0.2,
                "reflection_frequency": 0.2
            },
            "fast": {
                "depth_increase_rate": 0.3,
                "topic_change_frequency": 0.4,
                "reflection_frequency": 0.1
            }
        }
        
        logger.info("NaturalConversationFlowEngine initialized")

    async def analyze_conversation_flow(
        self, 
        user_message: str,
        conversation_history: List[Dict[str, Any]],
        emotional_context: Dict[str, Any],
        user_id: str
    ) -> ConversationFlow:
        """
        Analyze the current conversation flow and determine optimal flow management.
        """
        try:
            # Get or create conversation flow
            current_flow = self._get_conversation_flow(user_id, conversation_history)
            
            # Update current topic
            current_topic = self._extract_topic_from_message(user_message, emotional_context)
            current_flow.current_topic = current_topic
            
            # Update conversation stage
            current_flow.current_stage = self._determine_conversation_stage(
                user_message, conversation_history, current_flow
            )
            
            # Update conversation depth
            current_flow.conversation_depth = self._calculate_conversation_depth(
                user_message, conversation_history, emotional_context
            )
            
            # Update energy level and pacing
            current_flow.energy_level = self._assess_energy_level(user_message, emotional_context)
            current_flow.pacing = self._determine_pacing(user_message, conversation_history, current_flow)
            
            # Calculate flow quality
            current_flow.flow_quality = self._calculate_flow_quality(current_flow, conversation_history)
            
            # Add to topic history
            current_flow.topic_history.append({
                "topic": current_topic.name,
                "timestamp": datetime.now(),
                "depth": current_topic.depth_level,
                "user_interest": current_topic.user_interest
            })
            
            return current_flow
            
        except Exception as e:
            logger.error(f"Error analyzing conversation flow: {e}")
            return self._create_default_flow(user_id)

    async def generate_natural_transition(
        self, 
        current_flow: ConversationFlow,
        target_topic: str,
        context: Dict[str, Any]
    ) -> Optional[ConversationTransition]:
        """
        Generate a natural transition to a new topic or conversation stage.
        """
        try:
            current_topic = current_flow.current_topic.name
            
            # Determine relationship between topics
            topic_relation = self._determine_topic_relationship(current_topic, target_topic)
            
            # Select appropriate transition phrase
            transition_phrases = self.transition_phrases.get(topic_relation, [])
            if not transition_phrases:
                return None
            
            transition_phrase = random.choice(transition_phrases)
            
            # Format the transition phrase
            formatted_phrase = transition_phrase.format(
                topic=current_topic,
                old_topic=current_topic,
                new_topic=target_topic
            )
            
            # Calculate naturalness score
            naturalness_score = self._calculate_naturalness_score(
                topic_relation, current_flow, context
            )
            
            transition = ConversationTransition(
                from_topic=current_topic,
                to_topic=target_topic,
                transition_type=topic_relation.value,
                transition_phrase=formatted_phrase,
                naturalness_score=naturalness_score,
                context=context
            )
            
            return transition
            
        except Exception as e:
            logger.error(f"Error generating transition: {e}")
            return None

    async def suggest_conversation_direction(
        self, 
        current_flow: ConversationFlow,
        user_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Suggest the optimal direction for conversation continuation.
        """
        try:
            suggestions = {
                "stage_suggestions": [],
                "topic_suggestions": [],
                "depth_recommendations": {},
                "pacing_adjustments": {}
            }
            
            # Stage suggestions
            current_stage = current_flow.current_stage
            if current_stage in self.stage_transitions:
                next_stage = self.stage_transitions[current_stage]["natural_progression"]
                transition_phrases = self.stage_transitions[current_stage]["phrases"]
                
                suggestions["stage_suggestions"] = {
                    "recommended_stage": next_stage.value,
                    "transition_phrases": transition_phrases,
                    "confidence": 0.8
                }
            
            # Topic suggestions based on relationships
            current_topic = current_flow.current_topic.name
            related_topics = self.topic_relationships.get(current_topic, [])
            
            for topic in related_topics:
                topic_interest = user_preferences.get("topics", {}).get(topic, 0.5)
                suggestions["topic_suggestions"].append({
                    "topic": topic,
                    "interest_score": topic_interest,
                    "relationship": "related"
                })
            
            # Depth recommendations
            current_depth = current_flow.conversation_depth
            if current_depth < 0.3:
                suggestions["depth_recommendations"] = {
                    "action": "deepen",
                    "target_depth": 0.6,
                    "approach": "ask follow-up questions"
                }
            elif current_depth > 0.8:
                suggestions["depth_recommendations"] = {
                    "action": "surface",
                    "target_depth": 0.5,
                    "approach": "introduce lighter elements"
                }
            
            # Pacing adjustments
            if current_flow.energy_level > 0.7 and current_flow.pacing == "slow":
                suggestions["pacing_adjustments"] = {
                    "recommendation": "increase_pace",
                    "reason": "high energy detected"
                }
            elif current_flow.energy_level < 0.3 and current_flow.pacing == "fast":
                suggestions["pacing_adjustments"] = {
                    "recommendation": "slow_down",
                    "reason": "low energy detected"
                }
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error suggesting conversation direction: {e}")
            return {}

    def _get_conversation_flow(self, user_id: str, conversation_history: List[Dict[str, Any]]) -> ConversationFlow:
        """Get or create conversation flow for user."""
        # In a real implementation, this would be stored and retrieved
        # For now, create based on conversation history
        
        if len(conversation_history) == 0:
            return self._create_default_flow(user_id)
        
        # Analyze conversation to recreate flow
        return self._analyze_existing_conversation(user_id, conversation_history)

    def _create_default_flow(self, user_id: str) -> ConversationFlow:
        """Create a default conversation flow."""
        default_topic = ConversationTopic(
            name="general",
            keywords=["general", "conversation", "chat"],
            depth_level=0.3,
            emotional_weight=0.2,
            user_interest=0.5
        )
        
        return ConversationFlow(
            user_id=user_id,
            current_stage=ConversationStage.OPENING,
            current_topic=default_topic,
            conversation_depth=0.3,
            flow_quality=0.7,
            energy_level=0.5
        )

    def _analyze_existing_conversation(self, user_id: str, conversation_history: List[Dict[str, Any]]) -> ConversationFlow:
        """Analyze existing conversation to determine current flow."""
        
        # Simple analysis for now
        flow = self._create_default_flow(user_id)
        
        # Determine stage based on conversation length
        conv_length = len(conversation_history)
        if conv_length < 3:
            flow.current_stage = ConversationStage.OPENING
        elif conv_length < 8:
            flow.current_stage = ConversationStage.BUILDING
        elif conv_length < 15:
            flow.current_stage = ConversationStage.EXPLORING
        else:
            flow.current_stage = ConversationStage.DEEPENING
        
        return flow

    def _extract_topic_from_message(self, message: str, emotional_context: Dict[str, Any]) -> ConversationTopic:
        """Extract topic information from a message."""
        
        message_lower = message.lower()
        
        # Topic detection (same as in authentic_behaviors.py but expanded)
        topic_keywords = {
            "work": ["work", "job", "career", "office", "meeting", "project", "business"],
            "health": ["health", "fitness", "exercise", "wellness", "medical", "doctor"],
            "relationships": ["friend", "family", "relationship", "dating", "love", "partner"],
            "hobbies": ["hobby", "interest", "passion", "activity", "creative", "art"],
            "travel": ["travel", "trip", "vacation", "visit", "journey", "adventure"],
            "technology": ["tech", "computer", "software", "app", "digital", "internet"],
            "food": ["food", "eat", "cook", "recipe", "restaurant", "meal"],
            "learning": ["learn", "study", "school", "education", "knowledge", "book"],
            "entertainment": ["movie", "music", "book", "game", "show", "fun"],
            "goals": ["goal", "plan", "achieve", "target", "dream", "aspiration"]
        }
        
        detected_topic = "general"
        max_matches = 0
        
        for topic, keywords in topic_keywords.items():
            matches = sum(1 for keyword in keywords if keyword in message_lower)
            if matches > max_matches:
                max_matches = matches
                detected_topic = topic
        
        # Calculate depth based on message characteristics
        depth = 0.3  # Default
        if len(message.split()) > 20:  # Longer messages suggest deeper discussion
            depth += 0.2
        if any(word in message_lower for word in ["feel", "think", "believe", "important", "meaningful"]):
            depth += 0.3
        
        # Calculate emotional weight
        emotional_weight = 0.2
        emotion = emotional_context.get("primary_emotion", "neutral")
        if emotion in ["excited", "passionate", "enthusiastic"]:
            emotional_weight = 0.8
        elif emotion in ["sad", "frustrated", "angry"]:
            emotional_weight = 0.7
        elif emotion in ["happy", "content"]:
            emotional_weight = 0.4
        
        # Calculate user interest based on emotional context and message length
        user_interest = min(1.0, 0.5 + (len(message) / 200) + emotional_weight * 0.3)
        
        return ConversationTopic(
            name=detected_topic,
            keywords=topic_keywords.get(detected_topic, []),
            depth_level=min(1.0, depth),
            emotional_weight=emotional_weight,
            user_interest=user_interest,
            last_discussed=datetime.now(),
            discussion_count=1
        )

    def _determine_conversation_stage(
        self, 
        user_message: str, 
        conversation_history: List[Dict[str, Any]], 
        current_flow: ConversationFlow
    ) -> ConversationStage:
        """Determine the current conversation stage."""
        
        conv_length = len(conversation_history)
        message_lower = user_message.lower()
        
        # Check for explicit stage indicators
        opening_indicators = ["hi", "hello", "hey", "good morning", "how are you"]
        closing_indicators = ["bye", "goodbye", "see you", "talk later", "thanks", "thank you"]
        deepening_indicators = ["feel", "important", "meaningful", "really", "deeply"]
        
        if any(indicator in message_lower for indicator in opening_indicators):
            return ConversationStage.OPENING
        elif any(indicator in message_lower for indicator in closing_indicators):
            return ConversationStage.CLOSING
        elif any(indicator in message_lower for indicator in deepening_indicators):
            return ConversationStage.DEEPENING
        
        # Determine based on conversation length and depth
        if conv_length < 2:
            return ConversationStage.OPENING
        elif conv_length < 5:
            return ConversationStage.BUILDING
        elif conv_length < 10:
            return ConversationStage.EXPLORING
        elif current_flow.conversation_depth > 0.7:
            return ConversationStage.DEEPENING
        else:
            return ConversationStage.EXPLORING

    def _calculate_conversation_depth(
        self, 
        user_message: str, 
        conversation_history: List[Dict[str, Any]], 
        emotional_context: Dict[str, Any]
    ) -> float:
        """Calculate the current depth of conversation."""
        
        depth_indicators = {
            "surface": ["what", "when", "where", "how much", "which"],
            "moderate": ["how", "why", "explain", "understand", "think"],
            "deep": ["feel", "believe", "important", "meaningful", "personally", "deeply"]
        }
        
        message_lower = user_message.lower()
        depth_score = 0.3  # Base depth
        
        # Check for depth indicators
        if any(word in message_lower for word in depth_indicators["deep"]):
            depth_score += 0.4
        elif any(word in message_lower for word in depth_indicators["moderate"]):
            depth_score += 0.2
        
        # Factor in emotional intensity
        emotion_intensity = emotional_context.get("intensity", 0.5)
        depth_score += emotion_intensity * 0.3
        
        # Factor in message length (longer messages often indicate deeper thought)
        word_count = len(user_message.split())
        if word_count > 30:
            depth_score += 0.2
        elif word_count > 15:
            depth_score += 0.1
        
        # Factor in conversation history depth
        if len(conversation_history) > 10:
            depth_score += 0.1
        
        return min(1.0, depth_score)

    def _assess_energy_level(self, user_message: str, emotional_context: Dict[str, Any]) -> float:
        """Assess the energy level from user's message."""
        
        energy_indicators = {
            "high": ["!", "awesome", "amazing", "excited", "love", "fantastic", "incredible"],
            "low": ["tired", "exhausted", "drained", "meh", "okay", "fine", "slow"]
        }
        
        message_lower = user_message.lower()
        energy_level = 0.5  # Default
        
        # Check for energy indicators
        high_energy_count = sum(1 for word in energy_indicators["high"] if word in message_lower)
        low_energy_count = sum(1 for word in energy_indicators["low"] if word in message_lower)
        
        # Count exclamation marks and caps
        exclamation_count = user_message.count("!")
        caps_ratio = sum(1 for c in user_message if c.isupper()) / len(user_message) if user_message else 0
        
        # Calculate energy
        if high_energy_count > 0 or exclamation_count > 0 or caps_ratio > 0.2:
            energy_level = min(1.0, 0.7 + high_energy_count * 0.1 + exclamation_count * 0.1)
        elif low_energy_count > 0:
            energy_level = max(0.1, 0.3 - low_energy_count * 0.1)
        
        # Factor in emotional context
        emotion = emotional_context.get("primary_emotion", "neutral")
        if emotion in ["excited", "happy", "enthusiastic"]:
            energy_level = min(1.0, energy_level + 0.2)
        elif emotion in ["tired", "sad", "overwhelmed"]:
            energy_level = max(0.1, energy_level - 0.2)
        
        return energy_level

    def _determine_pacing(
        self, 
        user_message: str, 
        conversation_history: List[Dict[str, Any]], 
        current_flow: ConversationFlow
    ) -> str:
        """Determine conversation pacing."""
        
        # Base pacing on energy level
        if current_flow.energy_level > 0.7:
            return "fast"
        elif current_flow.energy_level < 0.3:
            return "slow"
        else:
            return "moderate"

    def _calculate_flow_quality(self, current_flow: ConversationFlow, conversation_history: List[Dict[str, Any]]) -> float:
        """Calculate overall conversation flow quality."""
        
        quality_score = 0.5  # Base quality
        
        # Factor in conversation length (longer conversations suggest good flow)
        if len(conversation_history) > 15:
            quality_score += 0.2
        elif len(conversation_history) > 8:
            quality_score += 0.1
        
        # Factor in topic consistency vs. variety
        topic_history = list(current_flow.topic_history)
        if len(topic_history) > 1:
            # Check for good balance of topic depth vs. variety
            unique_topics = len(set(t["topic"] for t in topic_history))
            if 2 <= unique_topics <= 4:  # Good variety without being scattered
                quality_score += 0.1
        
        # Factor in conversation depth progression
        if current_flow.conversation_depth > 0.5:
            quality_score += 0.1
        
        # Factor in energy appropriateness
        if 0.3 <= current_flow.energy_level <= 0.8:  # Good energy range
            quality_score += 0.1
        
        return min(1.0, quality_score)

    def _determine_topic_relationship(self, current_topic: str, target_topic: str) -> TopicRelation:
        """Determine how two topics relate to each other."""
        
        if current_topic == target_topic:
            return TopicRelation.SAME
        
        # Check if topics are related
        current_related = self.topic_relationships.get(current_topic, [])
        if target_topic in current_related:
            return TopicRelation.RELATED
        
        # Check if target's related topics include current
        target_related = self.topic_relationships.get(target_topic, [])
        if current_topic in target_related:
            return TopicRelation.RELATED
        
        # Check for adjacent relationships (topics that share related topics)
        shared_relations = set(current_related) & set(target_related)
        if shared_relations:
            return TopicRelation.ADJACENT
        
        return TopicRelation.UNRELATED

    def _calculate_naturalness_score(
        self, 
        topic_relation: TopicRelation, 
        current_flow: ConversationFlow,
        context: Dict[str, Any]
    ) -> float:
        """Calculate how natural a transition would be."""
        
        # Base scores by relationship type
        relation_scores = {
            TopicRelation.SAME: 0.9,
            TopicRelation.RELATED: 0.8,
            TopicRelation.ADJACENT: 0.6,
            TopicRelation.UNRELATED: 0.3,
            TopicRelation.OPPOSITE: 0.2
        }
        
        base_score = relation_scores.get(topic_relation, 0.5)
        
        # Factor in conversation stage
        if current_flow.current_stage in [ConversationStage.EXPLORING, ConversationStage.TRANSITIONING]:
            base_score += 0.1  # Transitions more natural during these stages
        
        # Factor in conversation depth
        if current_flow.conversation_depth > 0.7 and topic_relation != TopicRelation.SAME:
            base_score -= 0.2  # Deep conversations shouldn't jump topics easily
        
        # Factor in flow quality
        base_score += (current_flow.flow_quality - 0.5) * 0.2
        
        return max(0.0, min(1.0, base_score))


# Global instance
natural_conversation_flow_engine = NaturalConversationFlowEngine()


