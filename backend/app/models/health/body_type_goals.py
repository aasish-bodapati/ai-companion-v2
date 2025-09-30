"""
Body Type Goals Model
Stores predefined body type goals with their target attributes
"""

from sqlalchemy import Column, Integer, String, Float, Text, Boolean
from sqlalchemy.dialects.postgresql import JSON
from app.db.base_class import Base


class BodyTypeGoal(Base):
    __tablename__ = "body_type_goals"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False, default="body_type")
    icon = Column(String, nullable=False)
    color = Column(String, nullable=False)
    
    # Target values
    target_bmi = Column(Float, nullable=False)
    target_body_fat = Column(Float, nullable=True)
    
    # Target attributes stored as JSON
    target_attributes = Column(JSON, nullable=False)
    
    # Metadata
    created_by = Column(Integer, nullable=True)  # User ID who created this goal
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<BodyTypeGoal(id='{self.id}', name='{self.name}')>"
