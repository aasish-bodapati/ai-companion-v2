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
from app.models.health.simple_routine import SimpleRoutine, RoutineWorkoutDay
from app.crud.health.simple_routine import simple_routine, simple_user_routine_progress
from app.crud.health.routine_workout_day import routine_workout_day
from app.crud.health.routine_exercise import routine_exercise
from app.schemas.health.simple_routine import (
    SimpleRoutine, SimpleRoutineCreate, SimpleRoutineUpdate,
    SimpleRoutineWithProgress, SimpleRoutineListResponse,
    SimpleUserRoutineProgress
)

router = APIRouter()

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
        # Get user's progress for this template routine
        progress = simple_user_routine_progress.get_by_user_and_routine(
            db, user_id=current_user.id, routine_id=routine_obj.id
        )
        
        # Prepare routine data with proper tags handling
        routine_data = routine_obj.__dict__.copy()

        # Convert tags from JSON string to list if needed
        if routine_data.get('tags') and isinstance(routine_data['tags'], str):
            try:
                import json
                routine_data['tags'] = json.loads(routine_data['tags'])
            except (json.JSONDecodeError, TypeError):
                # If it's a comma-separated string, split it
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
        # Get only active routines for the user
        active_progress = simple_user_routine_progress.get_user_active_routine(
            db, user_id=current_user.id
        )
        
        if not active_progress:
            return SimpleRoutineListResponse(
                routines=[],
                total=0,
                page=skip // limit + 1,
                size=limit
            )
        
        # Get the routine details - but only if user owns it
        routine = simple_routine.get(db, id=active_progress.routine_id)
        if routine and routine.created_by_user_id == current_user.id:
            routines_list = [routine]
        else:
            routines_list = []
    else:
        # Only return routines created by the current user
        routines_list = simple_routine.get_user_routines(db, user_id=current_user.id, skip=skip, limit=limit)

    # Get user progress and workout details for each routine
    routines_with_progress = []
    for routine_obj in routines_list:
        progress = simple_user_routine_progress.get_by_user_and_routine(db, user_id=current_user.id, routine_id=routine_obj.id)

        # Prepare routine data with proper tags handling
        routine_data = routine_obj.__dict__.copy()

        # Convert tags from JSON string to list if needed
        if routine_data.get('tags') and isinstance(routine_data['tags'], str):
            try:
                import json
                routine_data['tags'] = json.loads(routine_data['tags'])
            except (json.JSONDecodeError, TypeError):
                # If it's a comma-separated string, split it
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

    # Convert tags from JSON string to list if needed
    if routine_data.get('tags') and isinstance(routine_data['tags'], str):
        try:
            import json
            routine_data['tags'] = json.loads(routine_data['tags'])
        except (json.JSONDecodeError, TypeError):
            # If it's a comma-separated string, split it
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
    routine_data['is_template'] = True
    
    return SimpleRoutineWithProgress(**routine_data, user_progress=None)

