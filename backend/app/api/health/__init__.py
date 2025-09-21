from fastapi import APIRouter

from . import (
    logging,
    simple_routines,
    nutrition_routines,
    onboarding,
    simple_goals,
    dashboard,
    exercises,
    foods,
    contextual_logging,
    insights,
    fitness_logs,
    nutrition_logs,
    profile,
    analytics
)

router = APIRouter()

# Original health endpoints
router.include_router(logging.router, prefix="/logging", tags=["health-logging"])
router.include_router(simple_routines.router, prefix="/simple-routines", tags=["routines"])
router.include_router(nutrition_routines.router, prefix="/nutrition-routines", tags=["nutrition-routines"])
router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
router.include_router(simple_goals.router, prefix="/simple-goals", tags=["simple-goals"])

# New high-ROI endpoints
router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
router.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
router.include_router(foods.router, prefix="/foods", tags=["foods"])
router.include_router(contextual_logging.router, prefix="/contextual-logging", tags=["contextual-logging"])
router.include_router(insights.router, prefix="/insights", tags=["insights"])
router.include_router(fitness_logs.router, prefix="/fitness-logs", tags=["fitness-logs"])
router.include_router(nutrition_logs.router, prefix="/nutrition-logs", tags=["nutrition-logs"])
router.include_router(profile.router, prefix="/profile", tags=["health-profile"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
