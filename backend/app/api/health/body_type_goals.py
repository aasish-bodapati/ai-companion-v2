"""
Body Type Goals API endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...api.deps import get_current_user
from ...models.user import User
from ...crud.health.body_type_goals import body_type_goal
from ...schemas.health.body_type_goals import BodyTypeGoal, BodyTypeGoalList

router = APIRouter()


@router.get("/", response_model=BodyTypeGoalList)
def get_body_type_goals(
    category: str = None,
    created_by: str = None,
    db: Session = Depends(get_db)
):
    """Get all active body type goals, optionally filtered by category or created_by"""
    if created_by:
        # Convert string to integer if needed
        try:
            created_by_id = int(created_by) if isinstance(created_by, str) else created_by
            goals = body_type_goal.get_by_created_by(db, created_by=created_by_id)
        except (ValueError, TypeError):
            goals = []
    elif category:
        goals = body_type_goal.get_by_category(db, category=category)
    else:
        goals = body_type_goal.get_active_goals(db)
    
    return BodyTypeGoalList(
        body_type_goals=goals,
        total=len(goals)
    )


@router.get("/system", response_model=BodyTypeGoalList)
def get_system_body_type_goals(db: Session = Depends(get_db)):
    """Get all system-created body type goals"""
    goals = body_type_goal.get_system_goals(db)
    return BodyTypeGoalList(
        body_type_goals=goals,
        total=len(goals)
    )


@router.get("/user", response_model=BodyTypeGoalList)
def get_user_body_type_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all user-created body type goals for the current user"""
    goals = body_type_goal.get_user_goals(db, user_id=current_user.id)
    return BodyTypeGoalList(
        body_type_goals=goals,
        total=len(goals)
    )


@router.get("/{goal_id}", response_model=BodyTypeGoal)
def get_body_type_goal(
    goal_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific body type goal by ID"""
    goal = body_type_goal.get_by_id(db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Body type goal not found")
    return goal
