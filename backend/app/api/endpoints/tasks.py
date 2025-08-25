from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.tasks import Task, TaskCreate, TaskUpdate
from app.crud.tasks import tasks as crud_tasks

router = APIRouter(prefix="/tasks")


@router.get("/", response_model=List[Task])
def list_tasks(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    limit: int = 100,
):
    return crud_tasks.get_user_tasks(db, user_id=current_user.id, limit=limit)


@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    body: TaskCreate,
):
    return crud_tasks.create_for_user(db, user_id=current_user.id, obj_in=body)


@router.patch("/{task_id}", response_model=Task)
def update_task(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    task_id: str,
    body: TaskUpdate,
):
    updated = crud_tasks.update_for_user(db, user_id=current_user.id, task_id=task_id, obj_in=body)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return updated


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    task_id: str,
):
    ok = crud_tasks.delete_for_user(db, user_id=current_user.id, task_id=task_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return None
