"""
Enhanced Performance Monitoring System

This service provides comprehensive performance monitoring for the AI companion:
- Real-time performance metrics collection
- User experience quality tracking
- System health monitoring
- Performance bottleneck identification
- Automated alerting and optimization suggestions
"""

import logging
import time
import psutil
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import threading
import json

logger = logging.getLogger(__name__)


class MetricType(Enum):
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


class AlertLevel(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class PerformanceMetric:
    """Represents a performance metric measurement."""
    metric_type: MetricType
    value: float
    unit: str
    timestamp: datetime
    context: Dict[str, Any] = field(default_factory=dict)
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None


@dataclass
class PerformanceAlert:
    """Represents a performance alert."""
    alert_id: str
    level: AlertLevel
    metric_type: MetricType
    message: str
    value: float
    threshold: float
    timestamp: datetime
    context: Dict[str, Any] = field(default_factory=dict)
    resolved: bool = False


@dataclass
class SystemHealth:
    """Overall system health status."""
    overall_score: float  # 0-100
    cpu_usage: float
    memory_usage: float
    database_health: float
    llm_health: float
    user_satisfaction: float
    error_rate: float
    active_users: int
    timestamp: datetime
    issues: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)


@dataclass
class PerformanceReport:
    """Comprehensive performance report."""
    report_id: str
    start_time: datetime
    end_time: datetime
    system_health: SystemHealth
    key_metrics: Dict[str, float]
    trends: Dict[str, List[float]]
    bottlenecks: List[str]
    optimizations: List[str]
    user_experience_score: float
    generated_at: datetime


