from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.base_class import Base


class NutritionRoutine(Base):
    """Nutrition routine templates and user-created routines."""
    
    __tablename__ = "nutrition_routines"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Routine metadata
    difficulty = Column(String(20), nullable=False, default="beginner")  # beginner, intermediate, advanced
    duration_weeks = Column(Integer, nullable=False, default=4)
    tags = Column(Text, nullable=True)  # JSON array of tags
    
    # Target calories only (simplified)
    target_calories = Column(Integer, nullable=False, default=2000)
    
    # Routine type and ownership
    is_template = Column(Boolean, default=False)
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", back_populates="nutrition_routines")
    meal_plans = relationship("NutritionMealPlan", back_populates="routine", cascade="all, delete-orphan")
    user_progress = relationship("NutritionUserRoutineProgress", back_populates="routine", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<NutritionRoutine(id={self.id}, name='{self.name}', difficulty='{self.difficulty}')>"


class NutritionMealPlan(Base):
    """Daily meal plans within a nutrition routine."""
    
    __tablename__ = "nutrition_meal_plans"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    routine_id = Column(String(36), ForeignKey("nutrition_routines.id", ondelete="CASCADE"), nullable=False)
    
    # Day information
    day_name = Column(String(20), nullable=False)  # monday, tuesday, etc.
    day_order = Column(Integer, nullable=False, default=0)
    
    # Meal plan details
    plan_name = Column(String(100), nullable=True)  # e.g., "High Protein Day"
    description = Column(Text, nullable=True)
    
    # Daily calories only (simplified)
    daily_calories = Column(Integer, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    routine = relationship("NutritionRoutine", back_populates="meal_plans")
    meals = relationship("NutritionMeal", back_populates="meal_plan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<NutritionMealPlan(id={self.id}, day='{self.day_name}', routine_id={self.routine_id})>"


class NutritionMeal(Base):
    """Individual meals within a meal plan."""
    
    __tablename__ = "nutrition_meals"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meal_plan_id = Column(String(36), ForeignKey("nutrition_meal_plans.id", ondelete="CASCADE"), nullable=False)
    
    # Meal details
    meal_type = Column(String(20), nullable=False)  # breakfast, lunch, dinner, snack
    meal_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    
    # Nutritional targets for this meal (simplified)
    target_calories = Column(Integer, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    meal_plan = relationship("NutritionMealPlan", back_populates="meals")
    food_items = relationship("NutritionMealFood", back_populates="meal", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<NutritionMeal(id={self.id}, type='{self.meal_type}', name='{self.meal_name}')>"


class NutritionMealFood(Base):
    """Food items within a meal."""
    
    __tablename__ = "nutrition_meal_foods"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meal_id = Column(String(36), ForeignKey("nutrition_meals.id", ondelete="CASCADE"), nullable=False)
    
    # Food details
    food_name = Column(String(100), nullable=False)
    quantity = Column(String(50), nullable=False)  # e.g., "100g", "1 cup", "2 slices"
    order_index = Column(Integer, nullable=False, default=0)
    
    # Nutritional information (simplified)
    calories = Column(Integer, nullable=False)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    meal = relationship("NutritionMeal", back_populates="food_items")
    
    def __repr__(self):
        return f"<NutritionMealFood(id={self.id}, food='{self.food_name}', quantity='{self.quantity}')>"


class NutritionUserRoutineProgress(Base):
    """User progress tracking for nutrition routines."""
    
    __tablename__ = "nutrition_user_routine_progress"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    routine_id = Column(String(36), ForeignKey("nutrition_routines.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Progress tracking
    is_active = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Statistics
    meals_completed = Column(Integer, default=0)
    days_completed = Column(Integer, default=0)
    last_meal_date = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    routine = relationship("NutritionRoutine", back_populates="user_progress")
    user = relationship("User", back_populates="nutrition_routine_progress")
    
    def __repr__(self):
        return f"<NutritionUserRoutineProgress(id={self.id}, routine_id={self.routine_id}, user_id={self.user_id}, active={self.is_active})>"
