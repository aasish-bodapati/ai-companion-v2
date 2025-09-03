"""
Simple error tracking service for memory operations.
"""

import time
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from collections import defaultdict, deque
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


@dataclass
class ErrorRecord:
    """Record of an error that occurred."""
    timestamp: float
    error_type: str
    error_message: str
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    severity: str = "error"  # error, warning, critical


class ErrorTracker:
    """Simple in-memory error tracking for monitoring system health."""
    
    def __init__(self, max_errors: int = 1000):
        self.max_errors = max_errors
        self.errors: deque = deque(maxlen=max_errors)
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.user_errors: Dict[str, int] = defaultdict(int)
        self.start_time = time.time()
        
        logger.info("Error tracker initialized")

    def record_error(
        self,
        error_type: str,
        error_message: str,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        severity: str = "error"
    ):
        """Record an error for tracking."""
        try:
            error_record = ErrorRecord(
                timestamp=time.time(),
                error_type=error_type,
                error_message=error_message,
                user_id=user_id,
                conversation_id=conversation_id,
                context=context or {},
                severity=severity
            )
            
            self.errors.append(error_record)
            self.error_counts[error_type] += 1
            
            if user_id:
                self.user_errors[user_id] += 1
            
            # Log the error
            log_message = f"🚨 ERROR: {error_type} - {error_message}"
            if user_id:
                log_message += f" (user: {user_id})"
            if conversation_id:
                log_message += f" (conversation: {conversation_id})"
            
            if severity == "critical":
                logger.critical(log_message)
            elif severity == "warning":
                logger.warning(log_message)
            else:
                logger.error(log_message)
                
        except Exception as e:
            logger.error(f"Failed to record error: {e}")

    def get_error_summary(self) -> Dict[str, Any]:
        """Get a summary of recent errors."""
        current_time = time.time()
        recent_errors = [
            error for error in self.errors 
            if current_time - error.timestamp < 3600  # Last hour
        ]
        
        return {
            "total_errors": len(self.errors),
            "recent_errors_1h": len(recent_errors),
            "error_types": dict(self.error_counts),
            "top_error_types": sorted(
                self.error_counts.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:5],
            "users_with_errors": len(self.user_errors),
            "top_users_with_errors": sorted(
                self.user_errors.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5],
            "uptime_hours": (current_time - self.start_time) / 3600
        }

    def get_recent_errors(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent error records."""
        recent = list(self.errors)[-limit:]
        return [
            {
                "timestamp": error.timestamp,
                "error_type": error.error_type,
                "error_message": error.error_message,
                "user_id": error.user_id,
                "conversation_id": error.conversation_id,
                "severity": error.severity,
                "context": error.context
            }
            for error in recent
        ]

    def clear_old_errors(self, max_age_hours: int = 24):
        """Clear errors older than specified hours."""
        cutoff_time = time.time() - (max_age_hours * 3600)
        old_count = len(self.errors)
        
        # Remove old errors
        while self.errors and self.errors[0].timestamp < cutoff_time:
            self.errors.popleft()
        
        removed_count = old_count - len(self.errors)
        if removed_count > 0:
            logger.info(f"Cleared {removed_count} old error records")

    def get_health_status(self) -> Dict[str, Any]:
        """Get health status based on error patterns."""
        current_time = time.time()
        recent_errors = [
            error for error in self.errors 
            if current_time - error.timestamp < 300  # Last 5 minutes
        ]
        
        critical_errors = [
            error for error in recent_errors 
            if error.severity == "critical"
        ]
        
        # Determine health status
        if len(critical_errors) > 0:
            status = "critical"
        elif len(recent_errors) > 10:
            status = "warning"
        elif len(recent_errors) > 5:
            status = "degraded"
        else:
            status = "healthy"
        
        return {
            "status": status,
            "recent_errors_5m": len(recent_errors),
            "critical_errors_5m": len(critical_errors),
            "total_errors": len(self.errors),
            "uptime_hours": (current_time - self.start_time) / 3600
        }


# Global error tracker instance
error_tracker = ErrorTracker()

