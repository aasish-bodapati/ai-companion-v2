"""
Conversation flow analysis for natural topic transitions and engagement patterns.
"""
import re
from typing import List, Dict, Optional, Set, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class ConversationFlow:
    """Represents the flow and patterns of a conversation."""
    topic_transitions: List[str]
    engagement_level: str  # 'high', 'medium', 'low'
    conversation_depth: str  # 'surface', 'moderate', 'deep'
    emotional_trajectory: List[str]
    question_patterns: List[str]
    follow_up_opportunities: List[str]


class ConversationFlowAnalyzer:
    """Analyzes conversation patterns for natural flow and engagement."""
    
    def __init__(self):
        self.topic_keywords = {
            'health': ['health', 'medical', 'doctor', 'appointment', 'symptoms', 'medication', 'wellness'],
            'goals': ['goal', 'target', 'achieve', 'progress', 'milestone', 'objective', 'plan'],
            'work': ['work', 'job', 'career', 'project', 'meeting', 'deadline', 'office', 'business'],
            'personal': ['family', 'friend', 'relationship', 'social', 'hobby', 'interest', 'passion'],
            'learning': ['learn', 'study', 'course', 'skill', 'knowledge', 'education', 'practice']
        }
        
        self.engagement_indicators = {
            'high': ['excited', 'amazing', 'love', 'fantastic', 'awesome', 'great', 'perfect'],
            'medium': ['good', 'nice', 'okay', 'fine', 'alright', 'decent'],
            'low': ['tired', 'stressed', 'difficult', 'hard', 'struggling', 'frustrated']
        }
        
        self.question_patterns = [
            r'\?',  # Direct questions
            r'\bhow\b.*\?',  # How questions
            r'\bwhat\b.*\?',  # What questions
            r'\bwhy\b.*\?',  # Why questions
            r'\bwhen\b.*\?',  # When questions
            r'\bwhere\b.*\?',  # Where questions
            r'\bshould\s+i\b',  # Should I questions
            r'\bcan\s+you\b',  # Can you questions
        ]

    def analyze_conversation_flow(self, messages: List[Dict]) -> ConversationFlow:
        """Analyze the flow and patterns of a conversation."""
        if not messages:
            return ConversationFlow([], 'medium', 'surface', [], [], [])
        
        # Extract topics and transitions
        topic_transitions = self._analyze_topic_transitions(messages)
        
        # Determine engagement level
        engagement_level = self._analyze_engagement_level(messages)
        
        # Assess conversation depth
        conversation_depth = self._analyze_conversation_depth(messages)
        
        # Track emotional trajectory
        emotional_trajectory = self._analyze_emotional_trajectory(messages)
        
        # Identify question patterns
        question_patterns = self._analyze_question_patterns(messages)
        
        # Generate follow-up opportunities
        follow_up_opportunities = self._generate_follow_up_opportunities(
            messages, topic_transitions, engagement_level
        )
        
        return ConversationFlow(
            topic_transitions=topic_transitions,
            engagement_level=engagement_level,
            conversation_depth=conversation_depth,
            emotional_trajectory=emotional_trajectory,
            question_patterns=question_patterns,
            follow_up_opportunities=follow_up_opportunities
        )

    def _analyze_topic_transitions(self, messages: List[Dict]) -> List[str]:
        """Identify topic transitions in the conversation."""
        topics = []
        current_topics = set()
        
        for message in messages[-5:]:  # Analyze recent messages
            content = message.get('content', '').lower()
            message_topics = set()
            
            for topic, keywords in self.topic_keywords.items():
                if any(keyword in content for keyword in keywords):
                    message_topics.add(topic)
            
            # Detect topic transitions
            if message_topics and message_topics != current_topics:
                new_topics = message_topics - current_topics
                for topic in new_topics:
                    topics.append(f"transitioned_to_{topic}")
                current_topics = message_topics
        
        return topics[-3:]  # Return recent transitions

    def _analyze_engagement_level(self, messages: List[Dict]) -> str:
        """Determine the user's engagement level based on recent messages."""
        recent_user_messages = [
            msg for msg in messages[-3:] 
            if msg.get('role') == 'user'
        ]
        
        if not recent_user_messages:
            return 'medium'
        
        engagement_scores = {'high': 0, 'medium': 0, 'low': 0}
        
        for message in recent_user_messages:
            content = message.get('content', '').lower()
            
            for level, indicators in self.engagement_indicators.items():
                for indicator in indicators:
                    if indicator in content:
                        engagement_scores[level] += 1
            
            # Length and complexity as engagement indicators
            if len(content) > 100:
                engagement_scores['high'] += 1
            elif len(content) < 20:
                engagement_scores['low'] += 1
            else:
                engagement_scores['medium'] += 1
        
        return max(engagement_scores, key=engagement_scores.get)

    def _analyze_conversation_depth(self, messages: List[Dict]) -> str:
        """Assess how deep the conversation has gone."""
        recent_messages = messages[-5:]
        
        depth_indicators = {
            'deep': ['because', 'why', 'feel', 'think', 'believe', 'experience', 'struggle', 'challenge'],
            'moderate': ['how', 'what', 'when', 'where', 'explain', 'understand', 'help'],
            'surface': ['yes', 'no', 'ok', 'sure', 'thanks', 'hello', 'hi']
        }
        
        depth_scores = {'deep': 0, 'moderate': 0, 'surface': 0}
        
        for message in recent_messages:
            content = message.get('content', '').lower()
            
            for depth, indicators in depth_indicators.items():
                for indicator in indicators:
                    if indicator in content:
                        depth_scores[depth] += 1
        
        return max(depth_scores, key=depth_scores.get) if any(depth_scores.values()) else 'moderate'

    def _analyze_emotional_trajectory(self, messages: List[Dict]) -> List[str]:
        """Track the emotional progression of the conversation."""
        emotions = []
        
        emotion_keywords = {
            'positive': ['happy', 'excited', 'great', 'awesome', 'love', 'amazing', 'fantastic'],
            'neutral': ['okay', 'fine', 'alright', 'normal', 'usual'],
            'negative': ['sad', 'frustrated', 'tired', 'stressed', 'difficult', 'hard', 'struggling'],
            'curious': ['wonder', 'interesting', 'curious', 'question', 'why', 'how'],
            'motivated': ['ready', 'determined', 'focused', 'committed', 'goal', 'achieve']
        }
        
        for message in messages[-3:]:
            if message.get('role') == 'user':
                content = message.get('content', '').lower()
                message_emotions = []
                
                for emotion, keywords in emotion_keywords.items():
                    if any(keyword in content for keyword in keywords):
                        message_emotions.append(emotion)
                
                if message_emotions:
                    emotions.extend(message_emotions)
                else:
                    emotions.append('neutral')
        
        return emotions[-3:]  # Return recent emotional states

    def _analyze_question_patterns(self, messages: List[Dict]) -> List[str]:
        """Identify patterns in user questions."""
        patterns = []
        
        user_messages = [
            msg for msg in messages[-5:] 
            if msg.get('role') == 'user'
        ]
        
        for message in user_messages:
            content = message.get('content', '')
            
            for pattern in self.question_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    patterns.append(pattern)
        
        return list(set(patterns))  # Remove duplicates

    def _generate_follow_up_opportunities(
        self, 
        messages: List[Dict], 
        topic_transitions: List[str], 
        engagement_level: str
    ) -> List[str]:
        """Generate contextual follow-up opportunities."""
        opportunities = []
        
        if not messages:
            return opportunities
        
        last_message = messages[-1]
        last_user_message = next(
            (msg for msg in reversed(messages) if msg.get('role') == 'user'), 
            None
        )
        
        if not last_user_message:
            return opportunities
        
        content = last_user_message.get('content', '').lower()
        
        # Topic-specific follow-ups
        
        if 'goals' in topic_transitions or any(kw in content for kw in self.topic_keywords['goals']):
            opportunities.extend([
                "How's your progress on that goal?",
                "What's the next milestone?",
                "Need help breaking it down into steps?"
            ])
        
        # Engagement-based follow-ups
        if engagement_level == 'high':
            opportunities.extend([
                "That's fantastic! What's next?",
                "I love your enthusiasm! How can I help?",
                "You're doing amazing! Want to set a new challenge?"
            ])
        elif engagement_level == 'low':
            opportunities.extend([
                "How are you feeling about this?",
                "Want to talk about what's challenging?",
                "How can I better support you?"
            ])
        
        return opportunities[:3]  # Return top 3 opportunities

    def get_natural_transition_phrases(self, from_topic: str, to_topic: str) -> List[str]:
        """Get natural phrases for transitioning between topics."""
        transitions = {
            ('goals', 'health'): [
                "Speaking of goals, how's your health journey progressing?",
                "That's a great goal! How does your health fit into this?",
                "Let's see how your wellness routine supports this goal."
            ],
            ('health', 'goals'): [
                "Your health progress is great! What are your bigger goals?",
                "This wellness success - what's the ultimate goal behind it?",
                "You're building momentum! What other goals are you working on?"
            ]
        }
        
        return transitions.get((from_topic, to_topic), [
            f"That's interesting! Now, about {to_topic}...",
            f"I'm glad you brought that up. How does {to_topic} fit in?",
            f"That connects well to something else - {to_topic}."
        ])
