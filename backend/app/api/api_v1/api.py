from fastapi import APIRouter

from app.api.endpoints import (
    login,
    logout,
    public,
    users,
    conversations_main,
    conversations_messages,
    memory,
    onboarding,
    onboarding_chat,
)
# settings import removed for Milestone 1 simplicity

api_router = APIRouter()
# Public and auth
api_router.include_router(public.router, tags=["public"])  # e.g., health/info
api_router.include_router(login.router, tags=["login"])
api_router.include_router(logout.router, tags=["logout"])

# Core users
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Onboarding
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(onboarding_chat.router, prefix="/onboarding-chat", tags=["onboarding-chat"])

# Conversations suite (include CRUD first, then messages to let messages override conflicts)
api_router.include_router(
    conversations_main.router, prefix="/conversations", tags=["conversations"]
)
# Include conversations_messages after conversations_main to override the reply endpoint with auto-memory capture
api_router.include_router(
    conversations_messages.router, prefix="/conversations", tags=["conversations"]
)
# Streaming removed for Milestone 1 simplicity

# Memory system (simplified for Milestone 1)
api_router.include_router(memory.router, prefix="/memory", tags=["memory"])