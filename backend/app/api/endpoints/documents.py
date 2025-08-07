from fastapi import (
    APIRouter, Depends, HTTPException, status, 
    UploadFile, File, Form, BackgroundTasks, Query, Body
)
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import json
import logging
from datetime import datetime

from .... import schemas, models
from ....database import get_db
from ....core.security import get_current_active_user
from ....services.document import DocumentService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(
    "/upload/", 
    response_model=schemas.Document,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new document"
)
async def upload_document(
    file: UploadFile = File(..., description="File to upload"),
    title: Optional[str] = Form(None, description="Document title"),
    description: Optional[str] = Form(None, description="Document description"),
    metadata: Optional[str] = Form("{}", description="JSON string of additional metadata"),
    process_async: bool = Form(True, description="Process document asynchronously"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Upload a new document for processing and storage.
    
    The document will be stored in the configured storage backend (e.g., Supabase)
    and processed to extract text and generate embeddings for semantic search.
    
    - **file**: The document file to upload (PDF, DOCX, TXT, etc.)
    - **title**: Optional title for the document (defaults to filename)
    - **description**: Optional description of the document
    - **metadata**: Optional JSON string containing additional metadata
    - **process_async**: If True, process the document in the background
    """
    try:
        # Parse metadata JSON string
        try:
            metadata_dict = json.loads(metadata) if metadata else {}
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid metadata format. Must be a valid JSON string."
            )
        
        # Initialize document service
        doc_service = DocumentService(db)
        
        # Create document with processing
        document = await doc_service.create_document(
            user_id=current_user.id,
            file=file,
            metadata={
                **metadata_dict,
                "original_filename": file.filename,
            },
            background_tasks=background_tasks if process_async else None,
            process_async=process_async
        )
        
        # Update title and description if provided
        if title or description:
            update_data = {}
            if title:
                update_data["title"] = title
            if description:
                update_data["description"] = description
                
            document = doc_service.update_document(
                document_id=document.id,
                user_id=current_user.id,
                document_update=schemas.DocumentUpdate(**update_data)
            )
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )

@router.get(
    "/", 
    response_model=List[schemas.Document],
    summary="List all documents for the current user"
)
def list_documents(
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of documents to return"),
    include_chunks: bool = Query(False, description="Include document chunks in the response"),
    search_query: Optional[str] = Query(None, description="Search query to filter documents"),
    file_type: Optional[str] = Query(None, description="Filter by file type (e.g., 'application/pdf')"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    List all documents for the authenticated user with optional filtering.
    
    - **skip**: Number of documents to skip (for pagination)
    - **limit**: Maximum number of documents to return (1-1000)
    - **include_chunks**: Whether to include document chunks in the response
    - **search_query**: Text to search in document titles, descriptions, and filenames
    - **file_type**: Filter by file MIME type
    - **tags**: Filter by tags (AND condition)
    """
    try:
        doc_service = DocumentService(db)
        return doc_service.list_documents(
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            include_chunks=include_chunks,
            search_query=search_query,
            file_type=file_type,
            tags=tags
        )
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving documents"
        )

@router.get(
    "/{document_id}", 
    response_model=schemas.Document,
    summary="Get document details by ID"
)
def get_document(
    document_id: int,
    include_chunks: bool = Query(False, description="Include document chunks in the response"),
    chunk_limit: int = Query(50, ge=1, le=500, description="Maximum number of chunks to return"),
    chunk_offset: int = Query(0, ge=0, description="Number of chunks to skip"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get details for a specific document by ID with paginated chunks.
    
    - **document_id**: ID of the document to retrieve
    - **include_chunks**: Whether to include document chunks in the response
    - **chunk_limit**: Maximum number of chunks to return (1-500)
    - **chunk_offset**: Number of chunks to skip (for pagination)
    """
    try:
        doc_service = DocumentService(db)
        if include_chunks:
            document, chunks = doc_service.get_document_with_chunks(
                document_id=document_id,
                user_id=current_user.id,
                chunk_limit=chunk_limit,
                chunk_offset=chunk_offset
            )
            document.chunks = chunks  # Attach chunks to document
            return document
        return doc_service.get_document(document_id, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving document: {str(e)}"
        )

@router.get(
    "/{document_id}/download",
    response_model=Dict[str, str],
    summary="Get a download URL for the document"
)
def get_document_download_url(
    document_id: int,
    expires_in: int = 3600,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a signed URL to download the document.
    
    - **document_id**: ID of the document to download
    - **expires_in**: Expiration time in seconds (default: 1 hour)
    """
    try:
        doc_service = DocumentService(db)
        return {
            "download_url": doc_service.get_document_url(
                document_id, 
                current_user.id, 
                expires_in=expires_in
            )
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating download URL for document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating download URL"
        )

@router.put(
    "/{document_id}", 
    response_model=schemas.Document,
    summary="Update document metadata"
)
def update_document(
    document_id: int,
    document_update: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update metadata for a document.
    
    - **document_id**: ID of the document to update
    - **document_update**: Updated document data
    """
    try:
        doc_service = DocumentService(db)
        return doc_service.update_document(document_id, current_user.id, document_update)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating document"
        )

@router.delete(
    "/{document_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document"
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a document and all associated data.
    
    - **document_id**: ID of the document to delete
    """
    try:
        doc_service = DocumentService(db)
        doc_service.delete_document(document_id, current_user.id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting document"
        )

@router.post(
    "/{document_id}/reprocess",
    response_model=schemas.Document,
    summary="Reprocess a document"
)
async def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Re-process a document to update its text extraction and embeddings.
    
    - **document_id**: ID of the document to reprocess
    """
    try:
        doc_service = DocumentService(db)
        
        # Get the document to verify ownership
        document = doc_service.get_document(document_id, current_user.id)
        
        # Mark as unprocessed
        document = doc_service.update_document(
            document_id=document.id,
            user_id=current_user.id,
            document_update=schemas.DocumentUpdate(
                metadata={
                    **(document.metadata or {}),
                    "reprocessed_at": str(datetime.utcnow())
                }
            )
        )
        
        # Process the document in the background
        background_tasks.add_task(
            doc_service._process_document_sync,
            document_id,
            current_user.id
        )
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reprocessing document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error reprocessing document"
        )

@router.get(
    "/tags/",
    response_model=List[Dict[str, Any]],
    summary="Get all tags used by the current user"
)
def get_document_tags(
    min_count: int = Query(1, ge=1, description="Minimum number of documents a tag must be used in"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all unique tags used by the current user across their documents.
    
    - **min_count**: Only return tags that are used in at least this many documents
    """
    try:
        doc_service = DocumentService(db)
        return doc_service.get_document_tags(
            user_id=current_user.id,
            min_count=min_count
        )
    except Exception as e:
        logger.error(f"Error retrieving document tags: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving document tags"
        )

@router.post(
    "/{document_id}/tags",
    response_model=schemas.Document,
    summary="Add tags to a document"
)
def add_document_tags(
    document_id: int,
    tags: List[str] = Body(..., embed=True),
    replace: bool = Body(False, embed=True, description="Replace all existing tags"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Add tags to a document.
    
    - **document_id**: ID of the document to tag
    - **tags**: List of tags to add
    - **replace**: If True, replace all existing tags with the new ones
    """
    try:
        doc_service = DocumentService(db)
        return doc_service.add_document_tags(
            document_id=document_id,
            user_id=current_user.id,
            tags=tags,
            replace=replace
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding tags to document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding tags to document"
        )

@router.delete(
    "/{document_id}/tags",
    response_model=schemas.Document,
    summary="Remove tags from a document"
)
def remove_document_tags(
    document_id: int,
    tags: List[str] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Remove tags from a document.
    
    - **document_id**: ID of the document
    - **tags**: List of tags to remove
    """
    try:
        doc_service = DocumentService(db)
        return doc_service.remove_document_tags(
            document_id=document_id,
            user_id=current_user.id,
            tags=tags
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing tags from document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error removing tags from document"
        )

@router.post(
    "/search",
    response_model=List[schemas.DocumentSearchResult],
    summary="Search documents using semantic search"
)
def search_documents(
    search_query: schemas.DocumentSearchQuery,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Search across all documents using semantic search with advanced filtering.
    
    - **query**: The search query text (required)
    - **limit**: Maximum number of results to return (1-100)
    - **threshold**: Minimum similarity score (0-1) for results
    - **include_content**: Whether to include chunk content in results
    - **file_types**: Optional list of file types to filter by
    - **tags**: Optional list of tags to filter by (AND condition)
    """
    try:
        doc_service = DocumentService(db)
        
        # Perform the search with filters
        results = doc_service.search_documents(
            user_id=current_user.id,
            query=search_query.query,
            limit=search_query.limit,
            threshold=search_query.threshold,
            file_types=search_query.file_types,
            tags=search_query.tags
        )
        
        # Format results
        formatted_results = []
        for result in results:
            document = doc_service.get_document(result["document_id"], current_user.id)
            
            # Only include content if requested
            if not search_query.include_content:
                result["content"] = None
            
            # Format the result
            formatted_result = {
                "chunk_id": result["chunk_id"],
                "document_id": result["document_id"],
                "chunk_index": result["chunk_index"],
                "content": result["content"] if search_query.include_content else None,
                "similarity": result["similarity"],
                "document": {
                    "id": document.id,
                    "title": document.title or document.file_name,
                    "file_name": document.file_name,
                    "file_type": document.file_type,
                    "created_at": document.created_at.isoformat() if document.created_at else None,
                    "metadata": document.metadata or {}
                },
                "chunk_metadata": result.get("chunk_metadata", {})
            }
            formatted_results.append(formatted_result)
        
        return formatted_results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching documents"
        )
