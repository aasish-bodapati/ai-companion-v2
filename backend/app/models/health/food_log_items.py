"""
Food Log Items Model for detailed nutrition tracking.
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class FoodLogItem(Base):
    """Individual food items within a nutrition log entry."""

    __tablename__ = "food_log_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nutrition_log_id = Column(Integer, ForeignKey("nutrition_logs.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Food details
    food_name = Column(String(300), nullable=False)
    quantity_grams = Column(Numeric, nullable=False)
    
    # Nutritional information (calculated based on quantity)
    calories = Column(Numeric, nullable=True)
    protein_g = Column(Numeric, nullable=True)
    carbs_g = Column(Numeric, nullable=True)
    fat_g = Column(Numeric, nullable=True)
    fiber_g = Column(Numeric, nullable=True)
    sugar_g = Column(Numeric, nullable=True)
    sodium_mg = Column(Numeric, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    nutrition_log = relationship("NutritionLog", back_populates="food_log_items")
    food = relationship("Food", back_populates="food_log_items")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("quantity_grams > 0", name='ck_food_log_items_quantity_positive'),
        CheckConstraint("calories >= 0", name='ck_food_log_items_calories_positive'),
        CheckConstraint("protein_g >= 0", name='ck_food_log_items_protein_positive'),
        CheckConstraint("carbs_g >= 0", name='ck_food_log_items_carbs_positive'),
        CheckConstraint("fat_g >= 0", name='ck_food_log_items_fat_positive'),
        CheckConstraint("fiber_g >= 0", name='ck_food_log_items_fiber_positive'),
        CheckConstraint("sugar_g >= 0", name='ck_food_log_items_sugar_positive'),
        CheckConstraint("sodium_mg >= 0", name='ck_food_log_items_sodium_positive'),
        Index('idx_food_log_items_nutrition_log_id', 'nutrition_log_id'),
        Index('idx_food_log_items_food_id', 'food_id'),
        Index('idx_food_log_items_created_at', 'created_at'),
    )

    def __repr__(self):
        return f"<FoodLogItem(id={self.id}, food={self.food_name}, quantity={self.quantity_grams}g)>"
