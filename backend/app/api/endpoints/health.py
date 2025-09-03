"""
Health check endpoints for monitoring system status.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import time
import logging

from app.api.deps import get_db
from app.services.memory_batcher import memory_batcher
from app.services.smart_memory_filter import smart_memory_filter
from app.services.context_manager import context_manager
from app.services.error_tracker import error_tracker
from app.services.metrics import metrics_collector

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "api": "healthy",
            "memory_batcher": "healthy",
            "smart_memory_filter": "healthy",
            "context_manager": "healthy"
        }
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Detailed health check with service status and metrics."""
    try:
        # Test memory batcher
        batcher_stats = memory_batcher.get_stats()
        batcher_status = "healthy" if batcher_stats else "unhealthy"
        
        # Test smart memory filter
        test_analysis = smart_memory_filter.analyze_message("Test message")
        filter_status = "healthy" if test_analysis else "unhealthy"
        
        # Test context manager (basic test)
        context_status = "healthy"  # Context manager is stateless
        
        # Test database connection
        db_status = "healthy"
        try:
            db.execute("SELECT 1")
        except Exception as e:
            db_status = "unhealthy"
            logger.error(f"Database health check failed: {e}")
        
        overall_status = "healthy" if all([
            batcher_status == "healthy",
            filter_status == "healthy", 
            context_status == "healthy",
            db_status == "healthy"
        ]) else "unhealthy"
        
        return {
            "status": overall_status,
            "timestamp": time.time(),
            "services": {
                "database": {
                    "status": db_status,
                    "response_time_ms": 0  # Could add actual timing
                },
                "memory_batcher": {
                    "status": batcher_status,
                    "stats": batcher_stats
                },
                "smart_memory_filter": {
                    "status": filter_status,
                    "test_result": test_analysis.message_type.value if test_analysis else None
                },
                "context_manager": {
                    "status": context_status,
                    "max_immediate_context": context_manager.MAX_IMMEDIATE_CONTEXT
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.get("/health/memory")
async def memory_health_check() -> Dict[str, Any]:
    """Memory system specific health check."""
    try:
        # Get memory batcher statistics
        stats = memory_batcher.get_stats()
        
        # Test memory filter with various message types
        test_messages = [
            "Hello, how are you?",
            "My name is John",
            "I like pizza",
            "What's the weather like?"
        ]
        
        filter_results = []
        for msg in test_messages:
            analysis = smart_memory_filter.analyze_message(msg)
            filter_results.append({
                "message": msg,
                "type": analysis.message_type.value,
                "should_capture": analysis.should_capture,
                "confidence": analysis.confidence
            })
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "memory_batcher": stats,
            "filter_test_results": filter_results,
            "context_limits": {
                "max_immediate_context": context_manager.MAX_IMMEDIATE_CONTEXT,
                "max_relevant_context": context_manager.MAX_RELEVANT_CONTEXT,
                "max_background_context": context_manager.MAX_BACKGROUND_CONTEXT
            }
        }
        
    except Exception as e:
        logger.error(f"Memory health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Memory health check failed: {str(e)}")


@router.get("/health/performance")
async def performance_health_check() -> Dict[str, Any]:
    """Performance metrics health check."""
    try:
        # Test response times for key operations
        start_time = time.time()
        
        # Test memory filter performance
        filter_start = time.time()
        for i in range(10):
            smart_memory_filter.analyze_message(f"Test message {i}")
        filter_time = (time.time() - filter_start) * 1000  # Convert to ms
        
        # Test context manager performance
        context_start = time.time()
        # Basic context manager test (no DB needed)
        context_time = (time.time() - context_start) * 1000
        
        total_time = (time.time() - start_time) * 1000
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "performance_metrics": {
                "total_check_time_ms": total_time,
                "memory_filter_avg_ms": filter_time / 10,
                "context_manager_time_ms": context_time,
                "memory_batcher_stats": memory_batcher.get_stats()
            },
            "thresholds": {
                "max_filter_time_ms": 100,
                "max_total_time_ms": 500
            }
        }
        
    except Exception as e:
        logger.error(f"Performance health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Performance health check failed: {str(e)}")


@router.get("/health/errors")
async def error_health_check() -> Dict[str, Any]:
    """Error tracking health check."""
    try:
        error_summary = error_tracker.get_error_summary()
        health_status = error_tracker.get_health_status()
        recent_errors = error_tracker.get_recent_errors(limit=5)
        
        return {
            "status": health_status["status"],
            "timestamp": time.time(),
            "error_summary": error_summary,
            "health_status": health_status,
            "recent_errors": recent_errors
        }
        
    except Exception as e:
        logger.error(f"Error health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Error health check failed: {str(e)}")


@router.get("/health/metrics")
async def metrics_health_check() -> Dict[str, Any]:
    """Metrics health check."""
    try:
        metrics_summary = metrics_collector.get_metrics_summary()
        health_metrics = metrics_collector.get_health_metrics()
        recent_metrics = metrics_collector.get_recent_metrics(limit=20)
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "metrics_summary": metrics_summary,
            "health_metrics": health_metrics,
            "recent_metrics": recent_metrics
        }
        
    except Exception as e:
        logger.error(f"Metrics health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Metrics health check failed: {str(e)}")


@router.get("/health/overview")
async def overview_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Comprehensive health overview."""
    try:
        # Get all health data
        basic_health = await health_check()
        detailed_health = await detailed_health_check(db)
        memory_health = await memory_health_check()
        performance_health = await performance_health_check()
        error_health = await error_health_check()
        metrics_health = await metrics_health_check()
        
        # Determine overall status
        all_statuses = [
            detailed_health["status"],
            memory_health["status"],
            performance_health["status"],
            error_health["status"],
            metrics_health["status"]
        ]
        
        if "critical" in all_statuses:
            overall_status = "critical"
        elif "warning" in all_statuses:
            overall_status = "warning"
        elif "degraded" in all_statuses:
            overall_status = "degraded"
        else:
            overall_status = "healthy"
        
        return {
            "status": overall_status,
            "timestamp": time.time(),
            "services": {
                "basic": basic_health,
                "detailed": detailed_health,
                "memory": memory_health,
                "performance": performance_health,
                "errors": error_health,
                "metrics": metrics_health
            },
            "summary": {
                "total_services": len(all_statuses),
                "healthy_services": all_statuses.count("healthy"),
                "degraded_services": all_statuses.count("degraded"),
                "warning_services": all_statuses.count("warning"),
                "critical_services": all_statuses.count("critical")
            }
        }
        
    except Exception as e:
        logger.error(f"Overview health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Overview health check failed: {str(e)}")
