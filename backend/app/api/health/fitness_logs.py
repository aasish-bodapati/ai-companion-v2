from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.health.fitness_log import FitnessLog
from app.schemas.health.fitness_log import FitnessLog as FitnessLogSchema, FitnessLogCreate, FitnessLogUpdate
from app.crud.health.fitness_log import fitness_log

router = APIRouter()

@router.get("/", response_model=dict)
def get_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("week", description="Filter by period: week, month, all"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Page size"),
    routine_id: Optional[str] = Query(None, description="Filter by routine ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get fitness logs with optional filtering and pagination."""
    try:
        # Calculate date range based on period
        end_date_obj = datetime.now()
        if period == "week":
            start_date_obj = end_date_obj - timedelta(days=7)
        elif period == "month":
            start_date_obj = end_date_obj - timedelta(days=30)
        else:  # all
            start_date_obj = None

        # Override with custom dates if provided
        if start_date:
            start_date_obj = datetime.fromisoformat(start_date)
        if end_date:
            end_date_obj = datetime.fromisoformat(end_date)

        # Get logs from database
        logs = fitness_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj,
            skip=(page - 1) * size,
            limit=size
        )

        # Calculate statistics
        all_logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj
        )

        total_workouts = len(all_logs)
        total_duration = sum(log.duration_minutes or 0 for log in all_logs)
        total_calories = sum(log.calories_burned or 0 for log in all_logs)
        
        # Note: difficulty_rating not available in current model
        average_difficulty = 0

        # Calculate current streak
        current_streak = calculate_workout_streak(all_logs)

        # Convert logs to response format
        logs_data = []
        for log in logs:
            # Create exercise details from individual workout fields
            exercises = []
            if log.weight_kg is not None or log.reps is not None or log.sets is not None:
                exercise_detail = {
                    "exercise_name": log.activity_name or log.activity_type,
                    "sets": log.sets,
                    "reps": log.reps,
                    "weight_used": log.weight_kg,
                    "notes": log.notes
                }
                exercises.append(exercise_detail)
            
            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "routine_id": None,  # Not available in current model
                "routine_name": None,  # Not available in current model
                "workout_name": log.activity_name or log.activity_type,
                "exercises": exercises,
                "duration_minutes": log.duration_minutes,
                "calories_burned": log.calories_burned,
                "difficulty_rating": None,  # Not available in current model
                "notes": log.notes,
                "logged_at": log.activity_date.isoformat() if log.activity_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            logs_data.append(log_dict)

        return {
            "logs": logs_data,
            "stats": {
                "totalWorkouts": total_workouts,
                "totalDuration": total_duration,
                "totalCalories": total_calories,
                "averageDifficulty": round(average_difficulty, 1),
                "currentStreak": current_streak
            },
            "pagination": {
                "page": page,
                "size": size,
                "total": total_workouts,
                "totalPages": (total_workouts + size - 1) // size
            }
        }

    except Exception as e:
        print(f"Error getting fitness logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve fitness logs")

