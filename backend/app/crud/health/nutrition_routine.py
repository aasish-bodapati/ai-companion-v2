from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
import uuid
import json
from datetime import datetime

from app.crud.base import CRUDBase
from app.models.health.nutrition_routine import (
    NutritionRoutine, 
    NutritionMealPlan, 
    NutritionMeal, 
    NutritionMealFood,
    NutritionUserRoutineProgress
)
from app.schemas.health.nutrition_routine import (
    NutritionRoutineCreate, 
    NutritionRoutineUpdate,
    NutritionMealPlanCreate,
    NutritionMealCreate,
    NutritionMealFoodCreate,
    NutritionUserRoutineProgressCreate
)


class CRUDNutritionRoutine(CRUDBase[NutritionRoutine, NutritionRoutineCreate, NutritionRoutineUpdate]):
    def create(self, db: Session, *, obj_in: NutritionRoutineCreate) -> NutritionRoutine:
        """Create a nutrition routine with proper tags handling."""
        obj_in_data = obj_in.dict()
        
        # Convert tags to JSON string for SQLite
        if "tags" in obj_in_data and obj_in_data["tags"] is not None:
            if isinstance(obj_in_data["tags"], list):
                obj_in_data["tags"] = json.dumps(obj_in_data["tags"])
            elif isinstance(obj_in_data["tags"], str):
                # Already a string, keep as is
                pass
            else:
                obj_in_data["tags"] = json.dumps([])
        else:
            obj_in_data["tags"] = json.dumps([])
        
        db_obj = NutritionRoutine(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, *, db_obj: NutritionRoutine, obj_in: NutritionRoutineUpdate) -> NutritionRoutine:
        """Update a nutrition routine with proper tags handling."""
        update_data = obj_in.dict(exclude_unset=True)
        
        # Handle tags serialization
        if "tags" in update_data and update_data["tags"] is not None:
            if isinstance(update_data["tags"], list):
                update_data["tags"] = json.dumps(update_data["tags"])
            elif isinstance(update_data["tags"], str):
                # Already a string, keep as is
                pass
            else:
                update_data["tags"] = json.dumps([])
        
        # Ensure existing tags are serialized if they're lists
        if hasattr(db_obj, 'tags') and isinstance(db_obj.tags, list):
            db_obj.tags = json.dumps(db_obj.tags)
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def _deserialize_tags(self, routine: NutritionRoutine) -> NutritionRoutine:
        """Deserialize tags from JSON string to list."""
        if routine.tags:
            if isinstance(routine.tags, str):
                try:
                    routine.tags = json.loads(routine.tags)
                except (json.JSONDecodeError, TypeError):
                    routine.tags = []
            elif isinstance(routine.tags, list):
                # Already deserialized, keep as is
                pass
            else:
                routine.tags = []
        else:
            routine.tags = []
        return routine
    
    def get(self, db: Session, id: Any) -> Optional[NutritionRoutine]:
        """Get a single routine by ID with deserialized tags."""
        routine = super().get(db, id)
        if routine:
            return self._deserialize_tags(routine)
        return routine

    def get_user_routines(self, db: Session, *, user_id: str, skip: int = 0, limit: int = 100) -> List[NutritionRoutine]:
        """Get routines created by a specific user."""
        routines = db.query(NutritionRoutine).filter(
            NutritionRoutine.created_by_user_id == user_id
        ).offset(skip).limit(limit).all()
        return [self._deserialize_tags(routine) for routine in routines]
    
    def get_templates(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[NutritionRoutine]:
        """Get template routines."""
        routines = db.query(NutritionRoutine).filter(
            NutritionRoutine.is_template == True
        ).offset(skip).limit(limit).all()
        return [self._deserialize_tags(routine) for routine in routines]
    
    def get_user_created_only(self, db: Session, *, user_id: str, skip: int = 0, limit: int = 100) -> List[NutritionRoutine]:
        """Get only user-created routines (no templates)."""
        routines = db.query(NutritionRoutine).filter(
            and_(
                NutritionRoutine.created_by_user_id == user_id,
                NutritionRoutine.is_template == False
            )
        ).offset(skip).limit(limit).all()
        return [self._deserialize_tags(routine) for routine in routines]
    
    def create_with_meal_plans(self, db: Session, *, routine_data: NutritionRoutineCreate, 
                              meal_plans_data: List[Dict[str, Any]], user_id: str) -> NutritionRoutine:
        """Create a routine with detailed meal plans."""
        # Create the routine
        routine_dict = routine_data.dict()
        routine_dict["created_by_user_id"] = user_id
        routine_dict["is_template"] = False
        
        # Convert tags to JSON string for SQLite
        if "tags" in routine_dict and routine_dict["tags"] is not None:
            if isinstance(routine_dict["tags"], list):
                routine_dict["tags"] = json.dumps(routine_dict["tags"])
            elif isinstance(routine_dict["tags"], str):
                # Already a string, keep as is
                pass
            else:
                routine_dict["tags"] = json.dumps([])
        else:
            routine_dict["tags"] = json.dumps([])
        
        routine = NutritionRoutine(**routine_dict)
        db.add(routine)
        db.flush()  # Get the ID
        
        # Create meal plans
        for meal_plan_data in meal_plans_data:
            meal_plan_dict = meal_plan_data.copy()
            meal_plan_dict["routine_id"] = routine.id
            meal_plan_dict["id"] = str(uuid.uuid4())
            
            # Remove 'meals' field as it's a relationship, not a column
            meals_data = meal_plan_dict.pop("meals", [])
            
            # Convert datetime strings to datetime objects for meal plan
            if "created_at" in meal_plan_dict and isinstance(meal_plan_dict["created_at"], str):
                from datetime import datetime
                meal_plan_dict["created_at"] = datetime.fromisoformat(meal_plan_dict["created_at"].replace('Z', '+00:00'))
            if "updated_at" in meal_plan_dict and isinstance(meal_plan_dict["updated_at"], str):
                from datetime import datetime
                meal_plan_dict["updated_at"] = datetime.fromisoformat(meal_plan_dict["updated_at"].replace('Z', '+00:00'))
            
            meal_plan = NutritionMealPlan(**meal_plan_dict)
            db.add(meal_plan)
            db.flush()
            
            # Create meals for this meal plan
            for meal_data in meals_data:
                meal_dict = meal_data.copy()
                meal_dict["meal_plan_id"] = meal_plan.id
                meal_dict["id"] = str(uuid.uuid4())
                
                # Remove 'food_items' field as it's a relationship, not a column
                food_items_data = meal_dict.pop("food_items", [])
                
                # Convert datetime strings to datetime objects for meal
                if "created_at" in meal_dict and isinstance(meal_dict["created_at"], str):
                    from datetime import datetime
                    meal_dict["created_at"] = datetime.fromisoformat(meal_dict["created_at"].replace('Z', '+00:00'))
                if "updated_at" in meal_dict and isinstance(meal_dict["updated_at"], str):
                    from datetime import datetime
                    meal_dict["updated_at"] = datetime.fromisoformat(meal_dict["updated_at"].replace('Z', '+00:00'))
                
                meal = NutritionMeal(**meal_dict)
                db.add(meal)
                db.flush()
                
                # Create food items for this meal
                for food_data in food_items_data:
                    food_dict = food_data.copy()
                    food_dict["meal_id"] = meal.id
                    food_dict["id"] = str(uuid.uuid4())
                    
                    # Convert datetime strings to datetime objects
                    if "created_at" in food_dict and isinstance(food_dict["created_at"], str):
                        from datetime import datetime
                        food_dict["created_at"] = datetime.fromisoformat(food_dict["created_at"].replace('Z', '+00:00'))
                    if "updated_at" in food_dict and isinstance(food_dict["updated_at"], str):
                        from datetime import datetime
                        food_dict["updated_at"] = datetime.fromisoformat(food_dict["updated_at"].replace('Z', '+00:00'))
                    
                    food = NutritionMealFood(**food_dict)
                    db.add(food)
        
        db.commit()
        db.refresh(routine)
        return self._deserialize_tags(routine)
    
    def update_with_meal_plans(self, db: Session, *, routine_id: str, routine_data: NutritionRoutineUpdate,
                              meal_plans_data: List[Dict[str, Any]], user_id: str) -> Optional[NutritionRoutine]:
        """Update a routine with detailed meal plans."""
        routine = self.get(db, id=routine_id)
        if not routine or routine.created_by_user_id != user_id:
            return None
        
        # Update routine basic info
        update_data = routine_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "tags" and isinstance(value, list):
                # Serialize tags list to JSON string for SQLite
                setattr(routine, field, json.dumps(value))
            else:
                setattr(routine, field, value)
        
        # Ensure tags is serialized if it's a list (from get method)
        if hasattr(routine, 'tags') and isinstance(routine.tags, list):
            routine.tags = json.dumps(routine.tags)
        
        # Delete existing meal plans and related data
        existing_meal_plans = db.query(NutritionMealPlan).filter(
            NutritionMealPlan.routine_id == routine_id
        ).all()
        
        for meal_plan in existing_meal_plans:
            # Delete food items
            db.query(NutritionMealFood).filter(
                NutritionMealFood.meal_id.in_(
                    db.query(NutritionMeal.id).filter(NutritionMeal.meal_plan_id == meal_plan.id)
                )
            ).delete(synchronize_session=False)
            
            # Delete meals
            db.query(NutritionMeal).filter(NutritionMeal.meal_plan_id == meal_plan.id).delete()
            
            # Delete meal plan
            db.delete(meal_plan)
        
        # Create new meal plans
        for meal_plan_data in meal_plans_data:
            meal_plan_dict = meal_plan_data.copy()
            meal_plan_dict["routine_id"] = routine.id
            meal_plan_dict["id"] = str(uuid.uuid4())
            
            # Remove 'meals' field as it's a relationship, not a column
            meals_data = meal_plan_dict.pop("meals", [])
            
            # Convert datetime strings to datetime objects for meal plan
            if "created_at" in meal_plan_dict and isinstance(meal_plan_dict["created_at"], str):
                from datetime import datetime
                meal_plan_dict["created_at"] = datetime.fromisoformat(meal_plan_dict["created_at"].replace('Z', '+00:00'))
            if "updated_at" in meal_plan_dict and isinstance(meal_plan_dict["updated_at"], str):
                from datetime import datetime
                meal_plan_dict["updated_at"] = datetime.fromisoformat(meal_plan_dict["updated_at"].replace('Z', '+00:00'))
            
            meal_plan = NutritionMealPlan(**meal_plan_dict)
            db.add(meal_plan)
            db.flush()
            
            # Create meals for this meal plan
            for meal_data in meals_data:
                meal_dict = meal_data.copy()
                meal_dict["meal_plan_id"] = meal_plan.id
                meal_dict["id"] = str(uuid.uuid4())
                
                # Remove 'food_items' field as it's a relationship, not a column
                food_items_data = meal_dict.pop("food_items", [])
                
                # Convert datetime strings to datetime objects for meal
                if "created_at" in meal_dict and isinstance(meal_dict["created_at"], str):
                    from datetime import datetime
                    meal_dict["created_at"] = datetime.fromisoformat(meal_dict["created_at"].replace('Z', '+00:00'))
                if "updated_at" in meal_dict and isinstance(meal_dict["updated_at"], str):
                    from datetime import datetime
                    meal_dict["updated_at"] = datetime.fromisoformat(meal_dict["updated_at"].replace('Z', '+00:00'))
                
                meal = NutritionMeal(**meal_dict)
                db.add(meal)
                db.flush()
                
                # Create food items for this meal
                for food_data in food_items_data:
                    food_dict = food_data.copy()
                    food_dict["meal_id"] = meal.id
                    food_dict["id"] = str(uuid.uuid4())
                    
                    # Convert datetime strings to datetime objects
                    if "created_at" in food_dict and isinstance(food_dict["created_at"], str):
                        from datetime import datetime
                        food_dict["created_at"] = datetime.fromisoformat(food_dict["created_at"].replace('Z', '+00:00'))
                    if "updated_at" in food_dict and isinstance(food_dict["updated_at"], str):
                        from datetime import datetime
                        food_dict["updated_at"] = datetime.fromisoformat(food_dict["updated_at"].replace('Z', '+00:00'))
                    
                    food = NutritionMealFood(**food_dict)
                    db.add(food)
        
        db.commit()
        db.refresh(routine)
        return self._deserialize_tags(routine)


class CRUDNutritionMealPlan(CRUDBase[NutritionMealPlan, NutritionMealPlanCreate, NutritionMealPlanCreate]):
    def get_by_routine(self, db: Session, *, routine_id: str) -> List[NutritionMealPlan]:
        """Get all meal plans for a routine."""
        return db.query(NutritionMealPlan).filter(
            NutritionMealPlan.routine_id == routine_id
        ).order_by(NutritionMealPlan.day_order).all()


class CRUDNutritionMeal(CRUDBase[NutritionMeal, NutritionMealCreate, NutritionMealCreate]):
    def get_by_meal_plan(self, db: Session, *, meal_plan_id: str) -> List[NutritionMeal]:
        """Get all meals for a meal plan."""
        return db.query(NutritionMeal).filter(
            NutritionMeal.meal_plan_id == meal_plan_id
        ).order_by(NutritionMeal.order_index).all()


class CRUDNutritionMealFood(CRUDBase[NutritionMealFood, NutritionMealFoodCreate, NutritionMealFoodCreate]):
    def get_by_meal(self, db: Session, *, meal_id: str) -> List[NutritionMealFood]:
        """Get all food items for a meal."""
        return db.query(NutritionMealFood).filter(
            NutritionMealFood.meal_id == meal_id
        ).order_by(NutritionMealFood.order_index).all()


class CRUDNutritionUserRoutineProgress(CRUDBase[NutritionUserRoutineProgress, NutritionUserRoutineProgressCreate, NutritionUserRoutineProgressCreate]):
    def get_user_active_routine(self, db: Session, *, user_id: str) -> Optional[NutritionUserRoutineProgress]:
        """Get user's currently active nutrition routine."""
        return db.query(NutritionUserRoutineProgress).filter(
            and_(
                NutritionUserRoutineProgress.user_id == user_id,
                NutritionUserRoutineProgress.is_active == True
            )
        ).first()
    
    def get_user_routines(self, db: Session, *, user_id: str, skip: int = 0, limit: int = 100) -> List[NutritionUserRoutineProgress]:
        """Get all nutrition routines for a user."""
        return db.query(NutritionUserRoutineProgress).filter(
            NutritionUserRoutineProgress.user_id == user_id
        ).offset(skip).limit(limit).all()
    
    def start_routine(self, db: Session, *, routine_id: str, user_id: str) -> NutritionUserRoutineProgress:
        """Start following a nutrition routine."""
        # Deactivate any current active routine
        current_progress = self.get_user_active_routine(db, user_id=user_id)
        if current_progress:
            current_progress.is_active = False
        
        # Fix any routines with deserialized tags before committing
        # This prevents SQLite errors when updating routines with list-type tags
        routines_in_session = [obj for obj in db.identity_map.values() if isinstance(obj, NutritionRoutine)]
        for routine in routines_in_session:
            if hasattr(routine, 'tags') and isinstance(routine.tags, list):
                routine.tags = json.dumps(routine.tags)
        
        # Create new progress entry
        progress_data = {
            "routine_id": routine_id,
            "user_id": user_id,
            "is_active": True,
            "started_at": datetime.utcnow()
        }
        
        progress = NutritionUserRoutineProgress(**progress_data)
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress
    
    def stop_routine(self, db: Session, *, routine_id: str, user_id: str) -> bool:
        """Stop following a nutrition routine."""
        progress = self.get_user_active_routine(db, user_id=user_id)
        if progress and progress.routine_id == routine_id:
            progress.is_active = False
            db.commit()
            return True
        return False
    
    def log_meal(self, db: Session, *, routine_id: str, user_id: str) -> bool:
        """Log a meal completion for a routine."""
        progress = self.get_user_active_routine(db, user_id=user_id)
        if progress and progress.routine_id == routine_id:
            progress.meals_completed += 1
            progress.last_meal_date = datetime.utcnow()
            db.commit()
            return True
        return False


# Create instances
nutrition_routine = CRUDNutritionRoutine(NutritionRoutine)
nutrition_meal_plan = CRUDNutritionMealPlan(NutritionMealPlan)
nutrition_meal = CRUDNutritionMeal(NutritionMeal)
nutrition_meal_food = CRUDNutritionMealFood(NutritionMealFood)
nutrition_user_routine_progress = CRUDNutritionUserRoutineProgress(NutritionUserRoutineProgress)
