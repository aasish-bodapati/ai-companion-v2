"""
Simplified Routine API endpoints - Only what we actually need
"""

from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.health.fitness_log import FitnessLog
from app.models.health.simple_routine import SimpleRoutine
from app.crud.health.simple_routine import simple_routine
# Note: simple_user_routine_progress, RoutineWorkoutDay, and RoutineExercise tables removed as they're not in the current schema
from app.schemas.health.simple_routine import (
    SimpleRoutine, SimpleRoutineCreate, SimpleRoutineUpdate,
    SimpleRoutineWithProgress, SimpleRoutineListResponse
)

router = APIRouter()

def build_workout_schedule_from_json(routine_data):
    """Helper function to build workout schedule from JSON data in routines table"""
    workout_schedule = []
    if routine_data.get('workout_days'):
        try:
            import json
            workout_days_data = json.loads(routine_data['workout_days']) if isinstance(routine_data['workout_days'], str) else routine_data['workout_days']
            if isinstance(workout_days_data, list):
                workout_schedule = workout_days_data
        except (json.JSONDecodeError, TypeError):
            workout_schedule = []
    return workout_schedule

def process_tags(tags_data):
    """Helper function to process tags from JSON string to list"""
    if not tags_data:
        return []
    
    if isinstance(tags_data, str):
        try:
            import json
            return json.loads(tags_data)
        except (json.JSONDecodeError, TypeError):
            # If it's a comma-separated string, split it
            if ',' in tags_data:
                return [tag.strip() for tag in tags_data.split(',')]
            else:
                return [tags_data]
    elif isinstance(tags_data, list):
        return tags_data
    else:
        return []

