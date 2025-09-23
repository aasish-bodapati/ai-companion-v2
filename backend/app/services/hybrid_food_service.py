"""
Local Food Service
Provides food search and nutrition data from local database only
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.health.food_database import Food
from app.schemas.health.food_database import NutritionalProfile

logger = logging.getLogger(__name__)

class LocalFoodService:
    """Service that provides food search and nutrition from local database"""
    
    def __init__(self):
        pass
    
    async def search_foods(
        self, 
        db: Session, 
        query: str, 
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for foods using local database
        
        Args:
            db: Database session
            query: Search term
            max_results: Maximum number of results
            
        Returns:
            List of foods from local database
        """
        try:
            # Search in name, brand, and description with relevance scoring
            foods = db.query(Food).filter(
                or_(
                    Food.name.ilike(f"%{query}%"),
                    Food.brand.ilike(f"%{query}%"),
                    Food.description.ilike(f"%{query}%")
                )
            ).all()
            
            # Sort by relevance to search query
            def calculate_relevance_score(food, query):
                score = 0
                query_lower = query.lower()
                
                # Exact name match gets highest score
                if food.name.lower() == query_lower:
                    score += 100
                # Name starts with query
                elif food.name.lower().startswith(query_lower):
                    score += 80
                # Name contains query
                elif query_lower in food.name.lower():
                    score += 60
                
                # Brand matches
                if food.brand and query_lower in food.brand.lower():
                    score += 40
                
                # Description matches (lower priority)
                if food.description and query_lower in food.description.lower():
                    score += 20
                
                # Boost verified foods
                if food.is_verified:
                    score += 10
                
                # Boost common foods (fresh fruits, etc.)
                if food.source in ['common_fruits', 'common_foods']:
                    score += 15
                
                return score
            
            # Sort by relevance score (highest first)
            foods_sorted = sorted(foods, key=lambda f: calculate_relevance_score(f, query), reverse=True)
            
            # Take only the requested number of results
            foods = foods_sorted[:max_results]
            
            transformed_foods = []
            for food in foods:
                transformed_food = {
                    "id": food.id,
                    "name": food.name,
                    "brand": food.brand or "",
                    "description": food.description or "",
                    "category": food.category,
                    "source": "local",
                    "calories_per_100g": food.calories_per_100g or 0,
                    "protein_per_100g": food.protein_per_100g or 0,
                    "carbs_per_100g": food.carbs_per_100g or 0,
                    "fat_per_100g": food.fat_per_100g or 0,
                    "fiber_per_100g": food.fiber_per_100g or 0,
                    "sugar_per_100g": food.sugar_per_100g or 0,
                    "sodium_per_100g": food.sodium_per_100g or 0
                }
                transformed_foods.append(transformed_food)
            
            logger.info(f"Found {len(transformed_foods)} foods from local database for query: {query}")
            return transformed_foods
            
        except Exception as e:
            logger.error(f"Error searching local database: {str(e)}")
            return []
    
    async def get_food_nutrition(
        self, 
        db: Session, 
        food_id: str, 
        serving_grams: float = 100.0
    ) -> Optional[NutritionalProfile]:
        """
        Get nutritional profile for a food from local database
        
        Args:
            db: Database session
            food_id: Food ID
            serving_grams: Serving size in grams
            
        Returns:
            Nutritional profile or None if not found
        """
        try:
            food = db.query(Food).filter(Food.id == food_id).first()
            if not food:
                return None
            
            # Calculate nutrition for serving size
            multiplier = serving_grams / 100.0
            
            calories = (food.calories_per_100g or 0) * multiplier
            protein_g = (food.protein_per_100g or 0) * multiplier
            carbs_g = (food.carbs_per_100g or 0) * multiplier
            fat_g = (food.fat_per_100g or 0) * multiplier
            
            # Calculate macronutrient percentages
            total_macro_calories = (protein_g * 4) + (carbs_g * 4) + (fat_g * 9)
            
            protein_percent = (protein_g * 4 / total_macro_calories * 100) if total_macro_calories > 0 else 0
            carbs_percent = (carbs_g * 4 / total_macro_calories * 100) if total_macro_calories > 0 else 0
            fat_percent = (fat_g * 9 / total_macro_calories * 100) if total_macro_calories > 0 else 0
            
            return NutritionalProfile(
                serving_grams=round(serving_grams, 1),
                calories=round(calories, 1),
                protein_g=round(protein_g, 1),
                carbs_g=round(carbs_g, 1),
                fat_g=round(fat_g, 1),
                fiber_g=round((food.fiber_per_100g or 0) * multiplier, 1),
                sugar_g=round((food.sugar_per_100g or 0) * multiplier, 1),
                sodium_mg=round((food.sodium_per_100g or 0) * multiplier, 1),
                protein_percent=round(protein_percent, 1),
                carbs_percent=round(carbs_percent, 1),
                fat_percent=round(fat_percent, 1)
            )
            
        except Exception as e:
            logger.error(f"Error getting local nutrition: {str(e)}")
            return None

# Global service instance
local_food_service = LocalFoodService()