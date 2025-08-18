from fastapi import APIRouter

from app.api.endpoints import conversations, login, users, utils
from app.api.endpoints import onboarding, public
from app.api.endpoints import memory
from app.api.endpoints import uploads
from app.api.endpoints import nudges
from app.api.endpoints import vision
from app.api.endpoints import weekly
from app.api.endpoints import calendar as calendar_endpoints
from app.api.endpoints import coaching
from app.api.endpoints import actions

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(onboarding.router, prefix="/users", tags=["onboarding"])
api_router.include_router(public.router, tags=["public"])
api_router.include_router(memory.router, tags=["memory"])
api_router.include_router(nudges.router, tags=["nudges"])
api_router.include_router(uploads.router, tags=["uploads"])
api_router.include_router(vision.router, tags=["vision"])
api_router.include_router(weekly.router, tags=["weekly"])
api_router.include_router(calendar_endpoints.router, tags=["calendar"])
api_router.include_router(coaching.router)
api_router.include_router(actions.router)