@router.get("/templates", response_model=SimpleRoutineListResponse)
def get_routine_templates(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get system template routines - public access"""
    # Get template routines
    routines_list = simple_routine.get_templates(db, skip=skip, limit=limit)

    # Prepare routines with workout details
    routines_with_progress = []
    for routine_obj in routines_list:
        # Note: Progress tracking removed as simple_user_routine_progress table doesn't exist
        progress = None
        
        # Prepare routine data with proper tags handling
        routine_data = routine_obj.__dict__.copy()

        # Process tags using helper function
        routine_data['tags'] = process_tags(routine_data.get('tags'))

        # Load workout schedule using helper function
        workout_schedule = build_workout_schedule_from_json(routine_data)
        
        # Add required fields for SimpleRoutineWithProgress
        routine_data['workout_schedule'] = workout_schedule
        routine_data['total_workouts_per_week'] = len(workout_schedule)
        routine_data['is_template'] = True
        
        # Include user progress if it exists
        routine_with_progress = SimpleRoutineWithProgress(**routine_data, user_progress=progress)
        routines_with_progress.append(routine_with_progress)

    return SimpleRoutineListResponse(
        routines=routines_with_progress,
        total=len(routines_with_progress),
        page=skip // limit + 1,
        size=limit
    )

@router.get("/", response_model=SimpleRoutineListResponse)
def get_routines(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    active_only: bool = Query(False, description="Show only active routines")
):
    """Get user's own routines only - completely private"""
    # Debug logging removed for cleaner output
    
    if active_only:
        # Note: Active routine tracking removed as simple_user_routine_progress table doesn't exist
        # Return empty list for now
            return SimpleRoutineListResponse(
                routines=[],
                total=0,
                page=skip // limit + 1,
            size=limit,
            total_pages=0
        )
    else:
        # Only return routines created by the current user
        routines_list = simple_routine.get_user_routines(db, user_id=current_user.id, skip=skip, limit=limit)

    # Get user progress and workout details for each routine
    routines_with_progress = []
    for routine_obj in routines_list:
        # Note: Progress tracking removed as simple_user_routine_progress table doesn't exist
        progress = None

        # Prepare routine data with proper tags handling
        routine_data = routine_obj.__dict__.copy()

        # Process tags using helper function
        routine_data['tags'] = process_tags(routine_data.get('tags'))

        # Load workout schedule using helper function
        workout_schedule = build_workout_schedule_from_json(routine_data)
        
        # Add required fields for SimpleRoutineWithProgress
        routine_data['workout_schedule'] = workout_schedule
        routine_data['total_workouts_per_week'] = len(workout_schedule)
        
        if progress:
            routine_with_progress = SimpleRoutineWithProgress(**routine_data, user_progress=progress)
        else:
            routine_with_progress = SimpleRoutineWithProgress(**routine_data, user_progress=None)

        # Note: Workout details are now accessed via the workout_days relationship
        # No need to manually build workout_schedule as it's handled by the frontend

        routines_with_progress.append(routine_with_progress)

    return SimpleRoutineListResponse(
        routines=routines_with_progress,
        total=len(routines_with_progress),
        page=skip // limit + 1,
        size=limit
    )

@router.get("/workout-logs-test")
def get_workout_logs_test(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Simple test endpoint for workout logs"""
    try:
        from sqlalchemy import text
        
        # Simple query to get logs
        query = text("SELECT COUNT(*) FROM fitness_logs WHERE user_id = :user_id")
        count = db.execute(query, {"user_id": current_user.id}).scalar()
        
        return {
            "message": "API is working",
            "user_id": current_user.id,
            "total_logs": count
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/workout-logs")
def get_workout_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("month", description="Filter by period: week, month, all"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Page size")
):
    """Get workout logs for the fitness logs view"""
    try:
        # Debug logging removed
        from datetime import datetime, timedelta
        import json
        
        # Calculate date range based on period using user's timezone
        user_timezone = current_user.timezone or "UTC"
        
        if user_timezone != "UTC":
            offset_hours = {
                "UTC": 0, "Asia/Kolkata": 5.5, "America/New_York": -5, 
                "America/Los_Angeles": -8, "Europe/London": 0, 
                "Asia/Tokyo": 9, "Australia/Sydney": 10
            }.get(user_timezone, 0)
            
            from datetime import timezone
            user_tz = timezone(timedelta(hours=offset_hours))
            now_user = datetime.now(user_tz)
            end_date = now_user.astimezone(timezone.utc)
            
            if period == "week":
                start_date = (now_user - timedelta(days=7)).astimezone(timezone.utc)
            elif period == "month":
                start_date = (now_user - timedelta(days=30)).astimezone(timezone.utc)
            else:  # all
                start_date = None
        else:
            end_date = datetime.now()
            if period == "week":
                start_date = end_date - timedelta(days=7)
            elif period == "month":
                start_date = end_date - timedelta(days=30)
            else:  # all
                start_date = None

        # Build query using raw SQL since our table structure doesn't match the model
        from sqlalchemy import text
        
        where_clause = "WHERE user_id = :user_id"
        params = {"user_id": current_user.id}
        
        if start_date:
            where_clause += " AND activity_date >= :start_date"
            params["start_date"] = start_date
        
        # Get total count
        count_query = text(f"SELECT COUNT(*) FROM fitness_logs {where_clause}")
        total_count = db.execute(count_query, params).scalar()
        
        # Get logs with pagination
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
        
        # Convert to list of dicts for easier handling
        logs = []
        for row in logs_result:
            logs.append({
                'id': row[0],
                'user_id': row[1],
                'activity_type': row[2],
                'activity_name': row[3],
                'duration_minutes': row[4],
                'calories_burned': row[5],
                'notes': row[6],
                'logged_at': row[7],  # activity_date mapped to logged_at for frontend compatibility
                'created_at': row[8],
                'exercises': row[9],  # exercises JSONB field
                'unit': row[10] if len(row) > 10 else None  # unit field
            })
        
        # Format logs for frontend
        formatted_logs = []
        for log in logs:
            # Parse exercises from JSON string
            exercises = []
            if log['exercises']:
                try:
                    import json
                    exercises = json.loads(log['exercises']) if isinstance(log['exercises'], str) else log['exercises']
                except (json.JSONDecodeError, TypeError):
                    exercises = []
            
            formatted_log = {
                "id": str(log['id']),
                "user_id": str(log['user_id']),
                "routine_id": None,  # Not available in basic fitness_logs
                "routine_name": None,  # Not available in basic fitness_logs
                "workout_name": log['activity_name'] or f"{log['activity_type'].title()} Workout",
                "exercises": exercises,  # Return actual exercises from database
                "duration_minutes": int(log['duration_minutes']) if log['duration_minutes'] else 0,
                "calories_burned": int(log['calories_burned']) if log['calories_burned'] else 0,
                "difficulty_rating": 0,  # Not tracked in our current structure
                "notes": log['notes'],
                "logged_at": log['logged_at'].isoformat() if log['logged_at'] else None,
                "activity_date": log['logged_at'].isoformat() if log['logged_at'] else None,
                "created_at": log['created_at'].isoformat() if log['created_at'] else None,
                "activity_type": log['activity_type'],
                "unit": log['unit']  # Include unit field
            }
            formatted_logs.append(formatted_log)
        
        # Calculate stats
        total_workouts = total_count
        total_duration = sum(log['duration_minutes'] or 0 for log in logs)
        total_calories = sum(log['calories_burned'] or 0 for log in logs)
        average_difficulty = 0  # Not tracked in our current structure
        
        # Calculate current streak (simplified)
        current_streak = 0
        if logs:
            # Simple streak calculation - consecutive days with workouts
            workout_dates = set()
            for log in logs:
                if log['logged_at']:
                    workout_dates.add(log['logged_at'].date())
            
            # Count consecutive days from today backwards using user's timezone
            if user_timezone != "UTC":
                from datetime import timezone
                user_tz = timezone(timedelta(hours=offset_hours))
                now_user = datetime.now(user_tz)
                current_date = now_user.date()
            else:
                current_date = datetime.now().date()
            
            while current_date in workout_dates:
                current_streak += 1
                current_date -= timedelta(days=1)
        
        stats = {
            "totalWorkouts": total_workouts,
            "totalDuration": int(total_duration),
            "totalCalories": total_calories,
            "averageDifficulty": average_difficulty,
            "currentStreak": current_streak
        }
        
        return {
            "logs": formatted_logs,
            "stats": stats,
            "pagination": {
                "page": page,
                "size": size,
                "total": total_count,
                "total_pages": (total_count + size - 1) // size
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workout logs: {str(e)}")

@router.get("/templates/{id}", response_model=SimpleRoutineWithProgress)
def get_template_routine(
    *,
    db: Session = Depends(get_db),
    id: str
):
    """Get a specific template routine with detailed workout data - public access"""
    routine_obj = simple_routine.get(db, id=id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Template routine not found")
    
    # Only allow access to template routines
    if not routine_obj.is_template:
        raise HTTPException(status_code=403, detail="Not a template routine")

    # Prepare routine data with proper tags handling
    routine_data = routine_obj.__dict__.copy()

    # Process tags using helper function
    routine_data['tags'] = process_tags(routine_data.get('tags'))

    # Load workout schedule using helper function
    workout_schedule = build_workout_schedule_from_json(routine_data)
    
    # Add required fields for SimpleRoutineWithProgress
    routine_data['workout_schedule'] = workout_schedule
    routine_data['total_workouts_per_week'] = len(workout_schedule)
    routine_data['is_template'] = True
    
    return SimpleRoutineWithProgress(**routine_data, user_progress=None)

@router.get("/active", response_model=SimpleRoutineWithProgress)
def get_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's currently active routine"""
    # Note: Active routine tracking removed as simple_user_routine_progress table doesn't exist
    raise HTTPException(status_code=404, detail="No active routine found - progress tracking not available")
    
    # Prepare routine data with proper tags handling
    routine_data = routine_obj.__dict__.copy()
    
    # Convert tags from JSON string to list if needed
    if routine_data.get('tags') and isinstance(routine_data['tags'], str):
        try:
            import json
            routine_data['tags'] = json.loads(routine_data['tags'])
        except (json.JSONDecodeError, TypeError):
            if ',' in routine_data['tags']:
                routine_data['tags'] = [tag.strip() for tag in routine_data['tags'].split(',')]
            else:
                routine_data['tags'] = [routine_data['tags']]
    
    # Load workout schedule for this routine
    from app.models.health.simple_routine import RoutineWorkoutDay, RoutineExercise
    workout_days = db.query(RoutineWorkoutDay).filter(
        RoutineWorkoutDay.routine_id == routine_obj.id
    ).order_by(RoutineWorkoutDay.day_order).all()
    
    workout_schedule = []
    for workout_day in workout_days:
        exercises = db.query(RoutineExercise).filter(
            RoutineExercise.workout_day_id == workout_day.id
        ).order_by(RoutineExercise.order_index).all()
        
        workout_schedule.append({
            "day": workout_day.day_name,
            "workout_name": workout_day.workout_name,
            "description": workout_day.description,
            "exercises": [
                {
                    "exercise_name": ex.exercise_name,
                    "logging_category": ex.logging_category,
                    "sets": ex.sets,
                    "reps": ex.reps,
                    "duration": ex.duration,
                    "distance": ex.distance,
                    "distance_unit": ex.distance_unit,
                    "intensity": ex.intensity,
                    "heart_rate": ex.heart_rate,
                    "difficulty": ex.difficulty,
                    "total_reps": ex.total_reps,
                    "time": ex.time,
                    "pace": ex.pace,
                    "weight_notes": ex.weight_notes,
                    "rest_time": ex.rest_time,
                    "notes": ex.notes,
                    "order_index": ex.order_index
                } for ex in exercises
            ]
        })
    
    # Add required fields for SimpleRoutineWithProgress
    routine_data['workout_schedule'] = workout_schedule
    routine_data['total_workouts_per_week'] = len(workout_schedule)
    
    return SimpleRoutineWithProgress(**routine_data, user_progress=active_progress)

@router.get("/{id}", response_model=SimpleRoutineWithProgress)
def get_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Get a specific routine with detailed workout data - only if user owns it"""
    routine_obj = simple_routine.get(db, id=id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Security check: Only allow access to user's own routines
    if routine_obj.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this routine")

    # Note: Progress tracking removed as simple_user_routine_progress table doesn't exist
    progress = None

    # Prepare routine data with proper tags handling
    routine_data = routine_obj.__dict__.copy()

    # Process tags using helper function
    routine_data['tags'] = process_tags(routine_data.get('tags'))

    # Load workout schedule using helper function
    workout_schedule = build_workout_schedule_from_json(routine_data)

    # Add workout schedule to routine data
    routine_data['workout_schedule'] = workout_schedule
    routine_data['total_workouts_per_week'] = len(workout_schedule)

    if progress and progress.routine_id == int(id):
        return SimpleRoutineWithProgress(**routine_data, user_progress=progress)
    else:
        return SimpleRoutineWithProgress(**routine_data, user_progress=None)

@router.post("/", response_model=SimpleRoutine)
def create_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_in: SimpleRoutineCreate
):
    """Create a new routine"""
    return simple_routine.create_with_user(db, obj_in=routine_in, user_id=current_user.id)

@router.post("/with-workout-plan", response_model=SimpleRoutine)
def create_routine_with_workout_plan(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request_data: dict
):
    """Create a new routine with detailed workout plan"""
    try:

        # Filter out tags field since the model doesn't support it
        routine_data_dict = request_data.get("routine_data", {}).copy()
        if "tags" in routine_data_dict:
            del routine_data_dict["tags"]
        
        routine_data = SimpleRoutineCreate(**routine_data_dict)
        workout_days = request_data.get("workout_days", [])


        return simple_routine.create_with_workout_plan(
            db,
            routine_data=routine_data,
            workout_days=workout_days,
            user_id=current_user.id
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to create routine: {str(e)}")

@router.post("/{id}/start")
def start_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Start following a routine"""
    # Note: This endpoint is temporarily disabled due to missing simple_user_routine_progress table
    raise HTTPException(status_code=501, detail="Start routine endpoint temporarily unavailable")

@router.post("/{id}/stop")
def stop_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Stop following a routine"""
    # Note: This endpoint is temporarily disabled due to missing simple_user_routine_progress table
    raise HTTPException(status_code=501, detail="Stop routine endpoint temporarily unavailable")

@router.get("/active/today-workout")
def get_today_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's workout from the active routine"""
    # Note: This endpoint is temporarily disabled due to missing simple_user_routine_progress table
    raise HTTPException(status_code=501, detail="Today's workout endpoint temporarily unavailable")

@router.get("/active/previous-week-workout")
def get_previous_week_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get previous week's workout from the active routine"""
    # Note: This endpoint is temporarily disabled due to missing simple_user_routine_progress table
    raise HTTPException(status_code=501, detail="Previous week workout endpoint temporarily unavailable")

@router.post("/{id}/log-workout")
def log_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Log a workout completion"""
    # Note: This endpoint is temporarily disabled due to missing simple_user_routine_progress table
    raise HTTPException(status_code=501, detail="Log workout endpoint temporarily unavailable")

@router.post("/{id}/skip-workout")
def skip_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Mark a workout as skipped"""
    # Note: This endpoint is temporarily disabled due to missing simple_user_routine_progress table
    raise HTTPException(status_code=501, detail="Skip workout endpoint temporarily unavailable")

@router.put("/{id}/with-workout-plan", response_model=SimpleRoutine)
def update_routine_with_workout_plan(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str,
    request_data: dict
):
    """Update routine with workout plan"""
    # Note: This endpoint is temporarily disabled due to missing simple_user_routine_progress table
    raise HTTPException(status_code=501, detail="Update routine with workout plan endpoint temporarily unavailable")


@router.put("/{id}", response_model=SimpleRoutine)
def update_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str,
    routine_in: SimpleRoutineUpdate
):
    """Update a routine"""
    routine_obj = simple_routine.get(db, id=id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Routine not found")

    # Check if user owns this routine OR if it's a system-created routine (template)
    if routine_obj.created_by_user_id is not None and routine_obj.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this routine")

    return simple_routine.update(db, db_obj=routine_obj, obj_in=routine_in)

@router.delete("/{id}")
def delete_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Delete a routine"""
    routine_obj = simple_routine.get(db, id=id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Routine not found")

    # Check if user owns this routine
    if routine_obj.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this routine")

    simple_routine.remove(db, id=id)
    return {"message": "Routine deleted successfully"}
