"""
Simplified Health Goals API - Single endpoint for all goal types
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/goals")
async def get_health_goals(
    goal_type: Optional[str] = Query(None, description="Filter by goal type: weight, fitness, nutrition, general"),
    status: Optional[str] = Query(None, description="Filter by status: active, completed, paused, cancelled"),
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all health goals for the user with optional filtering"""
    try:
        query = "SELECT * FROM user_health_goals_simple WHERE user_id = :user_id"
        params = {"user_id": current_user.id}
        
        if goal_type:
            query += " AND goal_type = :goal_type"
            params["goal_type"] = goal_type
            
        if status:
            query += " AND status = :status"
            params["status"] = status
            
        query += " ORDER BY created_at DESC"
        
        result = db.execute(text(query), params)
        goals = result.fetchall()
        
        # Convert to list of dictionaries
        goal_list = []
        for goal in goals:
            goal_dict = {
                "id": goal[0],
                "user_id": goal[1],
                "goal_type": goal[2],
                "title": goal[3],
                "description": goal[4],
                "target_value": goal[5],
                "current_value": goal[6],
                "unit": goal[7],
                "target_date": goal[8],
                "priority": goal[9],
                "status": goal[10],
                "metadata": json.loads(goal[11]) if goal[11] else {},
                "created_at": goal[12],
                "updated_at": goal[13]
            }
            goal_list.append(goal_dict)
        
        return goal_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch goals: {str(e)}")

@router.post("/goals")
async def create_health_goal(
    goal_data: dict,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new health goal"""
    try:
        import uuid
        from datetime import datetime
        
        goal_id = str(uuid.uuid4())
        
        # Extract data from request
        goal_type = goal_data.get("goal_type", "general")
        title = goal_data.get("title", "New Goal")
        description = goal_data.get("description", "")
        target_value = goal_data.get("target_value")
        current_value = goal_data.get("current_value")
        unit = goal_data.get("unit", "")
        target_date = goal_data.get("target_date")
        priority = goal_data.get("priority", "medium")
        status = goal_data.get("status", "active")
        metadata = goal_data.get("metadata", {})
        
        # Insert new goal
        query = """
            INSERT INTO user_health_goals_simple 
            (id, user_id, goal_type, title, description, target_value, current_value, unit, target_date, priority, status, metadata, created_at, updated_at)
            VALUES (:id, :user_id, :goal_type, :title, :description, :target_value, :current_value, :unit, :target_date, :priority, :status, :metadata, :created_at, :updated_at)
        """
        
        params = {
            "id": goal_id,
            "user_id": current_user.id,
            "goal_type": goal_type,
            "title": title,
            "description": description,
            "target_value": target_value,
            "current_value": current_value,
            "unit": unit,
            "target_date": target_date,
            "priority": priority,
            "status": status,
            "metadata": json.dumps(metadata),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        db.execute(text(query), params)
        db.commit()
        
        return {"id": goal_id, "message": "Goal created successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create goal: {str(e)}")

@router.put("/goals/{goal_id}")
async def update_health_goal(
    goal_id: str,
    goal_data: dict,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing health goal"""
    try:
        from datetime import datetime
        
        # Check if goal exists and belongs to user
        check_query = "SELECT id FROM user_health_goals_simple WHERE id = :goal_id AND user_id = :user_id"
        result = db.execute(text(check_query), {"goal_id": goal_id, "user_id": current_user.id})
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Build update query dynamically
        update_fields = []
        params = {"goal_id": goal_id, "user_id": current_user.id}
        
        for field in ["title", "description", "target_value", "current_value", "unit", "target_date", "priority", "status"]:
            if field in goal_data:
                update_fields.append(f"{field} = :{field}")
                params[field] = goal_data[field]
        
        if "metadata" in goal_data:
            update_fields.append("metadata = :metadata")
            params["metadata"] = json.dumps(goal_data["metadata"])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = :updated_at")
        params["updated_at"] = datetime.now().isoformat()
        
        query = f"UPDATE user_health_goals_simple SET {', '.join(update_fields)} WHERE id = :goal_id AND user_id = :user_id"
        
        db.execute(text(query), params)
        db.commit()
        
        return {"message": "Goal updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update goal: {str(e)}")

@router.delete("/goals/{goal_id}")
async def delete_health_goal(
    goal_id: str,
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a health goal"""
    try:
        # Check if goal exists and belongs to user
        check_query = "SELECT id FROM user_health_goals_simple WHERE id = :goal_id AND user_id = :user_id"
        result = db.execute(text(check_query), {"goal_id": goal_id, "user_id": current_user.id})
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Delete goal
        delete_query = "DELETE FROM user_health_goals_simple WHERE id = :goal_id AND user_id = :user_id"
        db.execute(text(delete_query), {"goal_id": goal_id, "user_id": current_user.id})
        db.commit()
        
        return {"message": "Goal deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete goal: {str(e)}")

@router.get("/goals/summary")
async def get_goals_summary(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a summary of all goals by type and status"""
    try:
        # Get counts by type
        type_query = """
            SELECT goal_type, COUNT(*) as count 
            FROM user_health_goals_simple 
            WHERE user_id = :user_id 
            GROUP BY goal_type
        """
        type_result = db.execute(text(type_query), {"user_id": current_user.id})
        type_counts = {row[0]: row[1] for row in type_result.fetchall()}
        
        # Get counts by status
        status_query = """
            SELECT status, COUNT(*) as count 
            FROM user_health_goals_simple 
            WHERE user_id = :user_id 
            GROUP BY status
        """
        status_result = db.execute(text(status_query), {"user_id": current_user.id})
        status_counts = {row[0]: row[1] for row in status_result.fetchall()}
        
        # Get total count
        total_query = "SELECT COUNT(*) FROM user_health_goals_simple WHERE user_id = :user_id"
        total_result = db.execute(text(total_query), {"user_id": current_user.id})
        total_count = total_result.fetchone()[0]
        
        return {
            "total_goals": total_count,
            "by_type": type_counts,
            "by_status": status_counts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch goals summary: {str(e)}")
