"""
Unified Health Logging Model - Consolidates all health tracking into one table
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float, CheckConstraint, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class UnifiedHealthLog(Base):
    """
    Unified health logging model that consolidates:
    - Fitness logs (workouts, exercises)
    - Nutrition logs (meals, food)
    - Mood logs (mood tracking)
    - Water logs (water intake)
    - Weight logs (weight tracking)
    """

    __tablename__ = "unified_health_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Log type and basic info
    log_type = Column(String(20), nullable=False)  # 'fitness', 'nutrition', 'mood', 'water', 'weight'
    log_subtype = Column(String(50), nullable=True)  # 'workout', 'meal', 'mood_entry', 'water_intake', 'weight_entry'
    
    # Core data stored as JSON for flexibility
    data = Column(JSON, nullable=False)  # Type-specific data stored as JSON
    
    # Common fields for all log types
    value = Column(Float, nullable=True)  # Numeric value (calories, weight, mood rating, etc.)
    unit = Column(String(20), nullable=True)  # Unit of measurement
    notes = Column(Text, nullable=True)  # User notes
    
    # Timestamps
    log_date = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "log_type IN ('fitness', 'nutrition', 'mood', 'water', 'weight')", 
            name='ck_unified_health_logs_type'
        ),
        CheckConstraint('value >= 0', name='ck_unified_health_logs_value'),
    )

    def __repr__(self):
        return f"<UnifiedHealthLog(id={self.id}, type={self.log_type}, value={self.value})>"

    @property
    def is_fitness(self):
        return self.log_type == 'fitness'
    
    @property
    def is_nutrition(self):
        return self.log_type == 'nutrition'
    
    @property
    def is_mood(self):
        return self.log_type == 'mood'
    
    @property
    def is_water(self):
        return self.log_type == 'water'
    
    @property
    def is_weight(self):
        return self.log_type == 'weight'

