"""
Smart Memory Filter - Intelligent filtering for memory capture
Reduces noise and improves memory quality by filtering out non-valuable content.
"""

import re
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class MessageType(Enum):
    """Types of messages for filtering decisions."""
    QUESTION = "question"
    STATEMENT = "statement"
    COMMAND = "command"
    META = "meta"
    SHORT = "short"
    PERSONAL_INFO = "personal_info"
    PREFERENCE = "preference"
    FACT = "fact"


@dataclass
class MessageAnalysis:
    """Analysis result for a message."""
    message_type: MessageType
    should_capture: bool
    confidence: float
    reason: str
    extracted_content: Optional[str] = None


class SmartMemoryFilter:
    """
    Intelligent memory filtering system that determines whether a message
    contains valuable information worth storing as memory.
    """
    
    def __init__(self):
        # Pre-compile regex patterns for performance
        self._question_patterns = [
            r'\?$',  # Ends with question mark
            r'^(what|how|when|where|why|who|which|can|could|would|should|do|does|did)\b',
            r'\b(what|how|when|where|why|who|which|can|could|would|should|do|does|did)\s+\w+',
            r'^(is|are|was|were)\s+(this|that|it|he|she|they)\b',  # Only specific question forms
        ]
        
        self._command_patterns = [
            r'^/',  # Slash commands
            r'^(help|status|info|debug|test|clear|reset|delete|remove)',
        ]
        
        self._meta_patterns = [
            r'\b(summarize|tell me about)\b',
            r'\b(explain)\b(?!\s+that)',  # Exclude "explain that" questions
            r'\b(what do you know|what do you remember)\b(?!\s+about\s+me)',  # Exclude "about me" questions
            r'\b(what do you remember about me)\b',  # Include "remember about me" as meta
            r'\b(remember this|remember that|remember it)\b(?!\s+anything)',  # Exclude "remember anything" questions
        ]
        
        self._personal_info_patterns = [
            r'\b(my name is)\s+(.+?)(?:\.|$)',  # Name - only "my name is"
            # Removed problematic name pattern that was too broad
            r'\b(i work|i work as|i work at)\s+(.+?)(?:\.|$)',  # Work
            r'\b(i am|i\'m)\s+(a|an)\s+(.+?)(?:\.|$)',  # Profession - "I am a software engineer"
            r'\b(i live|i live in|i live at)\s+(.+?)(?:\.|$)',  # Location
            r'\b(my age is|i am \d+|i\'m \d+)\b(.*)',  # Age - capture additional words after
            r'\b(my email is|my phone is|my number is)\s+(.+?)(?:\.|$)',  # Contact info
            r'\b(my phone number is|my number is)\s+(.+?)(?:\.|$)',  # Phone
            r'\b(my address is|i live at)\s+(.+?)(?:\.|$)',  # Address
        ]
        
        self._preference_patterns = [
            r'\b(i like|i love|i enjoy|i prefer|i hate|i dislike)\s+(.+?)(?:\.|$)',
            r'\b(my favorite|my preferred|i want|i need)\s+(.+?)(?:\.|$)',
            r'\b(i\'m allergic to|i have an allergy to)\s+(.+?)(?:\.|$)',
        ]
        
        self._fact_patterns = [
            r'\b(i have|i own|i got|i bought|i received)\s+(.+?)(?:\.|$)',
            r'\b(my goal is|my plan is|i want to|i need to)\s+(.+?)(?:\.|$)',
            r'\b(i\'m getting|i\'m going to|i will|i\'ll)\s+(.+?)(?:\.|$)',
        ]
        
        # Compile all patterns
        self._compiled_patterns = {
            'questions': [re.compile(p, re.IGNORECASE) for p in self._question_patterns],
            'commands': [re.compile(p, re.IGNORECASE) for p in self._command_patterns],
            'meta': [re.compile(p, re.IGNORECASE) for p in self._meta_patterns],
            'personal_info': [re.compile(p, re.IGNORECASE) for p in self._personal_info_patterns],
            'preferences': [re.compile(p, re.IGNORECASE) for p in self._preference_patterns],
            'facts': [re.compile(p, re.IGNORECASE) for p in self._fact_patterns],
        }
        
        # Minimum thresholds
        self.MIN_MESSAGE_LENGTH = 10
        self.MIN_PERSONAL_INFO_LENGTH = 3
        self.CONFIDENCE_THRESHOLD = 0.6

    def analyze_message(self, message: str, conversation_context: Optional[Dict[str, Any]] = None) -> MessageAnalysis:
        """
        Analyze a message to determine if it should be captured as memory.
        
        Args:
            message: The user message to analyze
            conversation_context: Optional context about the conversation
            
        Returns:
            MessageAnalysis with capture decision and reasoning
        """
        if not message or not message.strip():
            return MessageAnalysis(
                message_type=MessageType.SHORT,
                should_capture=False,
                confidence=1.0,
                reason="Empty message"
            )
        
        message = message.strip()
        message_lower = message.lower()
        
        # Check for commands first (before length check)
        if self._is_command(message_lower):
            return MessageAnalysis(
                message_type=MessageType.COMMAND,
                should_capture=False,
                confidence=1.0,
                reason="Command message - not personal information"
            )
        
        # Check for meta prompts (before length check)
        if self._is_meta_prompt(message_lower):
            return MessageAnalysis(
                message_type=MessageType.META,
                should_capture=False,
                confidence=1.0,
                reason="Meta prompt - not personal information"
            )
        
        # Check message length after command/meta checks
        if len(message) < self.MIN_MESSAGE_LENGTH:
            return MessageAnalysis(
                message_type=MessageType.SHORT,
                should_capture=False,
                confidence=1.0,
                reason=f"Message too short ({len(message)} chars)"
            )
        
        # Check for preferences first (more specific patterns)
        preference = self._extract_preference(message_lower)
        if preference:
            return MessageAnalysis(
                message_type=MessageType.PREFERENCE,
                should_capture=True,
                confidence=0.8,
                reason="Contains preference information",
                extracted_content=preference
            )
        
        # Check for facts (more specific patterns)
        fact = self._extract_fact(message_lower)
        if fact:
            return MessageAnalysis(
                message_type=MessageType.FACT,
                should_capture=True,
                confidence=0.7,
                reason="Contains factual information",
                extracted_content=fact
            )
        
        # Check for general personal statements (before personal info)
        if self._is_personal_statement(message_lower):
            return MessageAnalysis(
                message_type=MessageType.STATEMENT,
                should_capture=True,
                confidence=0.6,
                reason="Personal statement worth capturing",
                extracted_content=message
            )
        
        # Check for personal information (broader patterns, checked last)
        personal_info = self._extract_personal_info(message_lower)
        if personal_info:
            return MessageAnalysis(
                message_type=MessageType.PERSONAL_INFO,
                should_capture=True,
                confidence=0.9,
                reason="Contains personal information",
                extracted_content=personal_info
            )
        
        # Check for questions (after personal info checks)
        if self._is_question(message_lower):
            return MessageAnalysis(
                message_type=MessageType.QUESTION,
                should_capture=False,
                confidence=0.9,
                reason="Question message - user asking, not sharing"
            )
        


        
        # Default: don't capture
        result = MessageAnalysis(
            message_type=MessageType.STATEMENT,
            should_capture=False,
            confidence=0.5,
            reason="No clear personal information detected"
        )
        
        # Log the analysis result
        logger.debug(f"🔍 FILTER: '{message[:50]}...' -> {result.message_type.value} (capture: {result.should_capture}, confidence: {result.confidence})")
        
        return result

    def _is_question(self, message_lower: str) -> bool:
        """Check if message is a question."""
        for pattern in self._compiled_patterns['questions']:
            if pattern.search(message_lower):
                return True
        return False

    def _is_command(self, message_lower: str) -> bool:
        """Check if message is a command."""
        for pattern in self._compiled_patterns['commands']:
            if pattern.search(message_lower):
                return True
        return False

    def _is_meta_prompt(self, message_lower: str) -> bool:
        """Check if message is a meta prompt about the system."""
        for pattern in self._compiled_patterns['meta']:
            if pattern.search(message_lower):
                return True
        return False

    def _extract_personal_info(self, message_lower: str) -> Optional[str]:
        """Extract personal information from message."""
        for pattern in self._compiled_patterns['personal_info']:
            match = pattern.search(message_lower)
            if match:
                # Extract the relevant part
                if len(match.groups()) >= 2:
                    # For profession pattern (3 groups), use group 3; otherwise use group 2
                    if len(match.groups()) >= 3 and 'a|an' in pattern.pattern:
                        extracted = match.group(3).strip()
                    else:
                        extracted = match.group(2).strip()
                    if len(extracted) >= self.MIN_PERSONAL_INFO_LENGTH:
                        return extracted
        return None

    def _extract_preference(self, message_lower: str) -> Optional[str]:
        """Extract preference information from message."""
        for pattern in self._compiled_patterns['preferences']:
            match = pattern.search(message_lower)
            if match:
                if len(match.groups()) >= 2:
                    extracted = match.group(2).strip()
                    if len(extracted) >= self.MIN_PERSONAL_INFO_LENGTH:
                        return extracted
        return None

    def _extract_fact(self, message_lower: str) -> Optional[str]:
        """Extract factual information from message."""
        for pattern in self._compiled_patterns['facts']:
            match = pattern.search(message_lower)
            if match:
                if len(match.groups()) >= 2:
                    extracted = match.group(2).strip()
                    if len(extracted) >= self.MIN_PERSONAL_INFO_LENGTH:
                        return extracted
        return None

    def _is_personal_statement(self, message_lower: str) -> bool:
        """Check if message is a personal statement worth capturing."""
        # Look for first-person statements with personal indicators
        personal_indicators = [
            'my name', 'i have',
            'i like', 'i love', 'i prefer', 'i want', 'i need',
            'my goal', 'my plan', 'i\'m getting', 'i will', 'i own',
            'i got', 'i bought', 'i received', 'i\'m planning',
            'feeling', 'tired', 'working', 'hard'
        ]
        
        # Must start with "I" and contain personal indicators
        if not (message_lower.startswith('i ') or message_lower.startswith("i'") or message_lower.startswith('i am')):
            return False
        
        return any(indicator in message_lower for indicator in personal_indicators)

    def filter_messages(self, messages: List[str]) -> List[MessageAnalysis]:
        """
        Analyze multiple messages and return filtered results.
        
        Args:
            messages: List of messages to analyze
            
        Returns:
            List of MessageAnalysis results
        """
        results = []
        for message in messages:
            analysis = self.analyze_message(message)
            results.append(analysis)
        
        return results

    def get_capture_candidates(self, messages: List[str]) -> List[str]:
        """
        Get messages that should be captured as memories.
        
        Args:
            messages: List of messages to analyze
            
        Returns:
            List of messages/content that should be captured
        """
        candidates = []
        for message in messages:
            analysis = self.analyze_message(message)
            if analysis.should_capture and analysis.confidence >= self.CONFIDENCE_THRESHOLD:
                content = analysis.extracted_content or message
                candidates.append(content)
        
        return candidates


# Global instance for easy access
smart_memory_filter = SmartMemoryFilter()
