"""
Actions API Endpoints

Provides endpoints for logging and managing user actions:
- Log actions (workout, meal, mood, sleep, hydration, journal)
- Get action history
- Update and delete actions
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import json

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.coaching import WorkoutLog, MealLog, HydrationLog, MoodLog, JournalEntry
from app.schemas.actions import (
    ActionLogRequest,
    ActionLogResponse,
    ActionHistoryResponse,
    ActionUpdateRequest,
    ActionResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/log", response_model=ActionLogResponse)
async def log_action(
    action: ActionLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log a new action for the current user.
    
    Supports logging of:
    - Workouts
    - Meals
    - Mood
    - Sleep
    - Hydration
    - Journal entries
    """
    try:
        user_id = str(current_user.id)
        timestamp = action.timestamp or datetime.now()
        
        # Create the appropriate log entry based on action type
        if action.type == "workout":
            # Parse workout details
            workout_data = json.loads(action.details) if isinstance(action.details, str) else action.details
            
            workout_log = WorkoutLog(
                user_id=user_id,
                when=timestamp,
                type=workout_data.get("type", "general"),
                duration_min=workout_data.get("duration", 0),
                intensity=workout_data.get("intensity", "moderate"),
                notes=action.notes or workout_data.get("notes", "")
            )
            db.add(workout_log)
            
        elif action.type == "meal":
            meal_log = MealLog(
                user_id=user_id,
                when=timestamp,
                items=json.dumps([action.details]) if isinstance(action.details, str) else json.dumps(action.details),
                notes=action.notes or ""
            )
            db.add(meal_log)
            
        elif action.type == "mood":
            # Parse mood details
            mood_data = json.loads(action.details) if isinstance(action.details, str) else action.details
            
            mood_log = MoodLog(
                user_id=user_id,
                when=timestamp,
                val=mood_data.get("value", 3),
                scale=mood_data.get("scale", 5),
                tags=json.dumps(mood_data.get("tags", [])),
                notes=action.notes or mood_data.get("notes", "")
            )
            db.add(mood_log)
            
        elif action.type == "sleep":
            # Parse sleep details
            # sleep_data = json.loads(action.details) if isinstance(action.details, str) else action.details
            
            # For now, we'll store sleep data in a generic format
            # You might want to create a dedicated SleepLog model
            sleep_log = JournalEntry(
                user_id=user_id,
                when=timestamp,
                title=f"Sleep Log - {timestamp.strftime('%Y-%m-%d')}",
                content=f"Sleep details: {action.details}\n{action.notes or ''}",
                tags=json.dumps(["sleep", "health"])
            )
            db.add(sleep_log)
            
        elif action.type == "hydration":
            # Parse hydration details
            hydration_data = json.loads(action.details) if isinstance(action.details, str) else action.details
            
            hydration_log = HydrationLog(
                user_id=user_id,
                when=timestamp,
                amount_ml=hydration_data.get("amount", 250),
                notes=action.notes or hydration_data.get("notes", "")
            )
            db.add(hydration_log)
            
        elif action.type == "journal":
            journal_log = JournalEntry(
                user_id=user_id,
                when=timestamp,
                title=f"Journal Entry - {timestamp.strftime('%Y-%m-%d %H:%M')}",
                content=action.details,
                tags=json.dumps(["journal", "reflection"])
            )
            db.add(journal_log)
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported action type: {action.type}"
            )
        
        # Commit to database
        db.commit()
        
        # Get the created log entry ID
        log_id = None
        if action.type == "workout":
            log_id = workout_log.id
        elif action.type == "meal":
            log_id = meal_log.id
        elif action.type == "mood":
            log_id = mood_log.id
        elif action.type == "sleep":
            log_id = sleep_log.id
        elif action.type == "hydration":
            log_id = hydration_log.id
        elif action.type == "journal":
            log_id = journal_log.id
        
        return ActionLogResponse(
            success=True,
            message=f"{action.type} logged successfully",
            action_id=str(log_id) if log_id else None,
            timestamp=timestamp.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error logging action: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log action: {str(e)}"
        )


