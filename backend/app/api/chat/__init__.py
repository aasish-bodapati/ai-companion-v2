"""
Chat API module - All chat and conversation endpoints
"""

from fastapi import APIRouter
from . import conversations, messages

router = APIRouter()

# Chat and conversation endpoints
router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
router.include_router(messages.router, prefix="/conversations", tags=["conversations"])
