"""
Holistic Memory API Schemas

Pydantic models for the holistic memory system API endpoints.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class HolisticContextRequest(BaseModel):
    """Request model for getting holistic context"""
    user_message: str = Field(..., description="User message for context analysis")
    conversation_id: Optional[str] = Field(None, description="Current conversation ID")
    time_window_hours: int = Field(168, description="Time window in hours (default: 7 days)")


class HolisticContextResponse(BaseModel):
    """Response model for holistic context"""
    user_id: str = Field(..., description="User identifier")
    user_message: str = Field(..., description="Original user message")
    context: Dict[str, Any] = Field(..., description="Holistic memory context")
    timestamp: Optional[str] = Field(None, description="Context timestamp")
    intent: Dict[str, Any] = Field(..., description="Intent analysis results")
    summary: Dict[str, Any] = Field(..., description="Holistic summary")


class HolisticResponseRequest(BaseModel):
    """Request model for generating holistic AI response"""
    user_message: str = Field(..., description="User message for AI response")
    conversation_id: Optional[str] = Field(None, description="Current conversation ID")
    system_prompt: Optional[str] = Field(None, description="Custom system prompt")


class HolisticResponseResponse(BaseModel):
    """Response model for holistic AI response"""
    user_id: str = Field(..., description="User identifier")
    user_message: str = Field(..., description="Original user message")
    ai_response: str = Field(..., description="AI generated response")
    context_used: Dict[str, Any] = Field(..., description="Memory context used")
    intent: Dict[str, Any] = Field(..., description="Intent analysis results")
    timestamp: Optional[str] = Field(None, description="Response timestamp")
    error: Optional[str] = Field(None, description="Error message if any")


class MemoryTimelineRequest(BaseModel):
    """Request model for memory timeline"""
    days: int = Field(7, description="Number of days to look back")
    include_types: Optional[List[str]] = Field(None, description="Memory types to include")


class MemoryTimelineResponse(BaseModel):
    """Response model for memory timeline"""
    user_id: str = Field(..., description="User identifier")
    timeline: List[Dict[str, Any]] = Field(..., description="Unified timeline entries")
    summary: Dict[str, Any] = Field(..., description="Timeline summary")
    period: str = Field(..., description="Time period covered")
    total_entries: int = Field(..., description="Total number of timeline entries")
    error: Optional[str] = Field(None, description="Error message if any")


class IntentAnalysisRequest(BaseModel):
    """Request model for intent analysis"""
    user_message: str = Field(..., description="User message to analyze")


class IntentAnalysisResponse(BaseModel):
    """Response model for intent analysis"""
    user_id: str = Field(..., description="User identifier")
    user_message: str = Field(..., description="Original user message")
    intent_type: str = Field(..., description="Classified intent type")
    confidence: float = Field(..., description="Confidence score (0.0 to 1.0)")
    keywords: List[str] = Field(..., description="Keywords that contributed to classification")
    context_summary: Dict[str, Any] = Field(..., description="Brief context summary")
    timestamp: Optional[str] = Field(None, description="Analysis timestamp")


class TimelineEntry(BaseModel):
    """Model for individual timeline entries"""
    timestamp: str = Field(..., description="Entry timestamp")
    type: str = Field(..., description="Entry type (workout, meal, journal, chat, etc.)")
    title: str = Field(..., description="Entry title")
    description: str = Field(..., description="Entry description")
    source: str = Field(..., description="Data source (logs, journals, chats, memories)")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    tags: Optional[List[str]] = Field(None, description="Associated tags")


class CrossConnection(BaseModel):
    """Model for cross-connections between memory buckets"""
    type: str = Field(..., description="Connection type")
    description: str = Field(..., description="Connection description")
    insight: str = Field(..., description="Insight from the connection")
    strength: float = Field(1.0, description="Connection strength (0.0 to 1.0)")
    source_buckets: List[str] = Field(..., description="Memory buckets involved")


class MemoryRecommendation(BaseModel):
    """Model for memory-based recommendations"""
    type: str = Field(..., description="Recommendation type")
    suggestion: str = Field(..., description="Recommendation text")
    priority: str = Field(..., description="Priority level (low, medium, high)")
    reasoning: Optional[str] = Field(None, description="Reasoning behind recommendation")
    related_context: Optional[Dict[str, Any]] = Field(None, description="Related context")


class HolisticSummary(BaseModel):
    """Model for holistic memory summary"""
    user_state: str = Field(..., description="Current user state")
    recent_activity: str = Field(..., description="Recent activity summary")
    emotional_context: str = Field(..., description="Emotional context summary")
    physical_context: str = Field(..., description="Physical context summary")
    conversation_context: str = Field(..., description="Conversation context summary")
    patterns: Optional[List[str]] = Field(None, description="Identified patterns")
    trends: Optional[List[str]] = Field(None, description="Recent trends")


class DataSourceSummary(BaseModel):
    """Model for individual data source summaries"""
    source_name: str = Field(..., description="Data source name")
    entry_count: int = Field(..., description="Number of entries")
    last_updated: Optional[str] = Field(None, description="Last update timestamp")
    key_insights: List[str] = Field(..., description="Key insights from this source")
    status: str = Field(..., description="Source status (active, inactive, error)")


class HolisticMemoryHealth(BaseModel):
    """Model for holistic memory system health"""
    status: str = Field(..., description="Overall system status")
    service: str = Field(..., description="Service name")
    orchestrator: str = Field(..., description="Orchestrator status")
    timestamp: str = Field(..., description="Health check timestamp")
    error: Optional[str] = Field(None, description="Error message if unhealthy")
    components: Optional[Dict[str, str]] = Field(None, description="Component statuses")
