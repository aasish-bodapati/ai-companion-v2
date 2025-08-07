import os
import uuid
import logging
import json
from typing import Optional, List, Dict, Any, BinaryIO, Union
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import UploadFile, HTTPException, status, BackgroundTasks
import numpy as np

from .. import models, schemas
from ..core.config import settings
from .storage import StorageService
from .file_parser import FileParser
from .embedding import EmbeddingService
from ..tasks.document_processing import DocumentProcessingTask

logger = logging.getLogger(__name__)

class DocumentService:
    """Service for document management, processing, and search"""
    
    def __init__(self, db: Session):
        self.db = db
        self.storage = StorageService()
        self.parser = FileParser()
        self.embedding_service = EmbeddingService()
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def create_document(
        self,
        user_id: int,
        file: Union[UploadFile, BinaryIO],
        metadata: Optional[Dict[str, Any]] = None,
        background_tasks: Optional[BackgroundTasks] = None,
        process_async: bool = True
    ) -> models.Document:
        """
        Create a new document and optionally process it asynchronously.
        
        Args:
            user_id: ID of the user uploading the document
            file: File to upload (FastAPI UploadFile or file-like object)
            metadata: Optional metadata to store with the document
            background_tasks: FastAPI BackgroundTasks instance for async processing
            process_async: Whether to process the document asynchronously
            
        Returns:
            The created document
        """
        try:
            # Generate a unique filename
            file_ext = os.path.splitext(getattr(file, 'filename', 'document'))[1]
            file_name = f"{uuid.uuid4()}{file_ext}"
            file_path = f"documents/{user_id}/{file_name}"
            
            # Upload the file to storage
            if isinstance(file, UploadFile):
                file_content = await file.read()
                content_type = file.content_type
            else:
                file_content = file.read()
                content_type = getattr(file, 'content_type', 'application/octet-stream')
            
            # Save file to storage
            self.storage.upload_file(
                bucket_name=settings.SUPABASE_STORAGE_BUCKET,
                file_path=file_path,
                file_content=file_content,
                content_type=content_type
            )
            
            # Create document in database
            db_document = models.Document(
                user_id=user_id,
                file_name=os.path.basename(file_path),
                file_path=file_path,
                file_type=content_type,
                file_size=len(file_content),
                metadata=metadata or {},
                is_processed=not process_async,  # Mark as processed if not processing async
                processing_error=None
            )
            
            self.db.add(db_document)
            self.db.commit()
            self.db.refresh(db_document)
            
            # Process the document (sync or async)
            if process_async and background_tasks:
                # Schedule background processing
                background_tasks.add_task(
                    self._process_document_sync,
                    db_document.id,
                    user_id
                )
            elif not process_async:
                # Process synchronously
                self._process_document_sync(db_document.id, user_id)
            
            return db_document
            
        except Exception as e:
            logger.error(f"Error creating document: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create document: {str(e)}"
            )
    
    def _process_document_sync(self, document_id: int, user_id: int) -> None:
        """Process a document synchronously (text extraction, chunking, embeddings)"""
        try:
            # Get the document with a fresh session to avoid detached instance issues
            with self.db.begin():
                document = self.db.query(models.Document).filter(
                    models.Document.id == document_id,
                    models.Document.user_id == user_id
                ).with_for_update().first()
                
                if not document:
                    logger.error(f"Document {document_id} not found for user {user_id}")
                    return
                    
                # Update status to processing
                document.is_processed = False
                document.processing_error = None
                document.updated_at = datetime.utcnow()
                self.db.add(document)
            
            try:
                # Create processing task
                task = DocumentProcessingTask(
                    db=self.db,
                    document_id=document.id,
                    user_id=user_id
                )
                
                # Process the document
                task.process()
                
                # Update status to completed
                with self.db.begin():
                    document = self.db.query(models.Document).get(document_id)
                    if document:
                        document.is_processed = True
                        document.updated_at = datetime.utcnow()
                        self.db.add(document)
                
                logger.info(f"Successfully processed document {document_id}")
                
            except Exception as e:
                # Update status to failed
                with self.db.begin():
                    document = self.db.query(models.Document).get(document_id)
                    if document:
                        document.is_processed = False
                        document.processing_error = str(e)
                        document.updated_at = datetime.utcnow()
                        self.db.add(document)
                
                logger.error(f"Error processing document {document_id}: {str(e)}", exc_info=True)
                raise
        
        except Exception as e:
            logger.error(f"Error in document processing: {str(e)}", exc_info=True)
            raise
    
    def get_document(
        self, 
        document_id: int, 
        user_id: int,
        include_chunks: bool = False
    ) -> models.Document:
        """
        Get a document by ID with user ownership check
        
        Args:
            document_id: ID of the document to retrieve
            user_id: ID of the user making the request
            include_chunks: Whether to include document chunks in the result
            
        Returns:
            The requested document
        """
        query = self.db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.user_id == user_id
        )
        
        if include_chunks:
            query = query.options(joinedload(models.Document.chunks))
        
        document = query.first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied"
            )
            
        return document
    
    def list_documents(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        include_chunks: bool = False,
        search_query: Optional[str] = None,
        file_type: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> List[models.Document]:
        """
        List documents for a user with filtering, searching, and pagination
        
        Args:
            user_id: ID of the user whose documents to list
            skip: Number of documents to skip (for pagination)
            limit: Maximum number of documents to return
            include_chunks: Whether to include document chunks in the results
            search_query: Optional text to search in document titles and content
            file_type: Optional file type filter (e.g., 'application/pdf')
            tags: Optional list of tags to filter by
            
        Returns:
            List of documents matching the criteria
        """
        query = self.db.query(models.Document).filter(
            models.Document.user_id == user_id
        )
        
        # Apply search filter if provided
        if search_query:
            search = f"%{search_query}%"
            query = query.filter(
                or_(
                    models.Document.title.ilike(search),
                    models.Document.description.ilike(search),
                    models.Document.file_name.ilike(search)
                )
            )
        
        # Apply file type filter
        if file_type:
            query = query.filter(models.Document.file_type == file_type)
        
        # Apply tags filter
        if tags:
            # Assuming tags are stored as a JSON array in metadata
            for tag in tags:
                query = query.filter(
                    models.Document.metadata['tags'].astext.contains(f'"{tag}"')
                )
        
        # Apply sorting (newest first by default)
        query = query.order_by(models.Document.created_at.desc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Eager load chunks if requested
        if include_chunks:
            query = query.options(joinedload(models.Document.chunks))
        
        return query.all()
    
    def get_document_with_chunks(
        self,
        document_id: int,
        user_id: int,
        chunk_limit: int = 50,
        chunk_offset: int = 0
    ) -> Tuple[models.Document, List[models.DocumentChunk]]:
        """
        Get a document along with its chunks with pagination
        
        Args:
            document_id: ID of the document to retrieve
            user_id: ID of the user making the request
            chunk_limit: Maximum number of chunks to return
            chunk_offset: Number of chunks to skip
            
        Returns:
            Tuple of (document, list of chunks)
        """
        # Get the document with ownership check
        document = self.get_document(document_id, user_id)
        
        # Get paginated chunks
        chunks = self.db.query(models.DocumentChunk).filter(
            models.DocumentChunk.document_id == document_id
        ).order_by(
            models.DocumentChunk.chunk_index
        ).offset(chunk_offset).limit(chunk_limit).all()
        
    
    def update_document(
        self, 
        document_id: int, 
        user_id: int,
        document_update: schemas.DocumentUpdate
    ) -> models.Document:
        """
        Update a document's metadata and content.
        
        Args:
            document_id: ID of the document to update
            user_id: ID of the user making the request
            document_update: The update data
            
        Returns:
            The updated document
            
        Raises:
            HTTPException: If the document is not found or access is denied
        """
        # Get the document with ownership check
        db_document = self.get_document(document_id, user_id)
        
        try:
            update_data = document_update.dict(exclude_unset=True)
            
            # Handle metadata update
            if 'metadata' in update_data:
                if db_document.metadata is None:
                    db_document.metadata = {}
                db_document.metadata.update(update_data['metadata'])
                del update_data['metadata']
            
            # Update other fields
            for field, value in update_data.items():
                if hasattr(db_document, field):
                    setattr(db_document, field, value)
            
            db_document.updated_at = datetime.utcnow()
            self.db.add(db_document)
            self.db.commit()
            self.db.refresh(db_document)
            
            return db_document
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating document: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating document: {str(e)}"
            )
    
    def add_document_tags(
        self,
        document_id: int,
        user_id: int,
        tags: List[str],
        replace: bool = False
    ) -> models.Document:
        """
        Add tags to a document
        
        Args:
            document_id: ID of the document to tag
            user_id: ID of the user making the request
            tags: List of tags to add
            replace: If True, replace all existing tags
            
        Returns:
            The updated document
        """
        document = self.get_document(document_id, user_id)
        
        try:
            # Initialize metadata if needed
            if document.metadata is None:
                document.metadata = {}
            
            # Initialize tags list if needed
            if 'tags' not in document.metadata or replace:
                document.metadata['tags'] = []
            
            # Add new tags (ensure uniqueness)
            existing_tags = set(document.metadata.get('tags', []))
            new_tags = list(existing_tags.union(set(tags)))
            
            # Update document
            document.metadata['tags'] = new_tags
            document.updated_at = datetime.utcnow()
            
            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)
            
            return document
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding tags to document: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error adding tags to document: {str(e)}"
            )
    
    def remove_document_tags(
        self,
        document_id: int,
        user_id: int,
        tags: List[str]
    ) -> models.Document:
        """
        Remove tags from a document
        
        Args:
            document_id: ID of the document
            user_id: ID of the user making the request
            tags: List of tags to remove
            
        Returns:
            The updated document
        """
        document = self.get_document(document_id, user_id)
        
        try:
            if not document.metadata or 'tags' not in document.metadata:
                return document  # No tags to remove
            
            # Remove specified tags
            existing_tags = set(document.metadata.get('tags', []))
            updated_tags = list(existing_tags - set(tags))
            
            # Update document
            document.metadata['tags'] = updated_tags
            document.updated_at = datetime.utcnow()
            
            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)
            
            return document
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing tags from document: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error removing tags from document: {str(e)}"
            )
    
    def search_documents(
        self,
        user_id: int,
        query: str,
        limit: int = 10,
        threshold: float = 0.5,
        file_types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search documents using semantic search with optional filters
        
        Args:
            user_id: ID of the user making the request
            query: Search query text
            limit: Maximum number of results to return
            threshold: Minimum similarity score (0-1)
            file_types: Optional list of file types to filter by
            tags: Optional list of tags to filter by
            
        Returns:
            List of search results with document and chunk information
        """
        try:
            # Generate embedding for the query
            query_embedding = self.embedding_service.get_embedding(query)
            if not query_embedding:
                logger.error("Failed to generate embedding for query")
                return []
            
            # Convert to PostgreSQL array format for cosine similarity
            query_embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
            # Build the base query
            query_str = """
            SELECT 
                dc.id as chunk_id,
                dc.document_id,
                dc.chunk_index,
                dc.content,
                dc.metadata as chunk_metadata,
                d.file_name,
                d.file_type,
                d.metadata as doc_metadata,
                1 - (dc.embedding <=> :query_embedding) as similarity
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE d.user_id = :user_id
            AND d.is_processed = true
            AND 1 - (dc.embedding <=> :query_embedding) >= :threshold
            """
            
            params = {
                'user_id': user_id,
                'query_embedding': query_embedding_str,
                'threshold': threshold
            }
            
            # Add file type filter if provided
            if file_types:
                placeholders = ", ".join([f"'{ft}'" for ft in file_types])
                query_str += f" AND d.file_type IN ({placeholders})"
            
            # Add tags filter if provided
            if tags:
                for i, tag in enumerate(tags):
                    param_name = f"tag_{i}"
                    query_str += f" AND d.metadata->'tags' ? :{param_name}"
                    params[param_name] = tag
            
            # Add ordering and limit
            query_str += " ORDER BY similarity DESC LIMIT :limit"
            params['limit'] = limit
            
            # Execute the query
            results = self.db.execute(query_str, params).fetchall()
            
            # Format results
            search_results = []
            for row in results:
                result = {
                    'chunk_id': row[0],
                    'document_id': row[1],
                    'chunk_index': row[2],
                    'content': row[3],
                    'chunk_metadata': row[4] or {},
                    'document': {
                        'file_name': row[5],
                        'file_type': row[6],
                        'metadata': row[7] or {}
                    },
                    'similarity': float(row[8])
                }
                search_results.append(result)
            
            return search_results
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error performing search"
            )
    
    def get_document_tags(
        self,
        user_id: int,
        min_count: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Get all unique tags used by a user across their documents
        
        Args:
            user_id: ID of the user
            min_count: Minimum number of documents a tag must be used in
            
        Returns:
            List of tags with their counts
        """
        try:
            # Get all tags with counts using JSON functions
            query = """
            SELECT tag, COUNT(*) as count
            FROM (
                SELECT jsonb_array_elements_text(metadata->'tags') as tag
                FROM documents
                WHERE user_id = :user_id
                AND metadata->'tags' IS NOT NULL
            ) t
            GROUP BY tag
            HAVING COUNT(*) >= :min_count
            ORDER BY count DESC, tag
            """
            
            results = self.db.execute(
                query,
                {'user_id': user_id, 'min_count': min_count}
            ).fetchall()
            
            return [{'name': row[0], 'count': row[1]} for row in results]
            
        except Exception as e:
            logger.error(f"Error getting document tags: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error retrieving document tags"
            )
    
    def delete_document(self, document_id: int, user_id: int) -> bool:
        """
        Delete a document and its associated data.
        
        Args:
            document_id: ID of the document to delete
            user_id: ID of the user making the request
            
        Returns:
            bool: True if deletion was successful
            
        Raises:
            HTTPException: If the document is not found, access is denied, or deletion fails
        """
        db_document = self.get_document(document_id, user_id)
        
        try:
            # Delete file from storage
            self.storage.delete_file(db_document.file_path)
            
            # Delete from database (cascading delete will handle chunks)
            self.db.delete(db_document)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting document {document_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting document: {str(e)}"
            )
    
    def get_document_url(self, document_id: int, user_id: int, expires_in: int = 3600) -> str:
        """
        Get a signed URL to access the document.
        
        Args:
            document_id: ID of the document
            user_id: ID of the user making the request
            expires_in: Expiration time in seconds (default: 1 hour)
            
        Returns:
            str: Signed URL for accessing the document
            
        Raises:
            HTTPException: If the document is not found, access is denied, or URL generation fails
        """
        db_document = self.get_document(document_id, user_id)
        
        try:
            return self.storage.get_file_url(db_document.file_path, expires_in=expires_in)
        except Exception as e:
            logger.error(f"Error generating URL for document {document_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating document URL: {str(e)}"
            )
    
    def search_documents(
        self,
        user_id: int,
        query: str,
        limit: int = 10,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for documents using semantic search.
        
        Args:
            user_id: ID of the user making the request
            query: Search query text
            limit: Maximum number of results to return
            threshold: Minimum similarity score (0-1) for results
            
        Returns:
            List of matching document chunks with similarity scores
        """
        try:
            # Generate embedding for the query
            embedding_service = EmbeddingService()
            query_embedding = embedding_service.get_embeddings([query])[0]
            
            # Search for similar chunks in the database
            # Note: This is a simplified example. In production, you'd use a vector database
            # like pgvector, Pinecone, or Weaviate for efficient similarity search.
            
            # Get all document chunks for the user
            chunks = self.db.query(models.DocumentChunk).join(
                models.Document
            ).filter(
                models.Document.user_id == user_id
            ).all()
            
            # Calculate similarity scores
            results = []
            for chunk in chunks:
                if not chunk.embedding:
                    continue
                    
                similarity = embedding_service.cosine_similarity(
                    query_embedding,
                    chunk.embedding
                )
                
                if similarity >= threshold:
                    results.append({
                        "chunk_id": chunk.id,
                        "document_id": chunk.document_id,
                        "content": chunk.content,
                        "similarity": similarity,
                        "metadata": chunk.metadata_
                    })
            
            # Sort by similarity score (descending)
            results.sort(key=lambda x: x["similarity"], reverse=True)
            
            return results[:limit]
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error searching documents: {str(e)}"
            )
