"""
Active routine management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.health.exercise_database import Exercise

router = APIRouter()


def get_exercise_name(db: Session, exercise_id: str) -> str:
    """Get exercise name from database by ID."""
    try:
        exercise = db.query(Exercise).filter(Exercise.id == int(exercise_id)).first()
        return exercise.name if exercise else f"Exercise {exercise_id}"
    except (ValueError, TypeError):
        return f"Exercise {exercise_id}"

def get_exercise_category(db: Session, exercise_id: str) -> str:
    """Get exercise category from database by ID."""
    try:
        exercise = db.query(Exercise).filter(Exercise.id == int(exercise_id)).first()
        return exercise.logging_category if exercise else "unknown"
    except (ValueError, TypeError):
        return "unknown"


class ActiveRoutineRequest(BaseModel):
    routine_id: str


class ActiveRoutineResponse(BaseModel):
    active_routine_id: str | None
    message: str


class ExerciseResponse(BaseModel):
    id: str
    name: str
    category: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[int] = None
    duration: Optional[int] = None
    difficulty: str
    day: Optional[str] = None


class TodaysWorkoutResponse(BaseModel):
    routine_id: str
    routine_name: str
    day_name: str
    exercises: List[ExerciseResponse]


@router.get("/active-routine", response_model=ActiveRoutineResponse)
async def get_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's currently active routine."""
    return ActiveRoutineResponse(
        active_routine_id=current_user.active_routine_id,
        message="Active routine retrieved successfully"
    )


