from fastapi import APIRouter

from app.api.endpoints import (
    login,
    logout,
    public,
    users,
    conversations_main,
    conversations_messages,
    memory,
    memory_visualization,
    memory_monitoring,
    deduplication,
    notes,
    tasks,
    reminders,
    weekly,
    uploads,
    utils,
    nudges,
    debug,
)
from app.core.config import settings

api_router = APIRouter()
# Public and auth
api_router.include_router(public.router, tags=["public"])  # e.g., health/info
api_router.include_router(login.router, tags=["login"])
api_router.include_router(logout.router, tags=["logout"])

# Core users
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Conversations suite (include CRUD first, then messages to let messages override conflicts)
api_router.include_router(
    conversations_main.router, prefix="/conversations", tags=["conversations"]
)
# Include conversations_messages after conversations_main to override the reply endpoint with auto-memory capture
api_router.include_router(
    conversations_messages.router, prefix="/conversations", tags=["conversations"]
)
if getattr(settings, "STREAMING_ENABLED", False):
    # Import lazily to avoid import errors when streaming module is removed
    from app.api.endpoints import conversations_streaming as _conversations_streaming  # type: ignore

    api_router.include_router(
        _conversations_streaming.router, prefix="/conversations", tags=["conversations"]
    )

# Memory and related (standardized under /memory) and legacy alias /memories for tests
api_router.include_router(memory.router, prefix="/memory", tags=["memory"])
api_router.include_router(memory.router, prefix="/memories", tags=["memory"])
api_router.include_router(
    memory_visualization.router, prefix="/memory-visualization", tags=["memory"]
)
api_router.include_router(deduplication.router, prefix="/deduplication", tags=["deduplication"])

# Holistic Memory System and Action System removed for MVP focus

# Additional feature areas
api_router.include_router(notes.router, tags=["notes"])
api_router.include_router(tasks.router, tags=["tasks"])
api_router.include_router(reminders.router, tags=["reminders"])
api_router.include_router(weekly.router, tags=["weekly"])
api_router.include_router(uploads.router, tags=["uploads"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(nudges.router, tags=["nudges"])
api_router.include_router(debug.router, tags=["debug"])

# Memory monitoring and evaluation
api_router.include_router(memory_monitoring.router, prefix="/memory-monitoring", tags=["memory-monitoring"])
