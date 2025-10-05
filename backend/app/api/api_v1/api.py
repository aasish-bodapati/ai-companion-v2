"""
Main API router - Health-focused application
"""

from fastapi import APIRouter

# Import organized API modules
from app.api.core import router as core_router
from app.api.health import router as health_router
from app.api.health.active_routine import router as active_routine_router
from app.api.analytics import health_metrics, predictive_insights, trends, pattern_insights, recommendations, goal_probability, anomalies

api_router = APIRouter()

# Core functionality (auth, users, onboarding)
api_router.include_router(core_router)

# Health logging and analytics
api_router.include_router(health_router, prefix="/health")
api_router.include_router(active_routine_router, prefix="/health", tags=["routines"])

# Analytics endpoints
api_router.include_router(health_metrics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(predictive_insights.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(trends.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(pattern_insights.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(recommendations.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(goal_probability.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(anomalies.router, prefix="/analytics", tags=["analytics"])
