# This file makes the crud directory a Python package
from .base import CRUDBase
from .user import user
# Memory system removed - simplified for health focus
from .onboarding import onboarding_profile
from .health.fitness_log import fitness_log, nutrition_log, mood_log
from .health.nutrition_routine import (
    nutrition_routine,
    nutrition_user_routine_progress
)
from .health.simple_routine import simple_routine
from .health.user_goals import user_health_profile
# Coaching CRUD removed for MVP focus

__all__ = [
    "CRUDBase",
    "user",
    # "memory",  # Removed - simplified for health focus
    "onboarding_profile",
    "fitness_log",
    "nutrition_log",
    "mood_log",
    "nutrition_routine",
    "nutrition_user_routine_progress",
    "simple_routine",
    "user_health_profile",
]
