"""
Food Database API endpoints.
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.crud.health import food_database
from app.services.hybrid_food_service import local_food_service
from app.schemas.health.food_database import (
    Food, FoodWithUserData, FoodSearchRequest, FoodSearchResponse,
    FoodSuggestion, FoodSuggestionsResponse, MealTemplate,
    QuickFoodLog, FoodLogWithDefaults, UserFoodHistory,
    BarcodeSearchRequest, BarcodeSearchResponse, FoodAlternativesResponse,
    FoodCategory, NutritionalProfile
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/public-search", response_model=List[Dict[str, Any]])
async def public_search_foods(
    *,
    db: Session = Depends(get_db),
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Result limit")
):
    """
    Public food search endpoint for MVP (no authentication required).
    
    This endpoint provides food search from the local database without requiring authentication.
    """
    try:
        logger.info(f"Public food search: '{query}'")
        
        # Use local service to search
        results = await local_food_service.search_foods(
            db=db,
            query=query,
            max_results=limit
        )
        
        logger.info(f"Public search found {len(results)} foods for query: {query}")
        return results
        
    except Exception as e:
        logger.error(f"Error in public food search: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search foods")

@router.get("/public-nutrition/{food_id}", response_model=Dict[str, Any])
async def public_get_food_nutrition(
    *,
    db: Session = Depends(get_db),
    food_id: str,
    serving_grams: float = Query(100, ge=1, description="Serving size in grams")
):
    """
    Public nutrition endpoint for MVP (no authentication required).
    
    This endpoint provides nutrition data from the local database without requiring authentication.
    """
    try:
        logger.info(f"Public nutrition request: food_id={food_id}, serving_grams={serving_grams}")
        
        # Use local service to get nutrition
        nutrition = await local_food_service.get_food_nutrition(
            db=db,
            food_id=food_id,
            serving_grams=serving_grams
        )
        
        if not nutrition:
            raise HTTPException(status_code=404, detail="Food not found or nutrition data unavailable")
        
        logger.info(f"Public nutrition retrieved for food {food_id}")
        return nutrition.dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in public nutrition: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get nutritional profile")

@router.get("/search", response_model=FoodSearchResponse)
async def search_foods(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    query: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    dietary_tags: Optional[List[str]] = Query(None, description="Filter by dietary tags"),
    max_calories_per_100g: Optional[float] = Query(None, description="Maximum calories per 100g"),
    min_protein_per_100g: Optional[float] = Query(None, description="Minimum protein per 100g"),
    verified_only: bool = Query(False, description="Only verified foods"),
    limit: int = Query(20, ge=1, le=100, description="Result limit"),
    offset: int = Query(0, ge=0, description="Result offset")
):
    """Search foods with advanced filtering."""
    try:
        # Search foods
        foods, total_count = food_database.food.search_foods(
            db,
            query=query,
            category=category,
            brand=brand,
            dietary_tags=dietary_tags,
            max_calories_per_100g=max_calories_per_100g,
            min_protein_per_100g=min_protein_per_100g,
            verified_only=verified_only,
            limit=limit,
            offset=offset
        )

        # Get user food history for personalization
        user_history = food_database.user_food_history.get_user_history(
            db, user_id=current_user.id
        )
        history_dict = {h.food_id: h for h in user_history}

        # Enrich foods with user data
        foods_with_user_data = []
        for food in foods:
            user_data = history_dict.get(food.id)
            food_dict = food.__dict__.copy()

            if user_data:
                food_dict.update({
                    "user_times_logged": user_data.times_logged,
                    "user_last_logged": user_data.last_logged,
                    "user_avg_serving_grams": user_data.avg_serving_grams,
                    "user_rating": user_data.rating
                })
            else:
                food_dict.update({
                    "user_times_logged": 0,
                    "user_last_logged": None,
                    "user_avg_serving_grams": None,
                    "user_rating": None
                })

            foods_with_user_data.append(FoodWithUserData(**food_dict))

        has_more = len(foods) == limit and (offset + limit) < total_count

        return FoodSearchResponse(
            foods=foods_with_user_data,
            total_count=total_count,
            has_more=has_more,
            filters_applied={
                "query": query,
                "category": category,
                "brand": brand,
                "dietary_tags": dietary_tags,
                "max_calories_per_100g": max_calories_per_100g,
                "min_protein_per_100g": min_protein_per_100g,
                "verified_only": verified_only
            }
        )

    except Exception as e:
        logger.error(f"Error searching foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search foods")

@router.get("/popular", response_model=List[FoodWithUserData])
async def get_popular_foods(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=50, description="Result limit")
):
    """Get popular foods."""
    try:
        foods = food_database.food.get_popular_foods(
            db, category=category, limit=limit
        )

        # Get user history for personalization
        user_history = food_database.user_food_history.get_user_history(
            db, user_id=current_user.id
        )
        history_dict = {h.food_id: h for h in user_history}

        # Add user data
        foods_with_user_data = []
        for food in foods:
            user_data = history_dict.get(food.id)
            food_dict = food.__dict__.copy()

            if user_data:
                food_dict.update({
                    "user_times_logged": user_data.times_logged,
                    "user_last_logged": user_data.last_logged,
                    "user_avg_serving_grams": user_data.avg_serving_grams,
                    "user_rating": user_data.rating
                })
            else:
                food_dict.update({
                    "user_times_logged": 0,
                    "user_last_logged": None,
                    "user_avg_serving_grams": None,
                    "user_rating": None
                })

            foods_with_user_data.append(FoodWithUserData(**food_dict))

        return foods_with_user_data

    except Exception as e:
        logger.error(f"Error getting popular foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get popular foods")

@router.get("/suggestions", response_model=FoodSuggestionsResponse)
async def get_smart_suggestions(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    meal_type: Optional[str] = Query(None, description="Filter by meal type"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(10, ge=1, le=20, description="Number of suggestions")
):
    """Get smart food suggestions based on user history."""
    try:
        suggestion_foods = food_database.food.get_smart_suggestions(
            db, user_id=current_user.id, meal_type=meal_type, category=category, limit=limit
        )

        # Get user preferences from history
        user_history = food_database.user_food_history.get_user_favorites(
            db, user_id=current_user.id, limit=20
        )

        # Build user preferences profile
        preferred_categories = {}
        preferred_brands = {}
        avg_calories = 0
        total_foods = 0

        for history in user_history:
            if history.food:
                # Count categories
                cat = history.food.category
                preferred_categories[cat] = preferred_categories.get(cat, 0) + history.times_logged

                # Count brands
                if history.food.brand:
                    brand = history.food.brand
                    preferred_brands[brand] = preferred_brands.get(brand, 0) + history.times_logged

                # Calculate average calories
                if history.avg_serving_grams and history.food.calories_per_100g:
                    calories = (history.food.calories_per_100g * history.avg_serving_grams) / 100
                    avg_calories = (avg_calories * total_foods + calories) / (total_foods + 1)
                    total_foods += 1

        user_preferences = {
            "preferred_categories": preferred_categories,
            "preferred_brands": preferred_brands,
            "avg_calories_per_serving": round(avg_calories, 0) if avg_calories else None,
            "total_foods_logged": len(user_history),
            "most_frequent_food": user_history[0].food.name if user_history else None
        }

        # Generate suggestions with reasoning
        suggestions = []
        for food in suggestion_foods:
            reason = "Popular food in this category"
            confidence = 0.7
            nutritional_benefits = []

            # Personalize reasoning
            if food.category in preferred_categories:
                reason = f"Great {food.category} choice - matches your preferences"
                confidence = min(0.95, confidence + 0.2)

            if food.brand and food.brand in preferred_brands:
                reason = f"From {food.brand} - a brand you often choose"
                confidence = min(0.95, confidence + 0.1)

            # Highlight nutritional benefits
            if food.protein_per_100g and food.protein_per_100g > 15:
                nutritional_benefits.append("High in protein")
            if food.fiber_per_100g and food.fiber_per_100g > 5:
                nutritional_benefits.append("Good source of fiber")
            if food.calories_per_100g < 100:
                nutritional_benefits.append("Low calorie")

            # Suggest serving size based on user history
            serving_suggestion = None
            if user_history:
                # Find similar foods user has logged
                similar_history = [h for h in user_history if h.food and h.food.category == food.category]
                if similar_history:
                    avg_serving = sum(h.avg_serving_grams or 100 for h in similar_history) / len(similar_history)
                    serving_suggestion = {
                        "grams": round(avg_serving, 0),
                        "description": f"Based on your typical {food.category} servings"
                    }

            suggestions.append(FoodSuggestion(
                food=Food.from_orm(food),
                reason=reason,
                confidence_score=confidence,
                nutritional_benefits=nutritional_benefits,
                serving_suggestion=serving_suggestion
            ))

        return FoodSuggestionsResponse(
            suggestions=suggestions,
            user_preferences=user_preferences,
            meal_context=meal_type,
            generated_at=datetime.now(timezone.utc)
        )

    except Exception as e:
        logger.error(f"Error getting food suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get food suggestions")

@router.get("/barcode/{barcode}", response_model=BarcodeSearchResponse)
async def search_by_barcode(
    *,
    db: Session = Depends(get_db),
    barcode: str
):
    """Search food by barcode."""
    try:
        food = food_database.food.search_by_barcode(db, barcode=barcode)

        if food:
            return BarcodeSearchResponse(
                found=True,
                food=Food.from_orm(food)
            )
        else:
            # If exact match not found, suggest similar foods
            # This is a simplified approach - in production you'd use more sophisticated matching
            suggested_foods = food_database.food.get_popular_foods(db, limit=5)

            return BarcodeSearchResponse(
                found=False,
                food=None,
                suggested_foods=[Food.from_orm(f) for f in suggested_foods]
            )

    except Exception as e:
        logger.error(f"Error searching by barcode: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search by barcode")

@router.get("/categories", response_model=List[FoodCategory])
async def get_food_categories():
    """Get all available food categories."""
    try:
        categories = [
            {
                "name": "fruits",
                "display_name": "Fruits",
                "description": "Fresh and dried fruits",
                "icon": "apple-outline",
                "subcategories": ["citrus", "berries", "tropical", "stone_fruits"]
            },
            {
                "name": "vegetables",
                "display_name": "Vegetables",
                "description": "Fresh and cooked vegetables",
                "icon": "carrot",
                "subcategories": ["leafy_greens", "root_vegetables", "cruciferous", "nightshades"]
            },
            {
                "name": "grains",
                "display_name": "Grains & Cereals",
                "description": "Rice, bread, pasta, and cereals",
                "icon": "wheat",
                "subcategories": ["whole_grains", "refined_grains", "breakfast_cereals"]
            },
            {
                "name": "proteins",
                "display_name": "Proteins",
                "description": "Meat, fish, eggs, and plant proteins",
                "icon": "drumstick",
                "subcategories": ["meat", "poultry", "fish", "eggs", "plant_proteins"]
            },
            {
                "name": "dairy",
                "display_name": "Dairy",
                "description": "Milk, cheese, yogurt, and dairy products",
                "icon": "milk",
                "subcategories": ["milk", "cheese", "yogurt", "butter"]
            },
            {
                "name": "nuts_seeds",
                "display_name": "Nuts & Seeds",
                "description": "Nuts, seeds, and nut butters",
                "icon": "nut",
                "subcategories": ["tree_nuts", "seeds", "nut_butters"]
            },
            {
                "name": "oils_fats",
                "display_name": "Oils & Fats",
                "description": "Cooking oils, butter, and healthy fats",
                "icon": "oil",
                "subcategories": ["cooking_oils", "animal_fats", "spreads"]
            },
            {
                "name": "beverages",
                "display_name": "Beverages",
                "description": "Drinks and liquid nutrition",
                "icon": "cup",
                "subcategories": ["water", "juices", "coffee_tea", "alcohol"]
            },
            {
                "name": "snacks",
                "display_name": "Snacks & Treats",
                "description": "Snack foods and desserts",
                "icon": "cookie",
                "subcategories": ["healthy_snacks", "chips_crackers", "desserts", "candy"]
            }
        ]

        return [FoodCategory(**cat) for cat in categories]

    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get categories")

@router.get("/quick-log/{food_id}", response_model=FoodLogWithDefaults)
async def get_food_with_defaults(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    food_id: str
):
    """Get food with smart defaults for quick logging."""
    try:
        # Get food
        food = food_database.food.get(db, id=food_id)
        if not food:
            raise HTTPException(status_code=404, detail="Food not found")

        # Get user history for this food
        user_history = food_database.user_food_history.get_user_history(db, user_id=current_user.id)
        food_history = next((h for h in user_history if h.food_id == food_id), None)

        # Calculate smart defaults
        suggested_serving_grams = food.default_serving_grams or 100
        suggested_meal_type = None

        if food_history:
            suggested_serving_grams = food_history.avg_serving_grams or suggested_serving_grams
            suggested_meal_type = food_history.most_common_meal_type
        else:
            # Use category-based defaults
            if food.category in ["fruits", "vegetables"]:
                suggested_serving_grams = 150
            elif food.category == "grains":
                suggested_serving_grams = 80
            elif food.category == "proteins":
                suggested_serving_grams = 120
            elif food.category == "dairy":
                suggested_serving_grams = 200
            elif food.category == "nuts_seeds":
                suggested_serving_grams = 30

        # Calculate nutritional info for suggested serving
        multiplier = suggested_serving_grams / 100
        nutritional_info = {
            "serving_grams": suggested_serving_grams,
            "calories": round(food.calories_per_100g * multiplier, 1),
            "protein_g": round((food.protein_per_100g or 0) * multiplier, 1),
            "carbs_g": round((food.carbs_per_100g or 0) * multiplier, 1),
            "fat_g": round((food.fat_per_100g or 0) * multiplier, 1),
            "fiber_g": round((food.fiber_per_100g or 0) * multiplier, 1),
            "sugar_g": round((food.sugar_per_100g or 0) * multiplier, 1),
            "sodium_mg": round((food.sodium_per_100g or 0) * multiplier, 1)
        }

        # Get alternatives
        alternatives = food_database.food_alternative.get_alternatives(db, food_id=food_id, limit=3)

        return FoodLogWithDefaults(
            food=Food.from_orm(food),
            suggested_serving_grams=suggested_serving_grams,
            suggested_meal_type=suggested_meal_type,
            nutritional_info=nutritional_info,
            user_history=UserFoodHistory.from_orm(food_history) if food_history else None,
            alternatives=[alt for alt in alternatives]  # Would need proper schema conversion
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting food defaults: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get food defaults")

@router.get("/recent", response_model=List[FoodWithUserData])
async def get_recent_foods(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(7, ge=1, le=30, description="Number of days to look back"),
    limit: int = Query(20, ge=1, le=50, description="Result limit")
):
    """Get foods user has logged recently."""
    try:
        recent_history = food_database.user_food_history.get_recent_foods(
            db, user_id=current_user.id, days=days, limit=limit
        )

        foods_with_user_data = []
        for history in recent_history:
            if history.food:
                food_dict = history.food.__dict__.copy()
                food_dict.update({
                    "user_times_logged": history.times_logged,
                    "user_last_logged": history.last_logged,
                    "user_avg_serving_grams": history.avg_serving_grams,
                    "user_rating": history.rating
                })
                foods_with_user_data.append(FoodWithUserData(**food_dict))

        return foods_with_user_data

    except Exception as e:
        logger.error(f"Error getting recent foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recent foods")

@router.get("/favorites", response_model=List[FoodWithUserData])
async def get_favorite_foods(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50, description="Result limit")
):
    """Get user's most frequently logged foods."""
    try:
        favorites = food_database.user_food_history.get_user_favorites(
            db, user_id=current_user.id, limit=limit
        )

        foods_with_user_data = []
        for history in favorites:
            if history.food:
                food_dict = history.food.__dict__.copy()
                food_dict.update({
                    "user_times_logged": history.times_logged,
                    "user_last_logged": history.last_logged,
                    "user_avg_serving_grams": history.avg_serving_grams,
                    "user_rating": history.rating
                })
                foods_with_user_data.append(FoodWithUserData(**food_dict))

        return foods_with_user_data

    except Exception as e:
        logger.error(f"Error getting favorite foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get favorite foods")

