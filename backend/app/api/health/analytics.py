"""
Analytics API endpoints for health data insights.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.analytics import HealthAnalyticsService
from app.services.cache import HealthDataCache, cached

router = APIRouter()


@router.get("/trends")
async def get_weekly_trends(
    weeks: int = Query(4, ge=1, le=12, description="Number of weeks to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get weekly trends for fitness and nutrition data."""
    try:
        analytics_service = HealthAnalyticsService(db)
        trends = await analytics_service.get_weekly_trends(current_user.id, weeks)
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate trends: {str(e)}")


@router.get("/correlations")
async def get_correlation_insights(
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get correlations between mood, nutrition, and fitness data."""
    try:
        analytics_service = HealthAnalyticsService(db)
        correlations = await analytics_service.get_correlation_insights(current_user.id, days)
        return correlations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze correlations: {str(e)}")


@router.get("/recommendations")
async def get_personalized_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get personalized recommendations based on user data."""
    try:
        analytics_service = HealthAnalyticsService(db)
        recommendations = await analytics_service.get_personalized_recommendations(current_user.id)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


@router.get("/dashboard")
@cached(expire_seconds=300, key_prefix="dashboard")
async def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive dashboard data with caching."""
    try:
        analytics_service = HealthAnalyticsService(db)
        
        # Get various analytics data
        trends = await analytics_service.get_weekly_trends(current_user.id, 4)
        correlations = await analytics_service.get_correlation_insights(current_user.id, 30)
        recommendations = await analytics_service.get_personalized_recommendations(current_user.id)
        
        # Calculate summary stats
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=7)
        
        # Get recent activity counts
        from app.models.health.fitness_log import FitnessLog, NutritionLog
        
        recent_workouts = db.query(FitnessLog).filter(
            FitnessLog.user_id == current_user.id,
            FitnessLog.activity_date >= start_date,
            FitnessLog.activity_date <= end_date
        ).count()
        
        recent_meals = db.query(NutritionLog).filter(
            NutritionLog.user_id == current_user.id,
            NutritionLog.meal_date >= start_date,
            NutritionLog.meal_date <= end_date
        ).count()
        
        return {
            "summary": {
                "recent_workouts": recent_workouts,
                "recent_meals": recent_meals,
                "period": "Last 7 days"
            },
            "trends": trends,
            "correlations": correlations,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard data: {str(e)}")


@router.get("/data-quality")
async def get_data_quality_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get data quality score and suggestions for improvement."""
    try:
        from app.services.data_validation import DataValidationService
        from app.models.health.fitness_log import FitnessLog
        
        validation_service = DataValidationService()
        
        # Get recent fitness logs for quality analysis
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        fitness_logs = db.query(FitnessLog).filter(
            FitnessLog.user_id == current_user.id,
            FitnessLog.activity_date >= start_date,
            FitnessLog.activity_date <= end_date
        ).all()
        
        quality_score = validation_service.get_data_quality_score(current_user.id, fitness_logs)
        
        return quality_score
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze data quality: {str(e)}")
