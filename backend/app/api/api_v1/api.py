from fastapi import APIRouter

from app.api.endpoints import conversations, login, users, utils
from app.api.endpoints import onboarding, public

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(
    conversations.router, 
    prefix="/conversations", 
    tags=["conversations"]
)
api_router.include_router(onboarding.router, prefix="/users", tags=["onboarding"])
api_router.include_router(public.router, tags=["public"])
