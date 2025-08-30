"""
Logout endpoint with cookie clearing
"""

from fastapi import APIRouter, Response, Depends
from app.api import deps
from app.models.user import User
from app.middleware.auth_cookies import clear_auth_cookies

router = APIRouter()


@router.post("/logout")
def logout(response: Response, current_user: User = Depends(deps.get_current_active_user)):
    """
    Logout user by clearing authentication cookies
    """
    clear_auth_cookies(response)
    return {"message": "Successfully logged out"}
