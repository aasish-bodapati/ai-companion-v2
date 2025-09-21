from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class UserWeightLog(Base):
    """Centralized weight tracking for users."""

    __tablename__ = "user_weight_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Weight measurements
    weight_kg = Column(Float, nullable=False)
    body_fat_percent = Column(Float, nullable=True)
    muscle_mass_kg = Column(Float, nullable=True)
    waist_circumference_cm = Column(Float, nullable=True)
    hip_circumference_cm = Column(Float, nullable=True)

    # Context
    notes = Column(Text, nullable=True)
    log_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="weight_logs")

    def __repr__(self):
        return f"<UserWeightLog(id={self.id}, weight={self.weight_kg}kg, date={self.log_date})>"
