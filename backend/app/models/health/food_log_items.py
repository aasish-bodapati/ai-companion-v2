"""
Food Log Items model for detailed nutrition tracking.
"""

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class FoodLogItem(Base):
    """Food log item for detailed nutrition tracking within nutrition logs."""

    __tablename__ = "food_log_items"

    id = Column(String(36), primary_key=True, index=True)
    nutrition_log_id = Column(String(36), ForeignKey("nutrition_logs.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=True, index=True)
    food_name = Column(String(300), nullable=False)
    quantity_grams = Column(Float, nullable=False)
    
    # Nutritional values for this specific item
    calories = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    fiber_g = Column(Float, nullable=True)
    sugar_g = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships - commented out to avoid circular import issues
    # nutrition_log = relationship("NutritionLog", back_populates="food_items")
    # food = relationship("Food", back_populates="log_items")

    # Constraints
    __table_args__ = (
        CheckConstraint('quantity_grams > 0', name='ck_food_log_items_quantity_positive'),
        CheckConstraint('calories >= 0', name='ck_food_log_items_calories_positive'),
    )

    def __repr__(self):
        return f"<FoodLogItem(id={self.id}, food_name={self.food_name}, quantity={self.quantity_grams}g)>"
