"""
Health insights API endpoints.
Provides comprehensive health analytics and insights.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.common.health_logging_factory import HealthLoggingFactory
from app.schemas.common.health_enums import LogType, TimePeriod

router = APIRouter(prefix="/health-insights", tags=["health-insights"])


@router.get("/dashboard")
async def get_health_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive health dashboard data."""
    try:
        dashboard_data = {}
        
        # Get data for each health log type
        for log_type in [LogType.FITNESS, LogType.NUTRITION, LogType.WATER, LogType.MOOD]:
            service = HealthLoggingFactory.get_service(log_type)
            dashboard_data[log_type.value] = await service.get_user_dashboard_data(
                db, current_user.id
            )
        
        return {
            "success": True,
            "data": dashboard_data,
            "user_id": current_user.id,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")


@router.get("/insights/{log_type}")
async def get_health_insights(
    log_type: LogType,
    period: TimePeriod = Query(TimePeriod.WEEK, description="Time period for analysis"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get insights for a specific health log type."""
    try:
        service = HealthLoggingFactory.get_service(log_type)
        insights = await service.get_user_insights(
            db, current_user.id, period
        )
        
        return {
            "success": True,
            "data": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")


@router.get("/analytics/{log_type}")
async def get_health_analytics(
    log_type: LogType,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed analytics for a specific health log type."""
    try:
        service = HealthLoggingFactory.get_service(log_type)
        
        # Parse dates if provided
        start_dt = None
        end_dt = None
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        
        analytics = await service.get_user_analytics(
            db, current_user.id, start_dt, end_dt
        )
        
        return {
            "success": True,
            "data": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")


@router.get("/search/{log_type}")
async def search_health_logs(
    log_type: LogType,
    search_term: str = Query(..., description="Search term"),
    search_fields: List[str] = Query(["notes", "activity_name"], description="Fields to search in"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search health logs by text."""
    try:
        service = HealthLoggingFactory.get_service(log_type)
        results = await service.search_user_logs(
            db, current_user.id, search_term, search_fields, limit
        )
        
        return {
            "success": True,
            "data": {
                "results": results,
                "total": len(results),
                "search_term": search_term,
                "log_type": log_type.value
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search logs: {str(e)}")


@router.get("/goals-progress/{log_type}")
async def get_goals_progress(
    log_type: LogType,
    goal_type: Optional[str] = Query(None, description="Type of goal to filter by"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get progress towards health goals."""
    try:
        service = HealthLoggingFactory.get_service(log_type)
        progress = await service.get_user_goals_progress(
            db, current_user.id, goal_type
        )
        
        return {
            "success": True,
            "data": progress
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get goals progress: {str(e)}")


@router.get("/services/info")
async def get_services_info():
    """Get information about available health logging services."""
    try:
        info = HealthLoggingFactory.get_service_info()
        return {
            "success": True,
            "data": info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get services info: {str(e)}")


@router.get("/overview")
async def get_health_overview(
    period: TimePeriod = Query(TimePeriod.WEEK, description="Time period for overview"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a comprehensive health overview across all log types."""
    try:
        overview = {
            "period": period.value,
            "user_id": current_user.id,
            "log_types": {},
            "summary": {
                "total_activities": 0,
                "active_streaks": 0,
                "longest_streak": 0,
                "most_active_type": None
            }
        }
        
        total_activities = 0
        active_streaks = 0
        longest_streak = 0
        most_active_type = None
        max_activities = 0
        
        # Get data for each log type
        for log_type in [LogType.FITNESS, LogType.NUTRITION, LogType.WATER, LogType.MOOD]:
            service = HealthLoggingFactory.get_service(log_type)
            insights = await service.get_user_insights(db, current_user.id, period)
            
            overview["log_types"][log_type.value] = insights
            
            # Update summary statistics
            activity_count = insights.get("stats", {}).get("total_count", 0)
            total_activities += activity_count
            
            current_streak = insights.get("streaks", {}).get("current", 0)
            if current_streak > 0:
                active_streaks += 1
            
            longest_type_streak = insights.get("streaks", {}).get("longest", 0)
            if longest_type_streak > longest_streak:
                longest_streak = longest_type_streak
            
            if activity_count > max_activities:
                max_activities = activity_count
                most_active_type = log_type.value
        
        overview["summary"].update({
            "total_activities": total_activities,
            "active_streaks": active_streaks,
            "longest_streak": longest_streak,
            "most_active_type": most_active_type
        })
        
        return {
            "success": True,
            "data": overview
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get health overview: {str(e)}")
