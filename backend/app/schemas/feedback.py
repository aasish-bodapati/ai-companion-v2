"""
Feedback Collection Schema Definitions
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from enum import Enum


class FeedbackType(str, Enum):
    """Types of feedback."""
    RESPONSE_QUALITY = "response_quality"
    CONVERSATION_FLOW = "conversation_flow"
    MEMORY_ACCURACY = "memory_accuracy"
    EMOTIONAL_SUPPORT = "emotional_support"
    HELPFULNESS = "helpfulness"
    NATURALNESS = "naturalness"
    CREATIVITY = "creativity"
    PERSONALIZATION = "personalization"
    OVERALL_SATISFACTION = "overall_satisfaction"


class FeedbackSentiment(str, Enum):
    """Feedback sentiment classification."""
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"


class FeedbackCreate(BaseModel):
    """Schema for creating feedback."""
    conversation_id: str = Field(..., description="ID of the conversation")
    message_id: Optional[str] = Field(None, description="ID of the specific message")
    feedback_type: FeedbackType = Field(..., description="Type of feedback")
    score: float = Field(..., ge=1.0, le=5.0, description="Rating score (1-5)")
    comments: Optional[str] = Field(None, description="Additional comments")
    improvement_suggestions: Optional[List[str]] = Field(None, description="Suggestions for improvement")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")


class FeedbackResponse(BaseModel):
    """Schema for feedback response."""
    feedback_id: str = Field(..., description="ID of the feedback entry")
    status: str = Field(..., description="Status of feedback collection")
    message: str = Field(..., description="Response message")


class FeedbackAnalytics(BaseModel):
    """Schema for feedback analytics."""
    total_feedback_count: int = Field(..., description="Total number of feedback entries")
    average_satisfaction: float = Field(..., description="Average satisfaction score")
    sentiment_distribution: Dict[str, int] = Field(..., description="Distribution of sentiments")
    improvement_areas: List[str] = Field(..., description="Areas needing improvement")
    quality_score: float = Field(..., description="Overall quality score")
    satisfaction_trend: List[float] = Field(..., description="Satisfaction trend over time")


class ImprovementInsight(BaseModel):
    """Schema for improvement insights."""
    category: str = Field(..., description="Category of improvement")
    priority: str = Field(..., description="Priority level")
    description: str = Field(..., description="Description of the insight")
    suggested_actions: List[str] = Field(..., description="Suggested actions")
    affected_users: int = Field(..., description="Number of affected users")
    confidence: float = Field(..., description="Confidence level")
    implementation_complexity: str = Field(..., description="Implementation complexity")



