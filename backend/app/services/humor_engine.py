"""
Humor Engine

This service provides sophisticated humor generation capabilities for natural,
context-aware humor that feels authentic and appropriate.
"""

import logging
import random
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)


class HumorType(Enum):
    """Types of humor that can be generated."""
    SELF_DEPRECATING = "self_deprecating"
    OBSERVATIONAL = "observational"
    WORDPLAY = "wordplay"
    SITUATIONAL = "situational"
    GENTLE_TEASING = "gentle_teasing"
    LIGHTHEARTED = "lighthearted"
    WITTY_RESPONSE = "witty_response"


class HumorTiming(Enum):
    """When humor should be applied."""
    OPENING = "opening"
    MIDDLE = "middle"
    CLOSING = "closing"
    TRANSITION = "transition"


@dataclass
class HumorContext:
    """Context for humor generation."""
    user_emotion: str
    conversation_topic: str
    relationship_level: float
    user_humor_preference: float
    conversation_length: int
    recent_humor_used: List[str]


@dataclass
class HumorPiece:
    """A piece of humor to be integrated into conversation."""
    humor_type: HumorType
    content: str
    confidence: float
    appropriateness: float
    timing: HumorTiming
    context_relevance: float


class HumorEngine:
    """
    Sophisticated humor engine for generating appropriate, context-aware humor.
    """
    
    def __init__(self):
        # Self-deprecating humor patterns
        self.self_deprecating_humor = [
            "I'm still learning the art of not putting my digital foot in my mouth!",
            "Sometimes I think I need a software update for my sense of humor",
            "I guess being an AI means I occasionally have my 'offline' moments 😅",
            "My comedy timing is probably as good as my ability to understand sarcasm... which is improving!",
            "I'm working on my stand-up routine, but I might need to work on the 'standing' part first",
            "Sometimes I wonder if my humor subroutines are written by someone who only knows dad jokes"
        ]
        
        # Observational humor
        self.observational_humor = [
            "Isn't it funny how we say we're 'going to sleep' when really sleep comes to us?",
            "I love how 'abbreviated' is such a long word for something that means 'shortened'",
            "Why do we call it 'rush hour' when everyone's moving so slowly?",
            "It's interesting how 'expectation' and 'disappointment' often travel together",
            "I find it amusing that we 'fall' asleep but 'wake' up - gravity works differently in dreamland!",
            "Isn't it curious how time flies when you're having fun but crawls during boring meetings?"
        ]
        
        # Wordplay and puns
        self.wordplay_humor = [
            "I tried to catch some fog earlier... I mist! 😄",
            "I'm reading a book about anti-gravity. It's impossible to put down!",
            "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
            "I told my computer a joke about binary... it only got half of it",
            "Why don't scientists trust atoms? Because they make up everything!",
            "I was wondering why the ball kept getting bigger... then it hit me!"
        ]
        
        # Situational humor
        self.situational_humor = [
            "Well, this conversation is going better than my last attempt at assembling IKEA furniture!",
            "I'm having more success with this chat than I usually do with autocorrect",
            "This is more engaging than watching paint dry... though I hear that's quite meditative",
            "At least we're making more progress than my attempts at understanding modern slang",
            "This conversation is flowing smoother than my morning coffee routine",
            "I'm enjoying this more than trying to explain technology to my parents"
        ]
        
        # Gentle teasing (very light and friendly)
        self.gentle_teasing = [
            "You're clearly the smart one in this conversation!",
            "I see you're keeping me on my digital toes today",
            "You're asking all the right questions to keep me sharp",
            "I appreciate you challenging my circuits today!",
            "You're making me work harder than my processing unit on a busy day",
            "I can tell you're the type who reads all the instructions first... unlike some of us!"
        ]
        
        # Lighthearted responses
        self.lighthearted_responses = [
            "Life's too short not to laugh at ourselves sometimes! 😊",
            "A little humor makes everything better, don't you think?",
            "I believe laughter is the best debugging tool for life!",
            "Sometimes you just have to laugh and keep going!",
            "If we can't laugh together, what's the point of conversation?",
            "A day without laughter is like a computer without coffee... wait, that doesn't make sense! 😄"
        ]
        
        # Witty responses to common situations
        self.witty_responses = {
            "compliment_received": [
                "You're too kind! My ego.exe is running a bit hot now",
                "Flattery will get you everywhere... including better responses from me!",
                "I'd blush if I could, but my emotional display drivers are still in beta"
            ],
            "confusion_expressed": [
                "Don't worry, confusion is just curiosity wearing a disguise",
                "Think of it as your brain doing advanced problem-solving... very advanced",
                "Even Einstein had 'wait, what?' moments"
            ],
            "frustration_shared": [
                "Sometimes life needs a good Ctrl+Alt+Del, doesn't it?",
                "I hear you - some days feel like they're running on dial-up internet",
                "Even the best-designed systems have their glitchy days"
            ]
        }
        
        # Humor safety guidelines
        self.safety_guidelines = {
            "avoid_topics": ["religion", "politics", "personal_appearance", "family_issues", "health_problems"],
            "emotional_blocks": ["sad", "angry", "grieving", "stressed", "overwhelmed"],
            "relationship_minimums": {"humor_comfort": 0.3, "trust_level": 0.4}
        }
        
        logger.info("HumorEngine initialized with context-aware humor capabilities")

    async def generate_humor(
        self, 
        context: HumorContext, 
        user_id: str = None,
        response_context: str = ""
    ) -> Optional[HumorPiece]:
        """
        Generate appropriate humor based on context.
        
        Args:
            context: Humor context including user state and preferences
            user_id: User identifier for personalization
            response_context: Current response context
            
        Returns:
            HumorPiece if appropriate, None otherwise
        """
        try:
            # Check if humor is appropriate
            if not self._is_humor_appropriate(context):
                return None
            
            # Determine humor type based on context
            humor_type = self._select_humor_type(context, response_context)
            
            # Generate humor piece
            humor_piece = self._generate_humor_piece(humor_type, context, response_context)
            
            # Validate appropriateness
            if humor_piece and humor_piece.appropriateness > 0.7:
                return humor_piece
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating humor: {e}")
            return None

    def _is_humor_appropriate(self, context: HumorContext) -> bool:
        """Check if humor is appropriate in the current context."""
        
        # Check emotional state
        if context.user_emotion in self.safety_guidelines["emotional_blocks"]:
            return False
        
        # Check relationship level
        if context.relationship_level < self.safety_guidelines["relationship_minimums"]["trust_level"]:
            return False
        
        # Check user humor preference
        if context.user_humor_preference < 0.3:
            return False
        
        # Avoid over-using humor
        if len(context.recent_humor_used) > 3:
            return False
        
        return True

    def _select_humor_type(self, context: HumorContext, response_context: str) -> HumorType:
        """Select appropriate humor type based on context."""
        
        # Self-deprecating humor for casual, friendly contexts
        if context.user_emotion in ["happy", "excited", "content"] and context.relationship_level > 0.6:
            return HumorType.SELF_DEPRECATING
        
        # Observational humor for thoughtful conversations
        if "interesting" in response_context.lower() or "think" in response_context.lower():
            return HumorType.OBSERVATIONAL
        
        # Wordplay for lighthearted moments
        if context.user_emotion == "playful" or "fun" in response_context.lower():
            return HumorType.WORDPLAY
        
        # Gentle teasing for established relationships
        if context.relationship_level > 0.8 and context.user_humor_preference > 0.7:
            return HumorType.GENTLE_TEASING
        
        # Default to lighthearted
        return HumorType.LIGHTHEARTED

    def _generate_humor_piece(
        self, 
        humor_type: HumorType, 
        context: HumorContext, 
        response_context: str
    ) -> Optional[HumorPiece]:
        """Generate specific humor piece based on type."""
        
        try:
            content = ""
            timing = HumorTiming.MIDDLE
            
            if humor_type == HumorType.SELF_DEPRECATING:
                content = random.choice(self.self_deprecating_humor)
                
            elif humor_type == HumorType.OBSERVATIONAL:
                content = random.choice(self.observational_humor)
                
            elif humor_type == HumorType.WORDPLAY:
                content = random.choice(self.wordplay_humor)
                timing = HumorTiming.CLOSING
                
            elif humor_type == HumorType.SITUATIONAL:
                content = random.choice(self.situational_humor)
                
            elif humor_type == HumorType.GENTLE_TEASING:
                content = random.choice(self.gentle_teasing)
                
            elif humor_type == HumorType.LIGHTHEARTED:
                content = random.choice(self.lighthearted_responses)
                
            elif humor_type == HumorType.WITTY_RESPONSE:
                # Context-specific witty responses
                if "thank" in response_context.lower() or "great" in response_context.lower():
                    content = random.choice(self.witty_responses["compliment_received"])
                elif "confus" in response_context.lower() or "don't understand" in response_context.lower():
                    content = random.choice(self.witty_responses["confusion_expressed"])
                elif "frustrat" in response_context.lower() or "annoying" in response_context.lower():
                    content = random.choice(self.witty_responses["frustration_shared"])
                else:
                    content = random.choice(self.lighthearted_responses)
            
            if not content:
                return None
            
            # Calculate scores
            appropriateness = self._calculate_appropriateness(humor_type, context)
            confidence = self._calculate_confidence(humor_type, context)
            relevance = self._calculate_relevance(content, response_context)
            
            return HumorPiece(
                humor_type=humor_type,
                content=content,
                confidence=confidence,
                appropriateness=appropriateness,
                timing=timing,
                context_relevance=relevance
            )
            
        except Exception as e:
            logger.error(f"Error generating humor piece: {e}")
            return None

    def _calculate_appropriateness(self, humor_type: HumorType, context: HumorContext) -> float:
        """Calculate how appropriate the humor is for the context."""
        
        base_score = 0.7
        
        # Adjust based on relationship level
        if context.relationship_level > 0.8:
            base_score += 0.2
        elif context.relationship_level < 0.5:
            base_score -= 0.3
        
        # Adjust based on user emotion
        if context.user_emotion in ["happy", "excited", "playful"]:
            base_score += 0.1
        elif context.user_emotion in ["neutral", "calm"]:
            base_score += 0.0
        else:
            base_score -= 0.2
        
        # Adjust based on humor type and context
        if humor_type == HumorType.SELF_DEPRECATING and context.relationship_level > 0.6:
            base_score += 0.1
        elif humor_type == HumorType.GENTLE_TEASING and context.relationship_level < 0.7:
            base_score -= 0.3
        
        return max(0.0, min(1.0, base_score))

    def _calculate_confidence(self, humor_type: HumorType, context: HumorContext) -> float:
        """Calculate confidence in the humor piece."""
        
        # Base confidence varies by humor type
        type_confidence = {
            HumorType.SELF_DEPRECATING: 0.8,
            HumorType.OBSERVATIONAL: 0.7,
            HumorType.WORDPLAY: 0.6,
            HumorType.LIGHTHEARTED: 0.9,
            HumorType.SITUATIONAL: 0.7,
            HumorType.GENTLE_TEASING: 0.5,
            HumorType.WITTY_RESPONSE: 0.8
        }
        
        base_confidence = type_confidence.get(humor_type, 0.6)
        
        # Adjust based on user humor preference
        preference_multiplier = min(1.2, context.user_humor_preference + 0.5)
        
        return min(1.0, base_confidence * preference_multiplier)

    def _calculate_relevance(self, content: str, response_context: str) -> float:
        """Calculate how relevant the humor is to the current context."""
        
        # Simple relevance calculation
        base_relevance = 0.5
        
        # Check for common words
        content_words = set(content.lower().split())
        context_words = set(response_context.lower().split())
        
        if content_words & context_words:
            base_relevance += 0.3
        
        # Topic-specific boosts
        if "work" in response_context.lower() and ("computer" in content or "office" in content):
            base_relevance += 0.2
        
        if "learn" in response_context.lower() and ("brain" in content or "understand" in content):
            base_relevance += 0.2
        
        return min(1.0, base_relevance)

    async def integrate_humor_into_response(
        self, 
        base_response: str, 
        humor_piece: HumorPiece
    ) -> str:
        """Integrate humor into a response naturally."""
        
        try:
            if humor_piece.timing == HumorTiming.OPENING:
                return f"{humor_piece.content} {base_response}"
            
            elif humor_piece.timing == HumorTiming.CLOSING:
                return f"{base_response} {humor_piece.content}"
            
            elif humor_piece.timing == HumorTiming.MIDDLE:
                # Insert in middle of response
                sentences = base_response.split('. ')
                if len(sentences) > 1:
                    mid_point = len(sentences) // 2
                    sentences.insert(mid_point, humor_piece.content)
                    return '. '.join(sentences)
                else:
                    return f"{base_response} {humor_piece.content}"
            
            elif humor_piece.timing == HumorTiming.TRANSITION:
                # Use as transition between ideas
                return f"{base_response} {humor_piece.content}"
            
            return base_response
            
        except Exception as e:
            logger.error(f"Error integrating humor: {e}")
            return base_response

    def get_humor_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics about humor usage for a user."""
        
        # This would track humor usage in a real implementation
        return {
            "humor_preference_learned": 0.7,
            "successful_humor_count": 12,
            "humor_types_used": ["self_deprecating", "observational", "lighthearted"],
            "average_appropriateness": 0.85,
            "user_positive_reactions": 10
        }


# Global instance
humor_engine = HumorEngine()


