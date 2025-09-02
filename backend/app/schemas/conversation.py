from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID

from app.schemas.memory import MemorySearchResult

# Shared properties


class MessageBase(BaseModel):
    role: str = Field(
        default="user",
        description="Role of the message sender ('user' or 'assistant')",
    )
    content: str = Field(..., description="Content of the message")


# Properties to receive via API on creation
class MessageCreate(MessageBase):
    remember: bool | None = Field(
        default=None,
        description=(
            "If true, explicitly save this user message to memory. "
            "If omitted, smart gating applies."
        ),
    )


# Properties to return via API
class Message(MessageBase):
    id: UUID
    conversation_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Shared properties for Conversation
class ConversationBase(BaseModel):
    title: Optional[str] = Field(None, description="Optional title for the conversation")
    personalization_enabled: Optional[bool] = Field(
        True,
        description="Whether personalized memory/profile context is used for replies",
    )
    incognito_mode: Optional[bool] = Field(
        False,
        description="Whether this conversation is in incognito mode (no memory storage or retrieval)",
    )


# Properties to receive via API on creation
class ConversationCreate(ConversationBase):
    pass


# Properties to receive via API on update
class ConversationUpdate(ConversationBase):
    pass


# Properties to return via API
class Conversation(ConversationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Additional models for API responses
class ConversationWithMessages(Conversation):
    messages: List[Message] = []


class ConversationList(BaseModel):
    conversations: List[Conversation]
    total: int


# Assistant reply with provenance for explainability
class AssistantReply(BaseModel):
    """Response shape for non-streaming assistant reply including provenance."""

    # Back-compat convenience: expose the assistant message id at the top level
    id: UUID | None = None
    message: Message
    provenance: List[MemorySearchResult] = []
    # Diagnostics: whether a real LLM call was used (False if local stub or deterministic handler)
    used_llm: bool | None = None
