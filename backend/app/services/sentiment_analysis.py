"""
Sentiment Analysis Service
Provides sentiment analysis capabilities to enhance emotion detection.
This service uses simple rule-based analysis and can be extended with ML models.
"""

import logging
import re
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SentimentResult:
    """Result of sentiment analysis."""
    sentiment: str  # "positive", "negative", "neutral"
    confidence: float  # 0.0 to 1.0
    emotions: List[str]  # Detected emotions
    intensity: float  # 0.0 to 1.0
    keywords: List[str]  # Keywords that influenced the analysis


class SentimentAnalyzer:
    """
    Simple rule-based sentiment analyzer that can be enhanced with ML models.
    Provides sentiment analysis to complement emotion detection.
    """
    
    def __init__(self):
        # Positive sentiment indicators
        self.positive_indicators = {
            "strong": [
                "love", "adore", "amazing", "fantastic", "incredible", "wonderful", 
                "perfect", "excellent", "brilliant", "outstanding", "superb",
                "thrilled", "ecstatic", "overjoyed", "elated", "euphoric"
            ],
            "moderate": [
                "like", "enjoy", "good", "nice", "great", "happy", "pleased",
                "satisfied", "content", "glad", "excited", "enthusiastic"
            ],
            "mild": [
                "okay", "fine", "alright", "decent", "not bad", "pretty good",
                "satisfactory", "acceptable", "reasonable"
            ]
        }
        
        # Negative sentiment indicators
        self.negative_indicators = {
            "strong": [
                "hate", "despise", "terrible", "awful", "horrible", "dreadful",
                "disgusting", "revolting", "appalling", "atrocious",
                "devastated", "heartbroken", "crushed", "hopeless"
            ],
            "moderate": [
                "dislike", "bad", "poor", "sad", "angry", "frustrated",
                "annoyed", "upset", "disappointed", "worried", "concerned"
            ],
            "mild": [
                "not great", "not good", "mediocre", "average", "so-so",
                "disappointing", "underwhelming", "lackluster"
            ]
        }
        
        # Emotion-specific keywords
        self.emotion_keywords = {
            "excited": ["excited", "thrilled", "can't wait", "looking forward", "eager"],
            "stressed": ["stressed", "overwhelmed", "worried", "anxious", "pressure"],
            "frustrated": ["frustrated", "annoyed", "irritated", "fed up", "sick of"],
            "sad": ["sad", "down", "blue", "depressed", "lonely", "heartbroken"],
            "grateful": ["grateful", "thankful", "blessed", "appreciate", "fortunate"],
            "confused": ["confused", "unsure", "uncertain", "don't know", "clueless"],
            "calm": ["calm", "relaxed", "peaceful", "serene", "content"]
        }
        
        # Negation words that can flip sentiment
        self.negation_words = [
            "not", "no", "never", "none", "nobody", "nothing", "neither", "nowhere",
            "hardly", "barely", "scarcely", "doesn't", "isn't", "aren't", "wasn't",
            "weren't", "don't", "didn't", "won't", "can't", "couldn't", "shouldn't"
        ]
        
        # Intensifiers that amplify sentiment
        self.intensifiers = [
            "very", "really", "extremely", "absolutely", "completely", "totally",
            "incredibly", "amazingly", "exceptionally", "particularly", "especially"
        ]
        
        # Diminishers that reduce sentiment intensity
        self.diminishers = [
            "slightly", "somewhat", "kind of", "sort of", "a bit", "a little",
            "rather", "quite", "fairly", "moderately", "reasonably"
        ]
    
    def analyze_sentiment(self, text: str) -> SentimentResult:
        """
        Analyze the sentiment of the given text.
        Returns a SentimentResult with sentiment, confidence, emotions, and intensity.
        """
        text_lower = text.lower()
        words = text_lower.split()
        
        # Calculate sentiment scores
        positive_score = self._calculate_sentiment_score(text_lower, self.positive_indicators)
        negative_score = self._calculate_sentiment_score(text_lower, self.negative_indicators)
        
        # Apply negation detection
        positive_score, negative_score = self._apply_negation_detection(text_lower, positive_score, negative_score)
        
        # Apply intensifier/diminisher detection
        positive_score, negative_score = self._apply_intensity_modifiers(text_lower, positive_score, negative_score)
        
        # Determine overall sentiment
        sentiment, confidence = self._determine_sentiment(positive_score, negative_score)
        
        # Detect emotions
        emotions = self._detect_emotions(text_lower)
        
        # Calculate overall intensity
        intensity = max(positive_score, negative_score)
        
        # Extract influential keywords
        keywords = self._extract_influential_keywords(text_lower)
        
        return SentimentResult(
            sentiment=sentiment,
            confidence=confidence,
            emotions=emotions,
            intensity=intensity,
            keywords=keywords
        )
    
    def _calculate_sentiment_score(self, text: str, indicators: Dict[str, List[str]]) -> float:
        """Calculate sentiment score based on indicators."""
        score = 0.0
        
        for intensity, words in indicators.items():
            for word in words:
                if word in text:
                    if intensity == "strong":
                        score += 0.8
                    elif intensity == "moderate":
                        score += 0.5
                    elif intensity == "mild":
                        score += 0.2
        
        return min(score, 1.0)
    
    def _apply_negation_detection(self, text: str, positive_score: float, negative_score: float) -> Tuple[float, float]:
        """Apply negation detection to flip sentiment scores."""
        words = text.split()
        
        for i, word in enumerate(words):
            if word in self.negation_words:
                # Look for sentiment words in the next few words
                for j in range(i + 1, min(i + 4, len(words))):
                    next_word = words[j]
                    
                    # Check if next word is a positive indicator
                    for intensity, positive_words in self.positive_indicators.items():
                        if next_word in positive_words:
                            positive_score -= 0.3
                            negative_score += 0.3
                            break
                    
                    # Check if next word is a negative indicator
                    for intensity, negative_words in self.negative_indicators.items():
                        if next_word in negative_words:
                            negative_score -= 0.3
                            positive_score += 0.3
                            break
        
        return max(0.0, positive_score), max(0.0, negative_score)
    
    def _apply_intensity_modifiers(self, text: str, positive_score: float, negative_score: float) -> Tuple[float, float]:
        """Apply intensifier and diminisher detection."""
        words = text.split()
        
        for i, word in enumerate(words):
            if word in self.intensifiers:
                # Amplify the next sentiment word
                for j in range(i + 1, min(i + 3, len(words))):
                    next_word = words[j]
                    
                    # Check for sentiment words
                    for intensity, positive_words in self.positive_indicators.items():
                        if next_word in positive_words:
                            positive_score *= 1.3
                            break
                    
                    for intensity, negative_words in self.negative_indicators.items():
                        if next_word in negative_words:
                            negative_score *= 1.3
                            break
            
            elif word in self.diminishers:
                # Reduce the next sentiment word
                for j in range(i + 1, min(i + 3, len(words))):
                    next_word = words[j]
                    
                    # Check for sentiment words
                    for intensity, positive_words in self.positive_indicators.items():
                        if next_word in positive_words:
                            positive_score *= 0.7
                            break
                    
                    for intensity, negative_words in self.negative_indicators.items():
                        if next_word in negative_words:
                            negative_score *= 0.7
                            break
        
        return min(1.0, positive_score), min(1.0, negative_score)
    
    def _determine_sentiment(self, positive_score: float, negative_score: float) -> Tuple[str, float]:
        """Determine overall sentiment and confidence."""
        if positive_score > negative_score:
            if positive_score > 0.5:
                return "positive", min(0.9, positive_score)
            else:
                return "positive", positive_score
        elif negative_score > positive_score:
            if negative_score > 0.5:
                return "negative", min(0.9, negative_score)
            else:
                return "negative", negative_score
        else:
            return "neutral", 0.5
    
    def _detect_emotions(self, text: str) -> List[str]:
        """Detect emotions in the text."""
        detected_emotions = []
        
        for emotion, keywords in self.emotion_keywords.items():
            if any(keyword in text for keyword in keywords):
                detected_emotions.append(emotion)
        
        return detected_emotions
    
    def _extract_influential_keywords(self, text: str) -> List[str]:
        """Extract keywords that influenced the sentiment analysis."""
        keywords = []
        
        # Add positive keywords
        for intensity, words in self.positive_indicators.items():
            for word in words:
                if word in text:
                    keywords.append(word)
        
        # Add negative keywords
        for intensity, words in self.negative_indicators.items():
            for word in words:
                if word in text:
                    keywords.append(word)
        
        # Add emotion keywords
        for emotion, emotion_words in self.emotion_keywords.items():
            for word in emotion_words:
                if word in text:
                    keywords.append(word)
        
        return list(set(keywords))[:10]  # Return unique keywords, max 10
    
    def get_sentiment_summary(self, text: str) -> Dict[str, Any]:
        """Get a comprehensive sentiment analysis summary."""
        result = self.analyze_sentiment(text)
        
        return {
            "sentiment": result.sentiment,
            "confidence": result.confidence,
            "emotions": result.emotions,
            "intensity": result.intensity,
            "keywords": result.keywords,
            "text_length": len(text),
            "word_count": len(text.split()),
            "has_exclamation": "!" in text,
            "has_question": "?" in text,
            "caps_ratio": sum(1 for c in text if c.isupper()) / len(text) if text else 0
        }


# Global instance
sentiment_analyzer = SentimentAnalyzer()
