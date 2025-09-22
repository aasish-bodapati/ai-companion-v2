from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.models.user import User
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.health.exercise_database import Exercise
from app.models.health.exercise_logging_categories import ExerciseLoggingCategory, ExerciseLoggingCategoryEnum, get_form_schema
from app.services.wger_api import map_wger_category_to_attributes
from pydantic import BaseModel

router = APIRouter()

class ExerciseResponse(BaseModel):
    """Simplified exercise response model for API documentation"""
    id: int
    name: str
    logging_category: str
    logging_category_info: dict

class ExerciseSearchResponse(BaseModel):
    """Exercise search response model"""
    exercises: List[ExerciseResponse]

@router.get(
    "/search",
    response_model=ExerciseSearchResponse,
    summary="Search exercises",
    description="Search for exercises by name or description. Returns a list of matching exercises with their details.",
    responses={
        200: {
            "description": "Successful search results",
            "content": {
                "application/json": {
                    "example": {
                        "exercises": [
                            {
                                "id": 1,
                                "name": "Push-ups",
                                "logging_category": "strength",
                                "logging_category_info": {
                                    "id": 1,
                                    "name": "strength",
                                    "display_name": "Strength Training"
                                },
                                "difficulty": "beginner",
                                "calories_per_minute": 8.0,
                                "description": "A basic bodyweight exercise for chest and arms"
                            }
                        ]
                    }
                }
            }
        },
        400: {
            "description": "Invalid search parameters",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Search query must be at least 2 characters long"
                    }
                }
            }
        }
    }
)
async def search_exercises(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    limit: int = Query(8, ge=1, le=20, description="Maximum number of results to return"),
    db: Session = Depends(get_db)
):
    if not q or len(q) < 2:
        return {"exercises": []}

    search_term = f"%{q.lower()}%"

    # Query the database for exercises matching the search term
    exercises = db.query(Exercise).filter(
        Exercise.name.ilike(search_term)
    ).limit(limit).all()

    # Convert to response format
    results = []
    for ex in exercises:
        # Get logging category info
        logging_category_info = _get_logging_category_info(ex.logging_category, db)

        results.append(ExerciseResponse(
            id=ex.id,
            name=ex.name,
            logging_category=ex.logging_category if ex.logging_category else None,
            logging_category_info=logging_category_info
        ))

    return ExerciseSearchResponse(exercises=results)

@router.get(
    "/all",
    response_model=ExerciseSearchResponse,
    summary="Get all exercises",
    description="Retrieve all available exercises in the database with optional filtering by logging category.",
    responses={
        200: {
            "description": "All exercises retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "exercises": [
                            {
                                "id": 1,
                                "name": "Push-ups",
                                "logging_category": "bodyweight",
                                "logging_category_info": {
                                    "id": 1,
                                    "name": "bodyweight",
                                    "display_name": "Bodyweight Exercises"
                                },
                                "difficulty": "beginner",
                                "calories_per_minute": 8.0,
                                "description": "A basic bodyweight exercise for chest and arms"
                            }
                        ]
                    }
                }
            }
        }
    }
)
async def get_all_exercises(
    logging_category: Optional[str] = Query(None, description="Filter by logging category (bodyweight, weighted, cardio_duration, hold_static, repetition_only, distance_based)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results to return"),
    db: Session = Depends(get_db)
):
    # Build query with filters
    query = db.query(Exercise)
    
    # Apply logging category filter
    if logging_category:
        try:
            category_enum = ExerciseLoggingCategoryEnum(logging_category)
            query = query.filter(Exercise.logging_category == category_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid logging category: {logging_category}")
    
    # Apply limit
    exercises = query.limit(limit).all()

    results = []
    for ex in exercises:
        # Get logging category info
        logging_category_info = _get_logging_category_info(ex.logging_category, db)

        results.append(ExerciseResponse(
            id=ex.id,
            name=ex.name,
            logging_category=ex.logging_category if ex.logging_category else None,
            logging_category_info=logging_category_info
        ))

    return ExerciseSearchResponse(exercises=results)

@router.get("/categories")
async def get_exercise_categories(
    db: Session = Depends(get_db)
):
    """Get all exercise logging categories with their attribute schemas"""
    categories = db.query(ExerciseLoggingCategory).filter(ExerciseLoggingCategory.is_active == True).order_by(ExerciseLoggingCategory.sort_order).all()

    results = []
    for category in categories:
        results.append({
            "id": category.id,
            "name": category.name,
            "category": category.name,  # Use name as category value
            "display_name": category.display_name,
            "description": category.description,
            "logging_attributes": get_form_schema(ExerciseLoggingCategoryEnum(category.name)),
            "icon": category.icon,
            "color": category.color
        })

    return {"categories": results}

def _get_logging_category_info(logging_category: str, db: Session) -> dict:
    """Get logging category information from database"""
    if not logging_category:
        return {"icon": "🏋️", "display_name": "Unknown", "color": "gray"}
    
    category_record = db.query(ExerciseLoggingCategory).filter(
        ExerciseLoggingCategory.name == logging_category
    ).first()
    
    if category_record:
        return {
            "id": category_record.id,
            "name": category_record.name,
            "display_name": category_record.display_name,
            "description": category_record.description,
            "logging_attributes": get_form_schema(ExerciseLoggingCategoryEnum(logging_category)) if logging_category in [e.value for e in ExerciseLoggingCategoryEnum] else {},
            "icon": category_record.icon or "🏋️",
            "color": category_record.color or "blue"
        }
    
    # Fallback for missing category records
    return {
        "icon": "🏋️",
        "display_name": logging_category.replace("_", " ").title(),
        "color": "gray"
    }
