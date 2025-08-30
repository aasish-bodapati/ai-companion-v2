"""
Memory System Monitoring and Metrics Collection

Real-time monitoring system for memory capture, storage, and retrieval performance.
Provides dashboards and alerts for memory system health.
"""

import time
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import threading
from contextlib import contextmanager

logger = logging.getLogger(__name__)


@dataclass
class MemoryMetric:
    """Individual memory system metric."""
    name: str
    value: float
    timestamp: datetime
    tags: Dict[str, str]
    unit: str = ""


class MemoryMetricsCollector:
    """Collects and aggregates memory system metrics."""
    
    def __init__(self, retention_hours: int = 24):
        self.metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.retention_hours = retention_hours
        self.lock = threading.RLock()
        
        # Performance counters
        self.counters = defaultdict(int)
        self.timers = defaultdict(list)
        
    def record_metric(self, name: str, value: float, tags: Optional[Dict[str, str]] = None, unit: str = ""):
        """Record a metric value."""
        with self.lock:
            metric = MemoryMetric(
                name=name,
                value=value,
                timestamp=datetime.now(timezone.utc),
                tags=tags or {},
                unit=unit
            )
            self.metrics[name].append(metric)
            self._cleanup_old_metrics()
    
    def increment_counter(self, name: str, tags: Optional[Dict[str, str]] = None):
        """Increment a counter metric."""
        key = f"{name}:{':'.join(f'{k}={v}' for k, v in (tags or {}).items())}"
        with self.lock:
            self.counters[key] += 1
    
    @contextmanager
    def timer(self, name: str, tags: Optional[Dict[str, str]] = None):
        """Context manager for timing operations."""
        start_time = time.time()
        try:
            yield
        finally:
            duration = (time.time() - start_time) * 1000  # Convert to milliseconds
            self.record_metric(f"{name}_duration", duration, tags, "ms")
    
    def get_metrics(self, name: str, hours: int = 1) -> List[MemoryMetric]:
        """Get metrics for a specific name within time window."""
        with self.lock:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
            return [m for m in self.metrics[name] if m.timestamp >= cutoff]
    
    def get_aggregated_metrics(self, hours: int = 1) -> Dict[str, Any]:
        """Get aggregated metrics summary."""
        with self.lock:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
            aggregated = {}
            
            for name, metric_list in self.metrics.items():
                recent_metrics = [m for m in metric_list if m.timestamp >= cutoff]
                if recent_metrics:
                    values = [m.value for m in recent_metrics]
                    aggregated[name] = {
                        "count": len(values),
                        "avg": sum(values) / len(values),
                        "min": min(values),
                        "max": max(values),
                        "latest": values[-1],
                        "unit": recent_metrics[-1].unit
                    }
            
            return aggregated
    
    def _cleanup_old_metrics(self):
        """Remove metrics older than retention period."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=self.retention_hours)
        
        for name, metric_list in self.metrics.items():
            while metric_list and metric_list[0].timestamp < cutoff:
                metric_list.popleft()


class MemorySystemMonitor:
    """Comprehensive monitoring for memory system components."""
    
    def __init__(self):
        self.metrics_collector = MemoryMetricsCollector()
        self.alert_thresholds = {
            "capture_accuracy": 0.7,
            "storage_latency_ms": 100,
            "retrieval_latency_ms": 50,
            "error_rate": 0.05,
            "cache_hit_rate": 0.6
        }
        self.alerts: List[Dict[str, Any]] = []
        
    def track_memory_capture(self, user_id: str, content: str, success: bool, 
                           extraction_time_ms: float, importance_score: float):
        """Track memory capture metrics."""
        tags = {"user_id": user_id, "success": str(success)}
        
        self.metrics_collector.record_metric("memory_capture_time", extraction_time_ms, tags, "ms")
        self.metrics_collector.record_metric("memory_importance_score", importance_score, tags)
        self.metrics_collector.increment_counter("memory_capture_attempts", tags)
        
        if success:
            self.metrics_collector.increment_counter("memory_capture_success", tags)
        
        # Check alerts
        if extraction_time_ms > self.alert_thresholds["storage_latency_ms"]:
            self._create_alert("high_capture_latency", f"Capture time {extraction_time_ms}ms exceeds threshold")
    
    def track_memory_storage(self, user_id: str, memory_id: str, storage_time_ms: float, 
                           compression_ratio: float, success: bool):
        """Track memory storage metrics."""
        tags = {"user_id": user_id, "success": str(success)}
        
        self.metrics_collector.record_metric("memory_storage_time", storage_time_ms, tags, "ms")
        self.metrics_collector.record_metric("memory_compression_ratio", compression_ratio, tags)
        self.metrics_collector.increment_counter("memory_storage_attempts", tags)
        
        if success:
            self.metrics_collector.increment_counter("memory_storage_success", tags)
    
    def track_memory_retrieval(self, user_id: str, query: str, num_results: int, 
                             retrieval_time_ms: float, avg_relevance: float):
        """Track memory retrieval metrics."""
        tags = {"user_id": user_id}
        
        self.metrics_collector.record_metric("memory_retrieval_time", retrieval_time_ms, tags, "ms")
        self.metrics_collector.record_metric("memory_retrieval_results", num_results, tags)
        self.metrics_collector.record_metric("memory_retrieval_relevance", avg_relevance, tags)
        self.metrics_collector.increment_counter("memory_retrieval_requests", tags)
        
        # Check alerts
        if retrieval_time_ms > self.alert_thresholds["retrieval_latency_ms"]:
            self._create_alert("high_retrieval_latency", f"Retrieval time {retrieval_time_ms}ms exceeds threshold")
    
    def track_cache_performance(self, cache_type: str, hit: bool, access_time_ms: float):
        """Track cache performance metrics."""
        tags = {"cache_type": cache_type, "hit": str(hit)}
        
        self.metrics_collector.record_metric("cache_access_time", access_time_ms, tags, "ms")
        self.metrics_collector.increment_counter("cache_accesses", tags)
        
        if hit:
            self.metrics_collector.increment_counter("cache_hits", tags)
    
    def track_error(self, component: str, error_type: str, user_id: Optional[str] = None):
        """Track system errors."""
        tags = {"component": component, "error_type": error_type}
        if user_id:
            tags["user_id"] = user_id
        
        self.metrics_collector.increment_counter("memory_system_errors", tags)
        
        # Create alert for errors
        self._create_alert("system_error", f"Error in {component}: {error_type}")
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health metrics."""
        metrics = self.metrics_collector.get_aggregated_metrics(hours=1)
        
        # Calculate derived metrics
        health = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "healthy",
            "metrics": metrics,
            "alerts": self.alerts[-10:],  # Last 10 alerts
            "derived_metrics": {}
        }
        
        # Calculate cache hit rate
        cache_hits = sum(self.metrics_collector.counters.get(k, 0) 
                        for k in self.metrics_collector.counters.keys() 
                        if "cache_hits" in k)
        cache_accesses = sum(self.metrics_collector.counters.get(k, 0) 
                           for k in self.metrics_collector.counters.keys() 
                           if "cache_accesses" in k)
        
        if cache_accesses > 0:
            cache_hit_rate = cache_hits / cache_accesses
            health["derived_metrics"]["cache_hit_rate"] = cache_hit_rate
            
            if cache_hit_rate < self.alert_thresholds["cache_hit_rate"]:
                health["status"] = "warning"
        
        # Calculate error rate
        total_errors = sum(self.metrics_collector.counters.get(k, 0) 
                          for k in self.metrics_collector.counters.keys() 
                          if "errors" in k)
        total_operations = sum(self.metrics_collector.counters.get(k, 0) 
                             for k in self.metrics_collector.counters.keys() 
                             if "attempts" in k or "requests" in k)
        
        if total_operations > 0:
            error_rate = total_errors / total_operations
            health["derived_metrics"]["error_rate"] = error_rate
            
            if error_rate > self.alert_thresholds["error_rate"]:
                health["status"] = "critical"
        
        return health
    
    def get_performance_dashboard(self) -> Dict[str, Any]:
        """Get performance dashboard data."""
        metrics = self.metrics_collector.get_aggregated_metrics(hours=24)
        
        dashboard = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "time_range": "24 hours",
            "sections": {
                "capture_performance": {
                    "avg_capture_time": metrics.get("memory_capture_time", {}).get("avg", 0),
                    "capture_success_rate": self._calculate_success_rate("capture"),
                    "avg_importance_score": metrics.get("memory_importance_score", {}).get("avg", 0)
                },
                "storage_performance": {
                    "avg_storage_time": metrics.get("memory_storage_time", {}).get("avg", 0),
                    "avg_compression_ratio": metrics.get("memory_compression_ratio", {}).get("avg", 0),
                    "storage_success_rate": self._calculate_success_rate("storage")
                },
                "retrieval_performance": {
                    "avg_retrieval_time": metrics.get("memory_retrieval_time", {}).get("avg", 0),
                    "avg_results_per_query": metrics.get("memory_retrieval_results", {}).get("avg", 0),
                    "avg_relevance_score": metrics.get("memory_retrieval_relevance", {}).get("avg", 0)
                },
                "system_health": {
                    "cache_hit_rate": self._calculate_cache_hit_rate(),
                    "error_rate": self._calculate_error_rate(),
                    "total_operations": self._calculate_total_operations()
                }
            }
        }
        
        return dashboard
    
    def _create_alert(self, alert_type: str, message: str):
        """Create a system alert."""
        alert = {
            "type": alert_type,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "severity": "warning"
        }
        
        # Determine severity
        if "critical" in message.lower() or "error" in alert_type:
            alert["severity"] = "critical"
        elif "high" in message.lower():
            alert["severity"] = "high"
        
        self.alerts.append(alert)
        
        # Keep only recent alerts
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-100:]
        
        logger.warning(f"Memory system alert: {alert_type} - {message}")
    
    def _calculate_success_rate(self, operation: str) -> float:
        """Calculate success rate for an operation."""
        success_key = f"memory_{operation}_success"
        attempts_key = f"memory_{operation}_attempts"
        
        success_count = sum(v for k, v in self.metrics_collector.counters.items() if success_key in k)
        attempts_count = sum(v for k, v in self.metrics_collector.counters.items() if attempts_key in k)
        
        return success_count / attempts_count if attempts_count > 0 else 0.0
    
    def _calculate_cache_hit_rate(self) -> float:
        """Calculate overall cache hit rate."""
        hits = sum(v for k, v in self.metrics_collector.counters.items() if "cache_hits" in k)
        accesses = sum(v for k, v in self.metrics_collector.counters.items() if "cache_accesses" in k)
        
        return hits / accesses if accesses > 0 else 0.0
    
    def _calculate_error_rate(self) -> float:
        """Calculate overall error rate."""
        errors = sum(v for k, v in self.metrics_collector.counters.items() if "errors" in k)
        operations = sum(v for k, v in self.metrics_collector.counters.items() 
                        if any(op in k for op in ["attempts", "requests", "accesses"]))
        
        return errors / operations if operations > 0 else 0.0
    
    def _calculate_total_operations(self) -> int:
        """Calculate total operations."""
        return sum(v for k, v in self.metrics_collector.counters.items() 
                  if any(op in k for op in ["attempts", "requests", "accesses"]))


