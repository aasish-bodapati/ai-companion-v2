"""
Predictive Intelligence Service

This service analyzes user patterns and predicts future needs using machine learning
techniques to provide anticipatory responses and proactive assistance.
Enhanced with Phase 5 Advanced Cognitive Capabilities for creative problem solving and adaptive learning.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
from collections import defaultdict, Counter
import re

# Phase 5 Advanced Cognitive Capabilities
try:
    from app.services.creative_problem_solving import CreativeProblemSolvingEngine
    from app.services.adaptive_learning import AdaptiveLearningEngine
    from app.services.cognitive_integration import CognitiveIntegrationEngine, CognitiveContext, CognitiveRequest
    PHASE5_AVAILABLE = True
except ImportError:
    PHASE5_AVAILABLE = False
    logging.warning("Phase 5 cognitive capabilities not available for predictive intelligence")

logger = logging.getLogger(__name__)


class PatternType(Enum):
    """Types of user patterns that can be detected."""
    CONVERSATION_TIME = "conversation_time"
    TOPIC_PREFERENCE = "topic_preference"
    EMOTIONAL_CYCLE = "emotional_cycle"
    RESPONSE_STYLE = "response_style"
    INTERACTION_FREQUENCY = "interaction_frequency"
    GOAL_ORIENTED = "goal_oriented"
    PROBLEM_SOLVING = "problem_solving"
    SOCIAL_NEEDS = "social_needs"


class PredictionConfidence(Enum):
    """Confidence levels for predictions."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


@dataclass
class UserPattern:
    """Represents a detected pattern in user behavior."""
    pattern_type: PatternType
    pattern_data: Dict[str, Any]
    confidence: float
    first_detected: datetime
    last_observed: datetime
    frequency: int
    strength: float  # 0.0 to 1.0
    context: Dict[str, Any]


@dataclass
class Prediction:
    """Represents a prediction about user needs or behavior."""
    prediction_type: str
    predicted_value: Any
    confidence: PredictionConfidence
    reasoning: str
    timeframe: str
    triggers: List[str]
    context: Dict[str, Any]


@dataclass
class AnticipatoryResponse:
    """Represents an anticipatory response to predicted user needs."""
    response_type: str
    content: str
    urgency: str  # low, medium, high
    timing: str  # immediate, soon, later
    confidence: float
    context: Dict[str, Any]


