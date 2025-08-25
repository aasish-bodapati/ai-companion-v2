from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NoteBase(BaseModel):
    title: str
    body: Optional[str] = None
    tags: Optional[str] = None  # comma-separated


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[str] = None


class Note(NoteBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    # Pydantic v2 config
    model_config = ConfigDict(from_attributes=True)
