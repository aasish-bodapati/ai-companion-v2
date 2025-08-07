from pydantic import BaseModel, Field, HttpUrl, validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from enum import Enum

class DocumentStatus(str, Enum):
    """Status of document processing"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class DocumentBase(BaseModel):
    title: Optional[str] = Field(None, max_length=100, description="User-friendly title for the document")
    description: Optional[str] = Field(None, description="Optional description of the document")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata for the document")

class DocumentCreate(DocumentBase):
    file_name: str = Field(..., description="Original name of the uploaded file")
    file_type: str = Field(..., description="MIME type of the file")
    file_size: int = Field(..., ge=1, description="Size of the file in bytes")
    process_async: bool = Field(True, description="Whether to process the document asynchronously")

class DocumentUpdate(DocumentBase):
    title: Optional[str] = Field(None, max_length=100, description="New title for the document")
    description: Optional[str] = Field(None, description="New description for the document")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Updated metadata for the document")

class DocumentInDBBase(DocumentBase):
    id: int
    user_id: int
    file_name: str
    file_path: str
    file_type: str
    file_size: int
    is_processed: bool = Field(False, description="Whether document processing is complete")
    processing_error: Optional[str] = Field(None, description="Error message if processing failed")
    created_at: datetime
    updated_at: datetime

    @property
    def status(self) -> DocumentStatus:
        """Get the processing status of the document"""
        if self.processing_error:
            return DocumentStatus.FAILED
        if not self.is_processed:
            return DocumentStatus.PROCESSING
        return DocumentStatus.COMPLETED

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class Document(DocumentInDBBase):
    """Document schema for API responses"""
    status: DocumentStatus = Field(..., description="Processing status of the document")
    
    @classmethod
    def from_orm(cls, obj):
        # Convert the ORM model to a dict and add the status
        data = super().from_orm(obj).dict()
        data["status"] = obj.status
        return cls(**data)

class DocumentInDB(DocumentInDBBase):
    """Document schema for internal use"""
    pass

class DocumentWithChunks(Document):
    """Document schema that includes its chunks"""
    chunks: List["DocumentChunk"] = Field(default_factory=list, description="Document chunks with embeddings")

class DocumentSearchQuery(BaseModel):
    """Schema for document search queries"""
    query: str = Field(..., description="Search query text")
    limit: int = Field(10, ge=1, le=100, description="Maximum number of results to return")
    threshold: float = Field(0.7, ge=0.0, le=1.0, description="Minimum similarity score (0-1) for results")
    include_content: bool = Field(True, description="Whether to include chunk content in results")

class DocumentSearchResult(BaseModel):
    """Schema for document search results"""
    chunk_id: int = Field(..., description="ID of the matching chunk")
    document_id: int = Field(..., description="ID of the parent document")
    content: Optional[str] = Field(None, description="Matching text content (if include_content=True)")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Similarity score (0-1)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata associated with the chunk")
    document: Optional[Dict[str, Any]] = Field(None, description="Parent document information")
