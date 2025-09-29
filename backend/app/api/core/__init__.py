"""
Core API module - Authentication, users, and basic system endpoints
"""

from fastapi import APIRouter
from . import auth, onboarding, users, profile

router = APIRouter()

# Authentication endpoints
router.include_router(auth.router, tags=["authentication"])

# User management
router.include_router(users.router, tags=["users"])

# Profile management
router.include_router(profile.router, tags=["profile"])

# Onboarding
router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
