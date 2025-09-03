"""
Simple metrics collection service for monitoring system performance.
"""

import time
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from collections import defaultdict, deque
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


@dataclass
class MetricRecord:
    """Record of a metric measurement."""
    timestamp: float
    metric_name: str
    value: float
    tags: Dict[str, str] = field(default_factory=dict)


class MetricsCollector:
    """Simple in-memory metrics collection for monitoring system performance."""
    
    def __init__(self, max_records: int = 10000):
        self.max_records = max_records
        self.metrics: deque = deque(maxlen=max_records)
        self.counters: Dict[str, int] = defaultdict(int)
        self.gauges: Dict[str, float] = defaultdict(float)
        self.timers: Dict[str, List[float]] = defaultdict(list)
        self.start_time = time.time()
        
        logger.info("Metrics collector initialized")

    def increment_counter(self, name: str, value: int = 1, tags: Optional[Dict[str, str]] = None):
        """Increment a counter metric."""
        try:
            self.counters[name] += value
            self._record_metric(name, float(value), tags or {})
        except Exception as e:
            logger.error(f"Failed to increment counter {name}: {e}")

    def set_gauge(self, name: str, value: float, tags: Optional[Dict[str, str]] = None):
        """Set a gauge metric value."""
        try:
            self.gauges[name] = value
            self._record_metric(name, value, tags or {})
        except Exception as e:
            logger.error(f"Failed to set gauge {name}: {e}")

    def record_timing(self, name: str, duration_ms: float, tags: Optional[Dict[str, str]] = None):
        """Record a timing metric."""
        try:
            self.timers[name].append(duration_ms)
            # Keep only last 1000 timings per metric
            if len(self.timers[name]) > 1000:
                self.timers[name] = self.timers[name][-1000:]
            self._record_metric(name, duration_ms, tags or {})
        except Exception as e:
            logger.error(f"Failed to record timing {name}: {e}")

    def time_operation(self, name: str, tags: Optional[Dict[str, str]] = None):
        """Context manager for timing operations."""
        class TimingContext:
            def __init__(self, collector, name, tags):
                self.collector = collector
                self.name = name
                self.tags = tags
                self.start_time = None
            
            def __enter__(self):
                self.start_time = time.time()
                return self
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                if self.start_time:
                    duration_ms = (time.time() - self.start_time) * 1000
                    self.collector.record_timing(self.name, duration_ms, self.tags)
        
        return TimingContext(self, name, tags)

    def _record_metric(self, name: str, value: float, tags: Dict[str, str]):
        """Record a metric for historical tracking."""
        try:
            record = MetricRecord(
                timestamp=time.time(),
                metric_name=name,
                value=value,
                tags=tags
            )
            self.metrics.append(record)
        except Exception as e:
            logger.error(f"Failed to record metric {name}: {e}")

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get a summary of all metrics."""
        current_time = time.time()
        
        # Calculate timing statistics
        timing_stats = {}
        for name, timings in self.timers.items():
            if timings:
                timing_stats[name] = {
                    "count": len(timings),
                    "avg_ms": sum(timings) / len(timings),
                    "min_ms": min(timings),
                    "max_ms": max(timings),
                    "p95_ms": sorted(timings)[int(len(timings) * 0.95)] if len(timings) > 20 else max(timings)
                }
        
        return {
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "timing_stats": timing_stats,
            "total_metrics_recorded": len(self.metrics),
            "uptime_hours": (current_time - self.start_time) / 3600
        }

    def get_recent_metrics(self, metric_name: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent metric records."""
        recent = list(self.metrics)
        if metric_name:
            recent = [m for m in recent if m.metric_name == metric_name]
        
        return [
            {
                "timestamp": m.timestamp,
                "metric_name": m.metric_name,
                "value": m.value,
                "tags": m.tags
            }
            for m in recent[-limit:]
        ]

    def get_health_metrics(self) -> Dict[str, Any]:
        """Get metrics relevant to system health."""
        current_time = time.time()
        
        # Calculate rates over last hour
        recent_metrics = [
            m for m in self.metrics 
            if current_time - m.timestamp < 3600
        ]
        
        # Count metrics by type in last hour
        recent_counts = defaultdict(int)
        for metric in recent_metrics:
            recent_counts[metric.metric_name] += 1
        
        return {
            "memory_capture_rate_per_hour": recent_counts.get("memory_captured", 0),
            "memory_filter_rate_per_hour": recent_counts.get("memory_filtered", 0),
            "context_build_rate_per_hour": recent_counts.get("context_built", 0),
            "error_rate_per_hour": recent_counts.get("error_occurred", 0),
            "avg_response_time_ms": self._get_avg_timing("response_time"),
            "avg_context_build_time_ms": self._get_avg_timing("context_build_time"),
            "avg_memory_filter_time_ms": self._get_avg_timing("memory_filter_time"),
            "uptime_hours": (current_time - self.start_time) / 3600
        }

    def _get_avg_timing(self, metric_name: str) -> float:
        """Get average timing for a metric."""
        timings = self.timers.get(metric_name, [])
        return sum(timings) / len(timings) if timings else 0.0

    def clear_old_metrics(self, max_age_hours: int = 24):
        """Clear metrics older than specified hours."""
        cutoff_time = time.time() - (max_age_hours * 3600)
        old_count = len(self.metrics)
        
        # Remove old metrics
        while self.metrics and self.metrics[0].timestamp < cutoff_time:
            self.metrics.popleft()
        
        removed_count = old_count - len(self.metrics)
        if removed_count > 0:
            logger.info(f"Cleared {removed_count} old metric records")


# Global metrics collector instance
metrics_collector = MetricsCollector()

