from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid

# Shared properties
class MessageBase(BaseModel):
    role: str = Field(..., description="Role of the message sender ('user' or 'assistant')")
    content: str = Field(..., description="Content of the message")

# Properties to receive via API on creation
class MessageCreate(MessageBase):
    pass

# Properties to return via API
class Message(MessageBase):
    id: uuid.UUID
    conversation_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Shared properties for Conversation
class ConversationBase(BaseModel):
    title: Optional[str] = Field(None, description="Optional title for the conversation")

# Properties to receive via API on creation
class ConversationCreate(ConversationBase):
    pass

# Properties to receive via API on update
class ConversationUpdate(ConversationBase):
    pass

# Properties to return via API
class Conversation(ConversationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Additional models for API responses
class ConversationWithMessages(Conversation):
    messages: List[Message] = []

class ConversationList(BaseModel):
    conversations: List[Conversation]
    total: int
