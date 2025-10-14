from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.user import User
from app.api.deps import get_current_user
from app.db.session import get_db
from app.services.exercise_api import ExerciseApiClient, map_exercise_category_to_attributes
from pydantic import BaseModel

router = APIRouter()

# Initialize ExerciseDB client
exercise_client = ExerciseApiClient()

class ExerciseResponse(BaseModel):
    """Exercise response model for API documentation"""
    id: str  # ExerciseDB exerciseId
    name: str
    category: str
    muscle_group: str
    equipment: Optional[str] = None
    instructions: Optional[List[str]] = None
    difficulty: str = "intermediate"
    logging_category: str
    logging_category_info: dict
    gif_url: Optional[str] = None
    target_muscles: Optional[List[str]] = None
    secondary_muscles: Optional[List[str]] = None
    body_parts: Optional[List[str]] = None

class ExerciseSearchResponse(BaseModel):
    """Exercise search response model"""
    exercises: List[ExerciseResponse]
    total: int
    page: int
    limit: int

def _map_exercisedb_to_response(exercise_data: dict) -> ExerciseResponse:
    """Map ExerciseDB exercise data to our response format"""
    # Determine logging category based on body parts and equipment
    body_parts = exercise_data.get("bodyParts", [])
    equipments = exercise_data.get("equipments", [])
    
    # Map to logging category
    if "cardio" in body_parts:
        logging_category = "cardio_duration"
    elif "body weight" in equipments:
        logging_category = "bodyweight"
    elif any(eq in equipments for eq in ["barbell", "dumbbell", "kettlebell", "weighted"]):
        logging_category = "weighted"
    else:
        logging_category = "weighted"  # Default fallback
    
    # Get logging category info
    logging_category_info = _get_logging_category_info(logging_category)
    
    # Determine primary muscle group
    target_muscles = exercise_data.get("targetMuscles", [])
    muscle_group = target_muscles[0] if target_muscles else "general"
    
    # Determine difficulty (we'll use a simple heuristic)
    instructions = exercise_data.get("instructions", [])
    if len(instructions) <= 3:
        difficulty = "beginner"
    elif len(instructions) <= 6:
        difficulty = "intermediate"
    else:
        difficulty = "advanced"
    
    return ExerciseResponse(
        id=exercise_data.get("exerciseId", ""),
        name=exercise_data.get("name", ""),
        category=body_parts[0] if body_parts else "general",
        muscle_group=muscle_group,
        equipment=", ".join(equipments) if equipments else None,
        instructions=exercise_data.get("instructions", []),
        difficulty=difficulty,
        logging_category=logging_category,
        logging_category_info=logging_category_info,
        gif_url=exercise_data.get("gifUrl"),
        target_muscles=target_muscles,
        secondary_muscles=exercise_data.get("secondaryMuscles", []),
        body_parts=body_parts
    )

