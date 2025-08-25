from app.db.base_class import Base
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.models.onboarding import OnboardingProfile
from app.models.memory import MemoryNode
from app.models.coaching import Goal as CoachingGoal, Routine as CoachingRoutine
from app.models.coaching import WorkoutLog, MealLog, HydrationLog, MoodLog, JournalEntry
from app.models.coaching import WorkoutPlan, NutritionPlan
from app.models.calendar import CalendarEvent
from app.models.note import Note
from app.models.task import Task
from app.models.reminder import Reminder

# This will make all models available for SQLAlchemy to discover
__all__ = [
    "Base",
    "User",
    "Conversation",
    "Message",
    "OnboardingProfile",
    "MemoryNode",
    "CalendarEvent",
    "Note",
    "Task",
    "Reminder",
    "CoachingGoal",
    "CoachingRoutine",
    "WorkoutLog",
    "MealLog",
    "HydrationLog",
    "MoodLog",
    "JournalEntry",
    "WorkoutPlan",
    "NutritionPlan",
]