class PerformanceMonitor:
    """
    Comprehensive performance monitoring system.
    """
    
    def __init__(self):
        self.metrics_buffer: Dict[MetricType, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.alerts: List[PerformanceAlert] = []
        self.is_monitoring = False
        self.monitoring_thread: Optional[threading.Thread] = None
        
        # Performance thresholds
        self.thresholds = {
            MetricType.RESPONSE_TIME: {"warning": 3.0, "critical": 5.0},
            MetricType.MEMORY_USAGE: {"warning": 80.0, "critical": 90.0},
            MetricType.CPU_USAGE: {"warning": 80.0, "critical": 95.0},
            MetricType.DATABASE_LATENCY: {"warning": 1.0, "critical": 2.0},
            MetricType.LLM_LATENCY: {"warning": 10.0, "critical": 20.0},
            MetricType.ERROR_RATE: {"warning": 5.0, "critical": 10.0},
            MetricType.USER_SATISFACTION: {"warning": 3.0, "critical": 2.5}
        }
        
        # Performance baselines (will be learned over time)
        self.baselines = {
            MetricType.RESPONSE_TIME: 2.0,
            MetricType.MEMORY_USAGE: 50.0,
            MetricType.CPU_USAGE: 30.0,
            MetricType.DATABASE_LATENCY: 0.5,
            MetricType.LLM_LATENCY: 5.0,
            MetricType.ERROR_RATE: 1.0,
            MetricType.USER_SATISFACTION: 4.0
        }
        
        # Monitoring configuration
        self.monitoring_interval = 30  # seconds
        self.alert_cooldown = 300  # 5 minutes
        self.last_alerts: Dict[MetricType, datetime] = {}
        
        logger.info("PerformanceMonitor initialized")
    
    def start_monitoring(self):
        """Start continuous performance monitoring."""
        if self.is_monitoring:
            return
        
        self.is_monitoring = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        
        logger.info("Performance monitoring started")
    
    def stop_monitoring(self):
        """Stop performance monitoring."""
        self.is_monitoring = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        
        logger.info("Performance monitoring stopped")
    
    async def record_metric(
        self,
        metric_type: MetricType,
        value: float,
        unit: str = "",
        context: Dict[str, Any] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None
    ):
        """Record a performance metric."""
        try:
            metric = PerformanceMetric(
                metric_type=metric_type,
                value=value,
                unit=unit,
                timestamp=datetime.now(timezone.utc),
                context=context or {},
                user_id=user_id,
                conversation_id=conversation_id
            )
            
            self.metrics_buffer[metric_type].append(metric)
            
            # Check for threshold violations
            await self._check_thresholds(metric)
            
        except Exception as e:
            logger.error(f"Error recording metric: {e}")
    
    async def get_system_health(self) -> SystemHealth:
        """Get current system health status."""
        try:
            current_time = datetime.now(timezone.utc)
            
            # Get system metrics
            cpu_usage = psutil.cpu_percent(interval=1)
            memory_info = psutil.virtual_memory()
            memory_usage = memory_info.percent
            
            # Calculate component health scores
            database_health = await self._calculate_database_health()
            llm_health = await self._calculate_llm_health()
            user_satisfaction = await self._calculate_user_satisfaction()
            error_rate = await self._calculate_error_rate()
            
            # Calculate overall health score
            component_scores = [
                (100 - cpu_usage),  # CPU health (inverse of usage)
                (100 - memory_usage),  # Memory health (inverse of usage)
                database_health,
                llm_health,
                user_satisfaction * 20,  # Convert 1-5 to 0-100
                max(0, 100 - error_rate * 10)  # Error health
            ]
            overall_score = sum(component_scores) / len(component_scores)
            
            # Identify issues
            issues = []
            if cpu_usage > 80:
                issues.append(f"High CPU usage: {cpu_usage:.1f}%")
            if memory_usage > 80:
                issues.append(f"High memory usage: {memory_usage:.1f}%")
            if database_health < 80:
                issues.append("Database performance degraded")
            if llm_health < 80:
                issues.append("LLM response time degraded")
            if user_satisfaction < 3.5:
                issues.append("Low user satisfaction detected")
            if error_rate > 5:
                issues.append(f"High error rate: {error_rate:.1f}%")
            
            # Generate recommendations
            recommendations = await self._generate_health_recommendations(
                cpu_usage, memory_usage, database_health, llm_health, user_satisfaction, error_rate
            )
            
            # Get active user count (simplified)
            active_users = len(set(
                metric.user_id for metric_buffer in self.metrics_buffer.values()
                for metric in metric_buffer
                if metric.user_id and metric.timestamp > current_time - timedelta(hours=1)
            ))
            
            return SystemHealth(
                overall_score=overall_score,
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                database_health=database_health,
                llm_health=llm_health,
                user_satisfaction=user_satisfaction,
                error_rate=error_rate,
                active_users=active_users,
                timestamp=current_time,
                issues=issues,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error getting system health: {e}")
            return SystemHealth(
                overall_score=0,
                cpu_usage=0,
                memory_usage=0,
                database_health=0,
                llm_health=0,
                user_satisfaction=0,
                error_rate=100,
                active_users=0,
                timestamp=datetime.now(timezone.utc),
                issues=["System health check failed"],
                recommendations=["Check system status"]
            )
    
    async def generate_performance_report(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> PerformanceReport:
        """Generate comprehensive performance report."""
        try:
            report_id = f"perf_report_{int(time.time())}"
            
            # Get system health
            system_health = await self.get_system_health()
            
            # Calculate key metrics
            key_metrics = {}
            trends = {}
            
            for metric_type in MetricType:
                metrics = [
                    m for m in self.metrics_buffer[metric_type]
                    if start_time <= m.timestamp <= end_time
                ]
                
                if metrics:
                    values = [m.value for m in metrics]
                    key_metrics[metric_type.value] = {
                        "average": sum(values) / len(values),
                        "min": min(values),
                        "max": max(values),
                        "count": len(values)
                    }
                    trends[metric_type.value] = values[-50:]  # Last 50 data points
            
            # Identify bottlenecks
            bottlenecks = await self._identify_bottlenecks(key_metrics)
            
            # Generate optimization suggestions
            optimizations = await self._generate_optimizations(key_metrics, bottlenecks)
            
            # Calculate user experience score
            user_experience_score = await self._calculate_user_experience_score(key_metrics)
            
            return PerformanceReport(
                report_id=report_id,
                start_time=start_time,
                end_time=end_time,
                system_health=system_health,
                key_metrics=key_metrics,
                trends=trends,
                bottlenecks=bottlenecks,
                optimizations=optimizations,
                user_experience_score=user_experience_score,
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Error generating performance report: {e}")
            raise
    
    async def get_active_alerts(self) -> List[PerformanceAlert]:
        """Get all active performance alerts."""
        return [alert for alert in self.alerts if not alert.resolved]
    
    async def resolve_alert(self, alert_id: str) -> bool:
        """Resolve a performance alert."""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.resolved = True
                logger.info(f"Resolved alert {alert_id}")
                return True
        return False
    
    def _monitoring_loop(self):
        """Main monitoring loop (runs in separate thread)."""
        while self.is_monitoring:
            try:
                asyncio.run(self._collect_system_metrics())
                time.sleep(self.monitoring_interval)
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(10)  # Brief pause before retrying
    
    async def _collect_system_metrics(self):
        """Collect system-level performance metrics."""
        try:
            # CPU usage
            cpu_usage = psutil.cpu_percent(interval=1)
            await self.record_metric(MetricType.CPU_USAGE, cpu_usage, "percent")
            
            # Memory usage
            memory_info = psutil.virtual_memory()
            await self.record_metric(MetricType.MEMORY_USAGE, memory_info.percent, "percent")
            
            # Additional system metrics can be added here
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
    
    async def _check_thresholds(self, metric: PerformanceMetric):
        """Check if metric violates performance thresholds."""
        try:
            thresholds = self.thresholds.get(metric.metric_type)
            if not thresholds:
                return
            
            # Check for alert cooldown
            last_alert = self.last_alerts.get(metric.metric_type)
            if last_alert and datetime.now(timezone.utc) - last_alert < timedelta(seconds=self.alert_cooldown):
                return
            
            alert_level = None
            threshold_value = None
            
            if metric.value > thresholds.get("critical", float('inf')):
                alert_level = AlertLevel.CRITICAL
                threshold_value = thresholds["critical"]
            elif metric.value > thresholds.get("warning", float('inf')):
                alert_level = AlertLevel.WARNING
                threshold_value = thresholds["warning"]
            
            # Special handling for satisfaction score (lower is worse)
            if metric.metric_type == MetricType.USER_SATISFACTION:
                if metric.value < thresholds.get("critical", 0):
                    alert_level = AlertLevel.CRITICAL
                    threshold_value = thresholds["critical"]
                elif metric.value < thresholds.get("warning", 0):
                    alert_level = AlertLevel.WARNING
                    threshold_value = thresholds["warning"]
            
            if alert_level:
                await self._create_alert(metric, alert_level, threshold_value)
                
        except Exception as e:
            logger.error(f"Error checking thresholds: {e}")
    
    async def _create_alert(self, metric: PerformanceMetric, level: AlertLevel, threshold: float):
        """Create a performance alert."""
        try:
            alert_id = f"alert_{int(time.time())}_{metric.metric_type.value}"
            
            message = f"{metric.metric_type.value} {level.value}: {metric.value} exceeds threshold of {threshold}"
            
            alert = PerformanceAlert(
                alert_id=alert_id,
                level=level,
                metric_type=metric.metric_type,
                message=message,
                value=metric.value,
                threshold=threshold,
                timestamp=metric.timestamp,
                context=metric.context
            )
            
            self.alerts.append(alert)
            self.last_alerts[metric.metric_type] = metric.timestamp
            
            logger.warning(f"Performance alert created: {message}")
            
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
    
    async def _calculate_database_health(self) -> float:
        """Calculate database performance health score (0-100)."""
        db_metrics = self.metrics_buffer[MetricType.DATABASE_LATENCY]
        if not db_metrics:
            return 100.0  # No data = assume healthy
        
        recent_metrics = [m for m in db_metrics if m.timestamp > datetime.now(timezone.utc) - timedelta(minutes=5)]
        if not recent_metrics:
            return 100.0
        
        avg_latency = sum(m.value for m in recent_metrics) / len(recent_metrics)
        baseline = self.baselines[MetricType.DATABASE_LATENCY]
        
        # Calculate health score (100 at baseline, 0 at 10x baseline)
        health_score = max(0, 100 - (avg_latency / baseline - 1) * 20)
        return min(100, health_score)
    
    async def _calculate_llm_health(self) -> float:
        """Calculate LLM performance health score (0-100)."""
        llm_metrics = self.metrics_buffer[MetricType.LLM_LATENCY]
        if not llm_metrics:
            return 100.0
        
        recent_metrics = [m for m in llm_metrics if m.timestamp > datetime.now(timezone.utc) - timedelta(minutes=5)]
        if not recent_metrics:
            return 100.0
        
        avg_latency = sum(m.value for m in recent_metrics) / len(recent_metrics)
        baseline = self.baselines[MetricType.LLM_LATENCY]
        
        health_score = max(0, 100 - (avg_latency / baseline - 1) * 10)
        return min(100, health_score)
    
    async def _calculate_user_satisfaction(self) -> float:
        """Calculate average user satisfaction (1-5 scale)."""
        satisfaction_metrics = self.metrics_buffer[MetricType.USER_SATISFACTION]
        if not satisfaction_metrics:
            return 4.0  # Default neutral satisfaction
        
        recent_metrics = [m for m in satisfaction_metrics if m.timestamp > datetime.now(timezone.utc) - timedelta(hours=1)]
        if not recent_metrics:
            return 4.0
        
        return sum(m.value for m in recent_metrics) / len(recent_metrics)
    
    async def _calculate_error_rate(self) -> float:
        """Calculate error rate percentage."""
        error_metrics = self.metrics_buffer[MetricType.ERROR_RATE]
        if not error_metrics:
            return 0.0
        
        recent_metrics = [m for m in error_metrics if m.timestamp > datetime.now(timezone.utc) - timedelta(hours=1)]
        if not recent_metrics:
            return 0.0
        
        return sum(m.value for m in recent_metrics) / len(recent_metrics)
    
    async def _generate_health_recommendations(
        self,
        cpu_usage: float,
        memory_usage: float,
        database_health: float,
        llm_health: float,
        user_satisfaction: float,
        error_rate: float
    ) -> List[str]:
        """Generate system health recommendations."""
        recommendations = []
        
        if cpu_usage > 80:
            recommendations.append("Consider scaling up CPU resources or optimizing high-CPU operations")
        
        if memory_usage > 80:
            recommendations.append("Monitor memory usage and consider increasing available memory")
        
        if database_health < 80:
            recommendations.append("Optimize database queries and consider connection pooling")
        
        if llm_health < 80:
            recommendations.append("Review LLM configuration and consider response caching")
        
        if user_satisfaction < 3.5:
            recommendations.append("Review user feedback and improve response quality")
        
        if error_rate > 5:
            recommendations.append("Investigate error logs and implement additional error handling")
        
        return recommendations
    
    async def _identify_bottlenecks(self, key_metrics: Dict[str, Any]) -> List[str]:
        """Identify performance bottlenecks from metrics."""
        bottlenecks = []
        
        # Check response time
        if "response_time" in key_metrics:
            avg_response_time = key_metrics["response_time"]["average"]
            if avg_response_time > 3.0:
                bottlenecks.append(f"High average response time: {avg_response_time:.2f}s")
        
        # Check LLM latency
        if "llm_latency" in key_metrics:
            avg_llm_latency = key_metrics["llm_latency"]["average"]
            if avg_llm_latency > 10.0:
                bottlenecks.append(f"High LLM processing time: {avg_llm_latency:.2f}s")
        
        # Check database latency
        if "database_latency" in key_metrics:
            avg_db_latency = key_metrics["database_latency"]["average"]
            if avg_db_latency > 1.0:
                bottlenecks.append(f"High database latency: {avg_db_latency:.2f}s")
        
        # Check memory retrieval time
        if "memory_retrieval_time" in key_metrics:
            avg_memory_time = key_metrics["memory_retrieval_time"]["average"]
            if avg_memory_time > 0.5:
                bottlenecks.append(f"Slow memory retrieval: {avg_memory_time:.2f}s")
        
        return bottlenecks
    
    async def _generate_optimizations(self, key_metrics: Dict[str, Any], bottlenecks: List[str]) -> List[str]:
        """Generate optimization suggestions based on metrics and bottlenecks."""
        optimizations = []
        
        if any("response time" in b for b in bottlenecks):
            optimizations.append("Implement response caching for common queries")
            optimizations.append("Optimize LLM token usage and model selection")
        
        if any("LLM processing" in b for b in bottlenecks):
            optimizations.append("Consider using faster LLM models for simple queries")
            optimizations.append("Implement parallel processing for LLM requests")
        
        if any("database latency" in b for b in bottlenecks):
            optimizations.append("Add database indexes for frequently queried fields")
            optimizations.append("Implement database connection pooling")
        
        if any("memory retrieval" in b for b in bottlenecks):
            optimizations.append("Optimize memory search algorithms")
            optimizations.append("Implement memory caching for recent retrievals")
        
        # General optimizations
        if len(bottlenecks) > 2:
            optimizations.append("Consider horizontal scaling for improved performance")
            optimizations.append("Implement monitoring dashboards for proactive optimization")
        
        return optimizations
    
    async def _calculate_user_experience_score(self, key_metrics: Dict[str, Any]) -> float:
        """Calculate overall user experience score (0-100)."""
        scores = []
        
        # Response time score (target: < 2s)
        if "response_time" in key_metrics:
            avg_response_time = key_metrics["response_time"]["average"]
            response_score = max(0, 100 - (avg_response_time - 2.0) * 20)
            scores.append(response_score)
        
        # User satisfaction score
        if "user_satisfaction" in key_metrics:
            avg_satisfaction = key_metrics["user_satisfaction"]["average"]
            satisfaction_score = (avg_satisfaction - 1) * 25  # Convert 1-5 to 0-100
            scores.append(satisfaction_score)
        
        # Error rate score
        if "error_rate" in key_metrics:
            avg_error_rate = key_metrics["error_rate"]["average"]
            error_score = max(0, 100 - avg_error_rate * 10)
            scores.append(error_score)
        
        # Memory accuracy score (if available)
        if "memory_accuracy" in key_metrics:
            memory_score = key_metrics["memory_accuracy"]["average"]
            scores.append(memory_score)
        
        if not scores:
            return 75.0  # Default neutral score
        
        return sum(scores) / len(scores)


# Global instance
performance_monitor = PerformanceMonitor()


