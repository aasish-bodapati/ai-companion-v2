"""
Main conversations router - imports and combines all conversation modules.
This file serves as the entry point for all conversation-related endpoints.
"""

import logging
from fastapi import APIRouter

# Import conversation modules with routers
# Note: conversation.py was removed - conversations_messages.py handles all conversation functionality

logger = logging.getLogger(__name__)

# Create main router
router = APIRouter()

# Note: All conversation functionality is now handled by conversations_messages.py
# This router is kept for compatibility but doesn't include any sub-routers

logger.info("🔍 CONVERSATIONS: Main router initialized (simplified for Milestone 1)")
