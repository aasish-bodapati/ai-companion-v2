"""
Comprehensive Feedback Collection System

This service implements advanced feedback collection capabilities for continuous improvement:
- Real-time feedback collection and analysis
- Multi-dimensional feedback scoring
- User experience tracking and analytics
- Feedback-driven improvement pipelines
"""

import logging
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict
import uuid

from sqlalchemy.orm import Session
from app.crud.memory import memory
from app.schemas.memory import MemoryCreate

logger = logging.getLogger(__name__)


class FeedbackType(Enum):
    """Types of feedback that can be collected."""
    RESPONSE_QUALITY = "response_quality"
    CONVERSATION_FLOW = "conversation_flow"
    MEMORY_ACCURACY = "memory_accuracy"
    EMOTIONAL_SUPPORT = "emotional_support"
    HELPFULNESS = "helpfulness"
    NATURALNESS = "naturalness"
    CREATIVITY = "creativity"
    PERSONALIZATION = "personalization"
    OVERALL_SATISFACTION = "overall_satisfaction"


class FeedbackSentiment(Enum):
    """Sentiment classification for feedback."""
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"


@dataclass
class FeedbackEntry:
    """Represents a single feedback entry."""
    feedback_id: str
    user_id: str
    conversation_id: str
    message_id: Optional[str]
    feedback_type: FeedbackType
    score: float  # 1.0 to 5.0
    sentiment: FeedbackSentiment
    comments: str
    context: Dict[str, Any]
    timestamp: datetime
    response_time: Optional[float] = None
    ai_response_length: Optional[int] = None
    memory_used: Optional[List[str]] = None
    improvement_suggestions: Optional[List[str]] = None


@dataclass
class FeedbackAnalytics:
    """Analytics derived from feedback data."""
    total_feedback_count: int
    average_satisfaction: float
    sentiment_distribution: Dict[str, int]
    improvement_areas: List[str]
    trending_issues: List[str]
    user_satisfaction_trend: List[float]
    feature_performance: Dict[str, float]
    quality_score: float


@dataclass
class ImprovementInsight:
    """Insights for system improvement."""
    category: str
    priority: str  # "high", "medium", "low"
    description: str
    suggested_actions: List[str]
    affected_users: int
    confidence: float
    implementation_complexity: str  # "easy", "medium", "hard"


