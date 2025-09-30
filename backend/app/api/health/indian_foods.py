"""
Indian Food API Endpoints
Provides endpoints for searching and retrieving Indian food nutrition data
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from app.api.deps import get_db
from app.services.indian_food_service import IndianFoodService

router = APIRouter()


@router.get("/search")
async def search_indian_foods(
    q: str = Query(..., description="Search query for food name"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """Search for Indian foods by name"""
    try:
        service = IndianFoodService(db)
        results = service.search_foods(q, limit)
        
        return {
            "success": True,
            "data": results,
            "count": len(results),
            "query": q
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/food/{food_code}")
async def get_food_by_code(
    food_code: str,
    db: Session = Depends(get_db)
):
    """Get specific food by food code"""
    try:
        service = IndianFoodService(db)
        food = service.get_food_by_code(food_code)
        
        if not food:
            raise HTTPException(status_code=404, detail="Food not found")
        
        return {
            "success": True,
            "data": food
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get food: {str(e)}")


@router.get("/nutrition/{food_code}")
async def get_food_nutrition(
    food_code: str,
    serving_qty: float = Query(1.0, ge=0.1, le=1000, description="Serving quantity"),
    db: Session = Depends(get_db)
):
    """Get nutrition data for a specific food and serving quantity"""
    try:
        service = IndianFoodService(db)
        nutrition = service.get_food_nutrition(food_code, serving_qty)
        
        if not nutrition:
            raise HTTPException(status_code=404, detail="Food not found")
        
        return {
            "success": True,
            "data": nutrition
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get nutrition: {str(e)}")


@router.get("/popular")
async def get_popular_foods(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """Get popular Indian foods"""
    try:
        service = IndianFoodService(db)
        foods = service.get_popular_foods(limit)
        
        return {
            "success": True,
            "data": foods,
            "count": len(foods)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get popular foods: {str(e)}")


@router.get("/category")
async def get_foods_by_category(
    keywords: str = Query(..., description="Comma-separated category keywords"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """Get foods by category keywords"""
    try:
        category_keywords = [kw.strip() for kw in keywords.split(',') if kw.strip()]
        if not category_keywords:
            raise HTTPException(status_code=400, detail="At least one keyword is required")
        
        service = IndianFoodService(db)
        foods = service.get_foods_by_category(category_keywords, limit)
        
        return {
            "success": True,
            "data": foods,
            "count": len(foods),
            "keywords": category_keywords
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get foods by category: {str(e)}")


@router.post("/calculate-meal")
async def calculate_meal_nutrition(
    food_items: List[Dict],
    db: Session = Depends(get_db)
):
    """Calculate total nutrition for a meal with multiple food items"""
    try:
        service = IndianFoodService(db)
        total_nutrition = service.calculate_meal_nutrition(food_items)
        
        return {
            "success": True,
            "data": {
                "total_nutrition": total_nutrition,
                "food_items_count": len(food_items)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate meal nutrition: {str(e)}")


@router.get("/categories")
async def get_food_categories(db: Session = Depends(get_db)):
    """Get available food categories and their counts"""
    try:
        service = IndianFoodService(db)
        
        # Common Indian food categories
        categories = {
            "curry": service.get_foods_by_category(["curry", "masala"], 1),
            "rice": service.get_foods_by_category(["rice", "biryani", "pulao"], 1),
            "dal": service.get_foods_by_category(["dal", "lentil", "pulse"], 1),
            "bread": service.get_foods_by_category(["roti", "naan", "chapati", "paratha"], 1),
            "vegetable": service.get_foods_by_category(["vegetable", "sabzi", "bhaji"], 1),
            "snack": service.get_foods_by_category(["snack", "pakora", "samosa", "vada"], 1),
            "sweet": service.get_foods_by_category(["sweet", "mithai", "dessert", "halwa"], 1),
            "drink": service.get_foods_by_category(["drink", "juice", "lassi", "chai"], 1),
        }
        
        category_counts = {}
        for category, foods in categories.items():
            category_counts[category] = len(foods)
        
        return {
            "success": True,
            "data": {
                "categories": category_counts,
                "total_categories": len(category_counts)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")