def _get_logging_category_info(logging_category: str) -> dict:
    """Get logging category information"""
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
    "/search",
    response_model=ExerciseSearchResponse,
    summary="Search exercises",
    description="Search for exercises by name using ExerciseDB. Returns a list of matching exercises with their details.",
    responses={
        200: {
            "description": "Successful search results",
            "content": {
                "application/json": {
                    "example": {
                        "exercises": [
                            {
                                "id": "VPPtusI",
                                "name": "inverted row bent knees",
                                "category": "back",
                                "muscle_group": "upper back",
                                "equipment": "body weight",
                                "logging_category": "bodyweight",
                                "difficulty": "intermediate",
                                "gif_url": "https://static.exercisedb.dev/media/VPPtusI.gif"
                            }
                        ],
                        "total": 1,
                        "page": 1,
                        "limit": 20
                    }
                }
            }
        }
    }
)
async def search_exercises(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
    page: int = Query(1, ge=1, description="Page number"),
    body_part: Optional[str] = Query(None, description="Filter by body part"),
    equipment: Optional[str] = Query(None, description="Filter by equipment"),
    target_muscle: Optional[str] = Query(None, description="Filter by target muscle")
):
    """Search exercises using ExerciseDB with optional filtering"""
    if not q or len(q) < 2:
        return ExerciseSearchResponse(exercises=[], total=0, page=page, limit=limit)

    try:
        # Calculate offset for pagination
        offset = (page - 1) * limit
        
        # Search exercises with filters
        exercises_data = exercise_client.get_exercises(
            limit=limit,
            offset=offset,
            body_part=body_part,
            equipment=equipment,
            target_muscle=target_muscle
        )
        
        # Filter by search query (ExerciseDB doesn't have built-in search, so we filter client-side)
        filtered_exercises = [
            ex for ex in exercises_data 
            if q.lower() in ex.get("name", "").lower()
        ]
        
        # Map to response format
        exercises = [_map_exercisedb_to_response(ex) for ex in filtered_exercises]
        
        return ExerciseSearchResponse(
            exercises=exercises,
            total=len(filtered_exercises),
            page=page,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching exercises: {str(e)}")

@router.get(
    "/all",
    response_model=ExerciseSearchResponse,
    summary="Get all exercises",
    description="Retrieve all available exercises from ExerciseDB with optional filtering.",
    responses={
        200: {
            "description": "All exercises retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "exercises": [
                            {
                                "id": "VPPtusI",
                                "name": "inverted row bent knees",
                                "category": "back",
                                "muscle_group": "upper back",
                                "equipment": "body weight",
                                "logging_category": "bodyweight"
                            }
                        ],
                        "total": 1500,
                        "page": 1,
                        "limit": 100
                    }
                }
            }
        }
    }
)
async def get_all_exercises(
    body_part: Optional[str] = Query(None, description="Filter by body part"),
    equipment: Optional[str] = Query(None, description="Filter by equipment"),
    target_muscle: Optional[str] = Query(None, description="Filter by target muscle"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results to return"),
    page: int = Query(1, ge=1, description="Page number")
):
    """Get all exercises from ExerciseDB with optional filtering"""
    try:
        # Calculate offset for pagination
        offset = (page - 1) * limit
        
        # Get exercises with filters
        exercises_data = exercise_client.get_exercises(
            limit=limit,
            offset=offset,
            body_part=body_part,
            equipment=equipment,
            target_muscle=target_muscle
        )
        
        # Map to response format
        exercises = [_map_exercisedb_to_response(ex) for ex in exercises_data]
        
        return ExerciseSearchResponse(
            exercises=exercises,
            total=len(exercises),
            page=page,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving exercises: {str(e)}")

@router.get("/categories")
async def get_exercise_categories():
    """Get all exercise categories (body parts) from ExerciseDB"""
    try:
        body_parts = exercise_client.get_exercise_categories()
        
        # Map to our category format
        categories = []
        for body_part in body_parts:
            category_info = map_exercise_category_to_attributes(body_part.get("name", ""))
            categories.append({
                "id": body_part.get("name", ""),
                "name": body_part.get("name", ""),
                "category": body_part.get("name", ""),
                "display_name": body_part.get("name", "").replace("_", " ").title(),
                "description": f"Exercises targeting {body_part.get('name', '')}",
                "logging_attributes": category_info.get("attributes", []),
                "icon": "fitness-outline",
                "color": "#3b82f6"
            })
        
        return {"categories": categories}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving categories: {str(e)}")

@router.get("/body-parts")
async def get_body_parts():
    """Get all body parts from ExerciseDB"""
    try:
        body_parts = exercise_client.get_exercise_categories()
        return {"body_parts": [bp.get("name") for bp in body_parts]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving body parts: {str(e)}")

@router.get("/equipment")
async def get_equipment():
    """Get all equipment types from ExerciseDB"""
    try:
        equipment = exercise_client.get_equipment()
        return {"equipment": [eq.get("name") for eq in equipment]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving equipment: {str(e)}")

@router.get("/muscles")
async def get_muscles():
    """Get all muscles from ExerciseDB"""
    try:
        muscles = exercise_client.get_muscles()
        return {"muscles": muscles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving muscles: {str(e)}")

@router.get(
    "/{exercise_id}",
    response_model=ExerciseResponse,
    summary="Get exercise by ID",
    description="Retrieve a specific exercise by its ExerciseDB ID.",
    responses={
        200: {
            "description": "Exercise retrieved successfully",
        },
        404: {
            "description": "Exercise not found",
        }
    }
)
async def get_exercise_by_id(exercise_id: str):
    """Get a specific exercise by ExerciseDB ID."""
    try:
        exercise_data = exercise_client.get_exercise_by_id(exercise_id)
        
        if not exercise_data:
            raise HTTPException(status_code=404, detail="Exercise not found")
        
        return _map_exercisedb_to_response(exercise_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving exercise: {str(e)}")

@router.get("/by-body-part/{body_part}")
async def get_exercises_by_body_part(
    body_part: str,
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results to return")
):
    """Get exercises for a specific body part"""
    try:
        exercises_data = exercise_client.get_exercises_by_body_part(body_part, limit)
        exercises = [_map_exercisedb_to_response(ex) for ex in exercises_data]
        return {"exercises": exercises, "body_part": body_part, "count": len(exercises)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving exercises for body part: {str(e)}")

@router.get("/by-equipment/{equipment}")
async def get_exercises_by_equipment(
    equipment: str,
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results to return")
):
    """Get exercises for a specific equipment type"""
    try:
        exercises_data = exercise_client.get_exercises_by_equipment(equipment, limit)
        exercises = [_map_exercisedb_to_response(ex) for ex in exercises_data]
        return {"exercises": exercises, "equipment": equipment, "count": len(exercises)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving exercises for equipment: {str(e)}")

@router.get("/by-target-muscle/{target_muscle}")
async def get_exercises_by_target_muscle(
    target_muscle: str,
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results to return")
):
    """Get exercises for a specific target muscle"""
    try:
        exercises_data = exercise_client.get_exercises_by_target_muscle(target_muscle, limit)
        exercises = [_map_exercisedb_to_response(ex) for ex in exercises_data]
        return {"exercises": exercises, "target_muscle": target_muscle, "count": len(exercises)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving exercises for target muscle: {str(e)}")