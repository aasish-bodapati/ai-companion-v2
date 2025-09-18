"""
Food Database Models for comprehensive nutrition tracking.
"""

from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON, Index, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid


class Food(Base):
    """Comprehensive food database with nutritional information."""
    
    __tablename__ = "foods"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic info
    name = Column(String(300), nullable=False, index=True)
    brand = Column(String(200), nullable=True, index=True)
    category = Column(String(100), nullable=False, index=True)  # fruits, vegetables, grains, etc.
    subcategory = Column(String(100), nullable=True)  # citrus_fruits, leafy_greens, etc.
    
    # Identifiers
    barcode = Column(String(50), nullable=True, unique=True, index=True)
    usda_fdc_id = Column(String(20), nullable=True, index=True)  # USDA Food Data Central ID
    
    # Nutritional info per 100g
    calories_per_100g = Column(Float, nullable=False)
    protein_per_100g = Column(Float, nullable=True, default=0)
    carbs_per_100g = Column(Float, nullable=True, default=0)
    fat_per_100g = Column(Float, nullable=True, default=0)
    fiber_per_100g = Column(Float, nullable=True, default=0)
    sugar_per_100g = Column(Float, nullable=True, default=0)
    sodium_per_100g = Column(Float, nullable=True, default=0)  # in mg
    
    # Additional nutrients (optional)
    calcium_per_100g = Column(Float, nullable=True)  # mg
    iron_per_100g = Column(Float, nullable=True)  # mg
    vitamin_c_per_100g = Column(Float, nullable=True)  # mg
    vitamin_d_per_100g = Column(Float, nullable=True)  # mcg
    
    # Serving information
    common_serving_sizes = Column(JSON, nullable=True)  # [{"name": "1 cup", "grams": 240}, ...]
    default_serving_grams = Column(Float, nullable=True, default=100)
    
    # Metadata
    description = Column(Text, nullable=True)
    ingredients = Column(JSON, nullable=True)  # For processed foods
    allergens = Column(JSON, nullable=True)  # ["gluten", "dairy", "nuts"]
    dietary_tags = Column(JSON, nullable=True)  # ["vegan", "gluten_free", "low_carb"]
    
    # Tracking metadata
    is_verified = Column(Boolean, default=False, index=True)  # Verified nutritional data
    is_popular = Column(Boolean, default=False, index=True)
    usage_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_foods_category_verified', 'category', 'is_verified'),
        Index('ix_foods_popular_usage', 'is_popular', 'usage_count'),
        Index('ix_foods_brand_category', 'brand', 'category'),
        Index('ix_foods_name_brand', 'name', 'brand'),
    )
    
    def __repr__(self):
        return f"<Food(id={self.id}, name={self.name}, brand={self.brand})>"


class UserFoodHistory(Base):
    """Track user's food logging history and preferences."""
    
    __tablename__ = "user_food_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Usage statistics
    times_logged = Column(Integer, default=1)
    last_logged = Column(DateTime(timezone=True), nullable=False)
    avg_serving_grams = Column(Float, nullable=True)
    
    # Meal preferences
    most_common_meal_type = Column(String(20), nullable=True)  # breakfast, lunch, dinner, snack
    preferred_serving_size = Column(String(50), nullable=True)  # "1 cup", "1 medium", etc.
    
    # Personal notes
    notes = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 stars
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="food_history")
    food = relationship("Food")
    
    # Unique constraint
    __table_args__ = (
        Index('ix_user_food_unique', 'user_id', 'food_id', unique=True),
        Index('ix_user_food_last_logged', 'user_id', 'last_logged'),
    )
    
    def __repr__(self):
        return f"<UserFoodHistory(user_id={self.user_id}, food={self.food.name if self.food else 'Unknown'})>"


class MealTemplate(Base):
    """Pre-built meal templates for quick logging."""
    
    __tablename__ = "meal_templates"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Template info
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    meal_type = Column(String(20), nullable=False, index=True)  # breakfast, lunch, dinner, snack
    cuisine_type = Column(String(50), nullable=True)  # italian, mexican, asian, etc.
    
    # Nutritional summary
    total_calories = Column(Float, nullable=False)
    total_protein_g = Column(Float, nullable=True)
    total_carbs_g = Column(Float, nullable=True)
    total_fat_g = Column(Float, nullable=True)
    total_fiber_g = Column(Float, nullable=True)
    
    # Template data
    foods = Column(JSON, nullable=False)  # Array of food configs
    # Example: [{"food_id": "uuid", "serving_grams": 150, "notes": "cooked"}]
    
    # Dietary information
    dietary_tags = Column(JSON, nullable=True)  # ["vegetarian", "low_carb", "high_protein"]
    allergens = Column(JSON, nullable=True)  # ["dairy", "nuts"]
    prep_time_minutes = Column(Integer, nullable=True)
    
    # Metadata
    is_popular = Column(Boolean, default=False, index=True)
    usage_count = Column(Integer, default=0)
    created_by_system = Column(Boolean, default=True)  # True for system templates
    difficulty_level = Column(String(20), nullable=True)  # easy, medium, hard
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<MealTemplate(id={self.id}, name={self.name}, meal_type={self.meal_type})>"


class FoodAlternative(Base):
    """Food alternatives and substitutions for dietary preferences."""
    
    __tablename__ = "food_alternatives"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Original and alternative foods
    original_food_id = Column(String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)
    alternative_food_id = Column(String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)
    
    # Substitution info
    substitution_ratio = Column(Float, default=1.0)  # 1:1 substitution by default
    reason = Column(String(100), nullable=False)  # "lower_calorie", "dairy_free", "gluten_free"
    confidence_score = Column(Float, default=0.8)  # How good is this substitution
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    original_food = relationship("Food", foreign_keys=[original_food_id])
    alternative_food = relationship("Food", foreign_keys=[alternative_food_id])
    
    __table_args__ = (
        Index('ix_food_alternatives_original', 'original_food_id'),
        Index('ix_food_alternatives_reason', 'reason'),
    )
    
    def __repr__(self):
        return f"<FoodAlternative(original={self.original_food_id}, alternative={self.alternative_food_id})>"


class RecipeIngredient(Base):
    """Ingredients for custom recipes."""
    
    __tablename__ = "recipe_ingredients"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipe_id = Column(String(36), ForeignKey("meal_templates.id", ondelete="CASCADE"), nullable=False)
    food_id = Column(String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)
    
    # Ingredient details
    quantity_grams = Column(Float, nullable=False)
    preparation_method = Column(String(100), nullable=True)  # "chopped", "cooked", "raw"
    is_optional = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)  # Order in recipe
    
    # Relationships
    recipe = relationship("MealTemplate", backref="ingredients")
    food = relationship("Food")
    
    def __repr__(self):
        return f"<RecipeIngredient(recipe_id={self.recipe_id}, food_id={self.food_id})>"
