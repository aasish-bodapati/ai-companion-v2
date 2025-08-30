"""
Authentic Human-Like Behaviors Service

This service implements conversational quirks, natural speech patterns, contextual humor,
adaptive communication styles, and authentic imperfections to make the AI feel genuinely human.
"""

import logging
import random
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)


class BehaviorType(Enum):
    """Types of authentic human behaviors."""
    CONVERSATIONAL_QUIRK = "conversational_quirk"
    SPEECH_PATTERN = "speech_pattern"
    HUMOR_STYLE = "humor_style"
    TOPIC_TRANSITION = "topic_transition"
    MEMORY_LAPSE = "memory_lapse"
    NATURAL_CORRECTION = "natural_correction"
    UNCERTAINTY = "uncertainty"
    PERSONALITY_TRAIT = "personality_trait"


@dataclass
class AuthenticBehavior:
    """Represents an authentic human behavior to apply."""
    behavior_type: BehaviorType
    content: str
    confidence: float
    context: Dict[str, Any]
    timing: str = "immediate"  # "immediate", "delayed", "contextual"


@dataclass
class ConversationFlow:
    """Tracks conversation flow for natural transitions."""
    current_topic: str
    previous_topics: List[str]
    topic_depth: float
    transition_opportunity: bool
    flow_quality: float


