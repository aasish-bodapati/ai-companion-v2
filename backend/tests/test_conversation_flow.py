"""
Tests for conversation flow analysis.
"""

import pytest
from unittest.mock import patch, MagicMock

from app.core.conversation_flow import (
    ConversationFlow,
    ConversationFlowAnalyzer
)


class TestConversationFlow:
    """Test ConversationFlow dataclass."""

    def test_conversation_flow_creation(self):
        """Test creating a conversation flow."""
        flow = ConversationFlow(
            topic_transitions=["transitioned_to_health", "transitioned_to_goals"],
            engagement_level="high",
            conversation_depth="deep",
            emotional_trajectory=["positive", "motivated"],
            question_patterns=[r"\bhow\b.*\?", r"\bwhat\b.*\?"],
            follow_up_opportunities=["How's your progress?", "What's next?"]
        )
        
        assert flow.topic_transitions == ["transitioned_to_health", "transitioned_to_goals"]
        assert flow.engagement_level == "high"
        assert flow.conversation_depth == "deep"
        assert flow.emotional_trajectory == ["positive", "motivated"]
        assert flow.question_patterns == [r"\bhow\b.*\?", r"\bwhat\b.*\?"]
        assert flow.follow_up_opportunities == ["How's your progress?", "What's next?"]


