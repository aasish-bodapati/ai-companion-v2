from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, BaseModel
from .user import User
from .conversation import Conversation, Message, MessageRole

# Import all models here to ensure they are registered with SQLAlchemy
__all__ = [
    'Base',
    'BaseModel',
    'User',
    'Conversation',
    'Message',
    'MessageRole'
]

# This ensures all models are imported for SQLAlchemy's metadata
def init_models():
    # This will create all tables in the database
    from ..database import Base, engine
    Base.metadata.create_all(bind=engine)
