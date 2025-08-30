"""
Memory metadata validation and processing service.
Handles structured metadata validation, entity extraction, and semantic analysis.
"""

import json
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date
import logging
from dataclasses import dataclass

from app.schemas.memory import MemoryMetadata, PrivacyLevel

logger = logging.getLogger(__name__)


@dataclass
class EntityExtractionResult:
    """Result of entity extraction from memory content"""
    people: List[str]
    places: List[str]
    organizations: List[str]
    dates: List[str]
    numbers: List[str]
    skills: List[str]


@dataclass
class SemanticAnalysisResult:
    """Result of semantic analysis of memory content"""
    emotional_valence: Optional[float]  # -1.0 to 1.0
    confidence_score: float  # 0.0 to 1.0
    complexity_level: str  # "simple", "moderate", "complex"
    priority_level: str  # "low", "medium", "high", "critical"
    categories: List[str]
    subcategories: List[str]
    tags: List[str]


class MemoryMetadataService:
    """Service for handling memory metadata validation and enhancement"""

    def __init__(self):
        self.emotion_keywords = {
            "positive": ["happy", "excited", "joyful", "pleased", "satisfied", "grateful", "proud", "optimistic", "confident", "love"],
            "negative": ["sad", "angry", "frustrated", "disappointed", "worried", "anxious", "stressed", "tired", "overwhelmed", "hate"],
            "neutral": ["okay", "fine", "normal", "regular", "standard", "usual", "typical"]
        }
        
        self.priority_keywords = {
            "critical": ["urgent", "emergency", "critical", "deadline", "asap", "immediately"],
            "high": ["important", "priority", "significant", "key", "major", "crucial"],
            "medium": ["moderate", "average", "standard", "normal", "regular"],
            "low": ["minor", "small", "trivial", "optional", "whenever", "someday"]
        }
        
        self.skill_keywords = [
            "programming", "coding", "python", "javascript", "react", "sql", "machine learning",
            "writing", "communication", "presentation", "leadership", "management", "design",
            "cooking", "fitness", "yoga", "meditation", "guitar", "piano", "photography",
            "language", "spanish", "french", "german", "chinese"
        ]

    def validate_metadata(self, metadata: Optional[Dict[str, Any]]) -> MemoryMetadata:
        """
        Validate and normalize memory metadata into structured format.
        
        Args:
            metadata: Raw metadata dictionary
            
        Returns:
            Validated MemoryMetadata object
        """
        if not metadata:
            return MemoryMetadata()
            
        try:
            # Handle both dict and MemoryMetadata instances
            if isinstance(metadata, MemoryMetadata):
                return metadata
            elif isinstance(metadata, dict):
                return MemoryMetadata(**metadata)
            else:
                logger.warning(f"Invalid metadata type: {type(metadata)}")
                return MemoryMetadata()
        except Exception as e:
            logger.warning(f"Failed to validate metadata: {e}")
            return MemoryMetadata()

    def extract_entities(self, content: str) -> EntityExtractionResult:
        """
        Extract entities from memory content using pattern matching.
        
        Args:
            content: Memory content text
            
        Returns:
            EntityExtractionResult with extracted entities
        """
        content_lower = content.lower()
        
        # Extract people (capitalized names)
        people_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'
        people = list(set(re.findall(people_pattern, content)))
        
        # Filter out common false positives
        common_words = {"I", "The", "This", "That", "Today", "Tomorrow", "Yesterday"}
        people = [p for p in people if p not in common_words]
        
        # Extract places (common location patterns)
        place_patterns = [
            r'\b(?:at|in|to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Street|Road|Avenue|Boulevard|Place|Drive)\b',
            r'\b([A-Z][a-z]+)\s+(?:City|State|Country|University|Hospital|Airport)\b'
        ]
        places = []
        for pattern in place_patterns:
            places.extend(re.findall(pattern, content))
        places = list(set(places))
        
        # Extract organizations (companies, institutions)
        org_patterns = [
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc|Corp|LLC|Company|University|Hospital|School)\b',
            r'\b(?:at|for|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b'
        ]
        organizations = []
        for pattern in org_patterns:
            organizations.extend(re.findall(pattern, content))
        organizations = list(set(organizations))
        
        # Extract dates
        date_patterns = [
            r'\b\d{1,2}/\d{1,2}/\d{4}\b',
            r'\b\d{4}-\d{2}-\d{2}\b',
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
            r'\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)day\b',
            r'\b(?:today|tomorrow|yesterday|next week|last week)\b'
        ]
        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, content, re.IGNORECASE))
        dates = list(set(dates))
        
        # Extract numbers and quantities
        number_patterns = [
            r'\b\d+(?:\.\d+)?\s*(?:kg|lbs|miles|km|hours|minutes|seconds|years|months|days)\b',
            r'\$\d+(?:\.\d{2})?\b',
            r'\b\d+(?:\.\d+)?%\b',
            r'\b\d+(?:,\d{3})*(?:\.\d+)?\b'
        ]
        numbers = []
        for pattern in number_patterns:
            numbers.extend(re.findall(pattern, content, re.IGNORECASE))
        numbers = list(set(numbers))
        
        # Extract skills mentioned
        skills = []
        for skill in self.skill_keywords:
            if skill.lower() in content_lower:
                skills.append(skill)
        
        return EntityExtractionResult(
            people=people[:10],  # Limit results
            places=places[:10],
            organizations=organizations[:10],
            dates=dates[:10],
            numbers=numbers[:10],
            skills=skills[:10]
        )

    def analyze_semantic_content(self, content: str, content_type: str) -> SemanticAnalysisResult:
        """
        Perform semantic analysis on memory content.
        
        Args:
            content: Memory content text
            content_type: Type of memory content
            
        Returns:
            SemanticAnalysisResult with analysis results
        """
        content_lower = content.lower()
        words = content_lower.split()
        
        # Analyze emotional valence
        emotional_valence = self._analyze_emotional_valence(content_lower)
        
        # Calculate confidence score based on content indicators
        confidence_score = self._calculate_confidence_score(content, content_type)
        
        # Determine complexity level
        complexity_level = self._determine_complexity_level(content)
        
        # Determine priority level
        priority_level = self._determine_priority_level(content_lower)
        
        # Extract categories and subcategories
        categories, subcategories = self._extract_categories(content_lower, content_type)
        
        # Generate semantic tags
        tags = self._generate_semantic_tags(content_lower, categories)
        
        return SemanticAnalysisResult(
            emotional_valence=emotional_valence,
            confidence_score=confidence_score,
            complexity_level=complexity_level,
            priority_level=priority_level,
            categories=categories,
            subcategories=subcategories,
            tags=tags
        )

    def _analyze_emotional_valence(self, content_lower: str) -> Optional[float]:
        """Analyze emotional valence of content (-1.0 to 1.0)"""
        positive_count = sum(1 for word in self.emotion_keywords["positive"] if word in content_lower)
        negative_count = sum(1 for word in self.emotion_keywords["negative"] if word in content_lower)
        neutral_count = sum(1 for word in self.emotion_keywords["neutral"] if word in content_lower)
        
        total_emotional = positive_count + negative_count + neutral_count
        if total_emotional == 0:
            return None
            
        # Calculate weighted valence
        valence = (positive_count - negative_count) / total_emotional
        return max(-1.0, min(1.0, valence))

    def _calculate_confidence_score(self, content: str, content_type: str) -> float:
        """Calculate confidence score based on content indicators"""
        base_score = 0.5
        
        # Content type scoring
        type_scores = {
            "fact": 0.9,
            "preference": 0.8,
            "profile": 0.85,
            "conversation": 0.6,
            "message": 0.5,
            "onboarding": 0.9
        }
        base_score = type_scores.get(content_type, 0.5)
        
        # Content length factor
        length_factor = min(1.0, len(content) / 200)  # More content = higher confidence
        
        # Specificity indicators
        specificity_boost = 0.0
        if any(indicator in content.lower() for indicator in ["exactly", "specifically", "precisely", "definitely"]):
            specificity_boost += 0.1
        if any(indicator in content.lower() for indicator in ["always", "never", "every", "all"]):
            specificity_boost += 0.05
        if re.search(r'\b\d+\b', content):  # Contains numbers
            specificity_boost += 0.05
            
        # Uncertainty indicators
        uncertainty_penalty = 0.0
        if any(indicator in content.lower() for indicator in ["maybe", "possibly", "might", "could", "perhaps"]):
            uncertainty_penalty += 0.1
        if any(indicator in content.lower() for indicator in ["i think", "i believe", "i guess", "not sure"]):
            uncertainty_penalty += 0.15
            
        final_score = base_score + (length_factor * 0.2) + specificity_boost - uncertainty_penalty
        return max(0.0, min(1.0, final_score))

    def _determine_complexity_level(self, content: str) -> str:
        """Determine complexity level based on content structure"""
        word_count = len(content.split())
        sentence_count = len([s for s in content.split('.') if s.strip()])
        
        # Calculate average words per sentence
        avg_words_per_sentence = word_count / max(1, sentence_count)
        
        # Check for complex indicators
        complex_indicators = ["because", "therefore", "however", "although", "meanwhile", "consequently"]
        complex_count = sum(1 for indicator in complex_indicators if indicator in content.lower())
        
        if word_count < 10 and complex_count == 0:
            return "simple"
        elif word_count < 50 and avg_words_per_sentence < 15 and complex_count <= 1:
            return "moderate"
        else:
            return "complex"

    def _determine_priority_level(self, content_lower: str) -> str:
        """Determine priority level based on content keywords"""
        for level, keywords in self.priority_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                return level
        return "medium"  # Default

    def _extract_categories(self, content_lower: str, content_type: str) -> Tuple[List[str], List[str]]:
        """Extract categories and subcategories from content"""
        categories = []
        subcategories = []
        
        # Content-based categorization
        category_mapping = {
            "health": {
                "keywords": ["health", "fitness", "exercise", "workout", "diet", "nutrition", "sleep", "wellness"],
                "subcategories": ["physical_fitness", "mental_health", "nutrition", "sleep", "medical"]
            },
            "work": {
                "keywords": ["work", "job", "career", "project", "meeting", "deadline", "professional"],
                "subcategories": ["projects", "meetings", "goals", "skills", "networking"]
            },
            "personal": {
                "keywords": ["family", "friends", "relationship", "hobby", "interest", "personal"],
                "subcategories": ["relationships", "hobbies", "personal_growth", "entertainment"]
            },
            "learning": {
                "keywords": ["learn", "study", "course", "skill", "training", "education", "tutorial"],
                "subcategories": ["technical_skills", "soft_skills", "academic", "certifications"]
            },
            "finance": {
                "keywords": ["money", "budget", "investment", "salary", "expense", "financial"],
                "subcategories": ["budgeting", "investments", "income", "expenses", "planning"]
            },
            "travel": {
                "keywords": ["travel", "trip", "vacation", "flight", "hotel", "destination"],
                "subcategories": ["business_travel", "leisure_travel", "planning", "experiences"]
            }
        }
        
        for category, data in category_mapping.items():
            if any(keyword in content_lower for keyword in data["keywords"]):
                categories.append(category)
                # Add relevant subcategories
                for subcat in data["subcategories"]:
                    if any(word in content_lower for word in subcat.split("_")):
                        subcategories.append(subcat)
        
        # Add content type as category if no other categories found
        if not categories:
            categories.append(content_type)
            
        return categories[:3], subcategories[:5]  # Limit results

    def _generate_semantic_tags(self, content_lower: str, categories: List[str]) -> List[str]:
        """Generate semantic tags based on content analysis"""
        tags = []
        
        # Add category-based tags
        tags.extend(categories)
        
        # Time-based tags
        time_indicators = {
            "morning": ["morning", "am", "breakfast", "wake up"],
            "afternoon": ["afternoon", "pm", "lunch", "noon"],
            "evening": ["evening", "dinner", "night"],
            "weekend": ["weekend", "saturday", "sunday"],
            "weekday": ["monday", "tuesday", "wednesday", "thursday", "friday"]
        }
        
        for tag, keywords in time_indicators.items():
            if any(keyword in content_lower for keyword in keywords):
                tags.append(tag)
        
        # Activity-based tags
        activity_indicators = {
            "planning": ["plan", "schedule", "organize", "prepare"],
            "learning": ["learn", "study", "practice", "improve"],
            "social": ["friend", "family", "meet", "talk", "call"],
            "creative": ["create", "design", "write", "draw", "build"],
            "problem_solving": ["solve", "fix", "debug", "troubleshoot", "analyze"]
        }
        
        for tag, keywords in activity_indicators.items():
            if any(keyword in content_lower for keyword in keywords):
                tags.append(tag)
        
        # Remove duplicates and limit
        return list(set(tags))[:10]

    def determine_privacy_level(self, content: str, entities: EntityExtractionResult) -> PrivacyLevel:
        """
        Determine appropriate privacy level based on content and entities.
        
        Args:
            content: Memory content
            entities: Extracted entities
            
        Returns:
            Appropriate PrivacyLevel
        """
        content_lower = content.lower()
        
        # Sensitive indicators
        sensitive_keywords = [
            "password", "ssn", "social security", "credit card", "bank account",
            "personal", "private", "confidential", "secret", "medical", "health record"
        ]
        
        if any(keyword in content_lower for keyword in sensitive_keywords):
            return PrivacyLevel.SENSITIVE
            
        # Private indicators
        private_keywords = [
            "salary", "income", "financial", "personal relationship", "family issue",
            "therapy", "counseling", "private conversation"
        ]
        
        if any(keyword in content_lower for keyword in private_keywords):
            return PrivacyLevel.PRIVATE
            
        # Check for personal information in entities
        if entities.people or len(entities.organizations) > 2:
            return PrivacyLevel.PRIVATE
            
        return PrivacyLevel.NORMAL

    def enrich_memory_metadata(
        self, 
        content: str, 
        content_type: str, 
        base_metadata: Optional[Dict[str, Any]] = None
    ) -> MemoryMetadata:
        """
        Enrich memory with comprehensive metadata analysis.
        
        Args:
            content: Memory content
            content_type: Type of memory
            base_metadata: Existing metadata to enhance
            
        Returns:
            Enriched MemoryMetadata
        """
        # Start with validated base metadata
        metadata = self.validate_metadata(base_metadata)
        
        # Extract entities
        entities = self.extract_entities(content)
        
        # Perform semantic analysis
        semantic_analysis = self.analyze_semantic_content(content, content_type)
        
        # Determine privacy level
        privacy_level = self.determine_privacy_level(content, entities)
        
        # Enrich metadata with analysis results
        if not metadata.people_mentioned:
            metadata.people_mentioned = entities.people
        
        if not metadata.priority_level:
            metadata.priority_level = semantic_analysis.priority_level
            
        if not metadata.privacy_level or metadata.privacy_level == PrivacyLevel.NORMAL:
            metadata.privacy_level = privacy_level
            
        if not metadata.source_confidence:
            metadata.source_confidence = semantic_analysis.confidence_score
        
        return metadata


# Global instance
memory_metadata_service = MemoryMetadataService()