@router.post("/active-routine", response_model=ActiveRoutineResponse)
async def set_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: ActiveRoutineRequest
):
    """Set a routine as active for the user."""
    try:
        # Update the user's active routine
        current_user.active_routine_id = request.routine_id
        db.commit()
        db.refresh(current_user)
        
        return ActiveRoutineResponse(
            active_routine_id=current_user.active_routine_id,
            message=f"Routine {request.routine_id} set as active successfully"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to set active routine: {str(e)}")


@router.delete("/active-routine", response_model=ActiveRoutineResponse)
async def clear_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear the user's active routine."""
    try:
        # Clear the user's active routine
        current_user.active_routine_id = None
        db.commit()
        db.refresh(current_user)
        
        return ActiveRoutineResponse(
            active_routine_id=None,
            message="Active routine cleared successfully"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear active routine: {str(e)}")


@router.get("/active-routine/today-workout", response_model=TodaysWorkoutResponse)
async def get_todays_workout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's workout from the active routine."""
    try:
        # Check if user has an active routine
        if not current_user.active_routine_id:
            raise HTTPException(status_code=404, detail="No active routine found")
        
        print(f"🔍 [TODAY WORKOUT] Getting today's workout for user {current_user.id}, routine: {current_user.active_routine_id}")
        
        # Get today's day of week (0=Monday, 6=Sunday) using user's timezone
        user_timezone = current_user.timezone or "UTC"
        print(f"🕐 [TODAY WORKOUT] User timezone: {user_timezone}")
        
        if user_timezone != "UTC":
            offset_hours = {
                "UTC": 0, "Asia/Kolkata": 5.5, "Asia/Karachi": 5,  # Karachi is UTC+5
                "America/New_York": -5, "America/Los_Angeles": -8, 
                "Europe/London": 1,  # BST is UTC+1
                "Asia/Tokyo": 9, "Australia/Sydney": 10
            }.get(user_timezone, 0)
            
            user_tz = timezone(timedelta(hours=offset_hours))
            today = datetime.now(user_tz)
        else:
            today = datetime.now()
        
        day_of_week = today.weekday()  # 0=Monday, 6=Sunday
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        today_name = day_names[day_of_week]
        
        print(f"📅 [TODAY WORKOUT] Today is: {today_name} (weekday: {day_of_week})")
        
        # For now, we'll return a mock response since our routines are stored in the frontend
        # In a real implementation, you'd store routines in the database
        # This is a temporary solution to make the "Log Today's Workout" work
        
        # Mock routine data based on the 7-day comprehensive routine
        routine_data = {
            "7day-comprehensive": {
                "name": "7-Day Complete Workout Plan",
                "exercises": {
                    "Monday": [
                        {"id": "371", "name": "Bench Press", "category": "weighted", "sets": 4, "reps": 8, "weight": 80, "difficulty": "intermediate"},
                        {"id": "34", "name": "Pull-ups", "category": "bodyweight", "sets": 4, "reps": 8, "difficulty": "intermediate"},
                        {"id": "470", "name": "Arnold Shoulder Press", "category": "weighted", "sets": 3, "reps": 10, "weight": 25, "difficulty": "intermediate"},
                        {"id": "157", "name": "Seated Cable Row", "category": "distance_based", "sets": 4, "reps": 10, "weight": 70, "difficulty": "intermediate"},
                        {"id": "22", "name": "Ab wheel", "category": "bodyweight", "sets": 3, "reps": 12, "difficulty": "intermediate"}
                    ],
                    "Tuesday": [
                        {"id": "524", "name": "Squats", "category": "bodyweight", "sets": 5, "reps": 8, "weight": 100, "difficulty": "intermediate"},
                        {"id": "2", "name": "Deadlifts", "category": "weighted", "sets": 4, "reps": 6, "weight": 120, "difficulty": "intermediate"},
                        {"id": "657", "name": "Bulgarian Split Squats", "category": "bodyweight", "sets": 3, "reps": 12, "difficulty": "intermediate"},
                        {"id": "251", "name": "Lunges", "category": "bodyweight", "sets": 4, "reps": 12, "weight": 40, "difficulty": "intermediate"},
                        {"id": "236", "name": "Standing Calf Raises", "category": "weighted", "sets": 4, "reps": 15, "weight": 50, "difficulty": "intermediate"}
                    ],
                    "Wednesday": [
                        {"id": "615", "name": "Jump rope: basic jumps", "category": "cardio_duration", "sets": 1, "reps": 1, "duration": 20, "difficulty": "intermediate"},
                        {"id": "348", "name": "Plank", "category": "cardio_duration", "sets": 3, "reps": 1, "duration": 60, "difficulty": "intermediate"},
                        {"id": "115", "name": "Bird Dog", "category": "cardio_duration", "sets": 3, "reps": 10, "difficulty": "intermediate"},
                        {"id": "608", "name": "Glute Bridge", "category": "cardio_duration", "sets": 3, "reps": 15, "difficulty": "intermediate"},
                        {"id": "72", "name": "Kettlebell Swings", "category": "weighted", "sets": 3, "reps": 20, "difficulty": "intermediate"}
                    ],
                    "Thursday": [
                        {"id": "371", "name": "Bench Press", "category": "weighted", "sets": 4, "reps": 10, "weight": 70, "difficulty": "intermediate"},
                        {"id": "334", "name": "Incline Dumbbell Press", "category": "weighted", "sets": 4, "reps": 10, "weight": 60, "difficulty": "intermediate"},
                        {"id": "231", "name": "Overhead Press", "category": "weighted", "sets": 4, "reps": 8, "weight": 50, "difficulty": "intermediate"},
                        {"id": "100", "name": "Push-Up", "category": "bodyweight", "sets": 3, "reps": 15, "difficulty": "intermediate"},
                        {"id": "22", "name": "Ab wheel", "category": "bodyweight", "sets": 3, "reps": 15, "difficulty": "intermediate"}
                    ],
                    "Friday": [
                        {"id": "34", "name": "Pull-ups", "category": "bodyweight", "sets": 4, "reps": 10, "difficulty": "intermediate"},
                        {"id": "157", "name": "Seated Cable Row", "category": "distance_based", "sets": 4, "reps": 12, "weight": 60, "difficulty": "intermediate"},
                        {"id": "575", "name": "Bent Over Rowing", "category": "distance_based", "sets": 4, "reps": 12, "weight": 40, "difficulty": "intermediate"},
                        {"id": "470", "name": "Arnold Shoulder Press", "category": "weighted", "sets": 3, "reps": 12, "weight": 20, "difficulty": "intermediate"},
                        {"id": "555", "name": "Dumbbell farmer\'s carrie", "category": "weighted", "sets": 3, "reps": 1, "duration": 30, "difficulty": "intermediate"}
                    ],
                    "Saturday": [
                        {"id": "524", "name": "Squats", "category": "bodyweight", "sets": 3, "reps": 15, "weight": 60, "difficulty": "intermediate"},
                        {"id": "100", "name": "Push-Up", "category": "bodyweight", "sets": 3, "reps": 12, "difficulty": "intermediate"},
                        {"id": "615", "name": "Jump rope: basic jumps", "category": "cardio_duration", "sets": 1, "reps": 1, "duration": 15, "difficulty": "intermediate"},
                        {"id": "657", "name": "Bulgarian Split Squats", "category": "bodyweight", "sets": 3, "reps": 10, "difficulty": "intermediate"},
                        {"id": "72", "name": "Kettlebell Swings", "category": "weighted", "sets": 3, "reps": 15, "difficulty": "intermediate"},
                        {"id": "348", "name": "Plank", "category": "cardio_duration", "sets": 3, "reps": 1, "duration": 45, "difficulty": "intermediate"}
                    ],
                    "Sunday": [
                        {"id": "598", "name": "Yoga exercise: Cow-cat", "category": "cardio_duration", "difficulty": "beginner"},
                        {"id": "622", "name": "Cobra Stretch", "category": "cardio_duration", "difficulty": "beginner"},
                        {"id": "460", "name": "Stationary Bike Cardio", "category": "cardio_duration", "difficulty": "beginner"},
                        {"id": "608", "name": "Glute Bridge", "category": "bodyweight", "difficulty": "beginner"},
                        {"id": "115", "name": "Bird Dog", "category": "cardio_duration", "difficulty": "beginner"}
                    ]
                }
            }
        }
        
        # Get today's exercises
        routine_info = routine_data.get(current_user.active_routine_id)
        if not routine_info:
            raise HTTPException(status_code=404, detail="Active routine not found")
        
        today_exercises = routine_info["exercises"].get(today_name, [])
        if not today_exercises:
            raise HTTPException(status_code=404, detail=f"No workout scheduled for {today_name}")
        
        print(f"✅ [TODAY WORKOUT] Found {len(today_exercises)} exercises for {today_name}")
        
        # Convert to response format, fetching names and categories from database
        exercises = [
            ExerciseResponse(
                id=ex["id"],
                name=get_exercise_name(db, ex["id"]),  # Use database name instead of hardcoded
                category=get_exercise_category(db, ex["id"]),  # Use database category instead of hardcoded
                sets=ex.get("sets"),  # Optional - only if specified in routine
                reps=ex.get("reps"),  # Optional - only if specified in routine
                weight=ex.get("weight"),
                duration=ex.get("duration"),
                difficulty=ex["difficulty"],
                day=today_name
            )
            for ex in today_exercises
        ]
        
        return TodaysWorkoutResponse(
            routine_id=current_user.active_routine_id,
            routine_name=routine_info["name"],
            day_name=today_name,
            exercises=exercises
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [TODAY WORKOUT] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get today's workout: {str(e)}")

