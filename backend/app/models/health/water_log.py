from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class WaterLog(Base):
    """Water intake logging for users."""

    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Water intake details
    amount_ml = Column(Integer, nullable=False)  # Amount in milliliters
    amount_oz = Column(Float, nullable=True)  # Amount in ounces (calculated)
    log_type = Column(String(20), nullable=False, default="manual")  # manual, goal, reminder

    # Context and notes
    notes = Column(Text, nullable=True)

    # Timestamps
    log_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="water_logs")

    # Constraints
    __table_args__ = (
        CheckConstraint('amount_ml > 0 AND amount_ml <= 10000', name='ck_water_logs_amount_ml'),
        CheckConstraint("log_type IN ('manual', 'goal', 'reminder')", name='ck_water_logs_log_type'),
    )

    def __repr__(self):
        return f"<WaterLog(id={self.id}, amount={self.amount_ml}ml, date={self.log_date})>"
