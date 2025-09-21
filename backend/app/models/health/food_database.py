"""
Food Database Models for comprehensive nutrition tracking.
"""

from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON, Index, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid

class Food(Base):
    """Simplified food database with essential nutritional information."""

    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Basic info
    name = Column(String(200), nullable=False, index=True)
    brand = Column(String(100), nullable=True, index=True)
    category = Column(String(50), nullable=False, index=True)  # fruits, vegetables, grains, etc.

    # Essential nutritional info per 100g
    calories_per_100g = Column(Float, nullable=False)
    protein_per_100g = Column(Float, nullable=True, default=0)
    carbs_per_100g = Column(Float, nullable=True, default=0)
    fat_per_100g = Column(Float, nullable=True, default=0)
    fiber_per_100g = Column(Float, nullable=True, default=0)
    sugar_per_100g = Column(Float, nullable=True, default=0)
    sodium_per_100g = Column(Float, nullable=True, default=0)  # in mg

    # Default serving size
    default_serving_grams = Column(Float, nullable=True, default=100)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    food_log_items = relationship("FoodLogItem", back_populates="food")

    # Simple indexes
    __table_args__ = (
        Index('ix_foods_category', 'category'),
        Index('ix_foods_name', 'name'),
    )

    def __repr__(self):
        return f"<Food(id={self.id}, name={self.name}, brand={self.brand})>"

class UserFoodHistory(Base):
    """Simple user food logging history."""

    __tablename__ = "user_food_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True)

    # Basic usage tracking
    times_logged = Column(Integer, default=1)
    last_logged = Column(DateTime(timezone=True), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="food_history")
    food = relationship("Food")

    # Unique constraint
    __table_args__ = (
        Index('ix_user_food_unique', 'user_id', 'food_id', unique=True),
    )

    def __repr__(self):
        return f"<UserFoodHistory(user_id={self.user_id}, food={self.food.name if self.food else 'Unknown'})>"

# Removed overly complex meal template and food alternative tables
# These can be implemented later if needed with simpler structures
