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

@router.get("/debug-exercises")
def debug_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to test fitness logs query"""
    try:
        from sqlalchemy import text
        
        # Simple query to get all logs for user
        query = text("SELECT COUNT(*) FROM fitness_logs WHERE user_id = :user_id")
        count = db.execute(query, {"user_id": current_user.id}).scalar()
        
        # Get a sample log
        sample_query = text("SELECT * FROM fitness_logs WHERE user_id = :user_id LIMIT 1")
        sample = db.execute(sample_query, {"user_id": current_user.id}).fetchone()
        
        return {
            "user_id": current_user.id,
            "total_logs": count,
            "sample_log": sample
        }
    except Exception as e:
        return {"error": str(e)}

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
        # Disable date filtering for now to show all logs - updated
        start_date_obj = None
        end_date_obj = None

        # Get logs from our custom fitness_logs table using raw SQL
        # Updated to work with routine-based fitness logs
        from sqlalchemy import text
        
        where_clause = "WHERE user_id = :user_id"
        params = {"user_id": current_user.id}
        
        
        # Temporarily disable date filtering to test
        # if start_date_obj:
        #     where_clause += " AND date(logged_at) >= date(:start_date)"
        #     params["start_date"] = start_date_obj.strftime('%Y-%m-%d')
        # if end_date_obj:
        #     where_clause += " AND date(logged_at) <= date(:end_date)"
        #     params["end_date"] = end_date_obj.strftime('%Y-%m-%d')
        
        # Get logs with pagination - using actual PostgreSQL table structure
        offset = (page - 1) * size
        logs_query = text(f"""
            SELECT id, user_id, activity_type, activity_name, duration_minutes, 
                   calories_burned, notes, activity_date, created_at, exercises, unit
            FROM fitness_logs 
            {where_clause}
            ORDER BY activity_date DESC
            LIMIT :limit OFFSET :offset
        """)
        params.update({"limit": size, "offset": offset})
        logs_result = db.execute(logs_query, params).fetchall()
        
        # Convert to list of dicts for easier handling - PostgreSQL structure
        logs = []
        for row in logs_result:
            # Parse exercises JSON if it exists
            exercises = row[9] if len(row) > 9 and row[9] else []
            
            log_entry = {
                'id': str(row[0]),
                'user_id': str(row[1]),
                'activity_type': row[2],
                'activity_name': row[3],
                'duration_minutes': row[4],
                'calories_burned': row[5],
                'notes': row[6],
                'activity_date': row[7],
                'created_at': row[8],
                'routine_id': None,  # Not available in current structure
                'routine_name': None,  # Not available in current structure
                'workout_name': row[3],  # Use activity_name as workout_name
                'exercises': exercises,  # Now includes actual exercise data
                'unit': row[10] if len(row) > 10 and row[10] else 'kg',  # Include unit field
                'logged_at': row[7]  # Use activity_date as logged_at
            }
            logs.append(log_entry)
        
        # Get all logs for statistics (without pagination)
        all_logs_query = text(f"""
            SELECT duration_minutes, calories_burned
            FROM fitness_logs 
            {where_clause}
        """)
        all_logs_result = db.execute(all_logs_query, params).fetchall()
        
        # Convert to list for stats calculation
        all_logs = []
        for row in all_logs_result:
            all_logs.append({
                'duration_minutes': row[0] or 0,
                'calories_burned': row[1] or 0
            })

        total_workouts = len(all_logs)
        total_duration = sum(log['duration_minutes'] or 0 for log in all_logs)
        total_calories = sum(log['calories_burned'] or 0 for log in all_logs)

        # Note: difficulty_rating not available in current model
        average_difficulty = 0

        # Calculate current streak - simplified for now
        current_streak = 0

        # Convert logs to response format - PostgreSQL structure
        logs_data = []
        for log in logs:
            log_dict = {
                "id": str(log['id']),
                "user_id": str(log['user_id']),
                "routine_id": None,  # Not available in PostgreSQL structure
                "routine_name": None,  # Not available in PostgreSQL structure
                "workout_name": log['activity_name'],  # Use activity_name as workout_name
                "exercises": log['exercises'],  # Include exercises data from PostgreSQL
                "unit": log['unit'],  # Include unit field
                "duration_minutes": int(log['duration_minutes']) if log['duration_minutes'] else 0,
                "calories_burned": int(log['calories_burned']) if log['calories_burned'] else 0,
                "difficulty_rating": 0,  # Not tracked in current structure
                "notes": log['notes'],
                "logged_at": log['activity_date'].isoformat() if log['activity_date'] else None,
                "activity_date": log['activity_date'].isoformat() if log['activity_date'] else None,
                "created_at": log['created_at'].isoformat() if log['created_at'] else None
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
        raise HTTPException(status_code=500, detail="Failed to retrieve fitness logs")

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
            # Parse exercises from JSON string if it exists
            exercises = []
            if log.exercises:
                try:
                    exercises = json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises
                except (json.JSONDecodeError, TypeError):
                    exercises = []
            
            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "routine_id": None,  # Not available in current model
                "routine_name": None,  # Not available in current model
                "workout_name": log.activity_name,  # Use activity_name as workout_name
                "exercises": exercises,
                "duration_minutes": log.duration_minutes,
                "calories_burned": log.calories_burned,
                "difficulty_rating": None,  # Not available in current model
                "notes": log.notes,
                "logged_at": log.activity_date.isoformat() if log.activity_date else None,
                "activity_date": log.activity_date.isoformat() if log.activity_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            logs_data.append(log_dict)

        return logs_data

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve recent workouts")

@router.get("/{id}", response_model=dict)
def get_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Get a specific fitness log by ID."""
    log = fitness_log.get(db, id=id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fitness log not found")

    # Create exercise details - simplified to core tracking only
    exercises = []
    if log.activity_name:
        exercise_detail = {
            "exercise_name": log.activity_name,
            "activity_type": log.activity_type,
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
        "activity_date": log.activity_date.isoformat() if log.activity_date else None,
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
        # Add debugging
        print(f"🔍 DEBUG: Received fitness log data from user {current_user.id}")
        print(f"🔍 DEBUG: Raw log_data: {log_data}")
        print(f"🔍 DEBUG: log_data type: {type(log_data)}")
        print(f"🔍 DEBUG: log_data fields: {log_data.__dict__ if hasattr(log_data, '__dict__') else 'No __dict__'}")
        
        # Convert to dict and handle field mapping
        log_data_dict = log_data.model_dump()
        print(f"🔍 DEBUG: log_data_dict: {log_data_dict}")
        
        # Handle field name mapping from frontend
        if 'workout_name' in log_data_dict and log_data_dict['workout_name']:
            log_data_dict['activity_name'] = log_data_dict['workout_name']
        
        # Set default activity_date if not provided
        if not log_data_dict.get('activity_date'):
            from datetime import datetime
            log_data_dict['activity_date'] = datetime.now()
        
        # Convert exercises to JSON string if it's a list
        if 'exercises' in log_data_dict and isinstance(log_data_dict['exercises'], list):
            log_data_dict['exercises'] = json.dumps(log_data_dict['exercises'])
            print(f"🔍 DEBUG: Converted exercises to JSON: {log_data_dict['exercises']}")

        print(f"🔍 DEBUG: Final processed data: {log_data_dict}")

        # Create a new schema instance with the processed data
        from app.schemas.health.fitness_log import FitnessLogCreate
        processed_log_data = FitnessLogCreate(**log_data_dict)
        
        print(f"🔍 DEBUG: Created FitnessLogCreate instance: {processed_log_data}")
        
        log = fitness_log.create_with_user(db, obj_in=processed_log_data, user_id=current_user.id)
        print(f"🔍 DEBUG: Created fitness log with ID: {log.id}")

        # Parse exercises from JSON string
        exercises = []
        if log.exercises:
            try:
                exercises = json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises
            except (json.JSONDecodeError, TypeError):
                exercises = []

        return {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "routine_id": None,  # Not available in current model
            "routine_name": None,  # Not available in current model
            "workout_name": log.activity_name,  # Map activity_name to workout_name for frontend
            "exercises": exercises,  # Return actual exercises from database
            "duration_minutes": log.duration_minutes,
            "calories_burned": log.calories_burned,
            "difficulty_rating": None,  # Not available in current model
            "notes": log.notes,
            "logged_at": log.activity_date.isoformat() if log.activity_date else None,  # Map activity_date to logged_at
            "activity_date": log.activity_date.isoformat() if log.activity_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "unit": log.unit  # Include unit field
        }
    except Exception as e:
        import traceback
        print(f"❌ DEBUG: Exception in create_fitness_log: {str(e)}")
        print(f"❌ DEBUG: Exception type: {type(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create fitness log: {str(e)}")

@router.put("/{id}", response_model=dict)
def update_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str,
    log_data: FitnessLogUpdate
):
    """Update an existing fitness log."""
    log = fitness_log.get(db, id=id)
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
            "activity_type": updated_log.activity_type,
            "activity_name": updated_log.activity_name,
            "exercises": json.loads(updated_log.exercises) if isinstance(updated_log.exercises, str) else updated_log.exercises,
            "duration_minutes": updated_log.duration_minutes,
            "calories_burned": updated_log.calories_burned,
            "unit": updated_log.unit,
            "notes": updated_log.notes,
            "activity_date": updated_log.activity_date.isoformat() if updated_log.activity_date else None,
            "created_at": updated_log.created_at.isoformat() if updated_log.created_at else None,
            "updated_at": updated_log.updated_at.isoformat() if updated_log.updated_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update fitness log")

@router.delete("/{id}")
def delete_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Delete a fitness log."""
    log = fitness_log.get(db, id=id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fitness log not found")

    try:
        fitness_log.remove(db, id=id)
        return {"message": "Fitness log deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete fitness log")


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
            last_log = max(logs, key=lambda x: x.activity_date or x.created_at)
            last_workout_date = (last_log.activity_date or last_log.created_at).isoformat()

        return {
            "currentStreak": current_streak,
            "longestStreak": longest_streak,
            "lastWorkoutDate": last_workout_date
        }

    except Exception as e:
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
