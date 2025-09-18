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
    user_created_only: bool = Query(False, description="Only return user-created routines")
):
    """Get routines with optional filtering"""
    if templates_only:
        routines_list = simple_routine.get_templates(db, skip=skip, limit=limit)
    elif user_created_only:
        routines_list = simple_routine.get_user_routines(db, user_id=current_user.id, skip=skip, limit=limit)
    else:
        routines_list = simple_routine.get_all_routines(db, skip=skip, limit=limit)
    
    # Get user progress and workout details for each routine
    routines_with_progress = []
    for routine_obj in routines_list:
        progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
        
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
        
        if progress and progress.routine_id == routine_obj.id:
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


@router.get("/{routine_id}", response_model=SimpleRoutineWithProgress)
def get_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Get a specific routine with detailed workout data"""
    routine_obj = simple_routine.get(db, id=routine_id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Get user progress
    progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    
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
    workout_days = routine_workout_day.get_by_routine(db, routine_id=routine_id)
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
    
    if progress and progress.routine_id == routine_id:
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
        
        routine_data = SimpleRoutineCreate(**request_data.get("routine_data", {}))
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


@router.post("/{routine_id}/start", response_model=SimpleUserRoutineProgress)
def start_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Start following a routine"""
    # Check if routine exists
    routine = simple_routine.get(db, id=routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Stop any currently active routine
    current_progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if current_progress:
        current_progress.is_active = False
        db.commit()
    
    # Start new routine
    from datetime import datetime
    from app.models.health.simple_routine import SimpleUserRoutineProgress
    
    progress = SimpleUserRoutineProgress(
        routine_id=routine_id,
        user_id=current_user.id,
        is_active=True,
        started_at=datetime.utcnow()
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress


@router.post("/{routine_id}/stop")
def stop_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Stop following a routine"""
    progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if progress and progress.routine_id == routine_id:
        progress.is_active = False
        db.commit()
        return {"message": "Routine stopped successfully"}
    else:
        raise HTTPException(status_code=404, detail="Active routine not found")


@router.post("/{routine_id}/log-workout")
def log_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Log a workout completion"""
    progress = simple_user_routine_progress.get_user_active_routine(db, user_id=current_user.id)
    if not progress or progress.routine_id != routine_id:
        raise HTTPException(status_code=404, detail="Active routine not found")
    
    progress.workouts_completed += 1
    from datetime import datetime
    progress.last_workout_date = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Workout logged successfully",
        "workouts_completed": progress.workouts_completed
    }


@router.put("/{routine_id}/with-workout-plan", response_model=SimpleRoutine)
def update_routine_with_workout_plan(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str,
    request_data: dict
):
    """Update a routine with detailed workout plan"""
    try:
        print(f"🔍 Updating routine {routine_id} with workout plan")
        
        # Check if routine exists and belongs to user
        routine = simple_routine.get(db, id=routine_id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
        
        if routine.created_by_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this routine")
        
        routine_data = SimpleRoutineUpdate(**request_data.get("routine_data", {}))
        workout_days = request_data.get("workout_days", [])
        
        print(f"📋 Routine data: {routine_data}")
        print(f"🏋️ Workout days: {workout_days}")
        
        # Update routine basic info
        routine.name = routine_data.name
        routine.description = routine_data.description
        routine.difficulty = routine_data.difficulty
        routine.duration_weeks = routine_data.duration_weeks
        routine.tags = routine_data.tags
        
        # Delete existing workout days and exercises
        from app.models.health.simple_routine import RoutineWorkoutDay, RoutineExercise
        existing_workout_days = db.query(RoutineWorkoutDay).filter(RoutineWorkoutDay.routine_id == routine_id).all()
        for day in existing_workout_days:
            db.query(RoutineExercise).filter(RoutineExercise.workout_day_id == day.id).delete()
            db.delete(day)
        
        # Add new workout days and exercises
        if workout_days and len(workout_days) > 0:
            for day_data in workout_days:
                print(f"📅 Processing day: {day_data}")
                workout_day = RoutineWorkoutDay(
                    id=str(uuid.uuid4()),
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
                        id=str(uuid.uuid4()),
                        workout_day_id=workout_day.id,
                        exercise_name=exercise_data.get('activity_name', 'Exercise'),
                        sets=exercise_data.get('sets', 3),
                        reps=str(exercise_data.get('reps', 10)),
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


@router.put("/{routine_id}", response_model=SimpleRoutine)
def update_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str,
    routine_in: SimpleRoutineUpdate
):
    """Update a routine"""
    routine_obj = simple_routine.get(db, id=routine_id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Check if user owns this routine
    if routine_obj.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this routine")
    
    return simple_routine.update(db, db_obj=routine_obj, obj_in=routine_in)


@router.delete("/{routine_id}")
def delete_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Delete a routine"""
    routine_obj = simple_routine.get(db, id=routine_id)
    if not routine_obj:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Check if user owns this routine
    if routine_obj.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this routine")
    
    simple_routine.remove(db, id=routine_id)
    return {"message": "Routine deleted successfully"}


