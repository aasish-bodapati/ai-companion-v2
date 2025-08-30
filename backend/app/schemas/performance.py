"""
Performance Monitoring Schema Definitions
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum


class MetricTypeSchema(str, Enum):
    """Types of performance metrics."""
    RESPONSE_TIME = "response_time"
    MEMORY_USAGE = "memory_usage"
    CPU_USAGE = "cpu_usage"
    DATABASE_LATENCY = "database_latency"
    LLM_LATENCY = "llm_latency"
    MEMORY_RETRIEVAL_TIME = "memory_retrieval_time"
    USER_SATISFACTION = "user_satisfaction"
    ERROR_RATE = "error_rate"
    THROUGHPUT = "throughput"
    CONVERSATION_QUALITY = "conversation_quality"


class AlertLevel(str, Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class PerformanceMetricCreate(BaseModel):
    """Schema for creating performance metrics."""
    metric_type: MetricTypeSchema = Field(..., description="Type of metric")
    value: float = Field(..., description="Metric value")
    unit: str = Field("", description="Unit of measurement")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")
    conversation_id: Optional[str] = Field(None, description="Related conversation ID")
    include_user_id: bool = Field(False, description="Whether to include user ID")


class SystemHealthResponse(BaseModel):
    """Schema for system health response."""
    overall_score: float = Field(..., description="Overall health score (0-100)")
    cpu_usage: float = Field(..., description="CPU usage percentage")
    memory_usage: float = Field(..., description="Memory usage percentage")
    database_health: float = Field(..., description="Database health score")
    llm_health: float = Field(..., description="LLM health score")
    user_satisfaction: float = Field(..., description="Average user satisfaction")
    error_rate: float = Field(..., description="Error rate percentage")
    active_users: int = Field(..., description="Number of active users")
    timestamp: datetime = Field(..., description="Timestamp of health check")
    issues: List[str] = Field(..., description="Current issues")
    recommendations: List[str] = Field(..., description="Recommendations")


class PerformanceAlert(BaseModel):
    """Schema for performance alerts."""
    alert_id: str = Field(..., description="Alert ID")
    level: AlertLevel = Field(..., description="Alert severity level")
    metric_type: MetricTypeSchema = Field(..., description="Type of metric")
    message: str = Field(..., description="Alert message")
    value: float = Field(..., description="Current value")
    threshold: float = Field(..., description="Threshold value")
    timestamp: datetime = Field(..., description="Alert timestamp")
    context: Dict[str, Any] = Field(..., description="Alert context")


class PerformanceReport(BaseModel):
    """Schema for performance reports."""
    report_id: str = Field(..., description="Report ID")
    start_time: datetime = Field(..., description="Report start time")
    end_time: datetime = Field(..., description="Report end time")
    system_health: SystemHealthResponse = Field(..., description="System health status")
    key_metrics: Dict[str, Any] = Field(..., description="Key performance metrics")
    bottlenecks: List[str] = Field(..., description="Identified bottlenecks")
    optimizations: List[str] = Field(..., description="Optimization suggestions")
    user_experience_score: float = Field(..., description="User experience score")
    generated_at: datetime = Field(..., description="Report generation time")


