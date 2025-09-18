from sqlalchemy import Boolean, Column, String
from sqlalchemy.orm import relationship
import uuid

from app.db.base_class import Base


class User(Base):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
        nullable=False,
    )
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    # When null -> follow global settings.MEMORY_ENABLED; when True/False -> override per user
    memory_enabled = Column(Boolean(), nullable=True)

    # Relationships
    conversations = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
    )
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
    
    # New relationships for exercise and food databases
    exercise_history = relationship(
        "UserExerciseHistory",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    food_history = relationship(
        "UserFoodHistory", 
        back_populates="user",
        cascade="all, delete-orphan",
    )


    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}'>"
