"""
Pydantic schemas for Food Database.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Food schemas
class FoodBase(BaseModel):
    name: str = Field(..., description="Food name")
    brand: Optional[str] = Field(None, description="Brand name")
    category: str = Field(..., description="Food category")
    subcategory: Optional[str] = Field(None, description="Food subcategory")
    barcode: Optional[str] = Field(None, description="Product barcode")
    usda_fdc_id: Optional[str] = Field(None, description="USDA Food Data Central ID")
    
    # Nutritional info per 100g
    calories_per_100g: float = Field(..., ge=0, description="Calories per 100g")
    protein_per_100g: Optional[float] = Field(0, ge=0, description="Protein per 100g")
    carbs_per_100g: Optional[float] = Field(0, ge=0, description="Carbs per 100g")
    fat_per_100g: Optional[float] = Field(0, ge=0, description="Fat per 100g")
    fiber_per_100g: Optional[float] = Field(0, ge=0, description="Fiber per 100g")
    sugar_per_100g: Optional[float] = Field(0, ge=0, description="Sugar per 100g")
    sodium_per_100g: Optional[float] = Field(0, ge=0, description="Sodium per 100g in mg")
    
    # Additional nutrients
    calcium_per_100g: Optional[float] = Field(None, ge=0, description="Calcium per 100g in mg")
    iron_per_100g: Optional[float] = Field(None, ge=0, description="Iron per 100g in mg")
    vitamin_c_per_100g: Optional[float] = Field(None, ge=0, description="Vitamin C per 100g in mg")
    vitamin_d_per_100g: Optional[float] = Field(None, ge=0, description="Vitamin D per 100g in mcg")
    
    # Serving information
    common_serving_sizes: Optional[List[Dict[str, Any]]] = Field(None, description="Common serving sizes")
    default_serving_grams: Optional[float] = Field(100, ge=0, description="Default serving size in grams")
    
    # Metadata
    description: Optional[str] = Field(None, description="Food description")
    ingredients: Optional[List[str]] = Field(None, description="Ingredients list")
    allergens: Optional[List[str]] = Field(None, description="Allergen information")
    dietary_tags: Optional[List[str]] = Field(None, description="Dietary tags")


class FoodCreate(FoodBase):
    pass


class FoodUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    calories_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None
    fiber_per_100g: Optional[float] = None
    sugar_per_100g: Optional[float] = None
    sodium_per_100g: Optional[float] = None
    common_serving_sizes: Optional[List[Dict[str, Any]]] = None
    description: Optional[str] = None
    dietary_tags: Optional[List[str]] = None


class Food(FoodBase):
    id: str
    is_verified: bool = False
    is_popular: bool = False
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FoodWithUserData(Food):
    """Food with user-specific data."""
    user_times_logged: Optional[int] = 0
    user_last_logged: Optional[datetime] = None
    user_avg_serving_grams: Optional[float] = None
    user_rating: Optional[int] = None


# User Food History schemas
class UserFoodHistoryBase(BaseModel):
    food_id: str
    times_logged: int = 1
    avg_serving_grams: Optional[float] = None
    most_common_meal_type: Optional[str] = None
    preferred_serving_size: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5, description="1-5 star rating")


class UserFoodHistoryCreate(UserFoodHistoryBase):
    user_id: str


class UserFoodHistoryUpdate(BaseModel):
    times_logged: Optional[int] = None
    avg_serving_grams: Optional[float] = None
    most_common_meal_type: Optional[str] = None
    preferred_serving_size: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)


class UserFoodHistory(UserFoodHistoryBase):
    id: str
    user_id: str
    last_logged: datetime
    created_at: datetime
    updated_at: datetime
    food: Optional[Food] = None
    
    class Config:
        from_attributes = True


# Meal Template schemas
class MealTemplateBase(BaseModel):
    name: str = Field(..., description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    meal_type: str = Field(..., description="Meal type")
    cuisine_type: Optional[str] = Field(None, description="Cuisine type")
    
    # Nutritional summary
    total_calories: float = Field(..., ge=0, description="Total calories")
    total_protein_g: Optional[float] = Field(None, ge=0, description="Total protein")
    total_carbs_g: Optional[float] = Field(None, ge=0, description="Total carbs")
    total_fat_g: Optional[float] = Field(None, ge=0, description="Total fat")
    total_fiber_g: Optional[float] = Field(None, ge=0, description="Total fiber")
    
    # Template data
    foods: List[Dict[str, Any]] = Field(..., description="Food configurations")
    
    # Dietary information
    dietary_tags: Optional[List[str]] = Field(None, description="Dietary tags")
    allergens: Optional[List[str]] = Field(None, description="Allergen information")
    prep_time_minutes: Optional[int] = Field(None, ge=0, description="Prep time in minutes")
    difficulty_level: Optional[str] = Field(None, description="Difficulty level")


class MealTemplateCreate(MealTemplateBase):
    pass


class MealTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    meal_type: Optional[str] = None
    cuisine_type: Optional[str] = None
    total_calories: Optional[float] = None
    total_protein_g: Optional[float] = None
    total_carbs_g: Optional[float] = None
    total_fat_g: Optional[float] = None
    total_fiber_g: Optional[float] = None
    foods: Optional[List[Dict[str, Any]]] = None
    dietary_tags: Optional[List[str]] = None
    prep_time_minutes: Optional[int] = None


class MealTemplate(MealTemplateBase):
    id: str
    is_popular: bool = False
    usage_count: int = 0
    created_by_system: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Search and filter schemas
class FoodSearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    brand: Optional[str] = Field(None, description="Filter by brand")
    dietary_tags: Optional[List[str]] = Field(None, description="Filter by dietary tags")
    max_calories_per_100g: Optional[float] = Field(None, description="Maximum calories per 100g")
    min_protein_per_100g: Optional[float] = Field(None, description="Minimum protein per 100g")
    verified_only: bool = Field(False, description="Only verified foods")
    limit: int = Field(20, ge=1, le=100, description="Result limit")
    offset: int = Field(0, ge=0, description="Result offset")


class FoodSearchResponse(BaseModel):
    foods: List[FoodWithUserData]
    total_count: int
    has_more: bool
    filters_applied: Dict[str, Any]


# Smart suggestions
class FoodSuggestion(BaseModel):
    food: Food
    reason: str = Field(..., description="Why this food is suggested")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence in suggestion")
    nutritional_benefits: Optional[List[str]] = Field(None, description="Key nutritional benefits")
    serving_suggestion: Optional[Dict[str, Any]] = Field(None, description="Suggested serving size")


class FoodSuggestionsResponse(BaseModel):
    suggestions: List[FoodSuggestion]
    user_preferences: Dict[str, Any]
    meal_context: Optional[str] = None
    generated_at: datetime


# Food alternatives
class FoodAlternative(BaseModel):
    original_food: Food
    alternative_food: Food
    substitution_ratio: float = 1.0
    reason: str
    confidence_score: float
    nutritional_comparison: Optional[Dict[str, Any]] = None


class FoodAlternativesResponse(BaseModel):
    alternatives: List[FoodAlternative]
    original_food: Food
    filter_reason: Optional[str] = None


# Barcode scanning
class BarcodeSearchRequest(BaseModel):
    barcode: str = Field(..., description="Product barcode")


class BarcodeSearchResponse(BaseModel):
    found: bool
    food: Optional[Food] = None
    suggested_foods: Optional[List[Food]] = Field(None, description="Similar foods if exact match not found")


# Quick logging
class QuickFoodLog(BaseModel):
    """Quick food logging with smart defaults."""
    food_id: str
    serving_grams: Optional[float] = None
    meal_type: Optional[str] = None
    use_smart_defaults: bool = True


class FoodLogWithDefaults(BaseModel):
    """Food log data with smart defaults applied."""
    food: Food
    suggested_serving_grams: Optional[float] = None
    suggested_meal_type: Optional[str] = None
    nutritional_info: Dict[str, Any]  # Calculated nutrition for suggested serving
    user_history: Optional[UserFoodHistory] = None
    alternatives: Optional[List[FoodAlternative]] = None


# Categories and metadata
class FoodCategory(BaseModel):
    name: str
    display_name: str
    description: str
    icon: str
    subcategories: Optional[List[str]] = None


class NutritionalProfile(BaseModel):
    """Nutritional profile for a serving size."""
    serving_grams: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    
    # Calculated percentages (optional)
    protein_percent: Optional[float] = None
    carbs_percent: Optional[float] = None
    fat_percent: Optional[float] = None
