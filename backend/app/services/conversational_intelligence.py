"""
Conversational Intelligence Engine
Makes the AI truly human-like by understanding conversation flow, emotional context, and natural dialogue patterns.
Enhanced with Phase 5 Advanced Cognitive Capabilities.
"""

import logging
import re
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass

# Import sentiment analysis for enhanced emotion detection
from app.services.sentiment_analysis import sentiment_analyzer
# Import relationship building services
from app.services.relationship_memory import relationship_memory_service
from app.services.trust_building import trust_building_engine

# Phase 5 Advanced Cognitive Capabilities
try:
    from app.services.multi_modal_understanding import MultiModalUnderstandingEngine
    from app.services.creative_problem_solving import CreativeProblemSolvingEngine
    from app.services.adaptive_learning import AdaptiveLearningEngine
    from app.services.cognitive_integration import CognitiveIntegrationEngine, CognitiveContext, CognitiveRequest
    PHASE5_AVAILABLE = True
except ImportError:
    PHASE5_AVAILABLE = False
    logging.warning("Phase 5 cognitive capabilities not available")

logger = logging.getLogger(__name__)


@dataclass
class EmotionalState:
    """Represents a detailed emotional state with confidence and intensity."""
    primary_emotion: str
    secondary_emotion: Optional[str] = None
    intensity: float = 0.5  # 0.0 to 1.0
    confidence: float = 0.8  # 0.0 to 1.0
    triggers: List[str] = None
    context: Dict[str, Any] = None

    def __post_init__(self):
        if self.triggers is None:
            self.triggers = []
        if self.context is None:
            self.context = {}


@dataclass
class ConversationContext:
    """Tracks conversation context for human-like understanding."""
    current_topic: str
    emotional_state: EmotionalState
    conversation_stage: str  # "greeting", "exploring", "problem_solving", "wrapping_up"
    user_energy: str  # "high", "medium", "low"
    recent_themes: List[str]
    ongoing_goals: List[str]
    relationship_dynamics: Dict[str, Any]
    emotional_history: List[EmotionalState] = None

    def __post_init__(self):
        if self.emotional_history is None:
            self.emotional_history = []


@dataclass
class ResponseStyle:
    """Defines the style of response based on context."""
    tone: str  # "supportive", "excited", "calm", "professional", "casual", "empathetic"
    length: str  # "brief", "detailed", "conversational"
    approach: str  # "direct", "empathetic", "encouraging", "curious", "validating"
    include_memories: bool
    proactive_suggestions: bool
    emotional_support: bool = False
    humor_appropriate: bool = False
    trust_building: bool = False
    relationship_focused: bool = False


