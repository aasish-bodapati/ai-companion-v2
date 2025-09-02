"""
Main conversations router - imports and combines all conversation modules.
This file serves as the entry point for all conversation-related endpoints.
"""

import logging
from fastapi import APIRouter

# Import all conversation modules with routers
from .conversation import router as crud_router
# Note: conversations_simple router removed - conversations_messages.py will handle reply endpoint

logger = logging.getLogger(__name__)

# Create main router
router = APIRouter()

# Include all sub-routers
router.include_router(crud_router, tags=["conversations"])
# Note: conversations_simple router not included - will be overridden by conversations_messages.py

logger.info("🔍 CONVERSATIONS: Main router initialized with all modules")
