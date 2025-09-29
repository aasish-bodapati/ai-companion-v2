"""
Food Database models for storing food information and user history.
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Food(Base):
    """Food database model for storing food information."""

    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    brand = Column(String(100), nullable=True)
    category = Column(String(50), nullable=False, index=True)
    subcategory = Column(String(50), nullable=True)
    barcode = Column(String(50), nullable=True, unique=True)
    usda_fdc_id = Column(String(50), nullable=True, unique=True)
    
    # Nutritional info per 100g
    calories_per_100g = Column(Float, nullable=False)
    protein_per_100g = Column(Float, default=0, nullable=False)
    carbs_per_100g = Column(Float, default=0, nullable=False)
    fat_per_100g = Column(Float, default=0, nullable=False)
    fiber_per_100g = Column(Float, default=0, nullable=True)
    sugar_per_100g = Column(Float, default=0, nullable=True)
    sodium_per_100g = Column(Float, default=0, nullable=True)  # in mg
    
    # Additional nutrients
    calcium_per_100g = Column(Float, nullable=True)  # in mg
    iron_per_100g = Column(Float, nullable=True)  # in mg
    vitamin_c_per_100g = Column(Float, nullable=True)  # in mg
    vitamin_d_per_100g = Column(Float, nullable=True)  # in mcg
    
    # Serving information
    common_serving_sizes = Column(JSON, nullable=True)  # List of serving size dictionaries
    default_serving_grams = Column(Float, default=100, nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    ingredients = Column(JSON, nullable=True)  # List of ingredients
    allergens = Column(JSON, nullable=True)  # List of allergens
    dietary_tags = Column(JSON, nullable=True)  # List of dietary tags (vegan, gluten-free, etc.)
    
    # Usage tracking
    is_popular = Column(Boolean, default=False, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    external_id = Column(String(100), nullable=True, index=True)
    source = Column(String(50), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships - commented out to avoid circular import issues
    # user_history = relationship("UserFoodHistory", back_populates="food")
    # log_items = relationship("FoodLogItem", back_populates="food", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Food(id={self.id}, name={self.name}, category={self.category})>"


class UserFoodHistory(Base):
    """User food history for tracking personal food consumption."""

    __tablename__ = "user_food_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Consumption tracking
    times_consumed = Column(Integer, default=1, nullable=False)
    last_consumed = Column(DateTime(timezone=True), nullable=False)
    avg_serving_grams = Column(Float, nullable=True)
    avg_calories_consumed = Column(Float, nullable=True)
    
    # User preferences
    is_favorite = Column(Boolean, default=False, nullable=False)
    taste_rating = Column(Integer, nullable=True)  # 1-5 scale
    health_rating = Column(Integer, nullable=True)  # 1-5 scale
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships - commented out to avoid circular import issues
    # user = relationship("User", back_populates="food_history")
    # food = relationship("Food", back_populates="user_history")

    def __repr__(self):
        return f"<UserFoodHistory(user_id={self.user_id}, food_id={self.food_id}, times={self.times_consumed})>"
