from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, BaseModel
from .user import User
from .conversation import Conversation, Message, MessageRole
from .document import Document

# Import all models here to ensure they are registered with SQLAlchemy
__all__ = [
    'Base',
    'User',
    'Conversation',
    'Message',
    'MessageRole',
    'Document',
]

def init_models():
    # This will create all tables
    from .base import Base
    from .database import engine
    Base.metadata.create_all(bind=engine)
    
    # Ensure all relationships are properly set up
    if hasattr(User, 'documents') and hasattr(Document, 'user'):
        User.documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
