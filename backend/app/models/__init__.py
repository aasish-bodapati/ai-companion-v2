from app.db.base_class import Base
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.models.onboarding import OnboardingProfile

# This will make all models available for SQLAlchemy to discover
__all__ = ["Base", "User", "Conversation", "Message", "OnboardingProfile"]
