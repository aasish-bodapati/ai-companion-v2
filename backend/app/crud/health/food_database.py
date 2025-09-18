"""
CRUD operations for Food Database.
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from app.crud.base import CRUDBase
from app.models.health.food_database import Food, UserFoodHistory, MealTemplate, FoodAlternative
from app.schemas.health.food_database import (
    FoodCreate, FoodUpdate, 
    UserFoodHistoryCreate, UserFoodHistoryUpdate,
    MealTemplateCreate, MealTemplateUpdate
)
import json
from datetime import datetime, timezone


class CRUDFood(CRUDBase[Food, FoodCreate, FoodUpdate]):
    """CRUD operations for Food."""
    
    def search_foods(
        self, 
        db: Session, 
        *,
        query: Optional[str] = None,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        dietary_tags: Optional[List[str]] = None,
        max_calories_per_100g: Optional[float] = None,
        min_protein_per_100g: Optional[float] = None,
        verified_only: bool = False,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Food], int]:
        """Search foods with multiple filters and return results + total count."""
        
        # Build base query
        q = db.query(Food)
        count_q = db.query(func.count(Food.id))
        
        # Apply filters to both queries
        filters = []
        
        # Text search
        if query:
            text_filter = or_(
                Food.name.ilike(f"%{query}%"),
                Food.brand.ilike(f"%{query}%"),
                Food.description.ilike(f"%{query}%")
            )
            filters.append(text_filter)
        
        # Category filter
        if category:
            filters.append(Food.category == category)
        
        # Brand filter
        if brand:
            filters.append(Food.brand.ilike(f"%{brand}%"))
        
        # Dietary tags filter
        if dietary_tags:
            for tag in dietary_tags:
                filters.append(Food.dietary_tags.contains([tag]))
        
        # Nutritional filters
        if max_calories_per_100g:
            filters.append(Food.calories_per_100g <= max_calories_per_100g)
        
        if min_protein_per_100g:
            filters.append(Food.protein_per_100g >= min_protein_per_100g)
        
        # Verified only
        if verified_only:
            filters.append(Food.is_verified == True)
        
        # Apply all filters
        if filters:
            q = q.filter(and_(*filters))
            count_q = count_q.filter(and_(*filters))
        
        # Get total count
        total_count = count_q.scalar()
        
        # Order by popularity and usage, then name
        q = q.order_by(desc(Food.is_popular), desc(Food.usage_count), Food.name)
        
        # Apply pagination
        foods = q.offset(offset).limit(limit).all()
        
        return foods, total_count
    
    def get_popular_foods(self, db: Session, category: Optional[str] = None, limit: int = 20) -> List[Food]:
        """Get most popular foods."""
        q = db.query(Food).filter(Food.is_popular == True)
        
        if category:
            q = q.filter(Food.category == category)
        
        return q.order_by(desc(Food.usage_count), Food.name).limit(limit).all()
    
    def get_foods_by_category(self, db: Session, category: str, limit: int = 50) -> List[Food]:
        """Get foods by category."""
        return db.query(Food).filter(
            Food.category == category
        ).order_by(desc(Food.is_popular), Food.name).limit(limit).all()
    
    def search_by_barcode(self, db: Session, barcode: str) -> Optional[Food]:
        """Search food by barcode."""
        return db.query(Food).filter(Food.barcode == barcode).first()
    
    def increment_usage(self, db: Session, food_id: str) -> Food:
        """Increment usage count for a food."""
        food = self.get(db, id=food_id)
        if food:
            food.usage_count = (food.usage_count or 0) + 1
            db.commit()
            db.refresh(food)
        return food
    
    def get_similar_foods(
        self, 
        db: Session, 
        food_id: str, 
        limit: int = 10
    ) -> List[Food]:
        """Get foods similar to the given food."""
        
        food = self.get(db, id=food_id)
        if not food:
            return []
        
        # Find foods in same category with similar nutritional profile
        q = db.query(Food).filter(
            and_(
                Food.id != food_id,
                Food.category == food.category
            )
        )
        
        # Similar calorie range (±20%)
        if food.calories_per_100g:
            cal_min = food.calories_per_100g * 0.8
            cal_max = food.calories_per_100g * 1.2
            q = q.filter(
                and_(
                    Food.calories_per_100g >= cal_min,
                    Food.calories_per_100g <= cal_max
                )
            )
        
        return q.order_by(desc(Food.is_popular), desc(Food.usage_count)).limit(limit).all()
    
    def get_smart_suggestions(
        self, 
        db: Session, 
        user_id: str, 
        meal_type: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 10
    ) -> List[Food]:
        """Get smart food suggestions based on user history."""
        
        # Get user's food history
        user_history = db.query(UserFoodHistory).filter(
            UserFoodHistory.user_id == user_id
        ).all()
        
        if not user_history:
            # New user - return popular foods
            return self.get_popular_foods(db, category=category, limit=limit)
        
        # Get foods user has logged before
        logged_food_ids = [h.food_id for h in user_history]
        
        # Find similar foods (same categories, different foods)
        preferred_categories = {}
        for history in user_history:
            if history.food and history.food.category:
                cat = history.food.category
                preferred_categories[cat] = preferred_categories.get(cat, 0) + history.times_logged
        
        # Get top 3 preferred categories
        top_categories = sorted(preferred_categories.items(), key=lambda x: x[1], reverse=True)[:3]
        
        q = db.query(Food).filter(
            ~Food.id.in_(logged_food_ids)  # Exclude already logged foods
        )
        
        if category:
            q = q.filter(Food.category == category)
        elif top_categories:
            # Filter by user's preferred categories
            category_filters = [Food.category == cat for cat, _ in top_categories]
            q = q.filter(or_(*category_filters))
        
        # If meal_type is specified, prefer foods commonly eaten at that time
        if meal_type:
            # This would require tracking meal_type in user history
            # For now, we'll use simple heuristics
            if meal_type == "breakfast":
                breakfast_categories = ["grains", "fruits", "dairy"]
                q = q.filter(Food.category.in_(breakfast_categories))
            elif meal_type == "lunch" or meal_type == "dinner":
                main_meal_categories = ["proteins", "vegetables", "grains"]
                q = q.filter(Food.category.in_(main_meal_categories))
        
        return q.order_by(desc(Food.is_popular), desc(Food.usage_count)).limit(limit).all()


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
            # Update existing
            history.times_logged += 1
            history.last_logged = func.now()
            
            # Update average serving size
            if serving_grams:
                if history.avg_serving_grams:
                    # Weighted average (give more weight to recent servings)
                    weight = min(history.times_logged, 10)  # Cap at 10 for stability
                    history.avg_serving_grams = (
                        (history.avg_serving_grams * weight + serving_grams) / (weight + 1)
                    )
                else:
                    history.avg_serving_grams = serving_grams
            
            # Update most common meal type
            if meal_type:
                # Simple approach - just update to latest meal type
                # In production, you'd track meal type frequency
                history.most_common_meal_type = meal_type
        
        else:
            # Create new
            history = UserFoodHistory(
                user_id=user_id,
                food_id=food_id,
                times_logged=1,
                last_logged=func.now(),
                avg_serving_grams=serving_grams,
                most_common_meal_type=meal_type
            )
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
        """Get foods user has logged recently."""
        from datetime import timedelta
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        return db.query(UserFoodHistory).filter(
            and_(
                UserFoodHistory.user_id == user_id,
                UserFoodHistory.last_logged >= cutoff_date
            )
        ).order_by(desc(UserFoodHistory.last_logged)).limit(limit).all()


class CRUDMealTemplate(CRUDBase[MealTemplate, MealTemplateCreate, MealTemplateUpdate]):
    """CRUD operations for MealTemplate."""
    
    def get_popular_templates(
        self, 
        db: Session, 
        meal_type: Optional[str] = None, 
        dietary_tags: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[MealTemplate]:
        """Get popular meal templates."""
        q = db.query(MealTemplate).filter(MealTemplate.is_popular == True)
        
        if meal_type:
            q = q.filter(MealTemplate.meal_type == meal_type)
        
        if dietary_tags:
            for tag in dietary_tags:
                q = q.filter(MealTemplate.dietary_tags.contains([tag]))
        
        return q.order_by(desc(MealTemplate.usage_count), MealTemplate.name).limit(limit).all()
    
    def search_templates(
        self,
        db: Session,
        query: Optional[str] = None,
        meal_type: Optional[str] = None,
        cuisine_type: Optional[str] = None,
        dietary_tags: Optional[List[str]] = None,
        max_calories: Optional[float] = None,
        max_prep_time: Optional[int] = None,
        limit: int = 20
    ) -> List[MealTemplate]:
        """Search meal templates."""
        
        q = db.query(MealTemplate)
        
        if query:
            q = q.filter(
                or_(
                    MealTemplate.name.ilike(f"%{query}%"),
                    MealTemplate.description.ilike(f"%{query}%")
                )
            )
        
        if meal_type:
            q = q.filter(MealTemplate.meal_type == meal_type)
        
        if cuisine_type:
            q = q.filter(MealTemplate.cuisine_type == cuisine_type)
        
        if dietary_tags:
            for tag in dietary_tags:
                q = q.filter(MealTemplate.dietary_tags.contains([tag]))
        
        if max_calories:
            q = q.filter(MealTemplate.total_calories <= max_calories)
        
        if max_prep_time:
            q = q.filter(MealTemplate.prep_time_minutes <= max_prep_time)
        
        return q.order_by(desc(MealTemplate.is_popular), desc(MealTemplate.usage_count)).limit(limit).all()
    
    def increment_usage(self, db: Session, template_id: str) -> MealTemplate:
        """Increment usage count for a meal template."""
        template = self.get(db, id=template_id)
        if template:
            template.usage_count = (template.usage_count or 0) + 1
            db.commit()
            db.refresh(template)
        return template


class CRUDFoodAlternative(CRUDBase[FoodAlternative, None, None]):
    """CRUD operations for FoodAlternative."""
    
    def get_alternatives(
        self,
        db: Session,
        food_id: str,
        reason: Optional[str] = None,
        limit: int = 10
    ) -> List[FoodAlternative]:
        """Get alternatives for a food."""
        q = db.query(FoodAlternative).filter(
            FoodAlternative.original_food_id == food_id
        )
        
        if reason:
            q = q.filter(FoodAlternative.reason == reason)
        
        return q.order_by(desc(FoodAlternative.confidence_score), desc(FoodAlternative.usage_count)).limit(limit).all()
    
    def get_healthier_alternatives(
        self,
        db: Session,
        food_id: str,
        limit: int = 5
    ) -> List[FoodAlternative]:
        """Get healthier alternatives for a food."""
        return self.get_alternatives(
            db, food_id, reason="lower_calorie", limit=limit
        )


# Create instances
food = CRUDFood(Food)
user_food_history = CRUDUserFoodHistory(UserFoodHistory)
meal_template = CRUDMealTemplate(MealTemplate)
food_alternative = CRUDFoodAlternative(FoodAlternative)
