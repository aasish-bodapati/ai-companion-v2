"""
Body Type Goals API endpoints - Enhanced with custom goal creation
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from datetime import datetime

from ...db.session import get_db
from ...api.deps import get_current_user
from ...models.user import User
from ...models.health.body_type_goals import BodyTypeGoal

router = APIRouter()

# Pydantic schemas
class BodyTypeGoalCreate(BaseModel):
    name: str
    description: str
    icon: str = "fitness-outline"
    color: str = "#3b82f6"
    target_bmi: float
    target_body_fat: Optional[float] = None
    target_attributes: dict

class BodyTypeGoalResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    icon: str
    color: str
    target_bmi: float
    target_body_fat: Optional[float] = None
    target_attributes: dict
    created_by: str
    is_active: bool
    sort_order: int

# Hardcoded system body type goals
SYSTEM_BODY_TYPE_GOALS = [
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
            "body_fat_range_men": {"min": 10, "max": 20, "recommended": 15, "unit": "%"},
            "body_fat_range_women": {"min": 16, "max": 25, "recommended": 20, "unit": "%"},
            "ffmi_range_men": {"min": 18, "max": 22, "recommended": 20, "unit": "kg/m²"},
            "ffmi_range_women": {"min": 14, "max": 18, "recommended": 16, "unit": "kg/m²"},
            "smm_level": "moderate",
            "protein_per_kg_men": {"min": 1.6, "max": 2.2, "recommended": 1.8, "unit": "g/kg"},
            "protein_per_kg_women": {"min": 1.4, "max": 2.0, "recommended": 1.6, "unit": "g/kg"},
            "calorie_target": "maintenance",
            "workout_focus": "balanced strength and cardio",
            "workout_frequency": {"min": 3, "max": 5, "recommended": 4, "unit": "days/week"},
            "cardio_minutes": {"min": 150, "max": 300, "recommended": 225, "unit": "min/week"},
            "strength_sessions": {"min": 2, "max": 4, "recommended": 3, "unit": "sessions/week"},
            "water_goal": {"min": 2.5, "max": 3.5, "recommended": 3.0, "unit": "L/day"},
            "sleep_duration": {"min": 7, "max": 9, "recommended": 8, "unit": "hours"},
            "daily_steps": {"min": 8000, "max": 12000, "recommended": 10000, "unit": "steps"},
            "recovery_days": {"min": 1, "max": 3, "recommended": 2, "unit": "days/week"}
        },
        "is_active": True,
        "sort_order": 1
    }
]

@router.get("/", response_model=List[BodyTypeGoalResponse])
def get_body_type_goals(
    category: Optional[str] = None,
    created_by: Optional[str] = None,
    include_custom: bool = True,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get all active body type goals, optionally filtered by category or created_by"""
    goals = []
    
    # Add system goals
    system_goals = SYSTEM_BODY_TYPE_GOALS.copy()
    if category:
        system_goals = [goal for goal in system_goals if goal.get("category") == category]
    if created_by == "system":
        goals.extend(system_goals)
    elif created_by is None:
        goals.extend(system_goals)
    
    # Add custom goals if requested and user is authenticated
    if include_custom and current_user:
        custom_goals = db.query(BodyTypeGoal).filter(
            BodyTypeGoal.is_active == True
        ).all()
        
        for goal in custom_goals:
            goal_data = {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "category": goal.category,
                "icon": goal.icon,
                "color": goal.color,
                "target_bmi": goal.target_bmi,
                "target_body_fat": goal.target_body_fat,
                "target_attributes": goal.target_attributes,
                "created_by": "user" if goal.created_by else "system",
                "is_active": goal.is_active,
                "sort_order": goal.sort_order
            }
            
            if category and goal_data.get("category") != category:
                continue
            if created_by == "user" and goal_data.get("created_by") != "user":
                continue
            if created_by == "system" and goal_data.get("created_by") != "system":
                continue
                
            goals.append(goal_data)
    
    return goals

@router.get("/system", response_model=List[BodyTypeGoalResponse])
def get_system_body_type_goals(db: Session = Depends(get_db)):
    """Get all system-created body type goals"""
    return SYSTEM_BODY_TYPE_GOALS

