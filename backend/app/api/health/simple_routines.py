"""
Simplified Routine API endpoints - Only what we actually need
"""

from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.simple_routine import simple_routine, simple_user_routine_progress
from app.crud.health.routine_workout_day import routine_workout_day
from app.crud.health.routine_exercise import routine_exercise
from app.schemas.health.simple_routine import (
    SimpleRoutine, SimpleRoutineCreate, SimpleRoutineUpdate,
    SimpleRoutineWithProgress, SimpleRoutineListResponse,
    SimpleUserRoutineProgress
)

router = APIRouter()

@router.get("/", response_model=SimpleRoutineListResponse)
def get_routines(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    templates_only: bool = Query(False, description="Only return system templates"),
    user_created_only: bool = Query(False, description="Only return user-created routines"),
    active_only: bool = Query(False, description="Show only active routines")
):
    """Get routines with optional filtering"""
    if active_only:
        print(f"🏋️ [SIMPLE ROUTINES] Getting active routines for user: {current_user.id}")
        # Get only active routines for the user
        active_progress = simple_user_routine_progress.get_user_active_routine(
            db, user_id=current_user.id
        )
        print(f"🏋️ [SIMPLE ROUTINES] Active progress found: {active_progress}")
        
        if not active_progress:
            print("🏋️ [SIMPLE ROUTINES] No active progress found, returning empty list")
            return SimpleRoutineListResponse(
                routines=[],
                total=0,
                page=skip // limit + 1,
                size=limit
            )
        
        # Get the routine details
        routine = simple_routine.get(db, id=active_progress.routine_id)
        print(f"🏋️ [SIMPLE ROUTINES] Routine found: {routine}")
        routines_list = [routine] if routine else []
    elif templates_only:
        routines_list = simple_routine.get_templates(db, skip=skip, limit=limit)
    elif user_created_only:
        routines_list = simple_routine.get_user_routines(db, user_id=current_user.id, skip=skip, limit=limit)
    else:
        routines_list = simple_routine.get_all_routines(db, skip=skip, limit=limit)

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

        # Add required fields for SimpleRoutineWithProgress
        routine_data['workout_schedule'] = []  # Empty for now
        routine_data['total_workouts_per_week'] = 0  # Default value
        
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

@router.get("/{id}", response_model=SimpleRoutineWithProgress)
def get_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Get a specific routine with detailed workout data"""
    routine_obj = simple_routine.get(db, id=id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Routine not found")

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
                    "sets": exercise.sets,
                    "reps": exercise.reps,
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
        print(f"🔍 Received request data: {request_data}")

        # Filter out tags field since the model doesn't support it
        routine_data_dict = request_data.get("routine_data", {}).copy()
        if "tags" in routine_data_dict:
            del routine_data_dict["tags"]
        
        routine_data = SimpleRoutineCreate(**routine_data_dict)
        workout_days = request_data.get("workout_days", [])

        print(f"📋 Routine data: {routine_data}")
        print(f"🏋️ Workout days: {workout_days}")

        return simple_routine.create_with_workout_plan(
            db,
            routine_data=routine_data,
            workout_days=workout_days,
            user_id=current_user.id
        )
    except Exception as e:
        print(f"❌ Error creating routine with workout plan: {e}")
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
    from datetime import datetime
    
    # Get active routine
    progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if not progress:
        raise HTTPException(status_code=404, detail="No active routine found")
    
    # Get the routine details
    routine = simple_routine.get(db, id=progress.routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Get today's day of week (0=Monday, 6=Sunday)
    today = datetime.now()
    day_of_week = today.weekday()  # 0=Monday, 6=Sunday
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    today_name = day_names[day_of_week]
    
    # Get today's workout day
    from app.models.health.simple_routine import RoutineWorkoutDay, RoutineExercise
    workout_day = db.query(RoutineWorkoutDay).filter(
        RoutineWorkoutDay.routine_id == routine.id,
        RoutineWorkoutDay.day_name == today_name
    ).first()
    
    if not workout_day:
        raise HTTPException(status_code=404, detail=f"No workout scheduled for {today_name}")
    
    # Get exercises for today
    exercises = db.query(RoutineExercise).filter(
        RoutineExercise.workout_day_id == workout_day.id
    ).order_by(RoutineExercise.order_index).all()
    
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
                "logging_category": ex.logging_category,
                "sets": ex.sets,
                "reps": ex.reps,
                "weight": ex.weight,
                "weight_unit": ex.weight_unit,
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
    }

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
        print(f"🔍 Updating routine {id} with workout plan")

        # Check if routine exists and belongs to user
        routine = simple_routine.get(db, id=id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")

        if routine.created_by_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this routine")

        # Filter out tags field since the model doesn't support it
        routine_data_dict = request_data.get("routine_data", {}).copy()
        if "tags" in routine_data_dict:
            del routine_data_dict["tags"]
        
        routine_data = SimpleRoutineUpdate(**routine_data_dict)
        workout_days = request_data.get("workout_days", [])

        print(f"📋 Routine data: {routine_data}")
        print(f"🏋️ Workout days: {workout_days}")

        # Update routine basic info
        routine.name = routine_data.name
        routine.description = routine_data.description
        routine.difficulty = routine_data.difficulty
        routine.duration_weeks = routine_data.duration_weeks
        # Note: tags field not supported in model

        # Delete existing workout days and exercises
        from app.models.health.simple_routine import RoutineWorkoutDay, RoutineExercise
        existing_workout_days = db.query(RoutineWorkoutDay).filter(RoutineWorkoutDay.routine_id == int(id)).all()
        for day in existing_workout_days:
            db.query(RoutineExercise).filter(RoutineExercise.workout_day_id == day.id).delete()
            db.delete(day)

        # Add new workout days and exercises
        if workout_days and len(workout_days) > 0:
            for day_data in workout_days:
                print(f"📅 Processing day: {day_data}")
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
                    exercise = RoutineExercise(
                        workout_day_id=workout_day.id,
                        exercise_name=exercise_data.get('activity_name', exercise_data.get('exercise_name', 'Exercise')),
                        logging_category=exercise_data.get('logging_category', 'weighted'),
                        sets=exercise_data.get('sets', 3),
                        reps=str(exercise_data.get('reps', 10)),
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
                    print(f"💪 Added exercise: {exercise.exercise_name}")

        db.commit()
        db.refresh(routine)
        print(f"✅ Routine updated successfully: {routine.name}")
        return routine

    except Exception as e:
        print(f"❌ Error updating routine with workout plan: {e}")
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

    # Check if user owns this routine
    if routine_obj.created_by_user_id != current_user.id:
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
