"""
Nutrition search API endpoints using Nutritionix
"""
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.nutritionix_api import NutritionixApiClient
# from app.schemas.common import MessageResponse

router = APIRouter()

@router.get("/search")
async def search_foods(
    q: str = Query(..., description="Food search query"),
    limit: int = Query(10, ge=1, le=20, description="Number of results to return"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Search for foods using Nutritionix API
    """
    try:
        client = NutritionixApiClient()
        results = client.search_foods(q, limit)
        
        # Format results for frontend
        formatted_results = []
        for item in results:
            formatted_results.append({
                "food_name": item.get("food_name", ""),
                "calories": item.get("nf_calories", 0),
                "serving_qty": item.get("serving_qty", 1),
                "serving_unit": item.get("serving_unit", ""),
                "photo": item.get("photo", {}).get("thumb", ""),
                "type": item.get("type", "unknown"),
                "tag_id": item.get("tag_id", ""),
                "nix_item_id": item.get("nix_item_id", ""),
                "brand_name": item.get("brand_name", "")
            })
        
        return {
            "success": True,
            "query": q,
            "results": formatted_results,
            "count": len(formatted_results)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Food search failed: {str(e)}"
        )

@router.get("/nutrition/{food_id}")
async def get_food_nutrition(
    food_id: str,
    food_type: str = Query("common", description="Type of food: common or branded"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get detailed nutrition information for a specific food
    """
    try:
        client = NutritionixApiClient()
        
        if food_type == "common":
            # For common foods, use the food name directly
            # The food_id is actually the food name for common foods
            nutrition = client.get_food_nutrition_by_name(food_id)
        else:
            # For branded foods, use the nix_item_id
            nutrition = client.get_branded_food(food_id)
        
        if not nutrition:
            raise HTTPException(
                status_code=404,
                detail="Food not found"
            )
        
        # Map to our format
        mapped_nutrition = client.map_nutrition_data(nutrition)
        
        return {
            "success": True,
            "nutrition": mapped_nutrition
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Nutrition lookup failed: {str(e)}"
        )

@router.post("/nutrition/calculate")
async def calculate_serving_nutrition(
    base_nutrition: Dict,
    serving_qty: float,
    serving_unit: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Calculate nutrition for a custom serving size
    """
    try:
        client = NutritionixApiClient()
        
        calculated_nutrition = client.calculate_serving_nutrition(
            base_nutrition, 
            serving_qty, 
            serving_unit
        )
        
        if not calculated_nutrition:
            raise HTTPException(
                status_code=400,
                detail="Invalid base nutrition data"
            )
        
        return {
            "success": True,
            "nutrition": calculated_nutrition
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Nutrition calculation failed: {str(e)}"
        )

@router.post("/nutrition/natural")
async def get_natural_nutrition(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Get nutrition using natural language query (e.g., "1 medium apple", "2 slices of bread")
    """
    try:
        client = NutritionixApiClient()
        nutrition = client.get_food_nutrition_by_name(query)
        
        if not nutrition:
            raise HTTPException(
                status_code=404,
                detail="Food not found or invalid query"
            )
        
        mapped_nutrition = client.map_nutrition_data(nutrition)
        
        return {
            "success": True,
            "nutrition": mapped_nutrition
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Natural nutrition lookup failed: {str(e)}"
        )