@router.get("/user", response_model=List[BodyTypeGoalResponse])
def get_user_body_type_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all user-created body type goals for the current user"""
    user_goals = db.query(BodyTypeGoal).filter(
        BodyTypeGoal.created_by == current_user.id,
        BodyTypeGoal.is_active == True
    ).all()
    
    goals = []
    for goal in user_goals:
        goals.append({
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "category": goal.category,
            "icon": goal.icon,
            "color": goal.color,
            "target_bmi": goal.target_bmi,
            "target_body_fat": goal.target_body_fat,
            "target_attributes": goal.target_attributes,
            "created_by": "user",
            "is_active": goal.is_active,
            "sort_order": goal.sort_order
        })
    
    return goals

@router.post("/", response_model=BodyTypeGoalResponse)
def create_body_type_goal(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    goal_data: BodyTypeGoalCreate
):
    """Create a new custom body type goal"""
    try:
        # Generate unique ID
        goal_id = f"custom-{current_user.id}-{uuid.uuid4().hex[:8]}"
        
        # Create new body type goal
        new_goal = BodyTypeGoal(
            id=goal_id,
            name=goal_data.name,
            description=goal_data.description,
            category="body_type",
            icon=goal_data.icon,
            color=goal_data.color,
            target_bmi=goal_data.target_bmi,
            target_body_fat=goal_data.target_body_fat,
            target_attributes=goal_data.target_attributes,
            created_by=current_user.id,
            is_active=True,
            sort_order=999  # Custom goals at the end
        )
        
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        
        return {
            "id": new_goal.id,
            "name": new_goal.name,
            "description": new_goal.description,
            "category": new_goal.category,
            "icon": new_goal.icon,
            "color": new_goal.color,
            "target_bmi": new_goal.target_bmi,
            "target_body_fat": new_goal.target_body_fat,
            "target_attributes": new_goal.target_attributes,
            "created_by": "user",
            "is_active": new_goal.is_active,
            "sort_order": new_goal.sort_order
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create body type goal: {str(e)}")

@router.get("/{goal_id}", response_model=BodyTypeGoalResponse)
def get_body_type_goal(
    goal_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific body type goal by ID"""
    # Check system goals first
    for goal in SYSTEM_BODY_TYPE_GOALS:
        if goal["id"] == goal_id:
            return goal
    
    # Check database for custom goals
    goal = db.query(BodyTypeGoal).filter(
        BodyTypeGoal.id == goal_id,
        BodyTypeGoal.is_active == True
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Body type goal not found")
    
    return {
        "id": goal.id,
        "name": goal.name,
        "description": goal.description,
        "category": goal.category,
        "icon": goal.icon,
        "color": goal.color,
        "target_bmi": goal.target_bmi,
        "target_body_fat": goal.target_body_fat,
        "target_attributes": goal.target_attributes,
        "created_by": "user" if goal.created_by else "system",
        "is_active": goal.is_active,
        "sort_order": goal.sort_order
    }

@router.put("/{goal_id}", response_model=BodyTypeGoalResponse)
def update_body_type_goal(
    goal_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    goal_data: BodyTypeGoalCreate
):
    """Update a custom body type goal (only user's own goals)"""
    # Check if it's a system goal
    for goal in SYSTEM_BODY_TYPE_GOALS:
        if goal["id"] == goal_id:
            raise HTTPException(status_code=403, detail="Cannot modify system goals")
    
    # Get user's custom goal
    goal = db.query(BodyTypeGoal).filter(
        BodyTypeGoal.id == goal_id,
        BodyTypeGoal.created_by == current_user.id,
        BodyTypeGoal.is_active == True
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Body type goal not found or not owned by user")
    
    try:
        # Update goal
        goal.name = goal_data.name
        goal.description = goal_data.description
        goal.icon = goal_data.icon
        goal.color = goal_data.color
        goal.target_bmi = goal_data.target_bmi
        goal.target_body_fat = goal_data.target_body_fat
        goal.target_attributes = goal_data.target_attributes
        
        db.commit()
        db.refresh(goal)
        
        return {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "category": goal.category,
            "icon": goal.icon,
            "color": goal.color,
            "target_bmi": goal.target_bmi,
            "target_body_fat": goal.target_body_fat,
            "target_attributes": goal.target_attributes,
            "created_by": "user",
            "is_active": goal.is_active,
            "sort_order": goal.sort_order
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update body type goal: {str(e)}")

@router.delete("/{goal_id}")
def delete_body_type_goal(
    goal_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a custom body type goal (only user's own goals)"""
    # Check if it's a system goal
    for goal in SYSTEM_BODY_TYPE_GOALS:
        if goal["id"] == goal_id:
            raise HTTPException(status_code=403, detail="Cannot delete system goals")
    
    # Get user's custom goal
    goal = db.query(BodyTypeGoal).filter(
        BodyTypeGoal.id == goal_id,
        BodyTypeGoal.created_by == current_user.id,
        BodyTypeGoal.is_active == True
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Body type goal not found or not owned by user")
    
    try:
        # Soft delete by setting is_active to False
        goal.is_active = False
        db.commit()
        
        return {"message": "Body type goal deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete body type goal: {str(e)}")