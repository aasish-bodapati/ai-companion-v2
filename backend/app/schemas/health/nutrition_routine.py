from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"

class DayName(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

# Base schemas
class NutritionRoutineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    duration_weeks: int = Field(4, ge=1, le=52)
    tags: Optional[List[str]] = None

    # Target calories only (simplified)
    target_calories: int = Field(2000, ge=500, le=10000)

class NutritionRoutineCreate(NutritionRoutineBase):
    pass

class NutritionRoutineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    duration_weeks: Optional[int] = Field(None, ge=1, le=52)
    tags: Optional[List[str]] = None

    # Target calories only (simplified)
    target_calories: Optional[int] = Field(None, ge=500, le=10000)

class NutritionRoutine(NutritionRoutineBase):
    id: str
    is_template: bool
    created_by_user_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Meal Plan schemas
class NutritionMealPlanBase(BaseModel):
    day_name: DayName
    day_order: int = Field(0, ge=0, le=6)
    plan_name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None

    # Daily calories only (simplified)
    daily_calories: int = Field(..., ge=500, le=10000)

class NutritionMealPlanCreate(NutritionMealPlanBase):
    pass

class NutritionMealPlan(NutritionMealPlanBase):
    id: str
    routine_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Meal schemas
class NutritionMealBase(BaseModel):
    meal_type: MealType
    meal_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    order_index: int = Field(0, ge=0)

    # Nutritional targets for this meal (simplified)
    target_calories: int = Field(..., ge=0, le=5000)

    # Food suggestions
    food_suggestions: Optional[List[Dict[str, Any]]] = None

class NutritionMealCreate(NutritionMealBase):
    pass

class NutritionMeal(NutritionMealBase):
    id: str
    meal_plan_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Food item schemas
class NutritionMealFoodBase(BaseModel):
    food_name: str = Field(..., min_length=1, max_length=100)
    quantity: str = Field(..., min_length=1, max_length=50)
    order_index: int = Field(0, ge=0)

    # Nutritional information (simplified)
    calories: int = Field(..., ge=0, le=10000)
    protein_g: Optional[float] = Field(None, ge=0, le=1000)
    carbs_g: Optional[float] = Field(None, ge=0, le=1000)
    fat_g: Optional[float] = Field(None, ge=0, le=1000)

class NutritionMealFoodCreate(NutritionMealFoodBase):
    pass

class NutritionMealFood(NutritionMealFoodBase):
    id: str
    meal_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# User progress schemas
class NutritionUserRoutineProgressBase(BaseModel):
    is_active: bool = False
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    meals_completed: int = Field(0, ge=0)
    days_completed: int = Field(0, ge=0)
    last_meal_date: Optional[datetime] = None

class NutritionUserRoutineProgressCreate(NutritionUserRoutineProgressBase):
    routine_id: str

class NutritionUserRoutineProgress(NutritionUserRoutineProgressBase):
    id: str
    routine_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Complex schemas for API responses
class NutritionMealWithFoods(NutritionMeal):
    food_items: List[NutritionMealFood] = []

class NutritionMealPlanWithMeals(NutritionMealPlan):
    meals: List[NutritionMealWithFoods] = []

class NutritionRoutineWithMealPlans(NutritionRoutine):
    meal_plans: List[NutritionMealPlanWithMeals] = []

# Request schemas for creating routines with meal plans
class CreateNutritionRoutineRequest(BaseModel):
    routine_data: NutritionRoutineCreate
    meal_plans: List[Dict[str, Any]]  # Will contain meal plans with meals and foods

class UpdateNutritionRoutineRequest(BaseModel):
    routine_data: NutritionRoutineUpdate
    meal_plans: List[Dict[str, Any]]  # Will contain meal plans with meals and foods
