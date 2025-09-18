from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.nutrition_routine import (
    nutrition_routine,
    nutrition_meal_plan,
    nutrition_meal,
    nutrition_meal_food,
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

router = APIRouter()


@router.get("/", response_model=List[NutritionRoutine])
def get_routines(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_created_only: bool = Query(False, description="Show only user-created routines"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get nutrition routines."""
    if user_created_only:
        routines = nutrition_routine.get_user_created_only(
            db, user_id=current_user.id, skip=skip, limit=limit
        )
    else:
        # Get both user-created and template routines
        user_routines = nutrition_routine.get_user_created_only(
            db, user_id=current_user.id, skip=0, limit=50
        )
        template_routines = nutrition_routine.get_templates(db, skip=0, limit=50)
        routines = user_routines + template_routines
    
    return routines


@router.get("/{routine_id}", response_model=NutritionRoutineWithMealPlans)
def get_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Get a specific nutrition routine with meal plans."""
    try:
        routine = nutrition_routine.get(db, id=routine_id)
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
        
        print(f"DEBUG: Found routine: {routine.name}")
        
        # Get meal plans with meals and foods
        meal_plans = nutrition_meal_plan.get_by_routine(db, routine_id=routine_id)
        print(f"DEBUG: Found {len(meal_plans)} meal plans")
        
        # Convert routine to dict and remove SQLAlchemy state
        routine_dict = {
            "id": routine.id,
            "name": routine.name,
            "description": routine.description,
            "difficulty": routine.difficulty,
            "duration_weeks": routine.duration_weeks,
            "tags": routine.tags if isinstance(routine.tags, list) else [],
            "target_calories": routine.target_calories,
            "is_template": routine.is_template,
            "created_by_user_id": routine.created_by_user_id,
            "created_at": routine.created_at.isoformat() if routine.created_at else None,
            "updated_at": routine.updated_at.isoformat() if routine.updated_at else None
        }
        
        routine_with_plans = NutritionRoutineWithMealPlans(
            **routine_dict,
            meal_plans=[]
        )
        
        for meal_plan in meal_plans:
            print(f"DEBUG: Processing meal plan: {meal_plan.id}")
            meals = nutrition_meal.get_by_meal_plan(db, meal_plan_id=meal_plan.id)
            print(f"DEBUG: Found {len(meals)} meals for meal plan")
            
            # Create meal plan with meals using proper schema
            meal_plan_with_meals = []
            
            for meal in meals:
                print(f"DEBUG: Processing meal: {meal.meal_name}")
                food_items = nutrition_meal_food.get_by_meal(db, meal_id=meal.id)
                print(f"DEBUG: Found {len(food_items)} food items for meal")
                
                # Create meal with foods using proper schema
                meal_with_foods = {
                    "id": meal.id,
                    "meal_plan_id": meal.meal_plan_id,
                    "meal_type": meal.meal_type,
                    "meal_name": meal.meal_name,
                    "description": meal.description,
                    "order_index": meal.order_index,
                    "target_calories": meal.target_calories,
                    "created_at": meal.created_at.isoformat() if meal.created_at else None,
                    "updated_at": meal.updated_at.isoformat() if meal.updated_at else None,
                    "food_items": [
                        {
                            "id": food.id,
                            "meal_id": food.meal_id,
                            "food_name": food.food_name,
                            "quantity": food.quantity,
                            "calories": food.calories,
                            "protein_g": food.protein_g,
                            "carbs_g": food.carbs_g,
                            "fat_g": food.fat_g,
                            "order_index": food.order_index,
                            "created_at": food.created_at.isoformat() if food.created_at else None,
                            "updated_at": food.updated_at.isoformat() if food.updated_at else None
                        }
                        for food in food_items
                    ]
                }
                meal_plan_with_meals.append(meal_with_foods)
            
            # Create meal plan with meals
            meal_plan_data = {
                "id": meal_plan.id,
                "routine_id": meal_plan.routine_id,
                "day_name": meal_plan.day_name,
                "day_order": meal_plan.day_order,
                "plan_name": meal_plan.plan_name,
                "description": meal_plan.description,
                "daily_calories": meal_plan.daily_calories,
                "created_at": meal_plan.created_at.isoformat() if meal_plan.created_at else None,
                "updated_at": meal_plan.updated_at.isoformat() if meal_plan.updated_at else None,
                "meals": meal_plan_with_meals
            }
            
            routine_with_plans.meal_plans.append(meal_plan_data)
        
        print(f"DEBUG: Returning routine with {len(routine_with_plans.meal_plans)} meal plans")
        return routine_with_plans
        
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
    routine_dict = routine_data.dict()
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


@router.put("/{routine_id}", response_model=NutritionRoutine)
def update_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str,
    routine_data: NutritionRoutineUpdate
):
    """Update a nutrition routine."""
    routine = nutrition_routine.get(db, id=routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    if routine.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this routine")
    
    routine = nutrition_routine.update(db, db_obj=routine, obj_in=routine_data)
    return routine


@router.put("/{routine_id}/with-meal-plans", response_model=NutritionRoutine)
def update_routine_with_meal_plans(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str,
    request_data: UpdateNutritionRoutineRequest
):
    """Update a nutrition routine with detailed meal plans."""
    try:
        print(f"🍎 Updating nutrition routine {routine_id}")
        
        routine = nutrition_routine.update_with_meal_plans(
            db=db,
            routine_id=routine_id,
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


@router.delete("/{routine_id}")
def delete_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Delete a nutrition routine."""
    routine = nutrition_routine.get(db, id=routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    if routine.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this routine")
    
    nutrition_routine.remove(db, id=routine_id)
    return {"message": "Routine deleted successfully"}


# User progress endpoints
@router.post("/{routine_id}/start", response_model=NutritionUserRoutineProgress)
def start_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Start following a nutrition routine."""
    routine = nutrition_routine.get(db, id=routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    progress = nutrition_user_routine_progress.start_routine(
        db, routine_id=routine_id, user_id=current_user.id
    )
    return progress


@router.post("/{routine_id}/stop")
def stop_routine(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Stop following a nutrition routine."""
    success = nutrition_user_routine_progress.stop_routine(
        db, routine_id=routine_id, user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Active routine not found")
    
    return {"message": "Routine stopped successfully"}


@router.post("/{routine_id}/log-meal")
def log_meal(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    routine_id: str
):
    """Log a meal completion for a routine."""
    success = nutrition_user_routine_progress.log_meal(
        db, routine_id=routine_id, user_id=current_user.id
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
