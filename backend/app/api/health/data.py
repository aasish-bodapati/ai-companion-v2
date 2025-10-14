"""
Consolidated Data API - All data-related endpoints in one place
Combines: exercises, foods, indian_foods, body_type_goals
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.exercise_api import ExerciseApiClient
from app.services.indian_food_service import IndianFoodService
from app.services.hybrid_food_service import LocalFoodService

router = APIRouter()

# Initialize services
exercise_client = ExerciseApiClient()
hybrid_food_service = LocalFoodService()

# ============================================================================
# EXERCISE DATA ENDPOINTS
# ============================================================================

class ExerciseResponse(BaseModel):
    id: str
    name: str
    gif_url: Optional[str] = None
    target_muscle: Optional[str] = None
    body_part: Optional[str] = None
    equipment: Optional[str] = None
    instructions: Optional[List[str]] = None

class ExerciseSearchResponse(BaseModel):
    exercises: List[ExerciseResponse]
    total: int
    page: int
    limit: int

@router.get("/exercises", response_model=ExerciseSearchResponse)
async def search_exercises(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
    page: int = Query(1, ge=1, description="Page number"),
    body_part: Optional[str] = Query(None, description="Filter by body part"),
    equipment: Optional[str] = Query(None, description="Filter by equipment"),
    target_muscle: Optional[str] = Query(None, description="Filter by target muscle")
):
    """Search exercises from ExerciseDB API"""
    try:
        exercises = exercise_client.search_exercises(q, limit)
        
        # Apply filters
        if body_part:
            exercises = [e for e in exercises if e.get('bodyPart', '').lower() == body_part.lower()]
        if equipment:
            exercises = [e for e in exercises if e.get('equipment', '').lower() == equipment.lower()]
        if target_muscle:
            exercises = [e for e in exercises if e.get('target', '').lower() == target_muscle.lower()]
        
        # Convert to response format
        exercise_responses = []
        for exercise in exercises:
            exercise_responses.append(ExerciseResponse(
                id=exercise.get('id', ''),
                name=exercise.get('name', ''),
                gif_url=exercise.get('gifUrl'),
                target_muscle=exercise.get('target'),
                body_part=exercise.get('bodyPart'),
                equipment=exercise.get('equipment'),
                instructions=exercise.get('instructions', [])
            ))
        
        return ExerciseSearchResponse(
            exercises=exercise_responses,
            total=len(exercise_responses),
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching exercises: {str(e)}")

@router.get("/exercises/all", response_model=List[ExerciseResponse])
async def get_all_exercises(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results to return"),
    body_part: Optional[str] = Query(None, description="Filter by body part"),
    equipment: Optional[str] = Query(None, description="Filter by equipment")
):
    """Get all exercises from ExerciseDB API"""
    try:
        exercises = exercise_client.get_exercises(limit=limit, body_part=body_part, equipment=equipment)
        
        exercise_responses = []
        for exercise in exercises:
            exercise_responses.append(ExerciseResponse(
                id=exercise.get('id', ''),
                name=exercise.get('name', ''),
                gif_url=exercise.get('gifUrl'),
                target_muscle=exercise.get('target'),
                body_part=exercise.get('bodyPart'),
                equipment=exercise.get('equipment'),
                instructions=exercise.get('instructions', [])
            ))
        
        return exercise_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching exercises: {str(e)}")

@router.get("/exercises/categories")
async def get_exercise_categories():
    """Get exercise categories (body parts)"""
    try:
        categories = exercise_client.get_exercise_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

@router.get("/exercises/equipment")
async def get_exercise_equipment():
    """Get exercise equipment types"""
    try:
        equipment = exercise_client.get_equipment()
        return {"equipment": equipment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching equipment: {str(e)}")

# ============================================================================
# FOOD DATA ENDPOINTS
# ============================================================================

class FoodResponse(BaseModel):
    id: str
    name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    serving_size: Optional[str] = None
    food_type: Optional[str] = None

class FoodSearchResponse(BaseModel):
    foods: List[FoodResponse]
    total: int
    page: int
    limit: int

@router.get("/foods", response_model=FoodSearchResponse)
async def search_foods(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
    page: int = Query(1, ge=1, description="Page number"),
    food_type: Optional[str] = Query(None, description="Filter by food type (general, indian)")
):
    """Search foods from the food database"""
    try:
        if food_type == "indian":
            indian_food_service = IndianFoodService(db)
            foods = indian_food_service.search_foods(q, limit)
        else:
            foods = hybrid_food_service.search_foods(q, limit)
        
        # Convert to response format
        food_responses = []
        for food in foods:
            food_responses.append(FoodResponse(
                id=str(food.get('id', '')),
                name=food.get('name', ''),
                calories=food.get('calories', 0.0),
                protein=food.get('protein', 0.0),
                carbs=food.get('carbs', 0.0),
                fat=food.get('fat', 0.0),
                fiber=food.get('fiber'),
                sugar=food.get('sugar'),
                sodium=food.get('sodium'),
                serving_size=food.get('serving_size'),
                food_type=food.get('food_type', 'general')
            ))
        
        return FoodSearchResponse(
            foods=food_responses,
            total=len(food_responses),
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching foods: {str(e)}")

@router.get("/foods/indian", response_model=List[FoodResponse])
async def get_indian_foods(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results to return"),
    category: Optional[str] = Query(None, description="Filter by food category")
):
    """Get Indian foods from the database"""
    try:
        indian_food_service = IndianFoodService(db)
        foods = indian_food_service.get_foods(limit=limit, category=category)
        
        food_responses = []
        for food in foods:
            food_responses.append(FoodResponse(
                id=str(food.get('id', '')),
                name=food.get('name', ''),
                calories=food.get('calories', 0.0),
                protein=food.get('protein', 0.0),
                carbs=food.get('carbs', 0.0),
                fat=food.get('fat', 0.0),
                fiber=food.get('fiber'),
                sugar=food.get('sugar'),
                sodium=food.get('sodium'),
                serving_size=food.get('serving_size'),
                food_type="indian"
            ))
        
        return food_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching Indian foods: {str(e)}")

@router.get("/foods/categories")
async def get_food_categories(db: Session = Depends(get_db)):
    """Get food categories"""
    try:
        indian_food_service = IndianFoodService(db)
        categories = indian_food_service.get_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

# ============================================================================
# BODY TYPE GOALS ENDPOINTS
# ============================================================================

class BodyTypeGoalResponse(BaseModel):
    id: int
    name: str
    description: str
    body_type: str
    goals: dict
    is_active: bool
    created_at: str

@router.get("/body-type-goals", response_model=List[BodyTypeGoalResponse])
async def get_body_type_goals(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    body_type: Optional[str] = Query(None, description="Filter by body type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status")
):
    """Get body type goals"""
    try:
        # This would typically query the body_type_goals table
        # For now, return a simplified response
        goals = [
            {
                "id": 1,
                "name": "Ectomorph Goals",
                "description": "Goals for ectomorph body type",
                "body_type": "ectomorph",
                "goals": {
                    "weight_gain": True,
                    "muscle_building": True,
                    "calorie_surplus": True
                },
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
        
        # Apply filters
        if body_type:
            goals = [g for g in goals if g["body_type"] == body_type]
        if is_active is not None:
            goals = [g for g in goals if g["is_active"] == is_active]
        
        return [BodyTypeGoalResponse(**goal) for goal in goals]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching body type goals: {str(e)}")