@router.get("/recent", response_model=List[ActionResponse])
async def get_recent_actions(
    limit: int = Query(10, ge=1, le=100, description="Number of recent actions to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent actions for the current user.
    """
    try:
        user_id = str(current_user.id)
        cutoff_time = datetime.now() - timedelta(days=7)
        
        actions = []
        
        # Get recent workouts
        workouts = db.query(WorkoutLog).filter(
            WorkoutLog.user_id == user_id,
            WorkoutLog.when >= cutoff_time
        ).order_by(WorkoutLog.when.desc()).limit(limit).all()
        
        for workout in workouts:
            actions.append(ActionResponse(
                id=str(workout.id),
                type="workout",
                details=workout.type,
                notes=workout.notes,
                timestamp=workout.when.isoformat()
            ))
        
        # Get recent meals
        meals = db.query(MealLog).filter(
            MealLog.user_id == user_id,
            MealLog.when >= cutoff_time
        ).order_by(MealLog.when.desc()).limit(limit).all()
        
        for meal in meals:
            actions.append(ActionResponse(
                id=str(meal.id),
                type="meal",
                details=meal.items,
                notes=meal.notes,
                timestamp=meal.when.isoformat()
            ))
        
        # Get recent moods
        moods = db.query(MoodLog).filter(
            MoodLog.user_id == user_id,
            MoodLog.when >= cutoff_time
        ).order_by(MoodLog.when.desc()).limit(limit).all()
        
        for mood in moods:
            actions.append(ActionResponse(
                id=str(mood.id),
                type="mood",
                details=f"{mood.val}/{mood.scale}",
                notes=mood.notes,
                timestamp=mood.when.isoformat()
            ))
        
        # Sort by timestamp and limit
        actions.sort(key=lambda x: x.timestamp, reverse=True)
        return actions[:limit]
        
    except Exception as e:
        logger.error(f"Error getting recent actions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recent actions: {str(e)}"
        )


@router.get("/history", response_model=ActionHistoryResponse)
async def get_action_history(
    type: Optional[str] = Query(None, description="Filter by action type"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of actions to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get action history for the current user with optional filtering.
    """
    try:
        user_id = str(current_user.id)
        
        # Parse dates
        start_dt = None
        end_dt = None
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")
        
        actions = []
        
        # Build queries based on type filter
        if not type or type == "workout":
            query = db.query(WorkoutLog).filter(WorkoutLog.user_id == user_id)
            if start_dt:
                query = query.filter(WorkoutLog.when >= start_dt)
            if end_dt:
                query = query.filter(WorkoutLog.when <= end_dt)
            
            workouts = query.order_by(WorkoutLog.when.desc()).limit(limit).all()
            for workout in workouts:
                actions.append(ActionResponse(
                    id=str(workout.id),
                    type="workout",
                    details=workout.type,
                    notes=workout.notes,
                    timestamp=workout.when.isoformat()
                ))
        
        if not type or type == "meal":
            query = db.query(MealLog).filter(MealLog.user_id == user_id)
            if start_dt:
                query = query.filter(MealLog.when >= start_dt)
            if end_dt:
                query = query.filter(MealLog.when <= end_dt)
            
            meals = query.order_by(MealLog.when.desc()).limit(limit).all()
            for meal in meals:
                actions.append(ActionResponse(
                    id=str(meal.id),
                    type="meal",
                    details=meal.items,
                    notes=meal.notes,
                    timestamp=meal.when.isoformat()
                ))
        
        # Sort by timestamp and limit
        actions.sort(key=lambda x: x.timestamp, reverse=True)
        
        return ActionHistoryResponse(
            actions=actions[:limit],
            total_count=len(actions),
            filtered_by_type=type,
            date_range={
                "start": start_date,
                "end": end_date
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting action history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get action history: {str(e)}"
        )


@router.delete("/{action_id}")
async def delete_action(
    action_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an action by ID.
    """
    try:
        user_id = str(current_user.id)
        
        # Try to find and delete the action from different tables
        # This is a simplified approach - in production you might want a unified actions table
        
        # Check workouts
        workout = db.query(WorkoutLog).filter(
            WorkoutLog.id == action_id,
            WorkoutLog.user_id == user_id
        ).first()
        
        if workout:
            db.delete(workout)
            db.commit()
            return {"success": True, "message": "Workout deleted successfully"}
        
        # Check meals
        meal = db.query(MealLog).filter(
            MealLog.id == action_id,
            MealLog.user_id == user_id
        ).first()
        
        if meal:
            db.delete(meal)
            db.commit()
            return {"success": True, "message": "Meal deleted successfully"}
        
        # Check moods
        mood = db.query(MoodLog).filter(
            MoodLog.id == action_id,
            MoodLog.user_id == user_id
        ).first()
        
        if mood:
            db.delete(mood)
            db.commit()
            return {"success": True, "message": "Mood deleted successfully"}
        
        # Check journal entries
        journal = db.query(JournalEntry).filter(
            JournalEntry.id == action_id,
            JournalEntry.user_id == user_id
        ).first()
        
        if journal:
            db.delete(journal)
            db.commit()
            return {"success": True, "message": "Journal entry deleted successfully"}
        
        raise HTTPException(status_code=404, detail="Action not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting action: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete action: {str(e)}"
        )


@router.patch("/{action_id}", response_model=ActionLogResponse)
async def update_action(
    action_id: str,
    updates: ActionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing action.
    """
    try:
        user_id = str(current_user.id)
        
        # Try to find and update the action from different tables
        # This is a simplified approach - in production you might want a unified actions table
        
        # Check workouts
        workout = db.query(WorkoutLog).filter(
            WorkoutLog.id == action_id,
            WorkoutLog.user_id == user_id
        ).first()
        
        if workout:
            if updates.details:
                workout.type = updates.details
            if updates.notes is not None:
                workout.notes = updates.notes
            
            db.commit()
            return ActionLogResponse(
                success=True,
                message="Workout updated successfully",
                action_id=str(workout.id),
                timestamp=workout.when.isoformat()
            )
        
        # Check meals
        meal = db.query(MealLog).filter(
            MealLog.id == action_id,
            MealLog.user_id == user_id
        ).first()
        
        if meal:
            if updates.details:
                meal.items = updates.details
            if updates.notes is not None:
                meal.notes = updates.notes
            
            db.commit()
            return ActionLogResponse(
                success=True,
                message="Meal updated successfully",
                action_id=str(meal.id),
                timestamp=meal.when.isoformat()
            )
        
        # Check moods
        mood = db.query(MoodLog).filter(
            MoodLog.id == action_id,
            MoodLog.user_id == user_id
        ).first()
        
        if mood:
            if updates.notes is not None:
                mood.notes = updates.notes
            
            db.commit()
            return ActionLogResponse(
                success=True,
                message="Mood updated successfully",
                action_id=str(mood.id),
                timestamp=mood.when.isoformat()
            )
        
        # Check journal entries
        journal = db.query(JournalEntry).filter(
            JournalEntry.id == action_id,
            JournalEntry.user_id == user_id
        ).first()
        
        if journal:
            if updates.details:
                journal.content = updates.details
            if updates.notes is not None:
                journal.title = f"Journal Entry - {updates.notes}"
            
            db.commit()
            return ActionLogResponse(
                success=True,
                message="Journal entry updated successfully",
                action_id=str(journal.id),
                timestamp=journal.when.isoformat()
            )
        
        raise HTTPException(status_code=404, detail="Action not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating action: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update action: {str(e)}"
        )
