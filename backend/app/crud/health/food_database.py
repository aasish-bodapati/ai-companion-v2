"""
CRUD operations for Food Database.
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from app.crud.base import CRUDBase
from app.models.health.food_database import Food, UserFoodHistory
from app.schemas.health.food_database import (
    FoodCreate, FoodUpdate,
    UserFoodHistoryCreate, UserFoodHistoryUpdate
)
import json
from datetime import datetime, timezone

class CRUDFood(CRUDBase[Food, FoodCreate, FoodUpdate]):
    """CRUD operations for Food."""

    def search_foods(
        self,
        db: Session,
        query: str,
        category: Optional[str] = None,
        limit: int = 20
    ) -> List[Food]:
        """Search foods by name or brand."""
        q = db.query(Food).filter(
            or_(
                Food.name.ilike(f"%{query}%"),
                Food.brand.ilike(f"%{query}%")
            )
        )
        
        if category:
            q = q.filter(Food.category == category)
            
        return q.limit(limit).all()

    def get_by_category(
        self,
        db: Session,
        category: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Food]:
        """Get foods by category."""
        return db.query(Food).filter(
            Food.category == category
        ).offset(skip).limit(limit).all()

    def get_popular_foods(
        self,
        db: Session,
        category: Optional[str] = None,
        limit: int = 20
    ) -> List[Food]:
        """Get popular foods."""
        q = db.query(Food)
        
        if category:
            q = q.filter(Food.category == category)
            
        return q.order_by(desc(Food.usage_count)).limit(limit).all()

class CRUDUserFoodHistory(CRUDBase[UserFoodHistory, UserFoodHistoryCreate, UserFoodHistoryUpdate]):
    """CRUD operations for UserFoodHistory."""

    def get_user_history(
        self,
        db: Session,
        user_id: str,
        limit: int = 50
    ) -> List[UserFoodHistory]:
        """Get user's food history."""
        return db.query(UserFoodHistory).filter(
            UserFoodHistory.user_id == user_id
        ).order_by(desc(UserFoodHistory.last_logged)).limit(limit).all()

    def get_user_favorites(
        self,
        db: Session,
        user_id: str,
        limit: int = 20
    ) -> List[UserFoodHistory]:
        """Get user's most frequently logged foods."""
        return db.query(UserFoodHistory).filter(
            UserFoodHistory.user_id == user_id
        ).order_by(desc(UserFoodHistory.times_logged)).limit(limit).all()

    def update_food_history(
        self,
        db: Session,
        user_id: str,
        food_id: str,
        serving_grams: Optional[float] = None,
        meal_type: Optional[str] = None
    ) -> UserFoodHistory:
        """Update or create user food history."""

        # Try to find existing history
        history = db.query(UserFoodHistory).filter(
            and_(
                UserFoodHistory.user_id == user_id,
                UserFoodHistory.food_id == food_id
            )
        ).first()

        if history:
            # Update existing history
            history.times_logged += 1
            history.last_logged = datetime.now(timezone.utc)
            if serving_grams:
                # Update average serving size
                if history.avg_serving_grams:
                    history.avg_serving_grams = (history.avg_serving_grams + serving_grams) / 2
                else:
                    history.avg_serving_grams = serving_grams
            if meal_type:
                history.most_common_meal_type = meal_type
        else:
            # Create new history
            history_data = {
                "user_id": user_id,
                "food_id": food_id,
                "times_logged": 1,
                "last_logged": datetime.now(timezone.utc),
                "avg_serving_grams": serving_grams,
                "most_common_meal_type": meal_type
            }
            history = UserFoodHistory(**history_data)
            db.add(history)

        db.commit()
        db.refresh(history)
        return history

    def get_recent_foods(
        self,
        db: Session,
        user_id: str,
        days: int = 7,
        limit: int = 20
    ) -> List[UserFoodHistory]:
        """Get foods logged in the last N days."""
        cutoff_date = datetime.now(timezone.utc) - timezone.timedelta(days=days)
        return db.query(UserFoodHistory).filter(
            and_(
                UserFoodHistory.user_id == user_id,
                UserFoodHistory.last_logged >= cutoff_date
            )
        ).order_by(desc(UserFoodHistory.last_logged)).limit(limit).all()

# Create instances
food = CRUDFood(Food)
user_food_history = CRUDUserFoodHistory(UserFoodHistory)