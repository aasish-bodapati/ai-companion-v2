from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class FitnessLog(Base):
    """Fitness activity logging for users."""

    __tablename__ = "fitness_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Activity details
    activity_type = Column(String(50), nullable=False)  # running, weightlifting, yoga, etc.
    activity_name = Column(String(100), nullable=True)  # custom name for the activity
    duration_minutes = Column(Integer, nullable=False)
    calories_burned = Column(Integer, nullable=True)

    # Additional metrics - simplified to core tracking only

    # Context and notes
    notes = Column(Text, nullable=True)

    # Timestamps
    activity_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="fitness_logs")

    # Constraints
    __table_args__ = (
        CheckConstraint('duration_minutes > 0 AND duration_minutes <= 1440', name='ck_fitness_logs_duration'),
        CheckConstraint('calories_burned >= 0', name='ck_fitness_logs_calories'),
    )

    def __repr__(self):
        return f"<FitnessLog(id={self.id}, activity={self.activity_type}, duration={self.duration_minutes}min)>"

class NutritionLog(Base):
    """Nutrition and food logging for users."""

    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Meal details
    meal_type = Column(String(20), nullable=False)  # breakfast, lunch, dinner, snack
    meal_name = Column(String(100), nullable=True)  # custom name for the meal

    # Nutritional information - simplified to core tracking only
    total_calories = Column(Integer, nullable=False)

    # Context and notes
    notes = Column(Text, nullable=True)

    # Timestamps
    meal_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="nutrition_logs")
    # food_items = relationship("FoodLogItem", back_populates="nutrition_log", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint("meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')", name='ck_nutrition_logs_meal_type'),
        CheckConstraint('total_calories >= 0', name='ck_nutrition_logs_calories'),
    )

    def __repr__(self):
        return f"<NutritionLog(id={self.id}, meal={self.meal_type}, calories={self.total_calories})>"

class MoodLog(Base):
    """Mood and wellness logging for users."""

    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Mood details - simplified to core tracking only
    mood_rating = Column(Integer, nullable=False)  # 1-10 scale

    # Context and notes
    notes = Column(Text, nullable=True)

    # Timestamps
    log_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="mood_logs")

    # Constraints
    __table_args__ = (
        CheckConstraint('mood_rating >= 1 AND mood_rating <= 10', name='ck_mood_logs_rating'),
    )

    def __repr__(self):
        return f"<MoodLog(id={self.id}, mood={self.mood_rating})>"