class MemoryMonitor:
    """Comprehensive memory system monitoring and alerting."""
    
    def __init__(self):
        self.metrics_collector = MemoryMetricsCollector()
        self.alerts = deque(maxlen=1000)
        self.performance_thresholds = {
            "retrieval_latency_ms": 500,  # Max acceptable retrieval time
            "memory_accuracy": 0.8,       # Minimum accuracy threshold
            "response_quality": 0.7,      # Minimum response quality score
            "error_rate": 0.05,           # Maximum error rate
        }
        
    def record_response_quality(self, user_id: str, query: str, response: str, 
                              expected_info: Optional[str] = None, 
                              hallucination_detected: bool = False):
        """Record response quality metrics."""
        try:
            # Calculate basic quality metrics
            response_length = len(response)
            has_memory_context = "remember" in response.lower() or "based on" in response.lower()
            
            # Check for common issues
            issues = []
            if hallucination_detected:
                issues.append("hallucination")
            if not has_memory_context and expected_info:
                issues.append("missing_context")
            if response_length < 10:
                issues.append("too_short")
            if response_length > 1000:
                issues.append("too_long")
            
            quality_score = 1.0 - (len(issues) * 0.2)
            quality_score = max(0.0, min(1.0, quality_score))
            
            tags = {
                "user_id": user_id,
                "query_type": self._classify_query(query),
                "has_issues": str(bool(issues)),
                "issues": ",".join(issues) if issues else "none"
            }
            
            self.metrics_collector.record_metric("response_quality", quality_score, tags)
            self.metrics_collector.record_metric("response_length", response_length, tags, "chars")
            
            # Alert if quality is below threshold
            if quality_score < self.performance_thresholds["response_quality"]:
                self._create_alert(
                    "LOW_RESPONSE_QUALITY",
                    f"Response quality {quality_score:.2f} below threshold {self.performance_thresholds['response_quality']}",
                    "warning",
                    {"user_id": user_id, "quality_score": quality_score, "issues": issues}
                )
                
        except Exception as e:
            logger.error(f"Error recording response quality: {e}")
    
    def record_memory_accuracy(self, user_id: str, query: str, retrieved_memories: List[Any], 
                              relevant_count: int, total_retrieved: int):
        """Record memory retrieval accuracy metrics."""
        try:
            if total_retrieved > 0:
                accuracy = relevant_count / total_retrieved
            else:
                accuracy = 0.0
                
            tags = {
                "user_id": user_id,
                "query_type": self._classify_query(query),
                "total_retrieved": str(total_retrieved)
            }
            
            self.metrics_collector.record_metric("memory_accuracy", accuracy, tags)
            self.metrics_collector.record_metric("memory_retrieval_count", total_retrieved, tags)
            
            # Alert if accuracy is below threshold
            if accuracy < self.performance_thresholds["memory_accuracy"]:
                self._create_alert(
                    "LOW_MEMORY_ACCURACY",
                    f"Memory accuracy {accuracy:.2f} below threshold {self.performance_thresholds['memory_accuracy']}",
                    "warning",
                    {"user_id": user_id, "accuracy": accuracy, "total_retrieved": total_retrieved}
                )
                
        except Exception as e:
            logger.error(f"Error recording memory accuracy: {e}")
    
    def record_llm_performance(self, model: str, latency_ms: float, success: bool, error: Optional[str] = None):
        """Record LLM performance metrics."""
        try:
            tags = {"model": model, "success": str(success)}
            
            self.metrics_collector.record_metric("llm_latency_ms", latency_ms, tags, "ms")
            self.metrics_collector.increment_counter("llm_requests", tags)
            
            if not success:
                self.metrics_collector.increment_counter("llm_errors", tags)
                self._create_alert(
                    "LLM_ERROR",
                    f"LLM request failed: {error}",
                    "error",
                    {"model": model, "latency_ms": latency_ms, "error": error}
                )
            
            # Alert if latency is above threshold
            if latency_ms > self.performance_thresholds["retrieval_latency_ms"]:
                self._create_alert(
                    "HIGH_LLM_LATENCY",
                    f"LLM latency {latency_ms:.0f}ms above threshold {self.performance_thresholds['retrieval_latency_ms']}ms",
                    "warning",
                    {"model": model, "latency_ms": latency_ms}
                )
                
        except Exception as e:
            logger.error(f"Error recording LLM performance: {e}")
    
    def _classify_query(self, query: str) -> str:
        """Classify query type for better metrics analysis."""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["name", "what is my name"]):
            return "name_query"
        elif any(word in query_lower for word in ["work", "job", "career"]):
            return "work_query"
        elif any(word in query_lower for word in ["preference", "like", "favorite"]):
            return "preference_query"
        elif any(word in query_lower for word in ["hello", "hi", "hey"]):
            return "greeting"
        elif any(word in query_lower for word in ["remember", "know about me"]):
            return "memory_query"
        else:
            return "general_query"
    
    def _create_alert(self, alert_type: str, message: str, severity: str, metadata: Dict[str, Any]):
        """Create and store an alert."""
        alert = {
            "type": alert_type,
            "message": message,
            "severity": severity,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata
        }
        self.alerts.append(alert)
        
        # Log alert
        if severity == "error":
            logger.error(f"ALERT: {message}")
        elif severity == "warning":
            logger.warning(f"ALERT: {message}")
        else:
            logger.info(f"ALERT: {message}")
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health status."""
        try:
            # Get recent metrics
            recent_metrics = self.metrics_collector.get_aggregated_metrics(hours=1)
            
            # Calculate health indicators
            health_indicators = {
                "response_quality": recent_metrics.get("response_quality", {}).get("avg", 0.0),
                "memory_accuracy": recent_metrics.get("memory_accuracy", {}).get("avg", 0.0),
                "llm_latency_ms": recent_metrics.get("llm_latency_ms", {}).get("avg", 0.0),
                "error_rate": self._calculate_error_rate(recent_metrics),
            }
            
            # Determine overall health status
            overall_health = "healthy"
            if (health_indicators["response_quality"] < self.performance_thresholds["response_quality"] or
                health_indicators["memory_accuracy"] < self.performance_thresholds["memory_accuracy"] or
                health_indicators["llm_latency_ms"] > self.performance_thresholds["retrieval_latency_ms"] or
                health_indicators["error_rate"] > self.performance_thresholds["error_rate"]):
                overall_health = "degraded"
            
            return {
                "status": overall_health,
                "indicators": health_indicators,
                "thresholds": self.performance_thresholds,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting system health: {e}")
            return {"status": "unknown", "error": str(e)}
    
    def get_performance_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive performance dashboard data."""
        try:
            # Get metrics for different time windows
            metrics_1h = self.metrics_collector.get_aggregated_metrics(hours=1)
            metrics_24h = self.metrics_collector.get_aggregated_metrics(hours=24)
            
            # Get recent alerts
            recent_alerts = list(self.alerts)[-10:]  # Last 10 alerts
            
            return {
                "current_performance": {
                    "1h": metrics_1h,
                    "24h": metrics_24h
                },
                "recent_alerts": recent_alerts,
                "system_health": self.get_system_health(),
                "performance_trends": self._calculate_trends(metrics_1h, metrics_24h)
            }
            
        except Exception as e:
            logger.error(f"Error getting performance dashboard: {e}")
            return {"error": str(e)}
    
    def _calculate_error_rate(self, metrics: Dict[str, Any]) -> float:
        """Calculate error rate from metrics."""
        try:
            llm_requests = metrics.get("llm_requests", {}).get("count", 0)
            llm_errors = metrics.get("llm_errors", {}).get("count", 0)
            
            if llm_requests > 0:
                return llm_errors / llm_requests
            return 0.0
        except Exception:
            return 0.0
    
    def _calculate_trends(self, metrics_1h: Dict[str, Any], metrics_24h: Dict[str, Any]) -> Dict[str, str]:
        """Calculate performance trends."""
        trends = {}
        
        try:
            # Response quality trend
            quality_1h = metrics_1h.get("response_quality", {}).get("avg", 0.0)
            quality_24h = metrics_24h.get("response_quality", {}).get("avg", 0.0)
            
            if quality_1h > quality_24h * 1.1:
                trends["response_quality"] = "improving"
            elif quality_1h < quality_24h * 0.9:
                trends["response_quality"] = "declining"
            else:
                trends["response_quality"] = "stable"
                
            # Latency trend
            latency_1h = metrics_1h.get("llm_latency_ms", {}).get("avg", 0.0)
            latency_24h = metrics_24h.get("llm_latency_ms", {}).get("avg", 0.0)
            
            if latency_1h < latency_24h * 0.9:
                trends["latency"] = "improving"
            elif latency_1h > latency_24h * 1.1:
                trends["latency"] = "declining"
            else:
                trends["latency"] = "stable"
                
        except Exception as e:
            logger.error(f"Error calculating trends: {e}")
            trends = {"error": str(e)}
            
        return trends


