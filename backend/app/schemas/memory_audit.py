from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class MemoryAuditCreate(BaseModel):
    user_id: str
    faiss_id: str
    action: str  # update|soft_delete|hard_delete
    source: Optional[str] = None
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    before_content: Optional[str] = None
    after_content: Optional[str] = None
    before_metadata: Optional[str] = None
    after_metadata: Optional[str] = None
    # Request context metadata (nullable/backward compatible)
    request_ip: Optional[str] = None
    user_agent: Optional[str] = None


class MemoryAuditResponse(MemoryAuditCreate):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