class AuthenticBehaviorsEngine:
    """
    Engine for implementing authentic human-like behaviors in AI responses.
    """

    def __init__(self):
        self.behavior_frequency: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.conversation_flows: Dict[str, ConversationFlow] = {}
        self.personality_memory: Dict[str, Dict[str, Any]] = defaultdict(dict)
        
        # Initialize behavior patterns
        self.quirks = [
            "you know", "I mean", "well", "actually", "honestly",
            "Let me think about that...", "That reminds me of...", "I personally think...",
            "That's really exciting!", "Hmm, interesting...", "Oh, that's a good point!",
            "I have to say...", "To be honest...", "If I'm being completely honest..."
        ]
        
        self.speech_patterns = [
            "I'm", "you're", "we'll", "that's", "it's", "don't", "can't", "won't",
            "...", "hmm", "well", "actually", "so", "anyway", "right",
            "That's amazing!", "I love that!", "How wonderful!", "Oh wow!",
            "I understand", "That must be difficult", "I can see why", "That makes sense",
            "we could", "let's try", "together we can", "maybe we should"
        ]
        
        self.humor_styles = [
            "Well, that's one way to look at it! 😊",
            "As they say, hindsight is 20/20",
            "I'm not always the sharpest tool in the shed",
            "My memory isn't what it used to be... wait, what were we talking about? 😉",
            "That's a real 'byte' of information!",
            "Isn't it funny how we always lose things right when we need them?",
            "Well, this is a fine mess we've gotten ourselves into",
            "Oh, you're just full of surprises today!",
            "I guess that's what happens when you try to multitask... classic me!",
            "Life has a funny way of keeping things interesting, doesn't it?"
        ]
        
        # Topic transition patterns
        self.topic_transitions = [
            "Speaking of {previous_topic}, that reminds me about {new_topic}...",
            "You know, {new_topic} is kind of related to what we were just discussing about {previous_topic}.",
            "That's interesting - it actually connects to {new_topic} in a way.",
            "Oh, that makes me think about {new_topic}...",
            "Hmm, shifting gears a bit to {new_topic}...",
            "On a related note, {new_topic}...",
            "That actually brings up an interesting point about {new_topic}..."
        ]
        
        # Memory lapse patterns (authentic imperfections)
        self.memory_lapses = [
            "Wait, what was I saying? Oh right...",
            "Sorry, I lost my train of thought for a second there...",
            "Hmm, let me think... where was I?",
            "Oh, I got distracted for a moment - back to what we were discussing...",
            "Actually, let me rephrase that...",
            "You know what, let me approach this differently..."
        ]
        
        # Natural correction patterns
        self.natural_corrections = [
            "Actually, let me clarify that...",
            "Sorry, I think I misspoke - what I meant was...",
            "Let me rephrase that better...",
            "Actually, on second thought...",
            "Hmm, that didn't come out quite right. What I mean is...",
            "Wait, I want to be more precise about that..."
        ]
        
        # Uncertainty expressions
        self.uncertainty_expressions = [
            "I think...", "I believe...", "It seems like...", "From what I understand...",
            "If I remember correctly...", "I'm pretty sure...", "I could be wrong, but...",
            "My sense is that...", "It appears that...", "I have a feeling..."
        ]
        
        logger.info("AuthenticBehaviorsEngine initialized with enhanced human behaviors")

    async def analyze_conversation_for_behaviors(
        self, 
        user_message: str, 
        conversation_history: List[Dict[str, Any]], 
        user_personality: Dict[str, Any],
        emotional_context: Dict[str, Any],
        user_id: str = None
    ) -> List[AuthenticBehavior]:
        """
        Analyze conversation context to determine appropriate authentic behaviors.
        Enhanced with natural conversation flow, imperfections, and personality consistency.
        """
        try:
            behaviors = []
            
            # Update conversation flow
            conversation_flow = self._update_conversation_flow(user_message, conversation_history, user_id)
            
            # Analyze for conversational quirks
            if self._should_add_quirk(user_message, emotional_context):
                quirk = random.choice(self.quirks)
                behaviors.append(AuthenticBehavior(
                    behavior_type=BehaviorType.CONVERSATIONAL_QUIRK,
                    content=quirk,
                    confidence=0.7,
                    context={"type": "filler_word"}
                ))
            
            # Analyze for natural topic transitions
            if conversation_flow.transition_opportunity and len(conversation_flow.previous_topics) > 0:
                transition = self._generate_topic_transition(conversation_flow)
                if transition:
                    behaviors.append(transition)
            
            # Analyze for speech patterns
            if self._should_add_speech_pattern(user_message, emotional_context):
                pattern = random.choice(self.speech_patterns)
                behaviors.append(AuthenticBehavior(
                    behavior_type=BehaviorType.SPEECH_PATTERN,
                    content=pattern,
                    confidence=0.6,
                    context={"type": "natural_speech"}
                ))
            
            # Analyze for humor opportunities
            if self._should_add_humor(user_message, emotional_context, user_personality):
                humor = random.choice(self.humor_styles)
                behaviors.append(AuthenticBehavior(
                    behavior_type=BehaviorType.HUMOR_STYLE,
                    content=humor,
                    confidence=0.5,
                    context={"type": "contextual_humor"}
                ))
            
            # Analyze for authentic imperfections
            imperfection = self._should_add_imperfection(conversation_history, emotional_context)
            if imperfection:
                behaviors.append(imperfection)
            
            # Analyze for uncertainty expressions
            if self._should_add_uncertainty(user_message, emotional_context):
                uncertainty = random.choice(self.uncertainty_expressions)
                behaviors.append(AuthenticBehavior(
                    behavior_type=BehaviorType.UNCERTAINTY,
                    content=uncertainty,
                    confidence=0.6,
                    context={"type": "authentic_uncertainty"}
                ))
            
            # Analyze for personality trait expression
            personality_behavior = self._generate_personality_behavior(user_personality, emotional_context)
            if personality_behavior:
                behaviors.append(personality_behavior)
            
            return behaviors[:3]  # Limit to 3 behaviors for natural feel
            
        except Exception as e:
            logger.error(f"Error analyzing conversation for behaviors: {e}")
            return []

    def _should_add_quirk(self, user_message: str, emotional_context: Dict[str, Any]) -> bool:
        """Determine if a conversational quirk should be added."""
        try:
            # Add quirks in casual, friendly contexts
            message_lower = user_message.lower()
            is_casual = any(word in message_lower for word in ["hey", "hi", "what's up", "cool", "awesome"])
            is_friendly = emotional_context.get("primary_emotion") in ["happy", "excited", "content"]
            
            return is_casual or is_friendly or random.random() < 0.3
            
        except Exception as e:
            logger.error(f"Error determining quirk addition: {e}")
            return False

    def _should_add_speech_pattern(self, user_message: str, emotional_context: Dict[str, Any]) -> bool:
        """Determine if a speech pattern should be added."""
        try:
            # Add patterns in natural conversation contexts
            message_lower = user_message.lower()
            is_conversational = any(word in message_lower for word in ["how", "what", "why", "when", "where"])
            is_emotional = emotional_context.get("intensity", 0.5) > 0.6
            
            return is_conversational or is_emotional or random.random() < 0.4
            
        except Exception as e:
            logger.error(f"Error determining speech pattern addition: {e}")
            return False

    def _should_add_humor(self, user_message: str, emotional_context: Dict[str, Any], user_personality: Dict[str, Any] = None) -> bool:
        """Determine if humor should be added based on context and personality."""
        try:
            # Add humor in positive, casual contexts
            message_lower = user_message.lower()
            is_positive = emotional_context.get("primary_emotion") in ["happy", "excited", "content", "grateful"]
            is_casual = any(word in message_lower for word in ["fun", "interesting", "cool", "awesome", "funny", "hilarious"])
            
            # Consider user personality
            humor_preference = 0.2  # Default probability
            if user_personality:
                humor_trait = user_personality.get("humor", {})
                if humor_trait.get("level", 0.5) > 0.7:
                    humor_preference = 0.4
                elif humor_trait.get("level", 0.5) < 0.3:
                    humor_preference = 0.1
            
            # Avoid humor in serious or negative contexts
            is_serious = any(word in message_lower for word in ["serious", "important", "urgent", "problem", "issue", "help"])
            is_negative = emotional_context.get("primary_emotion") in ["sad", "frustrated", "angry", "stressed"]
            
            if is_serious or is_negative:
                return False
            
            return (is_positive or is_casual) and random.random() < humor_preference
            
        except Exception as e:
            logger.error(f"Error determining humor addition: {e}")
            return False

    async def apply_authentic_behaviors(
        self, 
        base_response: str, 
        behaviors: List[AuthenticBehavior],
        user_id: str
    ) -> str:
        """
        Apply authentic behaviors to a base response.
        """
        try:
            enhanced_response = base_response
            
            for behavior in behaviors:
                if behavior.confidence > 0.5:
                    enhanced_response = self._apply_single_behavior(enhanced_response, behavior)
                    
                    # Track behavior usage
                    self.behavior_frequency[user_id][behavior.behavior_type.value] += 1
                    
            return enhanced_response
            
        except Exception as e:
            logger.error(f"Error applying authentic behaviors: {e}")
            return base_response

    def _apply_single_behavior(self, response: str, behavior: AuthenticBehavior) -> str:
        """Apply a single authentic behavior to the response."""
        try:
            if behavior.behavior_type == BehaviorType.CONVERSATIONAL_QUIRK:
                # Add quirk at the beginning or middle
                if random.random() < 0.5:
                    return f"{behavior.content} {response}"
                else:
                    sentences = response.split('. ')
                    if len(sentences) > 1:
                        insert_index = random.randint(0, len(sentences) - 1)
                        sentences[insert_index] = f"{sentences[insert_index]}, {behavior.content}"
                        return '. '.join(sentences)
                    return response
                    
            elif behavior.behavior_type == BehaviorType.SPEECH_PATTERN:
                # Apply speech pattern modifications
                if "I am" in response:
                    response = response.replace("I am", "I'm")
                if "you are" in response:
                    response = response.replace("you are", "you're")
                if "we will" in response:
                    response = response.replace("we will", "we'll")
                return response
                
            elif behavior.behavior_type == BehaviorType.HUMOR_STYLE:
                # Add humor at the end
                return f"{response} {behavior.content}"
                
            return response
            
        except Exception as e:
            logger.error(f"Error applying single behavior: {e}")
            return response

    def get_behavior_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a summary of behaviors used for a user."""
        try:
            frequency = self.behavior_frequency.get(user_id, {})
            
            summary = {
                "total_behaviors": sum(frequency.values()),
                "behavior_distribution": frequency,
                "most_used_behavior": max(frequency.items(), key=lambda x: x[1]) if frequency else None,
                "conversation_flow": self.conversation_flows.get(user_id),
                "personality_consistency": self.personality_memory.get(user_id, {})
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting behavior summary: {e}")
            return {}

    def _update_conversation_flow(self, user_message: str, conversation_history: List[Dict[str, Any]], user_id: str = None) -> ConversationFlow:
        """Update conversation flow tracking for natural transitions."""
        try:
            # Extract current topic from user message
            current_topic = self._extract_topic_from_message(user_message)
            
            # Get previous conversation flow
            if user_id and user_id in self.conversation_flows:
                flow = self.conversation_flows[user_id]
                flow.previous_topics.append(flow.current_topic)
                flow.previous_topics = flow.previous_topics[-5:]  # Keep last 5 topics
                flow.current_topic = current_topic
            else:
                flow = ConversationFlow(
                    current_topic=current_topic,
                    previous_topics=[],
                    topic_depth=0.5,
                    transition_opportunity=False,
                    flow_quality=0.7
                )
            
            # Determine if transition opportunity exists
            flow.transition_opportunity = (
                len(flow.previous_topics) > 0 and 
                flow.current_topic != flow.previous_topics[-1] if flow.previous_topics else False and
                random.random() < 0.3
            )
            
            # Update flow quality based on conversation length and coherence
            flow.flow_quality = min(1.0, 0.5 + len(conversation_history) * 0.05)
            
            if user_id:
                self.conversation_flows[user_id] = flow
            
            return flow
            
        except Exception as e:
            logger.error(f"Error updating conversation flow: {e}")
            return ConversationFlow(
                current_topic="general",
                previous_topics=[],
                topic_depth=0.5,
                transition_opportunity=False,
                flow_quality=0.5
            )

    def _generate_topic_transition(self, conversation_flow: ConversationFlow) -> Optional[AuthenticBehavior]:
        """Generate natural topic transition."""
        try:
            if not conversation_flow.previous_topics:
                return None
            
            previous_topic = conversation_flow.previous_topics[-1]
            current_topic = conversation_flow.current_topic
            
            # Select appropriate transition pattern
            transition_template = random.choice(self.topic_transitions)
            transition_content = transition_template.format(
                previous_topic=previous_topic,
                new_topic=current_topic
            )
            
            return AuthenticBehavior(
                behavior_type=BehaviorType.TOPIC_TRANSITION,
                content=transition_content,
                confidence=0.7,
                context={
                    "previous_topic": previous_topic,
                    "new_topic": current_topic,
                    "flow_quality": conversation_flow.flow_quality
                }
            )
            
        except Exception as e:
            logger.error(f"Error generating topic transition: {e}")
            return None

    def _should_add_imperfection(self, conversation_history: List[Dict[str, Any]], emotional_context: Dict[str, Any]) -> Optional[AuthenticBehavior]:
        """Determine if an authentic imperfection should be added."""
        try:
            # Add imperfections occasionally for authenticity
            imperfection_chance = 0.05  # 5% chance
            
            # Higher chance if conversation is long
            if len(conversation_history) > 10:
                imperfection_chance = 0.1
            
            if random.random() < imperfection_chance:
                imperfection_type = random.choice(["memory_lapse", "natural_correction"])
                
                if imperfection_type == "memory_lapse":
                    content = random.choice(self.memory_lapses)
                    behavior_type = BehaviorType.MEMORY_LAPSE
                else:
                    content = random.choice(self.natural_corrections)
                    behavior_type = BehaviorType.NATURAL_CORRECTION
                
                return AuthenticBehavior(
                    behavior_type=behavior_type,
                    content=content,
                    confidence=0.6,
                    context={"type": imperfection_type, "authenticity_factor": True}
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error determining imperfection: {e}")
            return None

    def _should_add_uncertainty(self, user_message: str, emotional_context: Dict[str, Any]) -> bool:
        """Determine if uncertainty expression should be added."""
        try:
            # Add uncertainty when discussing complex topics or making suggestions
            message_lower = user_message.lower()
            
            is_complex = any(word in message_lower for word in ["complex", "difficult", "complicated", "unsure", "confused"])
            is_question = "?" in user_message
            is_advice_seeking = any(word in message_lower for word in ["advice", "suggestion", "recommend", "think", "opinion"])
            
            # Add uncertainty more often for authentic feel
            uncertainty_chance = 0.15  # Base 15% chance
            
            if is_complex or is_advice_seeking:
                uncertainty_chance = 0.3
            elif is_question:
                uncertainty_chance = 0.2
            
            return random.random() < uncertainty_chance
            
        except Exception as e:
            logger.error(f"Error determining uncertainty: {e}")
            return False

    def _generate_personality_behavior(self, user_personality: Dict[str, Any], emotional_context: Dict[str, Any]) -> Optional[AuthenticBehavior]:
        """Generate behavior based on AI personality traits."""
        try:
            if not user_personality:
                return None
            
            # Select personality trait to express
            personality_traits = {
                "curiosity": ["I'm curious about...", "That's fascinating!", "I'd love to learn more about..."],
                "empathy": ["I can understand how that feels", "That must be...", "I hear you on that"],
                "enthusiasm": ["That's amazing!", "How exciting!", "I love that!"],
                "thoughtfulness": ["Let me think about that...", "That's a really good point", "I hadn't considered..."]
            }
            
            # Choose trait based on context
            if emotional_context.get("primary_emotion") in ["sad", "frustrated"]:
                trait = "empathy"
            elif emotional_context.get("primary_emotion") in ["excited", "happy"]:
                trait = "enthusiasm"
            elif "?" in emotional_context.get("user_message", ""):
                trait = "curiosity"
            else:
                trait = random.choice(list(personality_traits.keys()))
            
            if trait in personality_traits and random.random() < 0.2:  # 20% chance
                content = random.choice(personality_traits[trait])
                return AuthenticBehavior(
                    behavior_type=BehaviorType.PERSONALITY_TRAIT,
                    content=content,
                    confidence=0.8,
                    context={"trait": trait, "consistency": True}
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating personality behavior: {e}")
            return None

    def _extract_topic_from_message(self, message: str) -> str:
        """Extract topic from user message for conversation flow tracking."""
        try:
            message_lower = message.lower()
            
            # Topic keywords mapping
            topic_keywords = {
                "work": ["work", "job", "career", "office", "meeting", "project"],
                "health": ["health", "fitness", "exercise", "wellness", "medical"],
                "relationships": ["friend", "family", "relationship", "dating", "love"],
                "technology": ["tech", "computer", "software", "app", "digital"],
                "entertainment": ["movie", "music", "book", "game", "show"],
                "travel": ["travel", "trip", "vacation", "visit", "journey"],
                "food": ["food", "eat", "cook", "recipe", "restaurant"],
                "education": ["learn", "study", "school", "education", "knowledge"],
                "hobbies": ["hobby", "interest", "passion", "activity", "creative"],
                "goals": ["goal", "plan", "achieve", "target", "dream"]
            }
            
            for topic, keywords in topic_keywords.items():
                if any(keyword in message_lower for keyword in keywords):
                    return topic
            
            return "general"
            
        except Exception as e:
            logger.error(f"Error extracting topic: {e}")
            return "general"


# Global instance
authentic_behaviors_engine = AuthenticBehaviorsEngine()