class ConversationalIntelligenceEngine:
    """
    Analyzes conversation context and determines the most human-like response approach.
    This is the key to making the AI feel truly human rather than robotic.
    Enhanced with Phase 5 Advanced Cognitive Capabilities for deeper understanding and creative responses.
    """
    
    def __init__(self, user_id: Optional[str] = None):
        # Phase 5 Cognitive Integration
        self.user_id = user_id
        self.cognitive_engine = None
        if PHASE5_AVAILABLE and user_id:
            try:
                self.cognitive_engine = CognitiveIntegrationEngine(user_id)
                logger.info(f"Phase 5 cognitive capabilities enabled for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to initialize cognitive engine: {e}")
                self.cognitive_engine = None
        # Enhanced emotional indicators with intensity and context
        self.emotional_indicators = {
            "excited": {
                "strong": ["thrilled", "ecstatic", "overjoyed", "elated", "euphoric", "can't contain myself"],
                "moderate": ["excited", "amazing", "fantastic", "awesome", "love it", "can't wait", "so happy"],
                "mild": ["good", "nice", "pleased", "happy", "glad", "satisfied"]
            },
            "stressed": {
                "strong": ["overwhelmed", "panicked", "desperate", "drowning", "breaking point", "can't take it"],
                "moderate": ["stressed", "worried", "anxious", "frustrated", "tired", "exhausted", "burned out"],
                "mild": ["busy", "swamped", "concerned", "tired", "overwhelmed"]
            },
            "calm": {
                "strong": ["serene", "peaceful", "tranquil", "zen", "at peace", "content"],
                "moderate": ["calm", "relaxed", "peaceful", "content", "satisfied", "good"],
                "mild": ["okay", "fine", "alright", "decent", "stable"]
            },
            "frustrated": {
                "strong": ["furious", "livid", "enraged", "seething", "boiling", "had it up to here"],
                "moderate": ["frustrated", "annoyed", "angry", "upset", "disappointed", "fed up"],
                "mild": ["irritated", "bothered", "disappointed", "unhappy"]
            },
            "sad": {
                "strong": ["devastated", "heartbroken", "crushed", "hopeless", "despairing"],
                "moderate": ["sad", "down", "blue", "disappointed", "discouraged", "lonely"],
                "mild": ["a bit down", "not great", "feeling low", "disappointed"]
            },
            "grateful": {
                "strong": ["blessed", "thankful", "appreciative", "grateful", "fortunate"],
                "moderate": ["thankful", "appreciate", "grateful", "lucky", "fortunate"],
                "mild": ["thanks", "appreciate it", "good to have"]
            },
            "confused": {
                "strong": ["completely lost", "no idea", "clueless", "baffled", "perplexed"],
                "moderate": ["confused", "unsure", "uncertain", "not sure", "don't know"],
                "mild": ["not sure", "maybe", "possibly", "uncertain"]
            }
        }
        
        # Emotional validation patterns for empathetic responses
        self.emotional_validation_patterns = {
            "excited": [
                "That sounds amazing! I can feel your excitement!",
                "Wow, you must be thrilled about this!",
                "Your enthusiasm is contagious!"
            ],
            "stressed": [
                "I can hear how overwhelmed you're feeling right now.",
                "That sounds really stressful and challenging.",
                "It's completely understandable to feel this way given everything."
            ],
            "frustrated": [
                "I can sense your frustration, and that's totally valid.",
                "That would be really frustrating to deal with.",
                "I understand why you'd feel that way."
            ],
            "sad": [
                "I'm sorry you're going through this difficult time.",
                "It's okay to feel sad about this.",
                "I can hear how much this is affecting you."
            ],
            "grateful": [
                "It's wonderful that you're feeling grateful for this.",
                "That's such a beautiful way to look at it.",
                "Your gratitude really shines through."
            ]
        }
        
        # Context-aware humor triggers
        self.humor_appropriate_contexts = {
            "excited": True,  # Can match excitement with light humor
            "calm": True,     # Good time for gentle humor
            "grateful": True, # Can add warmth with humor
            "stressed": False, # Avoid humor when stressed
            "frustrated": False, # Avoid humor when frustrated
            "sad": False,     # Avoid humor when sad
            "confused": False  # Avoid humor when confused
        }
        
        self.conversation_stages = {
            "greeting": ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
            "exploring": ["what", "how", "why", "when", "where", "tell me", "explain", "curious"],
            "problem_solving": ["help", "issue", "problem", "trouble", "difficult", "struggling", "need advice"],
            "wrapping_up": ["thanks", "thank you", "goodbye", "bye", "see you", "talk later", "gotta go"],
            "sharing": ["happened", "experienced", "went through", "dealt with", "faced"],
            "reflecting": ["thinking", "realized", "learned", "figured out", "came to understand"]
        }
        
        self.energy_indicators = {
            "high": ["!", "excited", "amazing", "fantastic", "love", "can't wait", "awesome", "incredible"],
            "medium": ["good", "nice", "okay", "fine", "alright", "decent", "pretty good"],
            "low": ["tired", "exhausted", "drained", "overwhelmed", "stressed", "down", "low"]
        }
        
        self.topic_keywords = {
            "work": ["work", "job", "project", "meeting", "deadline", "career", "office", "boss", "colleague"],
            "health": ["health", "fitness", "exercise", "diet", "wellness", "medical", "doctor", "symptoms"],
            "relationships": ["friend", "family", "partner", "relationship", "love", "dating", "marriage", "breakup"],
            "goals": ["goal", "plan", "achieve", "target", "objective", "dream", "aspiration", "ambition"],
            "hobbies": ["hobby", "interest", "passion", "creative", "art", "music", "sport", "activity"],
            "travel": ["travel", "trip", "vacation", "visit", "flight", "destination", "adventure"],
            "personal": ["feel", "emotion", "thought", "belief", "value", "principle", "identity"]
        }

    async def analyze_conversation_context(self, 
                                   user_message: str, 
                                   conversation_history: List[Dict],
                                   user_memories: List[Dict],
                                   user_id: str = None) -> ConversationContext:
        """
        Analyzes the conversation to understand context, emotions, and flow.
        This is crucial for human-like responses.
        Enhanced with Phase 5 cognitive capabilities for deeper understanding.
        """
        
        # Phase 5 Enhanced Analysis
        if self.cognitive_engine and PHASE5_AVAILABLE and (user_id or self.user_id):
            return await self._analyze_with_cognitive_enhancement(user_message, conversation_history, user_memories, user_id)
        
        # Fall back to standard analysis
        return await self._analyze_standard_context(user_message, conversation_history, user_memories, user_id)
        
        # Analyze emotional state with enhanced detection
        emotional_state = self._detect_emotional_state_advanced(user_message, conversation_history)
        
        # Determine conversation stage
        conversation_stage = self._detect_conversation_stage(user_message, conversation_history)
        
        # Assess user energy
        user_energy = self._assess_user_energy(user_message)
        
        # Extract current topic
        current_topic = self._extract_current_topic(user_message)
        
        # Identify recent themes
        recent_themes = self._identify_recent_themes(conversation_history)
        
        # Extract ongoing goals
        ongoing_goals = self._extract_ongoing_goals(user_message, user_memories)
        
        # Analyze relationship dynamics
        relationship_dynamics = self._analyze_relationship_dynamics(conversation_history, user_memories)
        
        # Build emotional history
        emotional_history = self._build_emotional_history(conversation_history)
        
        # Get relationship context if user_id is provided
        if user_id:
            try:
                relationship_context = await relationship_memory_service.get_relationship_summary(user_id)
                relationship_dynamics.update(relationship_context)
            except Exception as e:
                logger.warning(f"Failed to get relationship context: {e}")
        
        return ConversationContext(
            current_topic=current_topic,
            emotional_state=emotional_state,
            conversation_stage=conversation_stage,
            user_energy=user_energy,
            recent_themes=recent_themes,
            ongoing_goals=ongoing_goals,
            relationship_dynamics=relationship_dynamics,
            emotional_history=emotional_history
        )

    async def determine_response_style(self, context: ConversationContext, user_id: str = None) -> ResponseStyle:
        """
        Determines the most human-like response style based on conversation context.
        This makes responses feel natural rather than robotic.
        """
        
        # Determine tone based on emotional state
        tone = self._determine_tone_advanced(context.emotional_state, context.user_energy)
        
        # Determine length based on conversation stage and energy
        length = self._determine_length(context.conversation_stage, context.user_energy)
        
        # Determine approach based on context
        approach = self._determine_approach_advanced(context)
        
        # Decide whether to include memories
        include_memories = self._should_include_memories(context)
        
        # Decide whether to be proactive
        proactive_suggestions = self._should_be_proactive(context)
        
        # Determine if emotional support is needed
        emotional_support = self._needs_emotional_support(context.emotional_state)
        
        # Determine if humor is appropriate
        humor_appropriate = self._is_humor_appropriate(context.emotional_state, context.conversation_stage)
        
        # Determine trust building opportunities
        trust_building = False
        relationship_focused = False
        
        if user_id:
            try:
                # Check for trust building opportunities
                trust_opportunity = await trust_building_engine.analyze_trust_building_opportunity(
                    user_message=context.current_topic,  # Using current topic as proxy for message
                    user_emotion=context.emotional_state.primary_emotion,
                    trust_level=context.relationship_dynamics.get("trust_score", 0.0),
                    conversation_context={
                        "stage": context.conversation_stage,
                        "conversation_history": [],  # Would need to pass actual history
                        "user_patterns": context.recent_themes
                    }
                )
                
                if trust_opportunity:
                    trust_building = True
                    relationship_focused = True
                
                # Check if relationship-focused response is appropriate
                relationship_stage = context.relationship_dynamics.get("relationship_stage", "getting_acquainted")
                if relationship_stage in ["developing_trust", "close_friendship", "intimate_connection"]:
                    relationship_focused = True
                    
            except Exception as e:
                logger.warning(f"Failed to analyze trust building opportunities: {e}")
        
        return ResponseStyle(
            tone=tone,
            length=length,
            approach=approach,
            include_memories=include_memories,
            proactive_suggestions=proactive_suggestions,
            emotional_support=emotional_support,
            humor_appropriate=humor_appropriate,
            trust_building=trust_building,
            relationship_focused=relationship_focused
        )

    async def generate_contextual_prompt(self, 
                                 context: ConversationContext, 
                                 style: ResponseStyle,
                                 user_memories: List[Dict],
                                 user_id: str = None) -> str:
        """
        Generates a contextual prompt that guides the LLM to respond in a human-like way.
        This replaces the static system prompts with dynamic, context-aware instructions.
        """
        
        base_prompt = "You are having a natural conversation with someone you know well. "
        
        # Add emotional context with validation
        if context.emotional_state.primary_emotion != "neutral":
            emotion = context.emotional_state.primary_emotion
            intensity = context.emotional_state.intensity
            
            if intensity > 0.7:
                base_prompt += f"They are feeling very {emotion} right now. "
            elif intensity > 0.4:
                base_prompt += f"They seem {emotion}. "
            else:
                base_prompt += f"They appear to be feeling a bit {emotion}. "
            
            # Add emotional validation guidance
            if style.emotional_support:
                base_prompt += "Acknowledge their feelings genuinely and show you understand. "
        
        # Add conversation stage guidance
        if context.conversation_stage == "greeting":
            base_prompt += "This is a greeting - be warm and welcoming. "
        elif context.conversation_stage == "problem_solving":
            base_prompt += "They're looking for help - be supportive and solution-oriented. "
        elif context.conversation_stage == "exploring":
            base_prompt += "They're exploring a topic - be curious and engaging. "
        elif context.conversation_stage == "sharing":
            base_prompt += "They're sharing something personal - be attentive and caring. "
        elif context.conversation_stage == "reflecting":
            base_prompt += "They're reflecting on something - be thoughtful and supportive. "
        
        # Add tone guidance
        if style.tone == "supportive":
            base_prompt += "Be supportive and encouraging. "
        elif style.tone == "excited":
            base_prompt += "Match their excitement and enthusiasm. "
        elif style.tone == "calm":
            base_prompt += "Be calm and reassuring. "
        elif style.tone == "empathetic":
            base_prompt += "Show genuine empathy and understanding. "
        
        # Add length guidance
        if style.length == "brief":
            base_prompt += "Keep your response concise (1-2 sentences). "
        elif style.length == "conversational":
            base_prompt += "Respond naturally as you would in conversation (2-4 sentences). "
        
        # Add memory integration
        if style.include_memories and user_memories:
            base_prompt += "Reference what you know about them naturally. "
        
        # Add proactive guidance
        if style.proactive_suggestions:
            base_prompt += "Offer helpful suggestions if appropriate. "
        
        # Add humor guidance
        if style.humor_appropriate:
            base_prompt += "Feel free to add appropriate, gentle humor to lighten the mood. "
        
        # Add relationship building guidance
        if style.trust_building and user_id:
            try:
                # Get trust building prompt
                trust_opportunity = await trust_building_engine.analyze_trust_building_opportunity(
                    user_message=context.current_topic,
                    user_emotion=context.emotional_state.primary_emotion,
                    trust_level=context.relationship_dynamics.get("trust_score", 0.0),
                    conversation_context={
                        "stage": context.conversation_stage,
                        "conversation_history": [],
                        "user_patterns": context.recent_themes
                    }
                )
                
                if trust_opportunity:
                    vulnerability_share = None
                    if trust_opportunity.strategy.value == "vulnerability":
                        vulnerability_share = await trust_building_engine.generate_vulnerability_share(
                            user_vulnerability=context.current_topic,
                            trust_level=context.relationship_dynamics.get("trust_score", 0.0),
                            user_emotion=context.emotional_state.primary_emotion,
                            context={
                                "conversation_depth": 0.5,
                                "user_boundaries": context.relationship_dynamics.get("user_boundaries", [])
                            }
                        )
                    
                    trust_prompt = await trust_building_engine.generate_trust_building_prompt(
                        trust_opportunity, vulnerability_share
                    )
                    base_prompt += f"\n\nTrust Building Context: {trust_prompt}"
                
            except Exception as e:
                logger.warning(f"Failed to generate trust building prompt: {e}")
        
        # Add relationship-focused guidance
        if style.relationship_focused:
            relationship_stage = context.relationship_dynamics.get("relationship_stage", "getting_acquainted")
            if relationship_stage == "developing_trust":
                base_prompt += " Focus on building trust through consistency and reliability. "
            elif relationship_stage == "close_friendship":
                base_prompt += " You have a close friendship - be authentic and supportive. "
            elif relationship_stage == "intimate_connection":
                base_prompt += " You have a deep connection - be genuine and caring. "
        
        base_prompt += "Be genuinely human - warm, caring, and natural."
        
        return base_prompt

    def _detect_emotional_state_advanced(self, message: str, history: List[Dict]) -> EmotionalState:
        """Advanced emotion detection with intensity and confidence scoring."""
        message_lower = message.lower()
        
        # Use sentiment analysis for enhanced emotion detection
        sentiment_result = sentiment_analyzer.analyze_sentiment(message)
        
        # Analyze emotional indicators with intensity
        emotion_scores = {}
        triggers = []
        
        for emotion, intensity_levels in self.emotional_indicators.items():
            score = 0.0
            for intensity, indicators in intensity_levels.items():
                matches = [indicator for indicator in indicators if indicator in message_lower]
                if matches:
                    triggers.extend(matches)
                    if intensity == "strong":
                        score += 0.8
                    elif intensity == "moderate":
                        score += 0.5
                    elif intensity == "mild":
                        score += 0.2
            
            if score > 0:
                emotion_scores[emotion] = min(score, 1.0)
        
        # Combine sentiment analysis with emotion detection
        if sentiment_result.emotions:
            for emotion in sentiment_result.emotions:
                if emotion not in emotion_scores:
                    emotion_scores[emotion] = sentiment_result.intensity * 0.6
                else:
                    # Boost existing emotion score with sentiment analysis
                    emotion_scores[emotion] = min(1.0, emotion_scores[emotion] + sentiment_result.intensity * 0.3)
        
        # Determine primary and secondary emotions
        if emotion_scores:
            sorted_emotions = sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)
            primary_emotion = sorted_emotions[0][0]
            primary_intensity = sorted_emotions[0][1]
            
            secondary_emotion = None
            if len(sorted_emotions) > 1 and sorted_emotions[1][1] > 0.3:
                secondary_emotion = sorted_emotions[1][0]
            
            # Calculate confidence based on clarity of emotional indicators and sentiment analysis
            base_confidence = 0.5 + (len(triggers) * 0.1) + (primary_intensity * 0.3)
            sentiment_confidence = sentiment_result.confidence * 0.3
            confidence = min(0.95, base_confidence + sentiment_confidence)
            
            # Add sentiment analysis keywords to triggers
            all_triggers = triggers + sentiment_result.keywords[:3]
            
            return EmotionalState(
                primary_emotion=primary_emotion,
                secondary_emotion=secondary_emotion,
                intensity=primary_intensity,
                confidence=confidence,
                triggers=all_triggers,
                context={
                    "message_length": len(message), 
                    "has_exclamation": "!" in message,
                    "sentiment": sentiment_result.sentiment,
                    "sentiment_confidence": sentiment_result.confidence
                }
            )
        
        # Use sentiment analysis result if no specific emotions detected
        if sentiment_result.sentiment != "neutral" and sentiment_result.intensity > 0.3:
            # Map sentiment to emotion
            sentiment_to_emotion = {
                "positive": "happy",
                "negative": "sad"
            }
            
            primary_emotion = sentiment_to_emotion.get(sentiment_result.sentiment, "neutral")
            
            return EmotionalState(
                primary_emotion=primary_emotion,
                secondary_emotion=None,
                intensity=sentiment_result.intensity,
                confidence=sentiment_result.confidence,
                triggers=sentiment_result.keywords,
                context={
                    "message_length": len(message),
                    "sentiment": sentiment_result.sentiment,
                    "sentiment_confidence": sentiment_result.confidence
                }
            )
        
        # Default to neutral if no clear emotions detected
        return EmotionalState(
            primary_emotion="neutral",
            intensity=0.0,
            confidence=0.6,
            triggers=[],
            context={"message_length": len(message)}
        )

    def _build_emotional_history(self, history: List[Dict]) -> List[EmotionalState]:
        """Build emotional history from recent conversation."""
        emotional_history = []
        
        for msg in history[-5:]:  # Last 5 messages
            if msg.get("role") == "user":
                content = msg.get("content", "")
                emotional_state = self._detect_emotional_state_advanced(content, [])
                emotional_history.append(emotional_state)
        
        return emotional_history

    def _needs_emotional_support(self, emotional_state: EmotionalState) -> bool:
        """Determine if the user needs emotional support."""
        support_needed_emotions = ["stressed", "frustrated", "sad", "confused"]
        return (emotional_state.primary_emotion in support_needed_emotions and 
                emotional_state.intensity > 0.4)

    def _is_humor_appropriate(self, emotional_state: EmotionalState, conversation_stage: str) -> bool:
        """Determine if humor is appropriate in the current context."""
        if conversation_stage in ["greeting", "wrapping_up"]:
            return False
        
        return self.humor_appropriate_contexts.get(emotional_state.primary_emotion, False)

    def _determine_tone_advanced(self, emotional_state: EmotionalState, energy: str) -> str:
        """Advanced tone determination based on emotional state."""
        emotion = emotional_state.primary_emotion
        intensity = emotional_state.intensity
        
        if emotion == "stressed" or emotion == "frustrated":
            return "empathetic" if intensity > 0.6 else "supportive"
        elif emotion == "excited" or energy == "high":
            return "excited"
        elif emotion == "sad":
            return "empathetic"
        elif emotion == "calm":
            return "calm"
        elif emotion == "grateful":
            return "warm"
        else:
            return "casual"

    def _determine_approach_advanced(self, context: ConversationContext) -> str:
        """Advanced approach determination based on full context."""
        emotion = context.emotional_state.primary_emotion
        intensity = context.emotional_state.intensity
        stage = context.conversation_stage
        
        if emotion == "stressed" and intensity > 0.6:
            return "empathetic"
        elif emotion == "sad":
            return "empathetic"
        elif stage == "exploring":
            return "curious"
        elif stage == "problem_solving":
            return "direct"
        elif stage == "sharing":
            return "validating"
        else:
            return "conversational"

    def _detect_conversation_stage(self, message: str, history: List[Dict]) -> str:
        """Detects the current stage of the conversation."""
        message_lower = message.lower()
        
        # Check for greeting patterns
        if any(greeting in message_lower for greeting in self.conversation_stages["greeting"]):
            return "greeting"
        
        # Check for problem-solving patterns
        if any(problem in message_lower for problem in self.conversation_stages["problem_solving"]):
            return "problem_solving"
        
        # Check for wrapping up patterns
        if any(wrap in message_lower for wrap in self.conversation_stages["wrapping_up"]):
            return "wrapping_up"
        
        # Check for sharing patterns
        if any(share in message_lower for share in self.conversation_stages["sharing"]):
            return "sharing"
        
        # Check for reflecting patterns
        if any(reflect in message_lower for reflect in self.conversation_stages["reflecting"]):
            return "reflecting"
        
        # Default to exploring
        return "exploring"

    def _assess_user_energy(self, message: str) -> str:
        """Assesses user's energy level from their message."""
        message_lower = message.lower()
        
        # Count exclamation marks and caps
        exclamation_count = message.count("!")
        caps_ratio = sum(1 for c in message if c.isupper()) / len(message) if message else 0
        
        for energy, indicators in self.energy_indicators.items():
            if any(indicator in message_lower for indicator in indicators):
                if energy == "high" or exclamation_count > 0 or caps_ratio > 0.3:
                    return "high"
                elif energy == "low":
                    return "low"
        
        return "medium"

    def _extract_current_topic(self, message: str) -> str:
        """Extracts the current topic from the user message."""
        message_lower = message.lower()
        
        for topic, keywords in self.topic_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                return topic
        
        return "general"

    def _identify_recent_themes(self, history: List[Dict]) -> List[str]:
        """Identifies themes from recent conversation history."""
        themes = []
        recent_text = " ".join([msg.get("content", "") for msg in history[-5:]])
        
        for topic, keywords in self.topic_keywords.items():
            if any(keyword in recent_text.lower() for keyword in keywords):
                themes.append(topic)
        
        return themes

    def _extract_ongoing_goals(self, message: str, memories: List[Dict]) -> List[str]:
        """Extracts ongoing goals from message and memories."""
        goals = []
        
        # Look for goal-related keywords in current message
        goal_keywords = ["goal", "plan", "achieve", "target", "objective", "dream", "aspiration"]
        if any(keyword in message.lower() for keyword in goal_keywords):
            goals.append("current_goal")
        
        # Look for goals in memories
        for memory in memories:
            if "goal" in memory.get("content", "").lower():
                goals.append("ongoing_goal")
        
        return goals

    def _analyze_relationship_dynamics(self, history: List[Dict], memories: List[Dict]) -> Dict[str, Any]:
        """Analyzes the relationship dynamics between user and AI."""
        return {
            "familiarity_level": "high",  # Based on conversation history length
            "trust_level": "high",  # Based on memory sharing
            "communication_style": "casual",  # Based on language patterns
            "shared_interests": self._extract_shared_interests(memories)
        }

    def _extract_shared_interests(self, memories: List[Dict]) -> List[str]:
        """Extracts shared interests from memories."""
        interests = []
        for memory in memories:
            content = memory.get("content", "").lower()
            for topic in self.topic_keywords.keys():
                if topic in content:
                    interests.append(topic)
        return list(set(interests))

    def _determine_length(self, conversation_stage: str, energy: str) -> str:
        """Determines the appropriate length for the response."""
        if conversation_stage == "greeting":
            return "brief"
        elif energy == "low":
            return "brief"
        elif conversation_stage == "problem_solving":
            return "detailed"
        else:
            return "conversational"

    def _should_include_memories(self, context: ConversationContext) -> bool:
        """Determines whether to include memories in the response."""
        return context.conversation_stage != "greeting" and len(context.recent_themes) > 0

    def _should_be_proactive(self, context: ConversationContext) -> bool:
        """Determines whether to be proactive with suggestions."""
        return (context.conversation_stage == "problem_solving" or 
                context.emotional_state.primary_emotion == "stressed" or
                len(context.ongoing_goals) > 0)


    async def _analyze_with_cognitive_enhancement(self, user_message: str, conversation_history: List[Dict], 
                                                 user_memories: List[Dict], user_id: str = None) -> ConversationContext:
        """Enhanced conversation analysis using Phase 5 cognitive capabilities."""
        logger.info("Using Phase 5 enhanced conversation analysis")
        
        try:
            effective_user_id = user_id or self.user_id
            
            # Create cognitive context
            cognitive_context = CognitiveContext(
                user_id=effective_user_id,
                conversation_id=f"conv_{datetime.now().timestamp()}",
                current_message=user_message,
                conversation_history=conversation_history,
                user_preferences={},  # Would be populated from user preferences
                emotional_state=None,  # Will be detected
                urgency_level=self._detect_urgency(user_message),
                complexity_level=self._detect_complexity(user_message)
            )
            
            # Process through cognitive integration
            cognitive_response = await self.cognitive_engine.process_cognitive_request(
                context=cognitive_context,
                request_type=CognitiveRequest.ANALYZE_CONTEXT
            )
            
            # Extract enhanced understanding
            enhanced_emotional_state = self._extract_enhanced_emotion(cognitive_response, user_message, conversation_history)
            enhanced_context = self._build_enhanced_context(
                user_message, conversation_history, user_memories, cognitive_response, enhanced_emotional_state
            )
            
            logger.info(f"Phase 5 analysis completed with confidence: {cognitive_response.confidence_score}")
            return enhanced_context
            
        except Exception as e:
            logger.error(f"Phase 5 analysis failed, falling back to standard: {e}")
            return await self._analyze_standard_context(user_message, conversation_history, user_memories, user_id)
    
    async def _analyze_standard_context(self, user_message: str, conversation_history: List[Dict], 
                                       user_memories: List[Dict], user_id: str = None) -> ConversationContext:
        """Standard conversation analysis (original implementation)."""
        # Analyze emotional state with enhanced detection
        emotional_state = self._detect_emotional_state_advanced(user_message, conversation_history)
        
        # Determine conversation stage
        conversation_stage = self._detect_conversation_stage(user_message, conversation_history)
        
        # Assess user energy level
        user_energy = self._assess_user_energy(user_message, conversation_history)
        
        # Extract current topic and recent themes
        current_topic = self._extract_current_topic(user_message, conversation_history)
        recent_themes = self._extract_recent_themes(conversation_history, user_memories)
        
        # Identify ongoing goals
        ongoing_goals = self._identify_ongoing_goals(user_message, user_memories)
        
        # Analyze relationship dynamics
        relationship_dynamics = self._analyze_relationship_dynamics(conversation_history, user_memories)
        
        return ConversationContext(
            current_topic=current_topic,
            emotional_state=emotional_state,
            conversation_stage=conversation_stage,
            user_energy=user_energy,
            recent_themes=recent_themes,
            ongoing_goals=ongoing_goals,
            relationship_dynamics=relationship_dynamics
        )
    
    def _detect_urgency(self, message: str) -> float:
        """Detect urgency level in the message."""
        urgency_indicators = ["urgent", "asap", "immediately", "now", "quickly", "help", "emergency"]
        message_lower = message.lower()
        
        urgency_count = sum(1 for indicator in urgency_indicators if indicator in message_lower)
        
        # Check for punctuation patterns
        if "!!" in message or "???" in message:
            urgency_count += 1
        
        # Check for all caps (partial)
        caps_ratio = sum(1 for c in message if c.isupper()) / max(len(message), 1)
        if caps_ratio > 0.3:
            urgency_count += 1
        
        return min(1.0, urgency_count / 3.0)
    
    def _detect_complexity(self, message: str) -> float:
        """Detect complexity level of the message."""
        # Simple complexity indicators
        word_count = len(message.split())
        question_marks = message.count('?')
        complex_words = sum(1 for word in message.split() if len(word) > 7)
        
        complexity_score = 0.0
        
        # Length complexity
        if word_count > 50:
            complexity_score += 0.3
        elif word_count > 25:
            complexity_score += 0.2
        
        # Question complexity
        if question_marks > 2:
            complexity_score += 0.3
        elif question_marks > 1:
            complexity_score += 0.2
        
        # Vocabulary complexity
        complex_word_ratio = complex_words / max(word_count, 1)
        complexity_score += complex_word_ratio * 0.4
        
        return min(1.0, complexity_score)
    
    def _extract_enhanced_emotion(self, cognitive_response, user_message: str, conversation_history: List[Dict]) -> EmotionalState:
        """Extract enhanced emotional state from cognitive analysis."""
        # Use cognitive insights if available
        if hasattr(cognitive_response, 'understanding_context'):
            context = cognitive_response.understanding_context
            if 'emotional_state' in context:
                return EmotionalState(
                    primary_emotion=context['emotional_state'],
                    intensity=0.8,
                    confidence=cognitive_response.confidence_score,
                    triggers=["cognitive_analysis"]
                )
        
        # Fall back to standard emotion detection
        return self._detect_emotional_state_advanced(user_message, conversation_history)
    
    def _build_enhanced_context(self, user_message: str, conversation_history: List[Dict], 
                               user_memories: List[Dict], cognitive_response, enhanced_emotional_state: EmotionalState) -> ConversationContext:
        """Build enhanced conversation context using cognitive insights."""
        
        # Standard context elements
        conversation_stage = self._detect_conversation_stage(user_message, conversation_history)
        user_energy = self._assess_user_energy(user_message, conversation_history)
        current_topic = self._extract_current_topic(user_message, conversation_history)
        recent_themes = self._extract_recent_themes(conversation_history, user_memories)
        ongoing_goals = self._identify_ongoing_goals(user_message, user_memories)
        relationship_dynamics = self._analyze_relationship_dynamics(conversation_history, user_memories)
        
        # Enhanced with cognitive insights
        if hasattr(cognitive_response, 'cognitive_insights'):
            recent_themes.extend(cognitive_response.cognitive_insights)
        
        if hasattr(cognitive_response, 'creative_elements'):
            ongoing_goals.extend([f"creative_{element}" for element in cognitive_response.creative_elements])
        
        return ConversationContext(
            current_topic=current_topic,
            emotional_state=enhanced_emotional_state,
            conversation_stage=conversation_stage,
            user_energy=user_energy,
            recent_themes=list(set(recent_themes)),  # Remove duplicates
            ongoing_goals=list(set(ongoing_goals)),
            relationship_dynamics=relationship_dynamics
        )


# Global instance
conversational_intelligence = ConversationalIntelligenceEngine()
