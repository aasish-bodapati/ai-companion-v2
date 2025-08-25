"""
Emotional Memory System - Captures and analyzes emotional context in conversations
to create human-like memory patterns and responses.
"""

import logging
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
import json

from app.core.config import settings
from app.core.llm import generate_with_openrouter

logger = logging.getLogger(__name__)


class EmotionalMemoryAnalyzer:
    """Analyzes and captures emotional context from conversations."""
    
    def __init__(self):
        self.emotion_patterns = {
            'excitement': ['excited', 'thrilled', 'amazing', 'awesome', 'fantastic', 'incredible', 'love it', 'can\'t wait'],
            'happiness': ['happy', 'glad', 'pleased', 'delighted', 'joyful', 'cheerful', 'great', 'wonderful'],
            'sadness': ['sad', 'disappointed', 'down', 'upset', 'depressed', 'blue', 'bummed', 'heartbroken'],
            'anxiety': ['worried', 'anxious', 'nervous', 'stressed', 'concerned', 'scared', 'afraid', 'overwhelmed'],
            'frustration': ['frustrated', 'annoyed', 'irritated', 'angry', 'mad', 'pissed', 'fed up', 'stuck'],
            'pride': ['proud', 'accomplished', 'achieved', 'succeeded', 'nailed it', 'crushed it', 'did it'],
            'gratitude': ['thankful', 'grateful', 'appreciate', 'blessed', 'lucky', 'thank you'],
            'confusion': ['confused', 'lost', 'don\'t understand', 'unclear', 'puzzled', 'not sure'],
            'determination': ['determined', 'focused', 'committed', 'going to', 'will do', 'motivated'],
            'exhaustion': ['tired', 'exhausted', 'drained', 'worn out', 'beat', 'wiped out']
        }
        
        self.energy_indicators = {
            'high': ['!', 'amazing', 'awesome', 'let\'s go', 'pumped', 'energized', 'ready'],
            'medium': ['good', 'okay', 'fine', 'alright', 'decent'],
            'low': ['tired', 'meh', 'whatever', 'not really', 'i guess', 'maybe']
        }
    
    def analyze_emotional_context(self, text: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Analyze emotional context from text and conversation history.
        
        Returns:
            Dict with emotional analysis including sentiment, energy, emotions, and context
        """
        if not text or not text.strip():
            return self._empty_emotional_context()
        
        text_lower = text.lower()
        
        # Basic sentiment analysis
        sentiment = self._analyze_sentiment(text_lower)
        
        # Energy level detection
        energy_level = self._detect_energy_level(text_lower, text)
        
        # Emotion detection
        detected_emotions = self._detect_emotions(text_lower)
        
        # Emotional intensity
        intensity = self._calculate_emotional_intensity(text, detected_emotions)
        
        # Contextual emotional state
        emotional_state = self._determine_emotional_state(sentiment, detected_emotions, energy_level)
        
        # Relationship indicators
        relationship_context = self._analyze_relationship_context(text_lower)
        
        # Temporal emotional context
        temporal_context = self._analyze_temporal_context(text_lower)
        
        return {
            'sentiment': sentiment,
            'energy_level': energy_level,
            'emotions': detected_emotions,
            'emotional_state': emotional_state,
            'intensity': intensity,
            'relationship_context': relationship_context,
            'temporal_context': temporal_context,
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'conversational_tone': self._analyze_conversational_tone(text_lower, text)
        }
    
    def _analyze_sentiment(self, text_lower: str) -> float:
        """Analyze sentiment on scale from -1 (negative) to 1 (positive)."""
        positive_words = ['good', 'great', 'awesome', 'amazing', 'love', 'like', 'happy', 'excited', 'wonderful', 'fantastic', 'excellent', 'perfect', 'best', 'incredible']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed', 'worst', 'horrible', 'sucks', 'annoying']
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        # Account for negations
        negation_patterns = ['not ', 'don\'t ', 'doesn\'t ', 'won\'t ', 'can\'t ', 'isn\'t ', 'aren\'t ']
        negation_count = sum(1 for pattern in negation_patterns if pattern in text_lower)
        
        if negation_count > 0:
            # Flip sentiment if negations present
            positive_count, negative_count = negative_count, positive_count
        
        total_words = len(text_lower.split())
        if total_words == 0:
            return 0.0
        
        sentiment_score = (positive_count - negative_count) / max(total_words, 1)
        return max(-1.0, min(1.0, sentiment_score * 5))  # Scale and clamp
    
    def _detect_energy_level(self, text_lower: str, original_text: str) -> str:
        """Detect energy level: high, medium, low."""
        # Check for high energy indicators
        high_energy_score = 0
        high_energy_score += original_text.count('!') * 2
        high_energy_score += original_text.count('?') * 0.5
        high_energy_score += len([word for word in self.energy_indicators['high'] if word in text_lower])
        
        # Check for low energy indicators
        low_energy_score = len([word for word in self.energy_indicators['low'] if word in text_lower])
        
        # Check message length and complexity
        word_count = len(text_lower.split())
        if word_count > 20:
            high_energy_score += 1
        elif word_count < 5:
            low_energy_score += 1
        
        if high_energy_score > low_energy_score and high_energy_score > 2:
            return 'high'
        elif low_energy_score > high_energy_score and low_energy_score > 1:
            return 'low'
        else:
            return 'medium'
    
    def _detect_emotions(self, text_lower: str) -> List[str]:
        """Detect specific emotions present in the text."""
        detected = []
        
        for emotion, patterns in self.emotion_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                detected.append(emotion)
        
        return detected
    
    def _calculate_emotional_intensity(self, text: str, emotions: List[str]) -> float:
        """Calculate emotional intensity from 0.0 to 1.0."""
        intensity = 0.0
        
        # Base intensity from number of emotions
        intensity += len(emotions) * 0.2
        
        # Intensity from punctuation
        intensity += text.count('!') * 0.1
        intensity += text.count('?') * 0.05
        
        # Intensity from capitalization
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        intensity += caps_ratio * 0.3
        
        # Intensity from repetition
        words = text.lower().split()
        if len(set(words)) < len(words) * 0.8:  # Repeated words
            intensity += 0.2
        
        return min(1.0, intensity)
    
    def _determine_emotional_state(self, sentiment: float, emotions: List[str], energy_level: str) -> str:
        """Determine overall emotional state."""
        if not emotions:
            if sentiment > 0.3:
                return 'positive'
            elif sentiment < -0.3:
                return 'negative'
            else:
                return 'neutral'
        
        # Prioritize certain emotional combinations
        if 'excitement' in emotions or 'happiness' in emotions:
            return 'excited' if energy_level == 'high' else 'happy'
        elif 'sadness' in emotions or 'disappointment' in emotions:
            return 'sad'
        elif 'anxiety' in emotions or 'worry' in emotions:
            return 'anxious'
        elif 'frustration' in emotions or 'anger' in emotions:
            return 'frustrated'
        elif 'pride' in emotions:
            return 'proud'
        elif 'gratitude' in emotions:
            return 'grateful'
        elif 'confusion' in emotions:
            return 'confused'
        elif 'determination' in emotions:
            return 'determined'
        elif 'exhaustion' in emotions:
            return 'tired'
        else:
            return emotions[0] if emotions else 'neutral'
    
    def _analyze_relationship_context(self, text_lower: str) -> Dict[str, Any]:
        """Analyze relationship and social context."""
        context = {
            'mentions_others': False,
            'relationship_type': None,
            'social_context': None
        }
        
        # Check for mentions of other people
        person_indicators = ['my friend', 'my partner', 'my spouse', 'my family', 'my mom', 'my dad', 'my boss', 'my colleague', 'someone', 'they said', 'he said', 'she said']
        if any(indicator in text_lower for indicator in person_indicators):
            context['mentions_others'] = True
        
        # Determine relationship context
        if any(word in text_lower for word in ['family', 'mom', 'dad', 'sister', 'brother', 'parent']):
            context['relationship_type'] = 'family'
        elif any(word in text_lower for word in ['friend', 'buddy', 'pal']):
            context['relationship_type'] = 'friend'
        elif any(word in text_lower for word in ['partner', 'spouse', 'husband', 'wife', 'boyfriend', 'girlfriend']):
            context['relationship_type'] = 'romantic'
        elif any(word in text_lower for word in ['boss', 'colleague', 'coworker', 'work', 'office']):
            context['relationship_type'] = 'professional'
        
        return context
    
    def _analyze_temporal_context(self, text_lower: str) -> Dict[str, Any]:
        """Analyze temporal and timing context."""
        context = {
            'time_references': [],
            'urgency': 'normal',
            'planning_horizon': None
        }
        
        # Time references
        time_patterns = ['today', 'tomorrow', 'yesterday', 'this week', 'next week', 'last week', 'this month', 'next month', 'soon', 'later', 'now', 'currently']
        context['time_references'] = [pattern for pattern in time_patterns if pattern in text_lower]
        
        # Urgency detection
        urgency_indicators = ['urgent', 'asap', 'immediately', 'right now', 'quickly', 'hurry', 'deadline', 'due']
        if any(indicator in text_lower for indicator in urgency_indicators):
            context['urgency'] = 'high'
        elif any(word in text_lower for word in ['whenever', 'no rush', 'eventually', 'someday']):
            context['urgency'] = 'low'
        
        # Planning horizon
        if any(word in text_lower for word in ['today', 'now', 'immediately']):
            context['planning_horizon'] = 'immediate'
        elif any(word in text_lower for word in ['this week', 'soon', 'tomorrow']):
            context['planning_horizon'] = 'short_term'
        elif any(word in text_lower for word in ['next month', 'this year', 'long term']):
            context['planning_horizon'] = 'long_term'
        
        return context
    
    def _analyze_conversational_tone(self, text_lower: str, original_text: str) -> str:
        """Analyze the conversational tone and style."""
        # Formal vs informal
        formal_indicators = ['please', 'thank you', 'would you', 'could you', 'i would like']
        informal_indicators = ['hey', 'yeah', 'nah', 'gonna', 'wanna', 'kinda', 'sorta']
        
        formal_count = sum(1 for indicator in formal_indicators if indicator in text_lower)
        informal_count = sum(1 for indicator in informal_indicators if indicator in text_lower)
        
        if formal_count > informal_count:
            return 'formal'
        elif informal_count > formal_count:
            return 'casual'
        else:
            return 'neutral'
    
    def _empty_emotional_context(self) -> Dict[str, Any]:
        """Return empty emotional context structure."""
        return {
            'sentiment': 0.0,
            'energy_level': 'medium',
            'emotions': [],
            'emotional_state': 'neutral',
            'intensity': 0.0,
            'relationship_context': {'mentions_others': False, 'relationship_type': None, 'social_context': None},
            'temporal_context': {'time_references': [], 'urgency': 'normal', 'planning_horizon': None},
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'conversational_tone': 'neutral'
        }
    
    def enhance_memory_with_emotion(self, content: str, emotional_context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance memory metadata with emotional context."""
        return {
            'emotional_sentiment': emotional_context['sentiment'],
            'emotional_state': emotional_context['emotional_state'],
            'energy_level': emotional_context['energy_level'],
            'emotions': emotional_context['emotions'],
            'emotional_intensity': emotional_context['intensity'],
            'conversational_tone': emotional_context['conversational_tone'],
            'relationship_context': emotional_context['relationship_context'],
            'temporal_context': emotional_context['temporal_context'],
            'emotional_analysis_timestamp': emotional_context['analysis_timestamp']
        }


# Global instance
emotional_analyzer = EmotionalMemoryAnalyzer()
