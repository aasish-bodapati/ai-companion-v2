"""
Memory System Monitoring API Endpoints

REST API endpoints for accessing memory system metrics and health status.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.schemas.user import User
from app.monitoring.memory_metrics import memory_monitor

router = APIRouter()


@router.get("/health", response_model=Dict[str, Any])
async def get_memory_system_health(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get overall memory system health status."""
    try:
        health = memory_monitor.get_system_health()
        return health
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system health: {str(e)}")


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_performance_dashboard(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get performance dashboard data."""
    try:
        dashboard = memory_monitor.get_performance_dashboard()
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")


@router.get("/metrics", response_model=Dict[str, Any])
async def get_metrics(
    hours: int = Query(default=1, ge=1, le=168, description="Time window in hours"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get aggregated metrics for specified time window."""
    try:
        metrics = memory_monitor.metrics_collector.get_aggregated_metrics(hours=hours)
        return {
            "time_window_hours": hours,
            "metrics": metrics,
            "timestamp": memory_monitor.metrics_collector.metrics.get("timestamp", [])[-1:] if memory_monitor.metrics_collector.metrics else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")


@router.get("/alerts", response_model=Dict[str, Any])
async def get_alerts(
    limit: int = Query(default=50, ge=1, le=100, description="Maximum number of alerts"),
    severity: Optional[str] = Query(default=None, description="Filter by severity"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get recent system alerts."""
    try:
        alerts = memory_monitor.alerts[-limit:]
        
        if severity:
            alerts = [alert for alert in alerts if alert.get("severity") == severity]
        
        return {
            "alerts": alerts,
            "total_count": len(memory_monitor.alerts),
            "filtered_count": len(alerts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")


@router.post("/evaluation/run")
async def run_evaluation(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Run comprehensive memory system evaluation."""
    try:
        from tests.memory_evaluation_framework import run_memory_evaluation
        
        target_user_id = user_id or current_user.id
        results = run_memory_evaluation(db, target_user_id)
        
        return {
            "status": "completed",
            "evaluation_results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run evaluation: {str(e)}")


@router.get("/evaluation/report/{user_id}")
async def get_evaluation_report(
    user_id: str,
    format: str = Query(default="json", pattern="^(json|markdown)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get evaluation report for a user."""
    try:
        from tests.memory_evaluation_framework import run_memory_evaluation, generate_evaluation_report
        
        # Run fresh evaluation
        results = run_memory_evaluation(db, user_id)
        
        if format == "markdown":
            report = generate_evaluation_report(results)
            return {
                "format": "markdown",
                "report": report,
                "user_id": user_id
            }
        else:
            return {
                "format": "json",
                "results": results,
                "user_id": user_id
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
