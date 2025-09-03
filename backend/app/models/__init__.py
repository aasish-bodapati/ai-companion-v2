from app.db.base_class import Base
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.models.onboarding import OnboardingProfile
from app.models.memory import MemoryNode
from app.models.memory_audit import MemoryAudit
from app.models.user_goal import UserGoal
from app.models.user_health_info import UserHealthInfo

# This will make all models available for SQLAlchemy to discover
__all__ = [
    "Base",
    "User",
    "Conversation",
    "Message",
    "OnboardingProfile",
    "MemoryNode",
    "MemoryAudit",
    "UserGoal",
    "UserHealthInfo",
]
