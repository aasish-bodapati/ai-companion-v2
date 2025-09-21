"""
Main API router - Health-focused application
"""

from fastapi import APIRouter

# Import organized API modules
from app.api.core import router as core_router
from app.api.health import router as health_router

api_router = APIRouter()

# Core functionality (auth, users, onboarding)
api_router.include_router(core_router)

# Health logging and analytics
api_router.include_router(health_router, prefix="/health")
