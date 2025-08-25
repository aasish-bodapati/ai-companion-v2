from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.reminders import Reminder, ReminderCreate, ReminderUpdate
from app.crud.reminders import reminders as crud_reminders

router = APIRouter(prefix="/reminders")


@router.get("/", response_model=List[Reminder])
def list_reminders(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    limit: int = 100,
):
    return crud_reminders.get_user_reminders(db, user_id=current_user.id, limit=limit)


@router.post("/", response_model=Reminder, status_code=status.HTTP_201_CREATED)
def create_reminder(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    body: ReminderCreate,
):
    return crud_reminders.create_for_user(db, user_id=current_user.id, obj_in=body)


@router.patch("/{reminder_id}", response_model=Reminder)
def update_reminder(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    reminder_id: str,
    body: ReminderUpdate,
):
    updated = crud_reminders.update_for_user(db, user_id=current_user.id, reminder_id=reminder_id, obj_in=body)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    return updated


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    reminder_id: str,
):
    ok = crud_reminders.delete_for_user(db, user_id=current_user.id, reminder_id=reminder_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    return None
