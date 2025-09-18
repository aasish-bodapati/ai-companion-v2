"""
Pydantic schemas - All API request/response schemas
"""

from .user import User, UserCreate, UserUpdate, UserInDB
from .conversation import Conversation, ConversationCreate, ConversationUpdate, Message, MessageCreate, MessageUpdate
from .onboarding import OnboardingProfile, OnboardingProfileCreate, OnboardingProfileUpdate
from .health import *

__all__ = [
    # User schemas
    "User",
    "UserCreate", 
    "UserUpdate",
    "UserInDB",
    # Conversation schemas
    "Conversation",
    "ConversationCreate",
    "ConversationUpdate",
    "Message",
    "MessageCreate",
    "MessageUpdate",
    # Onboarding schemas
    "OnboardingProfile",
    "OnboardingProfileCreate",
    "OnboardingProfileUpdate",
    # Health schemas (imported from health module)
]
