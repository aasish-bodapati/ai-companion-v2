"""
Main conversations router - imports and combines all conversation modules.
This file serves as the entry point for all conversation-related endpoints.
"""

import logging
from fastapi import APIRouter

# Import all conversation modules with routers
from .conversations_crud import router as crud_router
from .conversations_simple import router as messages_router

logger = logging.getLogger(__name__)

# Create main router
router = APIRouter()

# Include all sub-routers
router.include_router(crud_router, tags=["conversations"])
router.include_router(messages_router, tags=["conversations"])

logger.info("🔍 CONVERSATIONS: Main router initialized with all modules")
