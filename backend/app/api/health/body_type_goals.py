"""
Body Type Goals API endpoints - Simplified with JSON data
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...api.deps import get_current_user
from ...models.user import User

router = APIRouter()

# Hardcoded body type goals data - Single "Balanced & Fit" option
BODY_TYPE_GOALS = [
    {
        "id": "balanced-fit-001",
        "name": "Balanced & Fit",
        "description": "You want to stay active, feel strong, and look fit — without going to extremes. A balanced, sustainable approach focused on daily movement, smart nutrition, and overall well-being.",
        "category": "body_type",
        "icon": "scale-outline",
        "color": "#10b981",
        "target_bmi": 21.5,
        "target_body_fat": 18,
        "created_by": "system",
        "target_attributes": {
            "target_bmi_range": {"min": 20, "max": 23, "recommended": 21.5, "unit": "kg/m²"},
            "body_fat_range_men": {"min": 16, "max": 20, "recommended": 18, "unit": "%"},
            "body_fat_range_women": {"min": 21, "max": 25, "recommended": 23, "unit": "%"},
            "ffmi_range_men": {"min": 19, "max": 21, "recommended": 20, "unit": "kg/m²"},
            "ffmi_range_women": {"min": 18, "max": 20, "recommended": 19, "unit": "kg/m²"},
            "smm_range_men": {"min": 38, "max": 43, "recommended": 40.5, "unit": "% body weight"},
            "smm_range_women": {"min": 36, "max": 41, "recommended": 38.5, "unit": "% body weight"},
            "smm_level": "Balanced",
            "protein_per_kg_men": {"min": 1.4, "max": 1.8, "recommended": 1.6, "unit": "g/kg"},
            "protein_per_kg_women": {"min": 1.4, "max": 1.8, "recommended": 1.6, "unit": "g/kg"},
            "calorie_target": "Maintenance (±5%)",
            "workout_focus": "Strength training + cardio + mobility",
            "workout_frequency": {"min": 4, "max": 6, "recommended": 5, "unit": "days/week"},
            "strength_sessions": {"min": 3, "max": 4, "recommended": 3, "unit": "sessions/week"},
            "cardio_minutes": {"min": 120, "max": 180, "recommended": 150, "unit": "minutes/week"},
            "water_goal": {"min": 2.5, "max": 3.5, "recommended": 3.0, "unit": "L/day"},
            "sleep_duration": {"min": 7, "max": 9, "recommended": 8, "unit": "hours/night"},
            "daily_steps": {"min": 7000, "max": 10000, "recommended": 8500, "unit": "steps/day"},
            "recovery_days": {"min": 1, "max": 2, "recommended": 1, "unit": "days/week"}
        }
    }
]


@router.get("/")
def get_body_type_goals(
    category: str = None,
    created_by: str = None,
    db: Session = Depends(get_db)
):
    """Get all active body type goals, optionally filtered by category or created_by"""
    goals = BODY_TYPE_GOALS.copy()
    
    if category:
        goals = [goal for goal in goals if goal.get("category") == category]
    
    if created_by:
        goals = [goal for goal in goals if goal.get("created_by") == created_by]
    
    return {
        "body_type_goals": goals,
        "total": len(goals)
    }


@router.get("/system")
def get_system_body_type_goals(db: Session = Depends(get_db)):
    """Get all system-created body type goals"""
    goals = [goal for goal in BODY_TYPE_GOALS if goal.get("created_by") == "system"]
    return {
        "body_type_goals": goals,
        "total": len(goals)
    }


@router.get("/user")
def get_user_body_type_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all user-created body type goals for the current user"""
    # For now, return empty array since we're using hardcoded system goals
    # In the future, this could pull from user.goals JSON field
    return {
        "body_type_goals": [],
        "total": 0
    }


@router.get("/{goal_id}")
def get_body_type_goal(
    goal_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific body type goal by ID"""
    goal = next((goal for goal in BODY_TYPE_GOALS if goal["id"] == goal_id), None)
    if not goal:
        raise HTTPException(status_code=404, detail="Body type goal not found")
    return goal
