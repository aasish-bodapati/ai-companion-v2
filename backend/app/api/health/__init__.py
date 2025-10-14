from fastapi import APIRouter

from . import (
    logging,           # Consolidated health logging (fitness, nutrition, mood, water)
    routines,          # Consolidated routines (workout, nutrition, active)
    data,              # Consolidated data (exercises, foods, body type goals)
    dashboard,         # Dashboard endpoints
    onboarding,        # Onboarding endpoints
    simple_goals,      # Simple goals endpoints
    profile            # Health profile endpoints
)

router = APIRouter()

# Consolidated API endpoints - reduced from 20+ modules to 7 focused modules
router.include_router(logging.router, prefix="/logging", tags=["health-logging"])
router.include_router(routines.router, prefix="/routines", tags=["routines"])
router.include_router(data.router, prefix="/data", tags=["data"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
router.include_router(simple_goals.router, prefix="/goals", tags=["goals"])
router.include_router(profile.router, prefix="/profile", tags=["profile"])