class FeedbackCollectionService:
    """
    Service for collecting, analyzing, and acting on user feedback.
    """
    
    def __init__(self):
        self.feedback_storage: Dict[str, List[FeedbackEntry]] = defaultdict(list)
        self.analytics_cache: Dict[str, FeedbackAnalytics] = {}
        self.improvement_insights: List[ImprovementInsight] = []
        
        # Feedback quality thresholds
        self.quality_thresholds = {
            "excellent": 4.5,
            "good": 3.5,
            "acceptable": 2.5,
            "poor": 1.5
        }
        
        # Common improvement categories
        self.improvement_categories = {
            "response_quality": "Response Quality & Accuracy",
            "conversation_flow": "Natural Conversation Flow",
            "memory_usage": "Memory Integration & Accuracy",
            "emotional_intelligence": "Emotional Understanding",
            "personalization": "Personalization & Adaptation",
            "creativity": "Creative Problem Solving",
            "performance": "Speed & Reliability"
        }
        
        logger.info("FeedbackCollectionService initialized")
    
    async def collect_feedback(
        self,
        user_id: str,
        conversation_id: str,
        feedback_data: Dict[str, Any],
        db: Session
    ) -> FeedbackEntry:
        """
        Collect and store user feedback.
        
        Args:
            user_id: ID of the user providing feedback
            conversation_id: ID of the conversation being rated
            feedback_data: Feedback information including scores and comments
            db: Database session
            
        Returns:
            FeedbackEntry: The created feedback entry
        """
        try:
            # Create feedback entry
            feedback_entry = FeedbackEntry(
                feedback_id=str(uuid.uuid4()),
                user_id=user_id,
                conversation_id=conversation_id,
                message_id=feedback_data.get("message_id"),
                feedback_type=FeedbackType(feedback_data.get("type", "overall_satisfaction")),
                score=float(feedback_data.get("score", 3.0)),
                sentiment=self._determine_sentiment(feedback_data.get("score", 3.0)),
                comments=feedback_data.get("comments", ""),
                context=feedback_data.get("context", {}),
                timestamp=datetime.now(timezone.utc),
                response_time=feedback_data.get("response_time"),
                ai_response_length=feedback_data.get("ai_response_length"),
                memory_used=feedback_data.get("memory_used", []),
                improvement_suggestions=feedback_data.get("improvement_suggestions", [])
            )
            
            # Store feedback in memory storage
            self.feedback_storage[user_id].append(feedback_entry)
            
            # Store feedback as memory for long-term tracking
            await self._store_feedback_as_memory(feedback_entry, db)
            
            # Analyze feedback for immediate insights
            await self._analyze_feedback_realtime(feedback_entry)
            
            # Update analytics cache
            await self._update_analytics(user_id)
            
            logger.info(f"Collected feedback for user {user_id}: {feedback_entry.feedback_type.value} - {feedback_entry.score}")
            
            return feedback_entry
            
        except Exception as e:
            logger.error(f"Error collecting feedback: {e}")
            raise
    
    async def get_user_feedback_analytics(self, user_id: str) -> FeedbackAnalytics:
        """Get analytics for a specific user's feedback."""
        try:
            if user_id in self.analytics_cache:
                return self.analytics_cache[user_id]
            
            user_feedback = self.feedback_storage.get(user_id, [])
            
            if not user_feedback:
                return FeedbackAnalytics(
                    total_feedback_count=0,
                    average_satisfaction=0.0,
                    sentiment_distribution={},
                    improvement_areas=[],
                    trending_issues=[],
                    user_satisfaction_trend=[],
                    feature_performance={},
                    quality_score=0.0
                )
            
            # Calculate analytics
            analytics = self._calculate_analytics(user_feedback)
            self.analytics_cache[user_id] = analytics
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting feedback analytics: {e}")
            raise
    
    async def get_improvement_insights(self, limit: int = 10) -> List[ImprovementInsight]:
        """Get top improvement insights based on feedback analysis."""
        try:
            # Analyze all feedback for system-wide insights
            all_feedback = []
            for user_feedback in self.feedback_storage.values():
                all_feedback.extend(user_feedback)
            
            if not all_feedback:
                return []
            
            # Generate insights
            insights = await self._generate_improvement_insights(all_feedback)
            
            # Sort by priority and confidence
            insights.sort(key=lambda x: (x.priority == "high", x.confidence), reverse=True)
            
            return insights[:limit]
            
        except Exception as e:
            logger.error(f"Error getting improvement insights: {e}")
            return []
    
    async def analyze_feedback_trends(self, days: int = 7) -> Dict[str, Any]:
        """Analyze feedback trends over a specified time period."""
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Filter recent feedback
            recent_feedback = []
            for user_feedback in self.feedback_storage.values():
                for feedback in user_feedback:
                    if feedback.timestamp >= cutoff_date:
                        recent_feedback.append(feedback)
            
            if not recent_feedback:
                return {"trends": "No recent feedback available"}
            
            # Analyze trends
            trends = {
                "feedback_volume": len(recent_feedback),
                "average_satisfaction": sum(f.score for f in recent_feedback) / len(recent_feedback),
                "satisfaction_trend": self._calculate_satisfaction_trend(recent_feedback),
                "common_issues": self._identify_common_issues(recent_feedback),
                "improvement_requests": self._extract_improvement_requests(recent_feedback),
                "feature_performance": self._analyze_feature_performance(recent_feedback),
                "user_sentiment": self._analyze_user_sentiment(recent_feedback)
            }
            
            return trends
            
        except Exception as e:
            logger.error(f"Error analyzing feedback trends: {e}")
            return {"error": str(e)}
    
    def _determine_sentiment(self, score: float) -> FeedbackSentiment:
        """Determine sentiment based on numerical score."""
        if score >= 4.5:
            return FeedbackSentiment.VERY_POSITIVE
        elif score >= 3.5:
            return FeedbackSentiment.POSITIVE
        elif score >= 2.5:
            return FeedbackSentiment.NEUTRAL
        elif score >= 1.5:
            return FeedbackSentiment.NEGATIVE
        else:
            return FeedbackSentiment.VERY_NEGATIVE
    
    async def _store_feedback_as_memory(self, feedback: FeedbackEntry, db: Session):
        """Store feedback as a memory for long-term tracking."""
        try:
            memory_content = f"User feedback: {feedback.feedback_type.value} - Score: {feedback.score}/5.0"
            if feedback.comments:
                memory_content += f" - Comments: {feedback.comments}"
            
            memory_data = MemoryCreate(
                content=memory_content,
                content_type="feedback",
                importance=self._calculate_feedback_importance(feedback),
                metadata={
                    "feedback_id": feedback.feedback_id,
                    "feedback_type": feedback.feedback_type.value,
                    "score": feedback.score,
                    "sentiment": feedback.sentiment.value,
                    "conversation_id": feedback.conversation_id,
                    "timestamp": feedback.timestamp.isoformat()
                }
            )
            
            await memory.create_memory(db, user_id=feedback.user_id, memory=memory_data)
            
        except Exception as e:
            logger.error(f"Error storing feedback as memory: {e}")
    
    def _calculate_feedback_importance(self, feedback: FeedbackEntry) -> float:
        """Calculate importance score for feedback memory."""
        base_importance = 0.3  # Base importance for all feedback
        
        # Higher importance for negative feedback
        if feedback.sentiment in [FeedbackSentiment.NEGATIVE, FeedbackSentiment.VERY_NEGATIVE]:
            base_importance += 0.4
        
        # Higher importance for detailed comments
        if len(feedback.comments) > 50:
            base_importance += 0.2
        
        # Higher importance for improvement suggestions
        if feedback.improvement_suggestions:
            base_importance += 0.3
        
        return min(1.0, base_importance)
    
    async def _analyze_feedback_realtime(self, feedback: FeedbackEntry):
        """Analyze feedback in real-time for immediate insights."""
        try:
            # Check for urgent issues
            if feedback.score <= 2.0 and feedback.comments:
                logger.warning(f"Low satisfaction feedback received: {feedback.score} - {feedback.comments}")
            
            # Extract improvement suggestions
            if feedback.improvement_suggestions:
                for suggestion in feedback.improvement_suggestions:
                    logger.info(f"Improvement suggestion received: {suggestion}")
            
            # Track performance issues
            if feedback.response_time and feedback.response_time > 5.0:
                logger.warning(f"Slow response time reported: {feedback.response_time}s")
                
        except Exception as e:
            logger.error(f"Error in real-time feedback analysis: {e}")
    
    async def _update_analytics(self, user_id: str):
        """Update analytics cache for a user."""
        try:
            user_feedback = self.feedback_storage.get(user_id, [])
            analytics = self._calculate_analytics(user_feedback)
            self.analytics_cache[user_id] = analytics
            
        except Exception as e:
            logger.error(f"Error updating analytics: {e}")
    
    def _calculate_analytics(self, feedback_list: List[FeedbackEntry]) -> FeedbackAnalytics:
        """Calculate analytics from feedback data."""
        if not feedback_list:
            return FeedbackAnalytics(
                total_feedback_count=0,
                average_satisfaction=0.0,
                sentiment_distribution={},
                improvement_areas=[],
                trending_issues=[],
                user_satisfaction_trend=[],
                feature_performance={},
                quality_score=0.0
            )
        
        # Calculate basic metrics
        total_count = len(feedback_list)
        average_satisfaction = sum(f.score for f in feedback_list) / total_count
        
        # Calculate sentiment distribution
        sentiment_dist = defaultdict(int)
        for feedback in feedback_list:
            sentiment_dist[feedback.sentiment.value] += 1
        
        # Identify improvement areas
        improvement_areas = self._identify_improvement_areas(feedback_list)
        
        # Calculate satisfaction trend (last 10 feedback entries)
        recent_feedback = sorted(feedback_list, key=lambda x: x.timestamp)[-10:]
        satisfaction_trend = [f.score for f in recent_feedback]
        
        # Analyze feature performance
        feature_performance = self._calculate_feature_performance(feedback_list)
        
        # Calculate overall quality score
        quality_score = self._calculate_quality_score(feedback_list)
        
        return FeedbackAnalytics(
            total_feedback_count=total_count,
            average_satisfaction=average_satisfaction,
            sentiment_distribution=dict(sentiment_dist),
            improvement_areas=improvement_areas,
            trending_issues=self._identify_trending_issues(feedback_list),
            user_satisfaction_trend=satisfaction_trend,
            feature_performance=feature_performance,
            quality_score=quality_score
        )
    
    def _identify_improvement_areas(self, feedback_list: List[FeedbackEntry]) -> List[str]:
        """Identify areas that need improvement based on feedback."""
        low_score_feedback = [f for f in feedback_list if f.score < 3.0]
        
        improvement_areas = []
        type_counts = defaultdict(int)
        
        for feedback in low_score_feedback:
            type_counts[feedback.feedback_type.value] += 1
        
        # Sort by frequency of issues
        for feedback_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
            if count >= 2:  # At least 2 complaints about this area
                improvement_areas.append(self.improvement_categories.get(feedback_type, feedback_type))
        
        return improvement_areas[:5]  # Top 5 improvement areas
    
    def _identify_trending_issues(self, feedback_list: List[FeedbackEntry]) -> List[str]:
        """Identify trending issues from recent feedback."""
        # Get recent feedback (last 7 days)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
        recent_feedback = [f for f in feedback_list if f.timestamp >= cutoff_date]
        
        if not recent_feedback:
            return []
        
        # Extract issues from comments
        issues = []
        for feedback in recent_feedback:
            if feedback.score < 3.0 and feedback.comments:
                # Simple keyword extraction for common issues
                comments_lower = feedback.comments.lower()
                if "slow" in comments_lower or "speed" in comments_lower:
                    issues.append("Performance/Speed")
                if "memory" in comments_lower or "remember" in comments_lower:
                    issues.append("Memory Issues")
                if "wrong" in comments_lower or "incorrect" in comments_lower:
                    issues.append("Accuracy Issues")
                if "confus" in comments_lower or "unclear" in comments_lower:
                    issues.append("Clarity Issues")
        
        # Count and return most common issues
        issue_counts = defaultdict(int)
        for issue in issues:
            issue_counts[issue] += 1
        
        return [issue for issue, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)][:3]
    
    def _calculate_feature_performance(self, feedback_list: List[FeedbackEntry]) -> Dict[str, float]:
        """Calculate performance scores for different features."""
        feature_scores = defaultdict(list)
        
        for feedback in feedback_list:
            feature_scores[feedback.feedback_type.value].append(feedback.score)
        
        # Calculate average scores for each feature
        performance = {}
        for feature, scores in feature_scores.items():
            performance[feature] = sum(scores) / len(scores)
        
        return performance
    
    def _calculate_quality_score(self, feedback_list: List[FeedbackEntry]) -> float:
        """Calculate overall quality score based on multiple factors."""
        if not feedback_list:
            return 0.0
        
        # Weighted scoring
        weights = {
            "average_satisfaction": 0.4,
            "consistency": 0.2,
            "trend": 0.2,
            "volume": 0.2
        }
        
        # Average satisfaction (normalized to 0-1)
        avg_satisfaction = sum(f.score for f in feedback_list) / len(feedback_list)
        satisfaction_score = (avg_satisfaction - 1) / 4  # Convert 1-5 to 0-1
        
        # Consistency score (lower variance is better)
        scores = [f.score for f in feedback_list]
        variance = sum((score - avg_satisfaction) ** 2 for score in scores) / len(scores)
        consistency_score = max(0, 1 - (variance / 4))  # Normalize variance
        
        # Trend score (positive trend is better)
        recent_scores = sorted(feedback_list, key=lambda x: x.timestamp)[-5:]
        if len(recent_scores) >= 2:
            trend = (recent_scores[-1].score - recent_scores[0].score) / 4  # Normalize to -1 to 1
            trend_score = max(0, 0.5 + trend / 2)  # Convert to 0-1
        else:
            trend_score = 0.5  # Neutral if not enough data
        
        # Volume score (more feedback is generally better, up to a point)
        volume_score = min(1.0, len(feedback_list) / 20)  # Cap at 20 feedback entries
        
        # Calculate weighted quality score
        quality_score = (
            satisfaction_score * weights["average_satisfaction"] +
            consistency_score * weights["consistency"] +
            trend_score * weights["trend"] +
            volume_score * weights["volume"]
        )
        
        return round(quality_score, 3)
    
    async def _generate_improvement_insights(self, feedback_list: List[FeedbackEntry]) -> List[ImprovementInsight]:
        """Generate actionable improvement insights from feedback."""
        insights = []
        
        # Analyze low-satisfaction feedback
        low_satisfaction = [f for f in feedback_list if f.score < 3.0]
        if len(low_satisfaction) > len(feedback_list) * 0.2:  # More than 20% negative feedback
            insights.append(ImprovementInsight(
                category="overall_satisfaction",
                priority="high",
                description=f"{len(low_satisfaction)} users reported low satisfaction scores",
                suggested_actions=[
                    "Review and improve response quality",
                    "Analyze common failure patterns",
                    "Implement additional quality checks"
                ],
                affected_users=len(set(f.user_id for f in low_satisfaction)),
                confidence=0.9,
                implementation_complexity="medium"
            ))
        
        # Analyze performance issues
        slow_responses = [f for f in feedback_list if f.response_time and f.response_time > 3.0]
        if len(slow_responses) > 5:
            insights.append(ImprovementInsight(
                category="performance",
                priority="high",
                description=f"{len(slow_responses)} reports of slow response times",
                suggested_actions=[
                    "Optimize LLM response generation",
                    "Implement response caching",
                    "Review memory retrieval performance"
                ],
                affected_users=len(set(f.user_id for f in slow_responses)),
                confidence=0.8,
                implementation_complexity="easy"
            ))
        
        # Analyze memory usage issues
        memory_issues = [f for f in feedback_list if "memory" in f.comments.lower() and f.score < 3.0]
        if len(memory_issues) > 3:
            insights.append(ImprovementInsight(
                category="memory_usage",
                priority="medium",
                description=f"{len(memory_issues)} users reported memory-related issues",
                suggested_actions=[
                    "Improve memory retrieval accuracy",
                    "Enhance memory attribution in responses",
                    "Review auto-capture logic"
                ],
                affected_users=len(set(f.user_id for f in memory_issues)),
                confidence=0.7,
                implementation_complexity="medium"
            ))
        
        return insights
    
    def _calculate_satisfaction_trend(self, feedback_list: List[FeedbackEntry]) -> List[float]:
        """Calculate satisfaction trend over time."""
        # Sort by timestamp and group by day
        sorted_feedback = sorted(feedback_list, key=lambda x: x.timestamp)
        
        daily_averages = []
        current_day = None
        day_scores = []
        
        for feedback in sorted_feedback:
            feedback_day = feedback.timestamp.date()
            
            if current_day != feedback_day:
                if day_scores:
                    daily_averages.append(sum(day_scores) / len(day_scores))
                current_day = feedback_day
                day_scores = [feedback.score]
            else:
                day_scores.append(feedback.score)
        
        # Add the last day
        if day_scores:
            daily_averages.append(sum(day_scores) / len(day_scores))
        
        return daily_averages
    
    def _identify_common_issues(self, feedback_list: List[FeedbackEntry]) -> List[str]:
        """Identify common issues from feedback comments."""
        issues = defaultdict(int)
        
        for feedback in feedback_list:
            if feedback.score < 3.0 and feedback.comments:
                comments = feedback.comments.lower()
                
                # Check for common issue keywords
                if any(word in comments for word in ["slow", "speed", "fast", "quick"]):
                    issues["Response Speed"] += 1
                if any(word in comments for word in ["wrong", "incorrect", "mistake", "error"]):
                    issues["Accuracy"] += 1
                if any(word in comments for word in ["memory", "remember", "forgot", "forget"]):
                    issues["Memory"] += 1
                if any(word in comments for word in ["confus", "unclear", "understand"]):
                    issues["Clarity"] += 1
                if any(word in comments for word in ["helpful", "useful", "relevant"]):
                    issues["Helpfulness"] += 1
        
        # Return most common issues
        return [issue for issue, count in sorted(issues.items(), key=lambda x: x[1], reverse=True)[:5]]
    
    def _extract_improvement_requests(self, feedback_list: List[FeedbackEntry]) -> List[str]:
        """Extract specific improvement requests from feedback."""
        requests = []
        
        for feedback in feedback_list:
            if feedback.improvement_suggestions:
                requests.extend(feedback.improvement_suggestions)
            
            # Extract requests from comments
            if feedback.comments:
                comments = feedback.comments.lower()
                if "should" in comments or "could" in comments or "would be better" in comments:
                    requests.append(feedback.comments[:100] + "..." if len(feedback.comments) > 100 else feedback.comments)
        
        return list(set(requests))[:10]  # Return unique requests, max 10
    
    def _analyze_feature_performance(self, feedback_list: List[FeedbackEntry]) -> Dict[str, float]:
        """Analyze performance of different features."""
        feature_scores = defaultdict(list)
        
        for feedback in feedback_list:
            feature_scores[feedback.feedback_type.value].append(feedback.score)
        
        performance = {}
        for feature, scores in feature_scores.items():
            if scores:
                performance[feature] = {
                    "average_score": sum(scores) / len(scores),
                    "feedback_count": len(scores),
                    "satisfaction_rate": len([s for s in scores if s >= 3.5]) / len(scores)
                }
        
        return performance
    
    def _analyze_user_sentiment(self, feedback_list: List[FeedbackEntry]) -> Dict[str, Any]:
        """Analyze overall user sentiment."""
        sentiments = [f.sentiment.value for f in feedback_list]
        sentiment_counts = defaultdict(int)
        
        for sentiment in sentiments:
            sentiment_counts[sentiment] += 1
        
        total = len(sentiments)
        if total == 0:
            return {}
        
        return {
            "distribution": dict(sentiment_counts),
            "positive_rate": (sentiment_counts["positive"] + sentiment_counts["very_positive"]) / total,
            "negative_rate": (sentiment_counts["negative"] + sentiment_counts["very_negative"]) / total,
            "overall_sentiment": "positive" if sentiment_counts["positive"] + sentiment_counts["very_positive"] > total / 2 else "neutral"
        }


# Global instance
feedback_collection_service = FeedbackCollectionService()