class TestConversationFlowAnalyzer:
    """Test ConversationFlowAnalyzer class."""

    def setup_method(self):
        """Set up analyzer for each test."""
        self.analyzer = ConversationFlowAnalyzer()

    def test_analyzer_initialization(self):
        """Test analyzer initialization with topic keywords."""
        assert "health" in self.analyzer.topic_keywords
        assert "goals" in self.analyzer.topic_keywords
        assert "work" in self.analyzer.topic_keywords
        assert "personal" in self.analyzer.topic_keywords
        assert "learning" in self.analyzer.topic_keywords
        
        # Check health keywords
        health_keywords = self.analyzer.topic_keywords["health"]
        assert "health" in health_keywords
        assert "medical" in health_keywords
        assert "doctor" in health_keywords
        
        # Check engagement indicators
        assert "high" in self.analyzer.engagement_indicators
        assert "medium" in self.analyzer.engagement_indicators
        assert "low" in self.analyzer.engagement_indicators

    def test_analyze_conversation_flow_empty_messages(self):
        """Test analyzing empty conversation."""
        flow = self.analyzer.analyze_conversation_flow([])
        
        assert flow.topic_transitions == []
        assert flow.engagement_level == "medium"
        assert flow.conversation_depth == "surface"
        assert flow.emotional_trajectory == []
        assert flow.question_patterns == []
        assert flow.follow_up_opportunities == []

    def test_analyze_conversation_flow_with_messages(self):
        """Test analyzing conversation with messages."""
        messages = [
            {"role": "user", "content": "I'm excited about my health goals!"},
            {"role": "assistant", "content": "That's great! What specific goals do you have?"},
            {"role": "user", "content": "I want to exercise more and eat better."}
        ]
        
        flow = self.analyzer.analyze_conversation_flow(messages)
        
        assert isinstance(flow, ConversationFlow)
        assert "transitioned_to_health" in flow.topic_transitions or "transitioned_to_goals" in flow.topic_transitions
        assert flow.engagement_level in ["high", "medium", "low"]
        assert flow.conversation_depth in ["surface", "moderate", "deep"]

    def test_analyze_topic_transitions(self):
        """Test topic transition analysis."""
        messages = [
            {"role": "user", "content": "I have a doctor appointment tomorrow"},
            {"role": "assistant", "content": "How are you feeling about that?"},
            {"role": "user", "content": "I want to achieve my fitness goals"}
        ]
        
        transitions = self.analyzer._analyze_topic_transitions(messages)
        
        assert isinstance(transitions, list)
        assert len(transitions) <= 3  # Should return recent transitions

    def test_analyze_topic_transitions_no_transitions(self):
        """Test topic transition analysis with no transitions."""
        messages = [
            {"role": "user", "content": "Hello there"},
            {"role": "assistant", "content": "Hi! How are you?"},
            {"role": "user", "content": "Just checking in"}
        ]
        
        transitions = self.analyzer._analyze_topic_transitions(messages)
        
        assert transitions == []

    def test_analyze_engagement_level_high(self):
        """Test engagement level analysis for high engagement."""
        messages = [
            {"role": "user", "content": "I'm so excited about this amazing opportunity!"},
            {"role": "assistant", "content": "That sounds fantastic!"},
            {"role": "user", "content": "I love how everything is coming together perfectly!"}
        ]
        
        engagement = self.analyzer._analyze_engagement_level(messages)
        
        assert engagement == "high"

    def test_analyze_engagement_level_medium(self):
        """Test engagement level analysis for medium engagement."""
        messages = [
            {"role": "user", "content": "It's going okay, I guess"},
            {"role": "assistant", "content": "How can I help?"},
            {"role": "user", "content": "Just trying to figure things out"}
        ]
        
        engagement = self.analyzer._analyze_engagement_level(messages)
        
        assert engagement == "medium"

    def test_analyze_engagement_level_low(self):
        """Test engagement level analysis for low engagement."""
        messages = [
            {"role": "user", "content": "I'm tired and stressed"},
            {"role": "assistant", "content": "I understand"},
            {"role": "user", "content": "It's difficult right now"}
        ]
        
        engagement = self.analyzer._analyze_engagement_level(messages)
        
        assert engagement == "low"

    def test_analyze_engagement_level_no_user_messages(self):
        """Test engagement level analysis with no user messages."""
        messages = [
            {"role": "assistant", "content": "How are you doing?"},
            {"role": "assistant", "content": "I'm here to help"}
        ]
        
        engagement = self.analyzer._analyze_engagement_level(messages)
        
        assert engagement == "medium"

    def test_analyze_engagement_level_by_length(self):
        """Test engagement level analysis based on message length."""
        messages = [
            {"role": "user", "content": "This is a very long message that should indicate high engagement because it contains many words and shows that the user is willing to put in effort to communicate their thoughts and feelings in detail."},
            {"role": "assistant", "content": "I see"},
            {"role": "user", "content": "Ok"}
        ]
        
        engagement = self.analyzer._analyze_engagement_level(messages)
        
        assert engagement == "high"

    def test_analyze_conversation_depth_deep(self):
        """Test conversation depth analysis for deep conversation."""
        messages = [
            {"role": "user", "content": "I feel like I'm struggling because I think this is challenging"},
            {"role": "assistant", "content": "I understand"},
            {"role": "user", "content": "I believe this experience will help me grow"}
        ]
        
        depth = self.analyzer._analyze_conversation_depth(messages)
        
        assert depth == "deep"

    def test_analyze_conversation_depth_moderate(self):
        """Test conversation depth analysis for moderate conversation."""
        messages = [
            {"role": "user", "content": "How do I understand this better?"},
            {"role": "assistant", "content": "Let me explain"},
            {"role": "user", "content": "What should I do next?"}
        ]
        
        depth = self.analyzer._analyze_conversation_depth(messages)
        
        assert depth == "moderate"

    def test_analyze_conversation_depth_surface(self):
        """Test conversation depth analysis for surface conversation."""
        messages = [
            {"role": "user", "content": "Yes"},
            {"role": "assistant", "content": "No problem"},
            {"role": "user", "content": "Thanks"}
        ]
        
        depth = self.analyzer._analyze_conversation_depth(messages)
        
        assert depth == "surface"

    def test_analyze_conversation_depth_no_indicators(self):
        """Test conversation depth analysis with no depth indicators."""
        messages = [
            {"role": "user", "content": "Random words here"},
            {"role": "assistant", "content": "Other random words"},
            {"role": "user", "content": "More random content"}
        ]
        
        depth = self.analyzer._analyze_conversation_depth(messages)
        
        assert depth == "moderate"  # Default when no indicators found

    def test_analyze_emotional_trajectory_positive(self):
        """Test emotional trajectory analysis for positive emotions."""
        messages = [
            {"role": "user", "content": "I'm so happy about this!"},
            {"role": "assistant", "content": "That's great"},
            {"role": "user", "content": "It's amazing and I love it!"}
        ]
        
        trajectory = self.analyzer._analyze_emotional_trajectory(messages)
        
        assert "positive" in trajectory
        assert len(trajectory) <= 3

    def test_analyze_emotional_trajectory_negative(self):
        """Test emotional trajectory analysis for negative emotions."""
        messages = [
            {"role": "user", "content": "I'm feeling sad and frustrated"},
            {"role": "assistant", "content": "I understand"},
            {"role": "user", "content": "This is difficult and I'm tired"}
        ]
        
        trajectory = self.analyzer._analyze_emotional_trajectory(messages)
        
        assert "negative" in trajectory

    def test_analyze_emotional_trajectory_neutral(self):
        """Test emotional trajectory analysis for neutral emotions."""
        messages = [
            {"role": "user", "content": "I'm feeling okay"},
            {"role": "assistant", "content": "That's fine"},
            {"role": "user", "content": "Everything is normal"}
        ]
        
        trajectory = self.analyzer._analyze_emotional_trajectory(messages)
        
        assert "neutral" in trajectory

    def test_analyze_emotional_trajectory_mixed(self):
        """Test emotional trajectory analysis for mixed emotions."""
        messages = [
            {"role": "user", "content": "I'm curious about this"},
            {"role": "assistant", "content": "Tell me more"},
            {"role": "user", "content": "I'm motivated to achieve my goals"}
        ]
        
        trajectory = self.analyzer._analyze_emotional_trajectory(messages)
        
        assert "curious" in trajectory or "motivated" in trajectory

    def test_analyze_question_patterns(self):
        """Test question pattern analysis."""
        messages = [
            {"role": "user", "content": "How are you doing?"},
            {"role": "assistant", "content": "I'm fine"},
            {"role": "user", "content": "What should I do next?"},
            {"role": "user", "content": "Can you help me with this?"}
        ]
        
        patterns = self.analyzer._analyze_question_patterns(messages)
        
        assert isinstance(patterns, list)
        assert len(patterns) > 0

    def test_analyze_question_patterns_no_questions(self):
        """Test question pattern analysis with no questions."""
        messages = [
            {"role": "user", "content": "I'm doing fine"},
            {"role": "assistant", "content": "That's good"},
            {"role": "user", "content": "Thanks for asking"}
        ]
        
        patterns = self.analyzer._analyze_question_patterns(messages)
        
        assert patterns == []

    def test_generate_follow_up_opportunities_goals(self):
        """Test follow-up opportunity generation for goals."""
        messages = [
            {"role": "user", "content": "I want to achieve my fitness goals"},
            {"role": "assistant", "content": "That's great!"}
        ]
        
        opportunities = self.analyzer._generate_follow_up_opportunities(
            messages, ["transitioned_to_goals"], "high"
        )
        
        assert isinstance(opportunities, list)
        assert len(opportunities) <= 3
        assert any("goal" in opp.lower() for opp in opportunities)

    def test_generate_follow_up_opportunities_high_engagement(self):
        """Test follow-up opportunity generation for high engagement."""
        messages = [
            {"role": "user", "content": "This is amazing!"},
            {"role": "assistant", "content": "I'm glad you think so"}
        ]
        
        opportunities = self.analyzer._generate_follow_up_opportunities(
            messages, [], "high"
        )
        
        assert isinstance(opportunities, list)
        assert len(opportunities) <= 3
        assert any("fantastic" in opp.lower() or "enthusiasm" in opp.lower() for opp in opportunities)

    def test_generate_follow_up_opportunities_low_engagement(self):
        """Test follow-up opportunity generation for low engagement."""
        messages = [
            {"role": "user", "content": "I'm struggling"},
            {"role": "assistant", "content": "I understand"}
        ]
        
        opportunities = self.analyzer._generate_follow_up_opportunities(
            messages, [], "low"
        )
        
        assert isinstance(opportunities, list)
        assert len(opportunities) <= 3
        assert any("feeling" in opp.lower() or "challenging" in opp.lower() for opp in opportunities)

    def test_generate_follow_up_opportunities_no_messages(self):
        """Test follow-up opportunity generation with no messages."""
        opportunities = self.analyzer._generate_follow_up_opportunities([], [], "medium")
        
        assert opportunities == []

    def test_generate_follow_up_opportunities_no_user_message(self):
        """Test follow-up opportunity generation with no user message."""
        messages = [
            {"role": "assistant", "content": "How can I help?"}
        ]
        
        opportunities = self.analyzer._generate_follow_up_opportunities(
            messages, [], "medium"
        )
        
        assert opportunities == []

    def test_get_natural_transition_phrases_goals_to_health(self):
        """Test getting natural transition phrases from goals to health."""
        phrases = self.analyzer.get_natural_transition_phrases("goals", "health")
        
        assert isinstance(phrases, list)
        assert len(phrases) > 0
        assert any("health" in phrase.lower() for phrase in phrases)

    def test_get_natural_transition_phrases_health_to_goals(self):
        """Test getting natural transition phrases from health to goals."""
        phrases = self.analyzer.get_natural_transition_phrases("health", "goals")
        
        assert isinstance(phrases, list)
        assert len(phrases) > 0
        assert any("goal" in phrase.lower() for phrase in phrases)

    def test_get_natural_transition_phrases_unknown_transition(self):
        """Test getting natural transition phrases for unknown transition."""
        phrases = self.analyzer.get_natural_transition_phrases("unknown", "other")
        
        assert isinstance(phrases, list)
        assert len(phrases) > 0
        assert any("other" in phrase.lower() for phrase in phrases)

    def test_analyze_conversation_flow_comprehensive(self):
        """Test comprehensive conversation flow analysis."""
        messages = [
            {"role": "user", "content": "I'm excited about my health goals! I want to exercise more."},
            {"role": "assistant", "content": "That's fantastic! What specific exercise goals do you have?"},
            {"role": "user", "content": "I want to run a marathon because I think it will help me feel accomplished."},
            {"role": "assistant", "content": "That's a great goal! How do you plan to train?"},
            {"role": "user", "content": "I'm curious about training plans. Can you help me understand the best approach?"}
        ]
        
        flow = self.analyzer.analyze_conversation_flow(messages)
        
        assert isinstance(flow, ConversationFlow)
        assert flow.engagement_level in ["high", "medium", "low"]
        assert flow.conversation_depth in ["surface", "moderate", "deep"]
        assert isinstance(flow.topic_transitions, list)
        assert isinstance(flow.emotional_trajectory, list)
        assert isinstance(flow.question_patterns, list)
        assert isinstance(flow.follow_up_opportunities, list)
        assert len(flow.follow_up_opportunities) <= 3
