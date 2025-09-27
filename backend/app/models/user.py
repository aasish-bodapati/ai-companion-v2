from sqlalchemy import Boolean, Column, String, Integer
from sqlalchemy.orm import relationship
from typing import TYPE_CHECKING

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.health.user_goal import UserGoal
    from app.models.health.exercise_database import UserExerciseHistory
    from app.models.health.food_database import UserFoodHistory

class User(Base):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True,
        nullable=False,
    )
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)

    # Relationships
    onboarding_profile = relationship(
        "OnboardingProfile",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
    health_info = relationship(
        "UserHealthProfile",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
    fitness_logs = relationship(
        "FitnessLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    nutrition_logs = relationship(
        "NutritionLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    mood_logs = relationship(
        "MoodLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    water_logs = relationship(
        "WaterLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    weight_logs = relationship(
        "UserWeightLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    nutrition_routines = relationship(
        "NutritionRoutine",
        back_populates="created_by_user",
        cascade="all, delete-orphan",
    )
    nutrition_routine_progress = relationship(
        "NutritionUserRoutineProgress",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Exercise database relationship - commented out to avoid circular import issues
    # exercise_history = relationship(
    #     "UserExerciseHistory",
    #     back_populates="user",
    #     cascade="all, delete-orphan",
    # )
    # Food database relationship - commented out to avoid circular import issues
    # food_history = relationship(
    #     "UserFoodHistory",
    #     back_populates="user",
    #     cascade="all, delete-orphan",
    # )
    # User goals relationship - commented out to avoid circular import issues
    # goals = relationship(
    #     "UserGoal",
    #     back_populates="user",
    #     cascade="all, delete-orphan",
    # )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}'>"
