"""
Action Executors for AI Companion Chat
Implements the actual execution logic for detected actions.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.crud.coaching import goal as goal_crud, workout_log as workout_log_crud, meal_log as meal_log_crud
from app.schemas.coaching import GoalCreate, WorkoutLogCreate, MealLogCreate
from app.models.coaching import Goal, WorkoutLog, MealLog

logger = logging.getLogger(__name__)


class ActionExecutors:
    """Handles execution of detected actions."""
    
    @staticmethod
    def execute_fitness_log_workout(
        db: Session, 
        user_id: str, 
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute fitness.log_workout action."""
        try:
            exercises = params.get("exercises", [])
            if not exercises:
                return {
                    "success": False,
                    "error": "No exercises provided"
                }
            
            # Create workout log
            workout_data = WorkoutLogCreate(
                user_id=user_id,
                exercises=exercises,
                workout_name=params.get("workout_name", "Workout"),
                duration_minutes=params.get("duration_min"),
                notes=params.get("notes", ""),
                logged_at=datetime.fromisoformat(params.get("when", datetime.now(timezone.utc).isoformat()))
            )
            
            workout_log = workout_log_crud.create_with_owner(
                db=db,
                obj_in=workout_data,
                owner_id=user_id
            )
            
            # Check for personal records
            pr_achieved = False
            pr_details = ""
            
            # Simple PR detection (could be enhanced)
            for exercise in exercises:
                if exercise.get("weight_kg") or exercise.get("weight_lbs"):
                    # This is a simplified PR check - in reality you'd compare against previous workouts
                    pr_achieved = True
                    pr_details = f"Great work on {exercise['name']}!"
                    break
            
            return {
                "success": True,
                "workout_id": str(workout_log.id),
                "status": "logged",
                "exercises_logged": len(exercises),
                "pr_achieved": pr_achieved,
                "pr_details": pr_details,
                "undo_token": f"workout_{workout_log.id}"
            }
            
        except Exception as e:
            logger.error(f"Error executing fitness.log_workout: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def execute_nutrition_log_meal(
        db: Session, 
        user_id: str, 
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute nutrition.log_meal action."""
        try:
            items = params.get("items", [])
            if not items:
                return {
                    "success": False,
                    "error": "No food items provided"
                }
            
            # Create meal log
            meal_data = MealLogCreate(
                user_id=user_id,
                food_items=", ".join(items),
                estimated_calories=params.get("est_kcal"),
                estimated_protein=params.get("est_protein_g"),
                notes=params.get("notes", ""),
                logged_at=datetime.fromisoformat(params.get("when", datetime.now(timezone.utc).isoformat()))
            )
            
            meal_log = meal_log_crud.create_with_owner(
                db=db,
                obj_in=meal_data,
                owner_id=user_id
            )
            
            return {
                "success": True,
                "meal_id": str(meal_log.id),
                "status": "logged",
                "items_logged": len(items),
                "undo_token": f"meal_{meal_log.id}"
            }
            
        except Exception as e:
            logger.error(f"Error executing nutrition.log_meal: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def execute_coaching_create_goal(
        db: Session, 
        user_id: str, 
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute coaching.create_goal action."""
        try:
            name = params.get("name", "")
            if not name:
                return {
                    "success": False,
                    "error": "No goal name provided"
                }
            
            # Create goal
            goal_data = GoalCreate(
                title=name,
                category=params.get("category", "other"),
                description=f"Goal created from chat: {name}",
                target_value=1,  # Default target
                current_value=0,
                unit="count",
                user_id=user_id
            )
            
            goal = goal_crud.create_with_owner(
                db=db,
                obj_in=goal_data,
                owner_id=user_id
            )
            
            return {
                "success": True,
                "goal_id": str(goal.id),
                "status": "created",
                "undo_token": f"goal_{goal.id}"
            }
            
        except Exception as e:
            logger.error(f"Error executing coaching.create_goal: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def execute_journal_add_entry(
        db: Session, 
        user_id: str, 
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute journal.add_entry action."""
        try:
            content = params.get("content", "")
            if not content:
                return {
                    "success": False,
                    "error": "No journal content provided"
                }
            
            # For now, we'll store journal entries as memories
            from app.memory.service import memory_service
            
            memory_service.store_memory(
                db=db,
                content=content,
                content_type="journal",
                user_id=user_id,
                metadata={"auto_captured": False, "source": "chat_action"}
            )
            
            return {
                "success": True,
                "entry_id": f"journal_{datetime.now().timestamp()}",
                "status": "saved",
                "undo_token": f"journal_{datetime.now().timestamp()}"
            }
            
        except Exception as e:
            logger.error(f"Error executing journal.add_entry: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Global instance
action_executors = ActionExecutors()
