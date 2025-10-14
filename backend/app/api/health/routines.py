"""
Consolidated Routines API - All routine-related endpoints in one place
Combines: simple_routines, nutrition_routines, active_routine
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.health.simple_routine import SimpleRoutine
from app.models.health.nutrition_routine import NutritionRoutine
from app.crud.health.simple_routine import simple_routine
from app.crud.health.nutrition_routine import nutrition_routine
from app.schemas.health.simple_routine import (
    SimpleRoutine, SimpleRoutineCreate, SimpleRoutineUpdate,
    SimpleRoutineWithProgress, SimpleRoutineListResponse
)
from app.schemas.health.nutrition_routine import (
    NutritionRoutine, NutritionRoutineCreate, NutritionRoutineUpdate,
    NutritionRoutineWithMealPlans, NutritionRoutineListResponse
)

router = APIRouter()

# ============================================================================
# SIMPLE ROUTINES (WORKOUT ROUTINES)
# ============================================================================

@router.post("/workout", response_model=SimpleRoutine)
async def create_workout_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_in: SimpleRoutineCreate
):
    """Create a new workout routine"""
    try:
        routine = simple_routine.create_with_user(db=db, obj_in=routine_in, user_id=current_user.id)
        return routine
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create routine: {str(e)}")

@router.get("/workout", response_model=SimpleRoutineListResponse)
async def get_workout_routines(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_template: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None)
):
    """Get workout routines for the current user"""
    try:
        routines = simple_routine.get_multi_by_user(
            db=db, 
            user_id=current_user.id, 
            skip=skip, 
            limit=limit,
            is_template=is_template,
            is_active=is_active
        )
        return SimpleRoutineListResponse(
            routines=routines,
            total=len(routines),
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve routines: {str(e)}")

@router.get("/workout/{routine_id}", response_model=SimpleRoutineWithProgress)
async def get_workout_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: int
):
    """Get a specific workout routine with progress"""
    try:
        routine = simple_routine.get_by_user(db=db, id=routine_id, user_id=current_user.id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
        
        # Add progress data (simplified for now)
        routine_with_progress = SimpleRoutineWithProgress(
            **routine.__dict__,
            progress_data={
                "workouts_completed": 0,
                "last_workout_date": None,
                "completion_percentage": 0
            }
        )
        return routine_with_progress
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve routine: {str(e)}")

@router.put("/workout/{routine_id}", response_model=SimpleRoutine)
async def update_workout_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: int,
    routine_in: SimpleRoutineUpdate
):
    """Update a workout routine"""
    try:
        routine = simple_routine.get_by_user(db=db, id=routine_id, user_id=current_user.id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
        
        updated_routine = simple_routine.update(db=db, db_obj=routine, obj_in=routine_in)
        return updated_routine
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update routine: {str(e)}")

@router.delete("/workout/{routine_id}")
async def delete_workout_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: int
):
    """Delete a workout routine"""
    try:
        routine = simple_routine.get_by_user(db=db, id=routine_id, user_id=current_user.id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
        
        simple_routine.remove(db=db, id=routine_id)
        return {"message": "Routine deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete routine: {str(e)}")

# ============================================================================
# NUTRITION ROUTINES
# ============================================================================

@router.post("/nutrition", response_model=NutritionRoutine)
async def create_nutrition_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_in: NutritionRoutineCreate
):
    """Create a new nutrition routine"""
    try:
        routine = nutrition_routine.create_with_user(db=db, obj_in=routine_in, user_id=current_user.id)
        return routine
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create nutrition routine: {str(e)}")

@router.get("/nutrition", response_model=NutritionRoutineListResponse)
async def get_nutrition_routines(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_template: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None)
):
    """Get nutrition routines for the current user"""
    try:
        routines = nutrition_routine.get_multi_by_user(
            db=db, 
            user_id=current_user.id, 
            skip=skip, 
            limit=limit,
            is_template=is_template,
            is_active=is_active
        )
        return NutritionRoutineListResponse(
            routines=routines,
            total=len(routines),
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve nutrition routines: {str(e)}")

# ============================================================================
# ACTIVE ROUTINE MANAGEMENT
# ============================================================================

@router.get("/active")
async def get_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's currently active routine"""
    try:
        if not current_user.active_routine_id:
            return {"active_routine": None, "message": "No active routine set"}
        
        # Get the active routine
        routine = simple_routine.get_by_user(
            db=db, 
            id=current_user.active_routine_id, 
            user_id=current_user.id
        )
        
        if not routine:
            return {"active_routine": None, "message": "Active routine not found"}
        
        return {"active_routine": routine}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active routine: {str(e)}")

@router.post("/active/{routine_id}")
async def set_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: int
):
    """Set a routine as active"""
    try:
        # Verify the routine exists and belongs to the user
        routine = simple_routine.get_by_user(db=db, id=routine_id, user_id=current_user.id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
        
        # Update user's active routine
        current_user.active_routine_id = routine_id
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Active routine updated successfully", "routine_id": routine_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set active routine: {str(e)}")

@router.delete("/active")
async def clear_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear the active routine"""
    try:
        current_user.active_routine_id = None
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Active routine cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear active routine: {str(e)}")
