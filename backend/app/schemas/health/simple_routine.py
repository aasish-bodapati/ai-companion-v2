"""
Simplified Routine Schemas - Only what we actually need
"""

from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class SimpleRoutineBase(BaseModel):
    """Base routine schema"""
    name: str
    description: Optional[str] = None
    difficulty: str  # beginner, intermediate, advanced
    duration_weeks: int = 4
    tags: Optional[List[str]] = None
    is_template: bool = True
    # Note: workout_schedule and total_workouts_per_week removed
    # Workout details are now in workout_days relationship

class SimpleRoutineCreate(SimpleRoutineBase):
    """Schema for creating a routine"""
    pass

class SimpleRoutineUpdate(SimpleRoutineBase):
    """Schema for updating a routine"""
    name: Optional[str] = None
    difficulty: Optional[str] = None
    duration_weeks: Optional[int] = None

class SimpleRoutine(SimpleRoutineBase):
    """Schema for returning a routine"""
    id: int
    created_by_user_id: Optional[int] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SimpleUserRoutineProgressBase(BaseModel):
    """Base user routine progress schema"""
    is_active: bool = False
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    workouts_completed: int = 0
    last_workout_date: Optional[datetime] = None

class SimpleUserRoutineProgressCreate(SimpleUserRoutineProgressBase):
    """Schema for creating user routine progress"""
    user_id: int
    routine_id: int

class SimpleUserRoutineProgressUpdate(SimpleUserRoutineProgressBase):
    """Schema for updating user routine progress"""
    pass

class SimpleUserRoutineProgress(SimpleUserRoutineProgressBase):
    """Schema for returning user routine progress"""
    id: int
    user_id: int
    routine_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SimpleRoutineWithProgress(SimpleRoutine):
    """Routine with user progress included"""
    user_progress: Optional[SimpleUserRoutineProgress] = None
    workout_schedule: Optional[List[dict]] = None
    total_workouts_per_week: Optional[int] = 0

class RoutineExerciseBase(BaseModel):
    """Base exercise schema"""
    exercise_name: str
    sets: int
    reps: Optional[str] = None
    weight_notes: Optional[str] = None
    rest_time: Optional[str] = None
    notes: Optional[str] = None
    order_index: int = 0

class RoutineExerciseCreate(RoutineExerciseBase):
    """Schema for creating an exercise"""
    pass

class RoutineExercise(RoutineExerciseBase):
    """Schema for returning an exercise"""
    id: str
    workout_day_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoutineWorkoutDayBase(BaseModel):
    """Base workout day schema"""
    day_name: str
    day_order: int
    workout_name: str
    description: Optional[str] = None

class RoutineWorkoutDayCreate(RoutineWorkoutDayBase):
    """Schema for creating a workout day"""
    exercises: List[RoutineExerciseCreate] = []

class RoutineWorkoutDay(RoutineWorkoutDayBase):
    """Schema for returning a workout day"""
    id: str
    routine_id: int
    exercises: List[RoutineExercise] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SimpleRoutineWithWorkouts(SimpleRoutine):
    """Routine with detailed workout plan"""
    workout_days: List[RoutineWorkoutDay] = []

class SimpleRoutineListResponse(BaseModel):
    """Response schema for routine list"""
    routines: List[SimpleRoutineWithProgress]
    total: int
    page: int
    size: int