@router.get("/templates", response_model=List[MealTemplate])
async def get_meal_templates(
    *,
    db: Session = Depends(get_db),
    meal_type: Optional[str] = Query(None, description="Filter by meal type"),
    cuisine_type: Optional[str] = Query(None, description="Filter by cuisine"),
    dietary_tags: Optional[List[str]] = Query(None, description="Filter by dietary tags"),
    max_calories: Optional[float] = Query(None, description="Maximum calories"),
    max_prep_time: Optional[int] = Query(None, description="Maximum prep time in minutes"),
    limit: int = Query(20, ge=1, le=50, description="Result limit")
):
    """Get meal templates for quick logging."""
    try:
        templates = food_database.meal_template.search_templates(
            db,
            meal_type=meal_type,
            cuisine_type=cuisine_type,
            dietary_tags=dietary_tags,
            max_calories=max_calories,
            max_prep_time=max_prep_time,
            limit=limit
        )

        return [MealTemplate.from_orm(template) for template in templates]

    except Exception as e:
        logger.error(f"Error getting meal templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get meal templates")

@router.get("/nutrition/{food_id}", response_model=NutritionalProfile)
async def get_nutritional_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    food_id: str,
    serving_grams: float = Query(100, ge=1, description="Serving size in grams")
):
    """
    Get nutritional profile from local database.
    """
    try:
        logger.info(f"Getting nutrition for food {food_id}, serving {serving_grams}g")
        
        # Use local service to get nutrition
        nutrition = await local_food_service.get_food_nutrition(
            db=db,
            food_id=food_id,
            serving_grams=serving_grams
        )
        
        if not nutrition:
            raise HTTPException(status_code=404, detail="Food not found or nutrition data unavailable")
        
        logger.info(f"Retrieved nutrition for food {food_id}")
        return nutrition
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting nutrition: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get nutritional profile")