@router.get("/active", response_model=SimpleRoutineWithProgress)
def get_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's currently active routine"""
    active_progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if not active_progress:
        raise HTTPException(status_code=404, detail="No active routine found")
    
    # Get the routine details
    routine_obj = simple_routine.get(db, id=active_progress.routine_id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Active routine not found")
    
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

    # Get user progress for this specific routine
    progress = simple_user_routine_progress.get_by_user_and_routine(db, user_id=current_user.id, routine_id=int(id))

    # Prepare routine data with proper tags handling
    routine_data = routine_obj.__dict__.copy()

    # Convert tags from JSON string to list if needed
    if routine_data.get('tags') and isinstance(routine_data['tags'], str):
        try:
            import json
            routine_data['tags'] = json.loads(routine_data['tags'])
        except (json.JSONDecodeError, TypeError):
            # If it's a comma-separated string, split it
            if ',' in routine_data['tags']:
                routine_data['tags'] = [tag.strip() for tag in routine_data['tags'].split(',')]
            else:
                routine_data['tags'] = [routine_data['tags']]

    # Load detailed workout data
    workout_days = routine_workout_day.get_by_routine(db, routine_id=int(id))
    workout_schedule = []

    for workout_day in workout_days:
        exercises = routine_exercise.get_by_workout_day(db, workout_day_id=workout_day.id)
        workout_schedule.append({
            "day": workout_day.day_name,
            "workout_name": workout_day.workout_name,
            "exercises": [
                {
                    "exercise_name": exercise.exercise_name,
                    "logging_category": exercise.logging_category,
                    "weight_notes": exercise.weight_notes,
                    "rest_time": exercise.rest_time,
                    "notes": exercise.notes
                }
                for exercise in exercises
            ]
        })

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

@router.post("/{id}/start", response_model=SimpleUserRoutineProgress)
def start_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Start following a routine"""
    # Check if routine exists
    routine = simple_routine.get(db, id=id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    # Stop any currently active routine
    current_progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if current_progress:
        current_progress.is_active = False
        db.commit()

    # Check if progress record already exists for this user and routine
    from datetime import datetime
    from app.models.health.simple_routine import SimpleUserRoutineProgress
    
    existing_progress = simple_user_routine_progress.get_by_user_and_routine(db, user_id=current_user.id, routine_id=int(id))
    
    if existing_progress:
        # Update existing progress record
        existing_progress.is_active = True
        existing_progress.started_at = datetime.utcnow()
        db.add(existing_progress)
        db.commit()
        db.refresh(existing_progress)
        return existing_progress
    else:
        # Create new progress record
        progress = SimpleUserRoutineProgress(
            routine_id=int(id),
            user_id=current_user.id,
            is_active=True,
            started_at=datetime.utcnow()
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress

@router.post("/{id}/stop")
def stop_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Stop following a routine"""
    progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if progress and progress.routine_id == int(id):
        progress.is_active = False
        db.commit()
        return {"message": "Routine stopped successfully"}
    else:
        raise HTTPException(status_code=404, detail="Active routine not found")

@router.get("/active/today-workout")
def get_today_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's workout from the active routine"""
    try:
        from datetime import datetime, timedelta
        
        print(f"🔍 [TODAY WORKOUT] Getting today's workout for user {current_user.id}")
        
        # Get active routine
        progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
        if not progress:
            print(f"❌ [TODAY WORKOUT] No active routine found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="No active routine found")
        
        print(f"✅ [TODAY WORKOUT] Active routine found: {progress.routine_id}")
        
        # Get the routine details
        routine = simple_routine.get(db, id=progress.routine_id)
        if not routine:
            print(f"❌ [TODAY WORKOUT] Routine {progress.routine_id} not found")
            raise HTTPException(status_code=404, detail="Routine not found")
        
        print(f"✅ [TODAY WORKOUT] Routine found: {routine.name} (Template: {routine.is_template})")
        
        # Get today's day of week (0=Monday, 6=Sunday) using user's timezone
        user_timezone = current_user.timezone or "UTC"
        print(f"🕐 [TODAY WORKOUT] User timezone: {user_timezone}")
        
        if user_timezone != "UTC":
            offset_hours = {
                "UTC": 0, "Asia/Kolkata": 5.5, "America/New_York": -5, 
                "America/Los_Angeles": -8, "Europe/London": 0, 
                "Asia/Tokyo": 9, "Australia/Sydney": 10
            }.get(user_timezone, 0)
            
            from datetime import timezone
            user_tz = timezone(timedelta(hours=offset_hours))
            today = datetime.now(user_tz)
        else:
            today = datetime.now()
        
        day_of_week = today.weekday()  # 0=Monday, 6=Sunday
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        today_name = day_names[day_of_week]
        
        print(f"📅 [TODAY WORKOUT] Today is: {today_name} (weekday: {day_of_week})")
        
        # Get today's workout day (case-insensitive)
        from app.models.health.simple_routine import RoutineWorkoutDay, RoutineExercise
        workout_day = db.query(RoutineWorkoutDay).filter(
            RoutineWorkoutDay.routine_id == routine.id,
            RoutineWorkoutDay.day_name.ilike(today_name)
        ).first()
        
        if not workout_day:
            print(f"❌ [TODAY WORKOUT] No workout scheduled for {today_name}")
            raise HTTPException(status_code=404, detail=f"No workout scheduled for {today_name}")
        
        print(f"✅ [TODAY WORKOUT] Workout day found: {workout_day.workout_name}")
        
        # Get exercises for today with logging category from exercises table
        from app.models.health.exercise_database import Exercise
        exercises_query = db.query(
            RoutineExercise,
            Exercise.logging_category.label('db_logging_category')
        ).outerjoin(
            Exercise, RoutineExercise.exercise_name == Exercise.name
        ).filter(
            RoutineExercise.workout_day_id == workout_day.id
        ).order_by(RoutineExercise.order_index).all()
        
        print(f"🏋️ [TODAY WORKOUT] Found {len(exercises_query)} exercises")
        
        return {
            "routine_id": routine.id,
            "routine_name": routine.name,
            "day_name": workout_day.day_name,
            "workout_name": workout_day.workout_name,
            "description": workout_day.description,
            "exercises": [
                {
                    "id": ex.id,
                    "exercise_name": ex.exercise_name,
                    "logging_category": db_logging_category or ex.logging_category or "weighted",  # Fallback to weighted if not found
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
                } for ex, db_logging_category in exercises_query
            ]
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (404, etc.)
        raise
    except Exception as e:
        print(f"❌ [TODAY WORKOUT] Unexpected error: {str(e)}")
        print(f"❌ [TODAY WORKOUT] Error type: {type(e).__name__}")
        import traceback
        print(f"❌ [TODAY WORKOUT] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/active/previous-week-workout")
def get_previous_week_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get previous week's workout data for the same day of week"""
    try:
        from datetime import datetime, timedelta
        
        # Get active routine
        progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
        if not progress:
            raise HTTPException(status_code=404, detail="No active routine found")
        
        # Get the routine details
        routine = simple_routine.get(db, id=progress.routine_id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
        
        # Get today's day of week (0=Monday, 6=Sunday) using user's timezone
        user_timezone = current_user.timezone or "UTC"
        
        if user_timezone != "UTC":
            offset_hours = {
                "UTC": 0, "Asia/Kolkata": 5.5, "America/New_York": -5, 
                "America/Los_Angeles": -8, "Europe/London": 0, 
                "Asia/Tokyo": 9, "Australia/Sydney": 10
            }.get(user_timezone, 0)
            
            from datetime import timezone
            user_tz = timezone(timedelta(hours=offset_hours))
            today = datetime.now(user_tz)
        else:
            today = datetime.now()
        
        day_of_week = today.weekday()  # 0=Monday, 6=Sunday
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        today_name = day_names[day_of_week]
        
        # Get today's workout day (case-insensitive comparison)
        from app.models.health.simple_routine import RoutineWorkoutDay, RoutineExercise
        workout_day = db.query(RoutineWorkoutDay).filter(
            RoutineWorkoutDay.routine_id == routine.id,
            RoutineWorkoutDay.day_name.ilike(today_name)
        ).first()
        
        if not workout_day:
            raise HTTPException(status_code=404, detail=f"No workout scheduled for {today_name}")
        
        # Get exercises for today
        exercises = db.query(RoutineExercise).filter(
            RoutineExercise.workout_day_id == workout_day.id
        ).order_by(RoutineExercise.order_index).all()
        
        # Get the most recent logged data for each exercise
        from app.models.health.fitness_log import FitnessLog
        from sqlalchemy import text
        import json
        
        # Get recent fitness logs for this user (last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        
        logs_query = text("""
            SELECT id, user_id, activity_type, activity_name, duration_minutes, 
                   calories_burned, notes, activity_date, created_at, updated_at, exercises, unit
            FROM fitness_logs 
            WHERE user_id = :user_id 
            AND activity_date >= :start_date
            AND exercises IS NOT NULL
            ORDER BY activity_date DESC, created_at DESC
        """)
        
        logs_result = db.execute(logs_query, {
            "user_id": current_user.id,
            "start_date": thirty_days_ago
        }).fetchall()
        
        # Create a map of exercise names to their most recent logged data
        exercise_previous_data = {}
        
        for row in logs_result:
            exercises_data = row[10]  # exercises JSONB field
            if exercises_data:
                try:
                    exercises_list = json.loads(exercises_data) if isinstance(exercises_data, str) else exercises_data
                    if isinstance(exercises_list, list):
                        for exercise_log in exercises_list:
                            exercise_name = exercise_log.get('activity_name', '').lower()
                            if exercise_name and exercise_name not in exercise_previous_data:
                                exercise_previous_data[exercise_name] = {
                                    'sets': exercise_log.get('sets'),
                                    'reps': exercise_log.get('reps'),
                                    'weight': exercise_log.get('weight'),
                                    'duration': exercise_log.get('duration'),
                                    'distance': exercise_log.get('distance'),
                                    'notes': exercise_log.get('notes')
                                }
                except (json.JSONDecodeError, TypeError):
                    continue
        
        # Debug logging
        # Debug logging removed
        
        # Build exercises with previous data if available
        exercises_with_previous_data = []
        for ex in exercises:
            exercise_name_lower = ex.exercise_name.lower()
            previous_data = exercise_previous_data.get(exercise_name_lower, {})
            
            exercises_with_previous_data.append({
                "id": ex.id,
                "exercise_name": ex.exercise_name,
                "logging_category": ex.logging_category,
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
                "order_index": ex.order_index,
                "previous_data": previous_data,
                # Add previous values for easy access
                "previous_sets": previous_data.get('sets'),
                "previous_reps": previous_data.get('reps'),
                "previous_weight": previous_data.get('weight'),
                "previous_duration": previous_data.get('duration'),
                "previous_distance": previous_data.get('distance'),
                "previous_notes": previous_data.get('notes')
            })
        
        return {
            "routine_id": routine.id,
            "routine_name": routine.name,
            "day_name": workout_day.day_name,
            "workout_name": workout_day.workout_name,
            "description": workout_day.description,
            "exercises": exercises_with_previous_data
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{id}/log-workout")
def log_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Log a workout completion"""
    progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if not progress or progress.routine_id != int(id):
        raise HTTPException(status_code=404, detail="Active routine not found")

    progress.workouts_completed += 1
    from datetime import datetime
    progress.last_workout_date = datetime.utcnow()
    db.commit()

    return {
        "message": "Workout logged successfully",
        "workouts_completed": progress.workouts_completed
    }

@router.post("/{id}/skip-workout")
def skip_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Mark a workout as skipped"""
    progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if not progress or progress.routine_id != int(id):
        raise HTTPException(status_code=404, detail="Active routine not found")

    # Increment skipped workouts counter
    progress.workouts_skipped = (progress.workouts_skipped or 0) + 1
    from datetime import datetime
    progress.last_workout_date = datetime.utcnow()
    db.commit()

    return {
        "message": "Workout marked as skipped",
        "workouts_skipped": progress.workouts_skipped
    }

@router.put("/{id}/with-workout-plan", response_model=SimpleRoutine)
def update_routine_with_workout_plan(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str,
    request_data: dict
):
    """Update a routine with detailed workout plan"""
    try:

        # Check if routine exists and belongs to user
        routine = simple_routine.get(db, id=id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")

        # Allow users to edit their own routines OR system-created routines (templates)
        if routine.created_by_user_id is not None and routine.created_by_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this routine")

        # Filter out tags field since the model doesn't support it
        routine_data_dict = request_data.get("routine_data", {}).copy()
        if "tags" in routine_data_dict:
            del routine_data_dict["tags"]
        
        try:
            routine_data = SimpleRoutineUpdate(**routine_data_dict)
        except Exception as validation_error:
            logger.error(f"❌ [ROUTINE UPDATE] Validation error: {str(validation_error)}")
            logger.error(f"❌ [ROUTINE UPDATE] Request data: {request_data}")
            logger.error(f"❌ [ROUTINE UPDATE] Routine data dict: {routine_data_dict}")
            raise HTTPException(status_code=422, detail=f"Validation error: {str(validation_error)}")
        workout_days = request_data.get("workout_days", [])
        

        # Update routine basic info
        routine.name = routine_data.name
        routine.description = routine_data.description
        routine.difficulty = routine_data.difficulty
        routine.duration_weeks = routine_data.duration_weeks
        # Note: tags field not supported in model

        # Delete existing workout days and exercises
        try:
            from app.models.health.simple_routine import RoutineWorkoutDay, RoutineExercise
            existing_workout_days = db.query(RoutineWorkoutDay).filter(RoutineWorkoutDay.routine_id == int(id)).all()
            for day in existing_workout_days:
                db.query(RoutineExercise).filter(RoutineExercise.workout_day_id == day.id).delete()
                db.delete(day)
        except Exception as e:
            logger.error(f"❌ [ROUTINE UPDATE] Error deleting existing workout days: {str(e)}")
            raise

        # Add new workout days and exercises
        if workout_days and len(workout_days) > 0:
            for day_data in workout_days:
                workout_day = RoutineWorkoutDay(
                    routine_id=routine.id,
                    day_name=day_data['day'],
                    day_order=day_data.get('day_order', 0),
                    workout_name=day_data.get('workout_name', f"{day_data['day']} Workout"),
                    description=day_data.get('description')
                )
                db.add(workout_day)
                db.flush()

                for i, exercise_data in enumerate(day_data.get('workouts', [])):
                    exercise_name = exercise_data.get('activity_name', exercise_data.get('exercise_name', 'Exercise'))
                    
                    # Lookup category from exercises table
                    from app.models.health.exercise_database import Exercise
                    exercise_lookup = db.query(Exercise).filter(Exercise.name == exercise_name).first()
                    logging_category = exercise_lookup.logging_category if exercise_lookup else 'weighted'  # Default fallback
                    
                    exercise = RoutineExercise(
                        workout_day_id=workout_day.id,
                        exercise_name=exercise_name,
                        logging_category=logging_category,
                        sets=exercise_data.get('sets', 0),  # Default to 0 for routine planning
                        reps=exercise_data.get('reps'),
                        weight=exercise_data.get('weight'),
                        weight_unit=exercise_data.get('weight_unit'),
                        duration=exercise_data.get('duration'),
                        distance=exercise_data.get('distance'),
                        distance_unit=exercise_data.get('distance_unit'),
                        intensity=exercise_data.get('intensity'),
                        heart_rate=exercise_data.get('heart_rate'),
                        difficulty=exercise_data.get('difficulty'),
                        total_reps=exercise_data.get('total_reps'),
                        time=exercise_data.get('time'),
                        pace=exercise_data.get('pace'),
                        weight_notes=exercise_data.get('weight_notes'),
                        rest_time=exercise_data.get('rest_time'),
                        notes=exercise_data.get('notes'),
                        order_index=i
                    )
                    db.add(exercise)

        db.commit()
        db.refresh(routine)
        return routine

    except HTTPException as e:
        # Re-raise HTTP exceptions (like 403, 404) as-is
        raise e
    except Exception as e:
        logger.error(f"❌ [ROUTINE UPDATE] Full error details: {str(e)}", exc_info=True)
        logger.error(f"❌ [ROUTINE UPDATE] Request data: {request_data}")
        raise HTTPException(status_code=422, detail=f"Failed to update routine: {str(e)}")

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
