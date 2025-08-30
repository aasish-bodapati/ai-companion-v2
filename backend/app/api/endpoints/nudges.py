from typing import List, Optional, Literal
from typing_extensions import TypedDict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User

router = APIRouter()


class NudgeItem(TypedDict):
    id: str
    nudge_type: Literal["morning", "evening", "weekly", "opportunity", "checkin"]
    title: str
    message: str
    scheduled_for: Optional[str]
    seen: bool


@router.get("/users/me/nudges", response_model=List[NudgeItem])
def list_my_nudges(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Placeholder: synthesizes a few nudges. Replace with DB-backed nudges.
    items: List[NudgeItem] = []
    items.append(
        {
            "id": "weekly-1",
            "nudge_type": "weekly",
            "title": "Weekly recap is ready",
            "message": "Want to create a recap of your week?",
            "scheduled_for": None,
            "seen": False,
        }
    )
    return items


@router.post("/nudges/run")
def run_nudges(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Placeholder: a no-op endpoint to trigger scheduled logic in dev.
    # Future: materialize nudges for the current user based on memory/state.
    return {"status": "ok"}
