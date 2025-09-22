from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.nutrition_routine import (
    nutrition_routine,
    nutrition_user_routine_progress
)
from app.schemas.health.nutrition_routine import (
    NutritionRoutine,
    NutritionRoutineCreate,
    NutritionRoutineUpdate,
    NutritionRoutineWithMealPlans,
    CreateNutritionRoutineRequest,
    UpdateNutritionRoutineRequest,
    NutritionUserRoutineProgress,
    NutritionUserRoutineProgressCreate
)

# Force reload marker - updated timestamp
print("🔄 [NUTRITION ROUTINES MODULE] Loading with active_only support - 2025-09-22 06:59")

router = APIRouter()

@router.get("/", response_model=List[NutritionRoutine])
@router.get("", response_model=List[NutritionRoutine])  # Handle both with and without trailing slash
def get_routines(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_created_only: bool = Query(False, description="Show only user-created routines"),
    active_only: bool = Query(False, description="Show only active routines"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get nutrition routines."""
    print(f"🍎 [NUTRITION ROUTINES] Request received - user_created_only: {user_created_only}, active_only: {active_only}")
    print(f"🍎 [NUTRITION ROUTINES] DEBUG - Function parameters: user_created_only={user_created_only}, active_only={active_only}")
    
    try:
        if active_only:
            print(f"🍎 [NUTRITION ROUTINES] Getting active routines for user: {current_user.id}")
            # Get only active routines for the user
            active_progress = nutrition_user_routine_progress.get_user_active_routine(
                db, user_id=current_user.id
            )
            print(f"🍎 [NUTRITION ROUTINES] Active progress found: {active_progress}")
            
            if not active_progress:
                print("🍎 [NUTRITION ROUTINES] No active progress found, returning empty list")
                return []
            
            # Get the routine details
            routine = nutrition_routine.get(db, id=active_progress.routine_id)
            print(f"🍎 [NUTRITION ROUTINES] Routine found: {routine}")
            return [routine] if routine else []
            
        elif user_created_only:
            print(f"🍎 [NUTRITION ROUTINES] Getting user-created routines for user: {current_user.id}")
            routines = nutrition_routine.get_user_created_only(
                db, user_id=current_user.id, skip=skip, limit=limit
            )
            print(f"🍎 [NUTRITION ROUTINES] Returning {len(routines)} routines")
            return routines
        else:
            print(f"🍎 [NUTRITION ROUTINES] Getting all routines for user: {current_user.id}")
            # Get both user-created and template routines
            user_routines = nutrition_routine.get_user_created_only(
                db, user_id=current_user.id, skip=0, limit=50
            )
            template_routines = nutrition_routine.get_templates(db, skip=0, limit=50)
            routines = user_routines + template_routines
            print(f"🍎 [NUTRITION ROUTINES] Returning {len(routines)} routines")
            return routines
        
    except Exception as e:
        print(f"❌ [NUTRITION ROUTINES] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get nutrition routines: {str(e)}")

@router.get("/{id}", response_model=NutritionRoutine)
def get_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Get a specific nutrition routine."""
    try:
        routine = nutrition_routine.get(db, id=id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")

        return routine

    except Exception as e:
        print(f"DEBUG: Error in get_routine: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=NutritionRoutine)
def create_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_data: NutritionRoutineCreate
):
    """Create a new nutrition routine."""
    # Filter out tags field since the model doesn't support it
    routine_dict = routine_data.dict()
    if "tags" in routine_dict:
        del routine_dict["tags"]
    
    routine_dict["created_by_user_id"] = current_user.id
    routine_dict["is_template"] = False

    routine = nutrition_routine.create(db, obj_in=routine_dict)
    return routine

@router.post("/with-meal-plans", response_model=NutritionRoutine)
def create_routine_with_meal_plans(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request_data: CreateNutritionRoutineRequest
):
    """Create a nutrition routine with detailed meal plans."""
    try:
        print(f"🍎 Creating nutrition routine: {request_data.routine_data.name}")

        routine = nutrition_routine.create_with_meal_plans(
            db=db,
            routine_data=request_data.routine_data,
            meal_plans_data=request_data.meal_plans,
            user_id=current_user.id
        )

        print(f"✅ Nutrition routine created successfully: {routine.name}")
        return routine

    except Exception as e:
        print(f"❌ Error creating nutrition routine: {e}")
        raise HTTPException(status_code=422, detail=f"Failed to create routine: {str(e)}")

@router.put("/{id}", response_model=NutritionRoutine)
def update_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str,
    routine_data: NutritionRoutineUpdate
):
    """Update a nutrition routine."""
    routine = nutrition_routine.get(db, id=id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    if routine.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this routine")

    # Filter out tags field since the model doesn't support it
    update_dict = routine_data.dict(exclude_unset=True)
    if "tags" in update_dict:
        del update_dict["tags"]
    
    # Create a new update object without tags
    from app.schemas.health.nutrition_routine import NutritionRoutineUpdate
    filtered_update = NutritionRoutineUpdate(**update_dict)
    
    routine = nutrition_routine.update(db, db_obj=routine, obj_in=filtered_update)
    return routine

@router.put("/{id}/with-meal-plans", response_model=NutritionRoutine)
def update_routine_with_meal_plans(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str,
    request_data: UpdateNutritionRoutineRequest
):
    """Update a nutrition routine with detailed meal plans."""
    try:
        print(f"🍎 Updating nutrition routine {id}")

        routine = nutrition_routine.update_with_meal_plans(
            db=db,
            id=id,
            routine_data=request_data.routine_data,
            meal_plans_data=request_data.meal_plans,
            user_id=current_user.id
        )

        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found or not authorized")

        print(f"✅ Nutrition routine updated successfully: {routine.name}")
        return routine

    except Exception as e:
        print(f"❌ Error updating nutrition routine: {e}")
        raise HTTPException(status_code=422, detail=f"Failed to update routine: {str(e)}")

@router.delete("/{id}")
def delete_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Delete a nutrition routine."""
    routine = nutrition_routine.get(db, id=id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    if routine.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this routine")

    nutrition_routine.remove(db, id=id)
    return {"message": "Routine deleted successfully"}

# User progress endpoints
@router.post("/{id}/start", response_model=NutritionUserRoutineProgress)
def start_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Start following a nutrition routine."""
    routine = nutrition_routine.get(db, id=id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    progress = nutrition_user_routine_progress.start_routine(
        db, id=id, user_id=current_user.id
    )
    return progress

@router.post("/{id}/stop")
def stop_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Stop following a nutrition routine."""
    success = nutrition_user_routine_progress.stop_routine(
        db, id=id, user_id=current_user.id
    )

    if not success:
        raise HTTPException(status_code=404, detail="Active routine not found")

    return {"message": "Routine stopped successfully"}

@router.post("/{id}/log-meal")
def log_meal(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Log a meal completion for a routine."""
    success = nutrition_user_routine_progress.log_meal(
        db, id=id, user_id=current_user.id
    )

    if not success:
        raise HTTPException(status_code=404, detail="Active routine not found")

    return {"message": "Meal logged successfully"}

@router.get("/progress/active", response_model=Optional[NutritionUserRoutineProgress])
def get_active_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's currently active nutrition routine."""
    return nutrition_user_routine_progress.get_user_active_routine(
        db, user_id=current_user.id
    )

@router.get("/progress/history", response_model=List[NutritionUserRoutineProgress])
def get_routine_history(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get user's nutrition routine history."""
    return nutrition_user_routine_progress.get_user_routines(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
