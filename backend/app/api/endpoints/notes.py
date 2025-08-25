from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.notes import Note, NoteCreate, NoteUpdate
from app.crud.notes import notes as crud_notes

router = APIRouter(prefix="/notes")


@router.get("/", response_model=List[Note])
def list_notes(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    limit: int = 100,
):
    return crud_notes.get_user_notes(db, user_id=current_user.id, limit=limit)


@router.post("/", response_model=Note, status_code=status.HTTP_201_CREATED)
def create_note(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    body: NoteCreate,
):
    return crud_notes.create_for_user(db, user_id=current_user.id, obj_in=body)


@router.patch("/{note_id}", response_model=Note)
def update_note(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    note_id: str,
    body: NoteUpdate,
):
    updated = crud_notes.update_for_user(db, user_id=current_user.id, note_id=note_id, obj_in=body)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return updated


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    note_id: str,
):
    ok = crud_notes.delete_for_user(db, user_id=current_user.id, note_id=note_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return None
