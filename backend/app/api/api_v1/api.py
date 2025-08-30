from fastapi import APIRouter

from app.api.endpoints import (
    login,
    logout,
    public,
    users,
    onboarding,
    conversations_main,
    memory,
    memory_visualization,
    memory_monitoring,
    deduplication,
    calendar,
    notes,
    tasks,
    reminders,
    weekly,
    coaching,
    actions,
    uploads,
    vision,
    utils,
    web_search,
    nudges,
    debug,
)
from app.core.config import settings

api_router = APIRouter()
# Public and auth
api_router.include_router(public.router, tags=["public"])  # e.g., health/info
api_router.include_router(login.router, tags=["login"])
api_router.include_router(logout.router, tags=["logout"])

# Core users and onboarding
api_router.include_router(users.router, prefix="/users", tags=["users"])
# Mount onboarding underneath /users/me/onboarding so endpoints become:
# GET/PUT /api/v1/users/me/onboarding, POST /api/v1/users/me/onboarding/complete, etc.
api_router.include_router(onboarding.router, prefix="/users/me/onboarding", tags=["onboarding"])

# Conversations suite (include CRUD first, then messages to let messages override conflicts)
api_router.include_router(
    conversations_main.router, prefix="/conversations", tags=["conversations"]
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

# Additional feature areas
api_router.include_router(calendar.router, tags=["calendar"])
api_router.include_router(notes.router, tags=["notes"])
api_router.include_router(tasks.router, tags=["tasks"])
api_router.include_router(reminders.router, tags=["reminders"])
api_router.include_router(weekly.router, tags=["weekly"])
api_router.include_router(coaching.router, tags=["coaching"])
api_router.include_router(actions.router, tags=["actions"])
api_router.include_router(uploads.router, tags=["uploads"])
api_router.include_router(vision.router, tags=["vision"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(web_search.router, prefix="/web-search", tags=["web-search"])
api_router.include_router(nudges.router, tags=["nudges"])
api_router.include_router(debug.router, tags=["debug"])

# Memory monitoring and evaluation
api_router.include_router(memory_monitoring.router, prefix="/memory-monitoring", tags=["memory-monitoring"])
