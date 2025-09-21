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

    # Additional metrics
    distance_km = Column(Float, nullable=True)  # for cardio activities
    weight_kg = Column(Float, nullable=True)  # for weightlifting
    reps = Column(Integer, nullable=True)  # for strength training
    sets = Column(Integer, nullable=True)  # for strength training

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
        CheckConstraint('distance_km >= 0', name='ck_fitness_logs_distance'),
        CheckConstraint('weight_kg >= 0', name='ck_fitness_logs_weight'),
        CheckConstraint('reps >= 0', name='ck_fitness_logs_reps'),
        CheckConstraint('sets >= 0', name='ck_fitness_logs_sets'),
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

    # Nutritional information
    total_calories = Column(Integer, nullable=False)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    fiber_g = Column(Float, nullable=True)
    sugar_g = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)

    # Food items (JSON array)
    _food_items = Column("food_items", Text, nullable=False)  # JSON array of food items with details

    @property
    def food_items(self):
        """Deserialize food_items JSON string to list."""
        if self._food_items and isinstance(self._food_items, str):
            try:
                import json
                return json.loads(self._food_items)
            except (json.JSONDecodeError, TypeError):
                return []
        return self._food_items or []

    @food_items.setter
    def food_items(self, value):
        """Serialize food_items list to JSON string."""
        if isinstance(value, list):
            import json
            self._food_items = json.dumps(value)
        else:
            self._food_items = value

    # Context and notes
    notes = Column(Text, nullable=True)

    # Timestamps
    meal_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="nutrition_logs")
    food_log_items = relationship("FoodLogItem", back_populates="nutrition_log", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint("meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')", name='ck_nutrition_logs_meal_type'),
        CheckConstraint('total_calories >= 0', name='ck_nutrition_logs_calories'),
        CheckConstraint('protein_g >= 0', name='ck_nutrition_logs_protein'),
        CheckConstraint('carbs_g >= 0', name='ck_nutrition_logs_carbs'),
        CheckConstraint('fat_g >= 0', name='ck_nutrition_logs_fat'),
        CheckConstraint('fiber_g >= 0', name='ck_nutrition_logs_fiber'),
        CheckConstraint('sugar_g >= 0', name='ck_nutrition_logs_sugar'),
        CheckConstraint('sodium_mg >= 0', name='ck_nutrition_logs_sodium'),
    )

    def __repr__(self):
        return f"<NutritionLog(id={self.id}, meal={self.meal_type}, calories={self.total_calories})>"

class MoodLog(Base):
    """Mood and wellness logging for users."""

    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Mood details
    mood_rating = Column(Integer, nullable=False)  # 1-10 scale
    energy_level = Column(Integer, nullable=True)  # 1-10 scale
    stress_level = Column(Integer, nullable=True)  # 1-10 scale
    sleep_quality = Column(Integer, nullable=True)  # 1-10 scale
    sleep_hours = Column(Float, nullable=True)

    # Additional wellness metrics

    # Context and notes
    notes = Column(Text, nullable=True)
    activities = Column(Text, nullable=True)  # JSON array of activities that day

    # Timestamps
    log_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="mood_logs")

    # Constraints
    __table_args__ = (
        CheckConstraint('mood_rating >= 1 AND mood_rating <= 10', name='ck_mood_logs_rating'),
        CheckConstraint('energy_level >= 1 AND energy_level <= 10', name='ck_mood_logs_energy'),
        CheckConstraint('stress_level >= 1 AND stress_level <= 10', name='ck_mood_logs_stress'),
        CheckConstraint('sleep_quality >= 1 AND sleep_quality <= 10', name='ck_mood_logs_sleep_quality'),
        CheckConstraint('sleep_hours >= 0 AND sleep_hours <= 24', name='ck_mood_logs_sleep_hours'),
    )

    def __repr__(self):
        return f"<MoodLog(id={self.id}, mood={self.mood_rating}, energy={self.energy_level})>"