# Global monitor instance
memory_monitor = MemorySystemMonitor()


# Decorator for automatic monitoring
def monitor_memory_operation(operation_type: str):
    """Decorator to automatically monitor memory operations."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            success = False
            error_type = None
            
            try:
                result = func(*args, **kwargs)
                success = True
                return result
            except Exception as e:
                error_type = type(e).__name__
                memory_monitor.track_error(operation_type, error_type)
                raise
            finally:
                duration = (time.time() - start_time) * 1000
                
                # Track based on operation type
                if operation_type == "capture":
                    user_id = kwargs.get("user_id", "unknown")
                    content = kwargs.get("content", "")
                    importance = getattr(result, "importance_score", 0.5) if success else 0.0
                    memory_monitor.track_memory_capture(user_id, content, success, duration, importance)
                
                elif operation_type == "storage":
                    user_id = kwargs.get("user_id", "unknown")
                    memory_id = getattr(result, "id", "unknown") if success else "failed"
                    memory_monitor.track_memory_storage(user_id, memory_id, duration, 0.5, success)
                
                elif operation_type == "retrieval":
                    user_id = kwargs.get("user_id", "unknown")
                    query = kwargs.get("query", "")
                    num_results = len(result) if success and result else 0
                    avg_relevance = 0.5  # Default relevance
                    if success and result:
                        relevances = [getattr(r, "relevance_score", 0.5) for r in result]
                        avg_relevance = sum(relevances) / len(relevances) if relevances else 0.5
                    memory_monitor.track_memory_retrieval(user_id, query, num_results, duration, avg_relevance)
        
        return wrapper
    return decorator
