"""
Logout endpoint with cookie clearing
"""

from fastapi import APIRouter, Response, Depends
from app.api import deps
from app.models.user import User
# Auth cookies removed for Milestone 1 simplicity

router = APIRouter()


@router.post("/logout")
def logout(response: Response, current_user: User = Depends(deps.get_current_active_user)):
    """
    Logout user (simplified for Milestone 1)
    """
    return {"message": "Successfully logged out"}
