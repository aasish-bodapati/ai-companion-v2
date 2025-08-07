import logging
import time
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.file_parser import FileParser
from app.services.embedding import EmbeddingService
from app.database import SessionLocal

logger = logging.getLogger(__name__)

class DocumentProcessingTask:
    """
    Background task for processing uploaded documents.
    Handles text extraction, chunking, and embedding generation.
    """
    
    def __init__(self, db: Optional[Session] = None):
        self.db = db or SessionLocal()
        self.file_parser = FileParser()
        self.embedding_service = EmbeddingService()
    
    def process_document(self, document_id: int, user_id: int) -> bool:
        """
        Process a single document asynchronously.
        
        Args:
            document_id: ID of the document to process
            user_id: ID of the user who owns the document
            
        Returns:
            bool: True if processing was successful, False otherwise
        """
        try:
            # Get the document from the database
            document = self._get_document(document_id, user_id)
            if not document:
                logger.error(f"Document {document_id} not found or access denied")
                return False
            
            # Skip if already processed
            if document.is_processed:
                logger.info(f"Document {document_id} is already processed")
                return True
            
            # Mark as processing
            self._update_document_status(document, is_processing=True)
            
            # Process the document
            success = self._process_document_content(document)
            
            # Update status
            self._update_document_status(
                document, 
                is_processing=False, 
                is_processed=success,
                error=None if success else "Failed to process document"
            )
            
            return success
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}", exc_info=True)
            self._update_document_status(
                document,
                is_processing=False,
                is_processed=False,
                error=str(e)
            )
            return False
    
    def _get_document(self, document_id: int, user_id: int) -> Optional[Document]:
        """Get a document by ID if it belongs to the user"""
        return self.db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
    
    def _update_document_status(
        self, 
        document: Document, 
        is_processing: bool = False,
        is_processed: Optional[bool] = None,
        error: Optional[str] = None
    ) -> None:
        """Update document processing status"""
        try:
            if is_processing:
                document.is_processed = False
                document.processing_error = None
            
            if is_processed is not None:
                document.is_processed = is_processed
            
            if error is not None:
                document.processing_error = error
            
            self.db.commit()
            self.db.refresh(document)
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating document status: {str(e)}")
            raise
    
    def _process_document_content(self, document: Document) -> bool:
        """Process document content: extract text, chunk, and generate embeddings"""
        try:
            # 1. Extract text from the document
            text, metadata = self.file_parser.extract_text(
                file_path=document.file_path,
                file_type=document.file_type
            )
            
            if not text:
                raise ValueError("No text could be extracted from the document")
            
            # 2. Chunk the text
            chunks = self._chunk_text(text, document.id)
            
            # 3. Generate embeddings for each chunk
            self._generate_chunk_embeddings(chunks)
            
            # 4. Save chunks to the database
            self._save_chunks(document, chunks)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing document content: {str(e)}", exc_info=True)
            return False
    
    def _chunk_text(self, text: str, document_id: int) -> List[Dict[str, Any]]:
        """Split text into chunks and prepare for embedding"""
        # Use the embedding service's chunking logic
        chunk_texts = self.embedding_service.chunk_text(
            text,
            chunk_size=settings.CHUNK_SIZE,
            overlap=settings.CHUNK_OVERLAP
        )
        
        # Prepare chunks for processing
        return [
            {
                "document_id": document_id,
                "chunk_index": i,
                "content": chunk,
                "token_count": len(chunk.split()),  # Simple token count
                "metadata": {}
            }
            for i, chunk in enumerate(chunk_texts)
        ]
    
    def _generate_chunk_embeddings(self, chunks: List[Dict[str, Any]]) -> None:
        """Generate embeddings for text chunks"""
        # Extract texts for embedding
        texts = [chunk["content"] for chunk in chunks]
        
        # Generate embeddings in batches
        batch_size = settings.EMBEDDING_BATCH_SIZE
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_embeddings = self.embedding_service.get_embeddings(batch_texts)
            
            # Assign embeddings to chunks
            for j, embedding in enumerate(batch_embeddings):
                chunks[i + j]["embedding"] = embedding
    
    def _save_chunks(self, document: Document, chunks: List[Dict[str, Any]]) -> None:
        """Save document chunks to the database"""
        try:
            # Delete existing chunks if any
            self.db.query(DocumentChunk).filter(
                DocumentChunk.document_id == document.id
            ).delete(synchronize_session=False)
            
            # Create new chunks
            for chunk_data in chunks:
                chunk = DocumentChunk(**chunk_data)
                self.db.add(chunk)
            
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving document chunks: {str(e)}")
            raise
