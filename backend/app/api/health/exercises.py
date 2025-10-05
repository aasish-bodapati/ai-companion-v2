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
    category: str
    muscle_group: str
    equipment: Optional[str] = None
    instructions: Optional[str] = None
    difficulty: str
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
    limit: int = Query(20, ge=1, le=50, description="Maximum number of results to return"),
    db: Session = Depends(get_db)
):
    if not q or len(q) < 2:
        return {"exercises": []}

    search_term = f"%{q.lower()}%"
    exact_term = q.lower()

    # Query the database for exercises matching the search term with proper sorting
    from sqlalchemy import case, desc
    
    exercises = db.query(Exercise).filter(
        Exercise.name.ilike(search_term)
    ).order_by(
        # Exact match first
        case(
            (Exercise.name.ilike(exact_term), 1),
            # Starts with search term
            (Exercise.name.ilike(f"{exact_term}%"), 2),
            # Contains search term
            else_=3
        ),
        # Then by name alphabetically
        Exercise.name
    ).limit(limit).all()

    # Convert to response format
    results = []
    for ex in exercises:
        # Get logging category info
        logging_category_info = _get_logging_category_info(ex.logging_category, db)

        results.append(ExerciseResponse(
            id=ex.id,
            name=ex.name,
            category=ex.logging_category if ex.logging_category else 'weighted',
            muscle_group='general',  # Default muscle group since it's not in the database
            equipment=None,
            instructions=None,
            difficulty='intermediate',  # Default difficulty
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
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results to return"),
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
            category=ex.logging_category if ex.logging_category else 'weighted',
            muscle_group='general',  # Default muscle group since it's not in the database
            equipment=None,
            instructions=None,
            difficulty='intermediate',  # Default difficulty
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
    """Get logging category information - using hardcoded data since categories are in exercises table"""
    if not logging_category:
        return {"id": "unknown", "name": "unknown", "display_name": "Unknown", "color": "gray", "icon": "help-outline"}
    
    # Hardcoded category data based on the actual categories in the exercises table
    category_data = {
        "weighted": {
            "id": "weighted",
            "name": "weighted", 
            "display_name": "Weighted",
            "color": "#ef4444",
            "icon": "barbell-outline"
        },
        "bodyweight": {
            "id": "bodyweight",
            "name": "bodyweight",
            "display_name": "Bodyweight", 
            "color": "#3b82f6",
            "icon": "person-outline"
        },
        "cardio_duration": {
            "id": "cardio_duration",
            "name": "cardio_duration",
            "display_name": "Cardio & Duration",
            "color": "#10b981", 
            "icon": "heart-outline"
        },
        "distance_based": {
            "id": "distance_based",
            "name": "distance_based",
            "display_name": "Distance-Based",
            "color": "#8b5cf6",
            "icon": "walk-outline"
        }
    }
    
    return category_data.get(logging_category, {
        "id": logging_category,
        "name": logging_category,
        "display_name": logging_category.replace('_', ' ').title(),
        "color": "#6b7280",
        "icon": "fitness-outline"
    })

@router.get(
    "/{exercise_id}",
    response_model=ExerciseResponse,
    summary="Get exercise by ID",
    description="Retrieve a specific exercise by its ID.",
    responses={
        200: {
            "description": "Exercise retrieved successfully",
        },
        404: {
            "description": "Exercise not found",
        }
    }
)
async def get_exercise_by_id(
    exercise_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific exercise by ID."""
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Get logging category info
    logging_category_info = _get_logging_category_info(exercise.logging_category, db)
    
    return ExerciseResponse(
        id=exercise.id,
        name=exercise.name,
        category=exercise.logging_category or "unknown",
        muscle_group="",  # Not available in current model
        equipment=None,   # Not available in current model
        instructions=None, # Not available in current model
        difficulty="intermediate",  # Default value
        logging_category=exercise.logging_category or "unknown",
        logging_category_info=logging_category_info
    )
