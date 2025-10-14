"""
Mood Logging API endpoints - Focused on mood tracking and emotional wellness.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.fitness_log import mood_log
from app.schemas.health.fitness_log import MoodLog, MoodLogCreate, MoodLogUpdate
from app.utils.response_utils import ResponseUtils
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/mood", response_model=MoodLog)
async def create_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    mood_log_in: MoodLogCreate
):
    """Create a new mood log entry."""
    try:
        mood_log_entry = mood_log.create_with_user(
            db, obj_in=mood_log_in, user_id=current_user.id
        )
        return mood_log_entry
    except Exception as e:
        logger.error(f"Error creating mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create mood log")

@router.get("/mood", response_model=List[MoodLog])
async def get_mood_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get mood logs for the current user."""
    try:
        logs = mood_log.get_user_logs(
            db,
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        return logs
    except Exception as e:
        logger.error(f"Error getting mood logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mood logs")

@router.get("/mood/{id}", response_model=MoodLog)
async def get_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Get a specific mood log by ID."""
    try:
        mood_log_entry = mood_log.get(db, id=str(id))
        if not mood_log_entry or mood_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Mood log not found")
        return mood_log_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mood log")

@router.put("/mood/{id}", response_model=MoodLog)
async def update_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int,
    mood_log_in: MoodLogUpdate
):
    """Update a mood log entry."""
    try:
        mood_log_entry = mood_log.get(db, id=str(id))
        if not mood_log_entry or mood_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Mood log not found")

        updated_log = mood_log.update(
            db, db_obj=mood_log_entry, obj_in=mood_log_in
        )
        return updated_log
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update mood log")

@router.delete("/mood/{id}")
async def delete_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Delete a mood log entry."""
    try:
        mood_log_entry = mood_log.get(db, id=str(id))
        if not mood_log_entry or mood_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Mood log not found")

        mood_log.remove(db, id=str(id))
        return {"message": "Mood log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete mood log")
