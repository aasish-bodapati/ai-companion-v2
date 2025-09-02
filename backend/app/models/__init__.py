from app.db.base_class import Base
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.models.onboarding import OnboardingProfile
from app.models.memory import MemoryNode
from app.models.memory_audit import MemoryAudit
# Coaching models removed for MVP focus

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
    "MemoryAudit",
    "Note",
    "Task",
    "Reminder",
]