class PredictiveIntelligenceEngine:
    """
    Engine for analyzing user patterns and making predictions about future needs.
    Enhanced with Phase 5 cognitive capabilities for creative pattern recognition and adaptive predictions.
    """
    
    def __init__(self, user_id: Optional[str] = None):
        self.patterns: Dict[str, List[UserPattern]] = defaultdict(list)
        self.prediction_history: Dict[str, List[Prediction]] = defaultdict(list)
        self.accuracy_tracking: Dict[str, List[bool]] = defaultdict(list)
        
        # Phase 5 Cognitive Integration
        self.user_id = user_id
        self.creative_engine = None
        self.learning_engine = None
        
        if PHASE5_AVAILABLE and user_id:
            try:
                self.creative_engine = CreativeProblemSolvingEngine()
                self.learning_engine = AdaptiveLearningEngine(user_id)
                logger.info(f"Phase 5 cognitive capabilities enabled for predictive intelligence: {user_id}")
            except Exception as e:
                logger.error(f"Failed to initialize Phase 5 capabilities: {e}")
                self.creative_engine = None
                self.learning_engine = None
        
        # Pattern detection thresholds
        self.min_pattern_frequency = 3
        self.min_confidence_threshold = 0.6
        self.pattern_decay_factor = 0.95
        
        # Time-based pattern detection
        self.time_windows = {
            "hourly": timedelta(hours=1),
            "daily": timedelta(days=1),
            "weekly": timedelta(weeks=1),
            "monthly": timedelta(days=30)
        }
        
        logger.info("PredictiveIntelligenceEngine initialized")
    
    async def analyze_user_patterns(self, user_id: str, conversation_data: Dict[str, Any]) -> List[UserPattern]:
        """
        Analyze conversation data to detect user patterns.
        
        Args:
            user_id: The user identifier
            conversation_data: Recent conversation data including messages, timing, topics
            
        Returns:
            List of detected patterns
        """
        try:
            patterns = []
            
            # Analyze conversation timing patterns
            timing_patterns = self._detect_timing_patterns(user_id, conversation_data)
            patterns.extend(timing_patterns)
            
            # Analyze topic preference patterns
            topic_patterns = self._detect_topic_patterns(user_id, conversation_data)
            patterns.extend(topic_patterns)
            
            # Analyze emotional patterns
            emotional_patterns = self._detect_emotional_patterns(user_id, conversation_data)
            patterns.extend(emotional_patterns)
            
            # Analyze response style patterns
            style_patterns = self._detect_response_style_patterns(user_id, conversation_data)
            patterns.extend(style_patterns)
            
            # Store and update patterns
            self._update_patterns(user_id, patterns)
            
            logger.info(f"Detected {len(patterns)} patterns for user {user_id}")
            return patterns
            
        except Exception as e:
            logger.error(f"Error analyzing patterns for user {user_id}: {e}")
            return []
    
    def _detect_timing_patterns(self, user_id: str, data: Dict[str, Any]) -> List[UserPattern]:
        """Detect patterns in conversation timing."""
        patterns = []
        
        try:
            messages = data.get("messages", [])
            if len(messages) < 3:
                return patterns
            
            # Extract timestamps
            timestamps = []
            for msg in messages:
                if "timestamp" in msg:
                    timestamps.append(datetime.fromisoformat(msg["timestamp"]))
            
            if len(timestamps) < 3:
                return patterns
            
            # Analyze time intervals
            intervals = []
            for i in range(1, len(timestamps)):
                interval = (timestamps[i] - timestamps[i-1]).total_seconds()
                intervals.append(interval)
            
            # Detect regular intervals
            if len(intervals) >= 3:
                avg_interval = np.mean(intervals)
                std_interval = np.std(intervals)
                
                # Check for consistency (low standard deviation)
                if std_interval < avg_interval * 0.5:  # Less than 50% variation
                    confidence = min(0.9, 1.0 - (std_interval / avg_interval))
                    
                    pattern = UserPattern(
                        pattern_type=PatternType.INTERACTION_FREQUENCY,
                        pattern_data={
                            "average_interval_seconds": avg_interval,
                            "std_deviation": std_interval,
                            "consistency_score": 1.0 - (std_interval / avg_interval)
                        },
                        confidence=confidence,
                        first_detected=timestamps[0],
                        last_observed=timestamps[-1],
                        frequency=len(intervals),
                        strength=confidence,
                        context={"total_messages": len(messages)}
                    )
                    patterns.append(pattern)
            
            # Detect time-of-day patterns
            hours = [ts.hour for ts in timestamps]
            hour_counts = Counter(hours)
            most_common_hour = hour_counts.most_common(1)[0]
            
            if most_common_hour[1] >= len(hours) * 0.4:  # 40% of messages at same hour
                pattern = UserPattern(
                    pattern_type=PatternType.CONVERSATION_TIME,
                    pattern_data={
                        "preferred_hour": most_common_hour[0],
                        "frequency": most_common_hour[1],
                        "total_messages": len(hours)
                    },
                    confidence=most_common_hour[1] / len(hours),
                    first_detected=timestamps[0],
                    last_observed=timestamps[-1],
                    frequency=most_common_hour[1],
                    strength=most_common_hour[1] / len(hours),
                    context={"hour_distribution": dict(hour_counts)}
                )
                patterns.append(pattern)
                
        except Exception as e:
            logger.error(f"Error detecting timing patterns: {e}")
        
        return patterns
    
    def _detect_topic_patterns(self, user_id: str, data: Dict[str, Any]) -> List[UserPattern]:
        """Detect patterns in topic preferences."""
        patterns = []
        
        try:
            messages = data.get("messages", [])
            if len(messages) < 3:
                return patterns
            
            # Extract topics from messages
            topics = []
            for msg in messages:
                if "topic" in msg:
                    topics.append(msg["topic"])
                elif "content" in msg:
                    # Simple topic extraction from content
                    content = msg["content"].lower()
                    detected_topics = self._extract_topics_from_content(content)
                    topics.extend(detected_topics)
            
            if not topics:
                return patterns
            
            # Analyze topic frequency
            topic_counts = Counter(topics)
            total_topics = len(topics)
            
            for topic, count in topic_counts.items():
                if count >= self.min_pattern_frequency:
                    frequency_ratio = count / total_topics
                    
                    if frequency_ratio >= 0.2:  # 20% or more of conversations
                        pattern = UserPattern(
                            pattern_type=PatternType.TOPIC_PREFERENCE,
                            pattern_data={
                                "topic": topic,
                                "frequency": count,
                                "frequency_ratio": frequency_ratio
                            },
                            confidence=frequency_ratio,
                            first_detected=datetime.now(),
                            last_observed=datetime.now(),
                            frequency=count,
                            strength=frequency_ratio,
                            context={"all_topics": dict(topic_counts)}
                        )
                        patterns.append(pattern)
                        
        except Exception as e:
            logger.error(f"Error detecting topic patterns: {e}")
        
        return patterns
    
    def _extract_topics_from_content(self, content: str) -> List[str]:
        """Extract topics from message content using keyword matching."""
        topics = []
        
        # Define topic keywords
        topic_keywords = {
            "work": ["work", "job", "career", "office", "meeting", "project", "deadline"],
            "health": ["health", "exercise", "diet", "sleep", "stress", "wellness", "medical"],
            "relationships": ["friend", "family", "partner", "relationship", "social"],
            "technology": ["tech", "computer", "software", "app", "digital", "online"],
            "entertainment": ["movie", "music", "game", "book", "hobby", "fun"],
            "personal": ["goal", "dream", "aspiration", "personal", "growth"],
            "problem": ["problem", "issue", "trouble", "difficulty", "challenge"]
        }
        
        content_lower = content.lower()
        for topic, keywords in topic_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    def _detect_emotional_patterns(self, user_id: str, data: Dict[str, Any]) -> List[UserPattern]:
        """Detect patterns in emotional states."""
        patterns = []
        
        try:
            messages = data.get("messages", [])
            if len(messages) < 3:
                return patterns
            
            # Extract emotional states
            emotions = []
            for msg in messages:
                if "emotional_state" in msg:
                    emotions.append(msg["emotional_state"])
            
            if not emotions:
                return patterns
            
            # Analyze emotional patterns
            emotion_counts = Counter(emotions)
            total_emotions = len(emotions)
            
            # Detect dominant emotions
            for emotion, count in emotion_counts.items():
                if count >= self.min_pattern_frequency:
                    frequency_ratio = count / total_emotions
                    
                    if frequency_ratio >= 0.3:  # 30% or more of emotional states
                        pattern = UserPattern(
                            pattern_type=PatternType.EMOTIONAL_CYCLE,
                            pattern_data={
                                "dominant_emotion": emotion,
                                "frequency": count,
                                "frequency_ratio": frequency_ratio
                            },
                            confidence=frequency_ratio,
                            first_detected=datetime.now(),
                            last_observed=datetime.now(),
                            frequency=count,
                            strength=frequency_ratio,
                            context={"emotion_distribution": dict(emotion_counts)}
                        )
                        patterns.append(pattern)
                        
        except Exception as e:
            logger.error(f"Error detecting emotional patterns: {e}")
        
        return patterns
    
    def _detect_response_style_patterns(self, user_id: str, data: Dict[str, Any]) -> List[UserPattern]:
        """Detect patterns in user response styles."""
        patterns = []
        
        try:
            messages = data.get("messages", [])
            if len(messages) < 3:
                return patterns
            
            # Analyze message characteristics
            message_lengths = []
            response_times = []
            question_frequency = 0
            
            for msg in messages:
                if "content" in msg:
                    content = msg["content"]
                    message_lengths.append(len(content))
                    
                    # Count questions
                    if "?" in content:
                        question_frequency += 1
            
            if message_lengths:
                avg_length = np.mean(message_lengths)
                std_length = np.std(message_lengths)
                
                # Detect consistent message length patterns
                if std_length < avg_length * 0.3:  # Very consistent length
                    pattern = UserPattern(
                        pattern_type=PatternType.RESPONSE_STYLE,
                        pattern_data={
                            "style": "consistent_length",
                            "average_length": avg_length,
                            "consistency": 1.0 - (std_length / avg_length)
                        },
                        confidence=1.0 - (std_length / avg_length),
                        first_detected=datetime.now(),
                        last_observed=datetime.now(),
                        frequency=len(message_lengths),
                        strength=1.0 - (std_length / avg_length),
                        context={"length_distribution": message_lengths}
                    )
                    patterns.append(pattern)
            
            # Detect question-asking patterns
            if question_frequency >= self.min_pattern_frequency:
                question_ratio = question_frequency / len(messages)
                
                if question_ratio >= 0.2:  # 20% or more questions
                    pattern = UserPattern(
                        pattern_type=PatternType.RESPONSE_STYLE,
                        pattern_data={
                            "style": "question_heavy",
                            "question_frequency": question_frequency,
                            "question_ratio": question_ratio
                        },
                        confidence=question_ratio,
                        first_detected=datetime.now(),
                        last_observed=datetime.now(),
                        frequency=question_frequency,
                        strength=question_ratio,
                        context={"total_messages": len(messages)}
                    )
                    patterns.append(pattern)
                    
        except Exception as e:
            logger.error(f"Error detecting response style patterns: {e}")
        
        return patterns
    
    def _update_patterns(self, user_id: str, new_patterns: List[UserPattern]):
        """Update stored patterns for a user."""
        try:
            existing_patterns = self.patterns[user_id]
            
            for new_pattern in new_patterns:
                # Check if similar pattern already exists
                similar_pattern = None
                for existing in existing_patterns:
                    if (existing.pattern_type == new_pattern.pattern_type and
                        self._patterns_similar(existing, new_pattern)):
                        similar_pattern = existing
                        break
                
                if similar_pattern:
                    # Update existing pattern
                    similar_pattern.frequency += new_pattern.frequency
                    similar_pattern.last_observed = new_pattern.last_observed
                    similar_pattern.strength = min(1.0, similar_pattern.strength + 0.1)
                    similar_pattern.confidence = max(similar_pattern.confidence, new_pattern.confidence)
                else:
                    # Add new pattern
                    existing_patterns.append(new_pattern)
            
            # Remove old patterns (decay)
            current_time = datetime.now()
            self.patterns[user_id] = [
                p for p in existing_patterns
                if (current_time - p.last_observed).days < 30  # Keep patterns from last 30 days
            ]
            
        except Exception as e:
            logger.error(f"Error updating patterns for user {user_id}: {e}")
    
    def _patterns_similar(self, pattern1: UserPattern, pattern2: UserPattern) -> bool:
        """Check if two patterns are similar enough to be considered the same."""
        if pattern1.pattern_type != pattern2.pattern_type:
            return False
        
        # Compare pattern data based on type
        if pattern1.pattern_type == PatternType.TOPIC_PREFERENCE:
            return pattern1.pattern_data.get("topic") == pattern2.pattern_data.get("topic")
        elif pattern1.pattern_type == PatternType.EMOTIONAL_CYCLE:
            return pattern1.pattern_data.get("dominant_emotion") == pattern2.pattern_data.get("dominant_emotion")
        elif pattern1.pattern_type == PatternType.CONVERSATION_TIME:
            return abs(pattern1.pattern_data.get("preferred_hour", 0) - 
                      pattern2.pattern_data.get("preferred_hour", 0)) <= 2
        else:
            return True
    
    async def generate_predictions(self, user_id: str, current_context: Dict[str, Any]) -> List[Prediction]:
        """
        Generate predictions about user needs based on detected patterns.
        Enhanced with Phase 5 cognitive capabilities for creative pattern recognition.
        
        Args:
            user_id: The user identifier
            current_context: Current conversation context
            
        Returns:
            List of predictions
        """
        try:
            # Phase 5 Enhanced Predictions
            if self.creative_engine and self.learning_engine and PHASE5_AVAILABLE:
                return await self._generate_enhanced_predictions(user_id, current_context)
            
            # Standard predictions
            return await self._generate_standard_predictions(user_id, current_context)
            
        except Exception as e:
            logger.error(f"Prediction generation failed: {e}")
            return []
    
    async def _generate_enhanced_predictions(self, user_id: str, current_context: Dict[str, Any]) -> List[Prediction]:
        """Generate enhanced predictions using Phase 5 cognitive capabilities."""
        logger.info(f"Using Phase 5 enhanced prediction generation for user {user_id}")
        
        predictions = []
        user_patterns = self.patterns.get(user_id, [])
        
        # Standard pattern-based predictions
        standard_predictions = await self._generate_standard_predictions(user_id, current_context)
        predictions.extend(standard_predictions)
        
        # Creative pattern recognition for hidden needs
        if user_patterns:
            creative_predictions = await self._generate_creative_predictions(user_patterns, current_context)
            predictions.extend(creative_predictions)
        
        # Adaptive learning-based predictions
        if self.learning_engine:
            adaptive_predictions = await self._generate_adaptive_predictions(user_id, current_context)
            predictions.extend(adaptive_predictions)
        
        # Remove duplicates and rank by confidence
        predictions = self._deduplicate_and_rank_predictions(predictions)
        
        logger.info(f"Generated {len(predictions)} enhanced predictions for user {user_id}")
        return predictions
    
    async def _generate_standard_predictions(self, user_id: str, current_context: Dict[str, Any]) -> List[Prediction]:
        """Generate standard predictions based on patterns."""
        predictions = []
        user_patterns = self.patterns.get(user_id, [])
        
        if not user_patterns:
            return predictions
        
        # Generate predictions based on each pattern type
        for pattern in user_patterns:
            if pattern.strength >= self.min_confidence_threshold:
                pattern_predictions = self._generate_pattern_predictions(pattern, current_context)
                predictions.extend(pattern_predictions)
        
        # Store predictions for accuracy tracking
        self.prediction_history[user_id].extend(predictions)
        
        return predictions
    
    def _generate_pattern_predictions(self, pattern: UserPattern, context: Dict[str, Any]) -> List[Prediction]:
        """Generate predictions based on a specific pattern."""
        predictions = []
        
        try:
            if pattern.pattern_type == PatternType.INTERACTION_FREQUENCY:
                # Predict next interaction time
                avg_interval = pattern.pattern_data.get("average_interval_seconds", 3600)
                next_time = datetime.now() + timedelta(seconds=avg_interval)
                
                prediction = Prediction(
                    prediction_type="next_interaction_time",
                    predicted_value=next_time.isoformat(),
                    confidence=self._get_confidence_level(pattern.confidence),
                    reasoning=f"Based on consistent {avg_interval/3600:.1f} hour intervals",
                    timeframe="next_few_hours",
                    triggers=["time_elapsed", "user_activity"],
                    context={"pattern_strength": pattern.strength}
                )
                predictions.append(prediction)
            
            elif pattern.pattern_type == PatternType.TOPIC_PREFERENCE:
                # Predict topic interest
                topic = pattern.pattern_data.get("topic", "")
                frequency_ratio = pattern.pattern_data.get("frequency_ratio", 0)
                
                prediction = Prediction(
                    prediction_type="topic_interest",
                    predicted_value=topic,
                    confidence=self._get_confidence_level(pattern.confidence),
                    reasoning=f"User shows {frequency_ratio*100:.0f}% interest in {topic} topics",
                    timeframe="ongoing",
                    triggers=["conversation_start", "topic_mention"],
                    context={"topic_frequency": frequency_ratio}
                )
                predictions.append(prediction)
            
            elif pattern.pattern_type == PatternType.EMOTIONAL_CYCLE:
                # Predict emotional state
                emotion = pattern.pattern_data.get("dominant_emotion", "")
                
                prediction = Prediction(
                    prediction_type="emotional_state",
                    predicted_value=emotion,
                    confidence=self._get_confidence_level(pattern.confidence),
                    reasoning=f"User frequently experiences {emotion}",
                    timeframe="current_session",
                    triggers=["conversation_start", "stress_indicators"],
                    context={"emotion_frequency": pattern.pattern_data.get("frequency_ratio", 0)}
                )
                predictions.append(prediction)
            
            elif pattern.pattern_type == PatternType.CONVERSATION_TIME:
                # Predict preferred conversation time
                preferred_hour = pattern.pattern_data.get("preferred_hour", 12)
                current_hour = datetime.now().hour
                
                if abs(current_hour - preferred_hour) <= 2:
                    prediction = Prediction(
                        prediction_type="conversation_readiness",
                        predicted_value=True,
                        confidence=self._get_confidence_level(pattern.confidence),
                        reasoning=f"User typically active around {preferred_hour}:00",
                        timeframe="current_hour",
                        triggers=["time_of_day"],
                        context={"preferred_hour": preferred_hour}
                    )
                    predictions.append(prediction)
                    
        except Exception as e:
            logger.error(f"Error generating pattern predictions: {e}")
        
        return predictions
    
    def _get_confidence_level(self, confidence: float) -> PredictionConfidence:
        """Convert confidence score to confidence level."""
        if confidence >= 0.9:
            return PredictionConfidence.VERY_HIGH
        elif confidence >= 0.7:
            return PredictionConfidence.HIGH
        elif confidence >= 0.5:
            return PredictionConfidence.MEDIUM
        else:
            return PredictionConfidence.LOW
    
    async def generate_anticipatory_responses(self, user_id: str, predictions: List[Prediction]) -> List[AnticipatoryResponse]:
        """
        Generate anticipatory responses based on predictions.
        
        Args:
            user_id: The user identifier
            predictions: List of predictions about user needs
            
        Returns:
            List of anticipatory responses
        """
        try:
            responses = []
            
            for prediction in predictions:
                if prediction.confidence in [PredictionConfidence.HIGH, PredictionConfidence.VERY_HIGH]:
                    response = self._generate_prediction_response(prediction)
                    if response:
                        responses.append(response)
            
            logger.info(f"Generated {len(responses)} anticipatory responses for user {user_id}")
            return responses
            
        except Exception as e:
            logger.error(f"Error generating anticipatory responses for user {user_id}: {e}")
            return []
    
    def _generate_prediction_response(self, prediction: Prediction) -> Optional[AnticipatoryResponse]:
        """Generate a specific anticipatory response for a prediction."""
        try:
            if prediction.prediction_type == "next_interaction_time":
                return AnticipatoryResponse(
                    response_type="check_in",
                    content="I noticed you might be due for a check-in. How are things going?",
                    urgency="low",
                    timing="soon",
                    confidence=prediction.confidence.value,
                    context={"prediction_type": prediction.prediction_type}
                )
            
            elif prediction.prediction_type == "topic_interest":
                topic = prediction.predicted_value
                return AnticipatoryResponse(
                    response_type="topic_suggestion",
                    content=f"I know you're interested in {topic}. Would you like to discuss anything related to that?",
                    urgency="medium",
                    timing="immediate",
                    confidence=prediction.confidence.value,
                    context={"topic": topic}
                )
            
            elif prediction.prediction_type == "emotional_state":
                emotion = prediction.predicted_value
                if emotion in ["stressed", "anxious", "overwhelmed"]:
                    return AnticipatoryResponse(
                        response_type="emotional_support",
                        content="I sense you might be feeling a bit overwhelmed. Would you like to talk about what's on your mind?",
                        urgency="high",
                        timing="immediate",
                        confidence=prediction.confidence.value,
                        context={"emotion": emotion}
                    )
            
            elif prediction.prediction_type == "conversation_readiness":
                return AnticipatoryResponse(
                    response_type="engagement_opportunity",
                    content="This seems like a good time for us to connect. What would you like to focus on?",
                    urgency="medium",
                    timing="immediate",
                    confidence=prediction.confidence.value,
                    context={"prediction_type": prediction.prediction_type}
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating prediction response: {e}")
            return None
    
    async def track_prediction_accuracy(self, user_id: str, prediction_id: str, was_correct: bool):
        """Track the accuracy of predictions for continuous improvement."""
        try:
            self.accuracy_tracking[user_id].append(was_correct)
            
            # Keep only recent accuracy data
            if len(self.accuracy_tracking[user_id]) > 100:
                self.accuracy_tracking[user_id] = self.accuracy_tracking[user_id][-100:]
            
            # Calculate accuracy rate
            if len(self.accuracy_tracking[user_id]) >= 10:
                accuracy_rate = sum(self.accuracy_tracking[user_id]) / len(self.accuracy_tracking[user_id])
                logger.info(f"Prediction accuracy for user {user_id}: {accuracy_rate:.2%}")
                
        except Exception as e:
            logger.error(f"Error tracking prediction accuracy: {e}")
    
    async def _generate_creative_predictions(self, user_patterns: List[UserPattern], current_context: Dict[str, Any]) -> List[Prediction]:
        """Generate creative predictions using lateral thinking and pattern synthesis."""
        creative_predictions = []
        
        try:
            # Identify potential problems from patterns
            problems = self._extract_problems_from_patterns(user_patterns, current_context)
            
            for problem in problems:
                # Use creative engine to find innovative solutions/predictions
                creative_session = await self.creative_engine.solve_problem_creatively(
                    problem_statement=problem["description"],
                    problem_type=problem.get("type", "personal"),
                    context=current_context
                )
                
                # Convert creative solutions to predictions
                for solution in creative_session.solutions[:2]:  # Top 2 solutions
                    prediction = Prediction(
                        prediction_id=f"creative_{datetime.now().timestamp()}",
                        prediction_type="creative_solution",
                        predicted_value=solution.solution_text,
                        confidence=self._map_confidence_to_enum(solution.feasibility_score),
                        probability=solution.feasibility_score,
                        timing="later",
                        context={
                            "creative_method": solution.method_used.value,
                            "original_problem": problem["description"],
                            "reasoning": solution.reasoning
                        }
                    )
                    creative_predictions.append(prediction)
            
            logger.info(f"Generated {len(creative_predictions)} creative predictions")
            
        except Exception as e:
            logger.error(f"Creative prediction generation failed: {e}")
        
        return creative_predictions
    
    async def _generate_adaptive_predictions(self, user_id: str, current_context: Dict[str, Any]) -> List[Prediction]:
        """Generate predictions based on adaptive learning insights."""
        adaptive_predictions = []
        
        try:
            # Get learning recommendations
            recommendations = await self.learning_engine.get_personalization_recommendations(current_context)
            
            for rec in recommendations:
                if rec["type"] == "preference_application":
                    # Predict user will want responses that match their preferences
                    prediction = Prediction(
                        prediction_id=f"adaptive_{datetime.now().timestamp()}",
                        prediction_type="preference_need",
                        predicted_value=rec["recommendation"],
                        confidence=self._map_confidence_to_enum(rec["confidence"]),
                        probability=rec["confidence"],
                        timing="immediate",
                        context={
                            "preference_category": rec["category"],
                            "reasoning": rec["reasoning"]
                        }
                    )
                    adaptive_predictions.append(prediction)
                
                elif rec["type"] == "learning_opportunity":
                    # Predict user would benefit from personalized interaction
                    prediction = Prediction(
                        prediction_id=f"learning_{datetime.now().timestamp()}",
                        prediction_type="learning_opportunity",
                        predicted_value=rec["recommendation"],
                        confidence=self._map_confidence_to_enum(rec["confidence"]),
                        probability=rec["confidence"],
                        timing="soon",
                        context={
                            "learning_category": rec["category"],
                            "potential_value": rec["confidence"]
                        }
                    )
                    adaptive_predictions.append(prediction)
            
            logger.info(f"Generated {len(adaptive_predictions)} adaptive predictions")
            
        except Exception as e:
            logger.error(f"Adaptive prediction generation failed: {e}")
        
        return adaptive_predictions
    
    def _extract_problems_from_patterns(self, patterns: List[UserPattern], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract potential problems from user patterns that could be solved creatively."""
        problems = []
        
        for pattern in patterns:
            if pattern.pattern_type == PatternType.EMOTIONAL_CYCLE:
                if "negative" in str(pattern.pattern_data).lower():
                    problems.append({
                        "description": f"User experiences recurring negative emotional patterns: {pattern.pattern_data}",
                        "type": "personal",
                        "urgency": "medium"
                    })
            
            elif pattern.pattern_type == PatternType.PROBLEM_SOLVING:
                problems.append({
                    "description": f"User frequently encounters challenges in: {pattern.pattern_data}",
                    "type": "problem_solving",
                    "urgency": "medium"
                })
            
            elif pattern.pattern_type == PatternType.GOAL_ORIENTED:
                if pattern.strength < 0.7:  # Struggling with goals
                    problems.append({
                        "description": f"User may need help achieving goals: {pattern.pattern_data}",
                        "type": "personal",
                        "urgency": "low"
                    })
        
        return problems
    
    def _deduplicate_and_rank_predictions(self, predictions: List[Prediction]) -> List[Prediction]:
        """Remove duplicate predictions and rank by confidence and relevance."""
        
        # Simple deduplication by prediction type and similarity
        unique_predictions = []
        seen_types = set()
        
        # Sort by confidence first
        sorted_predictions = sorted(predictions, key=lambda p: p.probability, reverse=True)
        
        for prediction in sorted_predictions:
            # Simple deduplication logic
            type_key = f"{prediction.prediction_type}_{prediction.timing}"
            if type_key not in seen_types:
                unique_predictions.append(prediction)
                seen_types.add(type_key)
            elif len(unique_predictions) < 10:  # Allow some duplicates if we have few predictions
                unique_predictions.append(prediction)
        
        return unique_predictions[:15]  # Limit to top 15 predictions
    
    def _map_confidence_to_enum(self, confidence_score: float) -> PredictionConfidence:
        """Map numerical confidence to enum."""
        if confidence_score >= 0.9:
            return PredictionConfidence.VERY_HIGH
        elif confidence_score >= 0.7:
            return PredictionConfidence.HIGH
        elif confidence_score >= 0.5:
            return PredictionConfidence.MEDIUM
        else:
            return PredictionConfidence.LOW
    
    def get_user_insights(self, user_id: str) -> Dict[str, Any]:
        """Get insights about user patterns and predictions."""
        try:
            patterns = self.patterns.get(user_id, [])
            predictions = self.prediction_history.get(user_id, [])
            accuracy = self.accuracy_tracking.get(user_id, [])
            
            insights = {
                "total_patterns": len(patterns),
                "pattern_types": Counter([p.pattern_type.value for p in patterns]),
                "total_predictions": len(predictions),
                "prediction_accuracy": sum(accuracy) / len(accuracy) if accuracy else 0.0,
                "strongest_patterns": sorted(patterns, key=lambda p: p.strength, reverse=True)[:3],
                "recent_predictions": predictions[-5:] if predictions else []
            }
            
            return insights
            
        except Exception as e:
            logger.error(f"Error getting user insights: {e}")
            return {}


# Global instance
predictive_intelligence_engine = PredictiveIntelligenceEngine()