@router.get("/{log_id}", response_model=dict)
def get_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: str
):
    """Get a specific fitness log by ID."""
    log = fitness_log.get(db, id=log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fitness log not found")

    # Create exercise details from individual workout fields
    exercises = []
    if log.weight_kg is not None or log.reps is not None or log.sets is not None:
        exercise_detail = {
            "exercise_name": log.activity_name or log.activity_type,
            "sets": log.sets,
            "reps": log.reps,
            "weight_used": log.weight_kg,
            "notes": log.notes
        }
        exercises.append(exercise_detail)

    return {
        "id": str(log.id),
        "user_id": str(log.user_id),
        "routine_id": None,  # Not available in current model
        "routine_name": None,  # Not available in current model
        "workout_name": log.activity_name or log.activity_type,
        "exercises": exercises,
        "duration_minutes": log.duration_minutes,
        "calories_burned": log.calories_burned,
        "difficulty_rating": None,  # Not available in current model
        "notes": log.notes,
        "logged_at": log.activity_date.isoformat() if log.activity_date else None,
        "created_at": log.created_at.isoformat() if log.created_at else None
    }

@router.post("/", response_model=dict)
def create_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_data: FitnessLogCreate
):
    """Create a new fitness log."""
    try:
        # Convert exercises to JSON string if it's a list
        if isinstance(log_data.exercises, list):
            log_data.exercises = json.dumps(log_data.exercises)

        log = fitness_log.create(db, obj_in=log_data, user_id=current_user.id)
        
        return {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "routine_id": str(log.routine_id) if log.routine_id else None,
            "routine_name": log.routine_name,
            "workout_name": log.workout_name,
            "exercises": json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises,
            "duration_minutes": log.duration_minutes,
            "calories_burned": log.calories_burned,
            "difficulty_rating": None,  # Not available in current model
            "notes": log.notes,
            "logged_at": log.logged_at.isoformat() if log.logged_at else None,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
    except Exception as e:
        print(f"Error creating fitness log: {e}")
        raise HTTPException(status_code=500, detail="Failed to create fitness log")

@router.put("/{log_id}", response_model=dict)
def update_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: str,
    log_data: FitnessLogUpdate
):
    """Update an existing fitness log."""
    log = fitness_log.get(db, id=log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fitness log not found")

    try:
        # Convert exercises to JSON string if it's a list
        if hasattr(log_data, 'exercises') and isinstance(log_data.exercises, list):
            log_data.exercises = json.dumps(log_data.exercises)

        updated_log = fitness_log.update(db, db_obj=log, obj_in=log_data)
        
        return {
            "id": str(updated_log.id),
            "user_id": str(updated_log.user_id),
            "routine_id": str(updated_log.routine_id) if updated_log.routine_id else None,
            "routine_name": updated_log.routine_name,
            "workout_name": updated_log.workout_name,
            "exercises": json.loads(updated_log.exercises) if isinstance(updated_log.exercises, str) else updated_log.exercises,
            "duration_minutes": updated_log.duration_minutes,
            "calories_burned": updated_log.calories_burned,
            "difficulty_rating": updated_log.difficulty_rating,
            "notes": updated_log.notes,
            "logged_at": updated_log.logged_at.isoformat() if updated_log.logged_at else None,
            "created_at": updated_log.created_at.isoformat() if updated_log.created_at else None
        }
    except Exception as e:
        print(f"Error updating fitness log: {e}")
        raise HTTPException(status_code=500, detail="Failed to update fitness log")

@router.delete("/{log_id}")
def delete_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: str
):
    """Delete a fitness log."""
    log = fitness_log.get(db, id=log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fitness log not found")

    try:
        fitness_log.remove(db, id=log_id)
        return {"message": "Fitness log deleted successfully"}
    except Exception as e:
        print(f"Error deleting fitness log: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete fitness log")

@router.get("/stats", response_model=dict)
def get_fitness_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("week", description="Filter by period: week, month, all")
):
    """Get fitness statistics."""
    try:
        # Calculate date range based on period
        end_date_obj = datetime.now()
        if period == "week":
            start_date_obj = end_date_obj - timedelta(days=7)
        elif period == "month":
            start_date_obj = end_date_obj - timedelta(days=30)
        else:  # all
            start_date_obj = None

        # Get logs from database
        logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj
        )

        total_workouts = len(logs)
        total_duration = sum(log.duration_minutes or 0 for log in logs)
        total_calories = sum(log.calories_burned or 0 for log in logs)
        
        # Note: difficulty_rating not available in current model
        average_difficulty = 0

        # Calculate current streak
        current_streak = calculate_workout_streak(logs)

        return {
            "totalWorkouts": total_workouts,
            "totalDuration": total_duration,
            "totalCalories": total_calories,
            "averageDifficulty": round(average_difficulty, 1),
            "currentStreak": current_streak
        }

    except Exception as e:
        print(f"Error getting fitness stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve fitness statistics")

@router.get("/recent", response_model=List[dict])
def get_recent_workouts(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent workouts (last 7 days)."""
    try:
        end_date_obj = datetime.now()
        start_date_obj = end_date_obj - timedelta(days=7)

        logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj,
            limit=10
        )

        logs_data = []
        for log in logs:
            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "routine_id": str(log.routine_id) if log.routine_id else None,
                "routine_name": log.routine_name,
                "workout_name": log.workout_name,
                "exercises": json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises,
                "duration_minutes": log.duration_minutes,
                "calories_burned": log.calories_burned,
                "difficulty_rating": None,  # Not available in current model
                "notes": log.notes,
                "logged_at": log.logged_at.isoformat() if log.logged_at else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            logs_data.append(log_dict)

        return logs_data

    except Exception as e:
        print(f"Error getting recent workouts: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recent workouts")

@router.get("/streak", response_model=dict)
def get_workout_streak(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get workout streak information."""
    try:
        # Get all logs for streak calculation
        logs = fitness_log.get_user_logs(db, user_id=current_user.id)
        
        current_streak = calculate_workout_streak(logs)
        longest_streak = calculate_longest_streak(logs)
        
        # Get last workout date
        last_workout_date = None
        if logs:
            last_log = max(logs, key=lambda x: x.logged_at or x.created_at)
            last_workout_date = (last_log.logged_at or last_log.created_at).isoformat()

        return {
            "currentStreak": current_streak,
            "longestStreak": longest_streak,
            "lastWorkoutDate": last_workout_date
        }

    except Exception as e:
        print(f"Error getting workout streak: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve workout streak")

def calculate_workout_streak(logs):
    """Calculate current workout streak in days."""
    if not logs:
        return 0
    
    # Sort logs by date (most recent first)
    sorted_logs = sorted(logs, key=lambda x: x.activity_date or x.created_at, reverse=True)
    
    streak = 0
    current_date = datetime.now().date()
    
    for log in sorted_logs:
        log_date = (log.activity_date or log.created_at).date()
        
        # If this is today or yesterday, continue the streak
        if log_date == current_date or log_date == current_date - timedelta(days=1):
            streak += 1
            current_date = log_date
        else:
            break
    
    return streak

def calculate_longest_streak(logs):
    """Calculate the longest workout streak."""
    if not logs:
        return 0
    
    # Sort logs by date
    sorted_logs = sorted(logs, key=lambda x: x.activity_date or x.created_at)
    
    longest_streak = 0
    current_streak = 0
    last_date = None
    
    for log in sorted_logs:
        log_date = (log.activity_date or log.created_at).date()
        
        if last_date is None:
            current_streak = 1
        elif log_date == last_date + timedelta(days=1):
            current_streak += 1
        else:
            longest_streak = max(longest_streak, current_streak)
            current_streak = 1
        
        last_date = log_date
    
    return max(longest_streak, current_streak)
