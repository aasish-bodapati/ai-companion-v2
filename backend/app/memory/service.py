from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import logging
import uuid

from app.core.config import settings
from app.crud.memory import memory
from app.memory.faiss_store import add as faiss_add, search as faiss_search
from app.memory.embeddings import embed_texts
from app.schemas.memory import MemorySearchQuery, MemorySearchResult

logger = logging.getLogger(__name__)


class MemoryService:
    """Service for integrating FAISS memory search with database operations."""
    
    def __init__(self):
        pass  # No initialization needed for function-based approach
    
    def search_memories(
        self, 
        db: Session, 
        query: str, 
        user_id: str,
        content_types: Optional[List[str]] = None,
        limit: int = 8,
        min_relevance: float = 0.5
    ) -> List[MemorySearchResult]:
        """
        Search for relevant memories using FAISS and return enriched results.
        
        Args:
            db: Database session
            query: Search query text
            user_id: User ID to search within
            content_types: Optional list of content types to filter by
            limit: Maximum number of results to return
            min_relevance: Minimum relevance score threshold
            
        Returns:
            List of memory search results with content and metadata
        """
        if not settings.MEMORY_ENABLED:
            logger.info("Memory system disabled, returning empty results")
            return []
        
        try:
            # Get query embedding
            query_embedding = embed_texts([query])
            if query_embedding is None:
                logger.warning("Failed to generate query embedding")
                return []
            
            # Search FAISS for similar vectors
            faiss_results = faiss_search(
                user_id, 
                query_embedding[0], 
                limit * 2  # Get more results to filter by relevance
            )
            
            if not faiss_results:
                logger.info("No FAISS results found")
                return []
            
            # Retrieve memory nodes from database
            memory_results = []
            for faiss_id, score in faiss_results:
                if score < min_relevance:
                    continue
                    
                memory_node = memory.get_memory_by_faiss_id(db, faiss_id)
                if not memory_node or memory_node.user_id != user_id:
                    continue
                
                # Apply content type filter if specified
                if content_types and memory_node.content_type not in content_types:
                    continue
                
                memory_results.append(MemorySearchResult(
                    faiss_id=memory_node.faiss_id,
                    content=memory_node.content,
                    content_type=memory_node.content_type,
                    relevance_score=score,
                    timestamp=memory_node.timestamp,
                    memory_metadata=memory_node.memory_metadata
                ))
                
                if len(memory_results) >= limit:
                    break
            
            # Sort by relevance score (highest first)
            memory_results.sort(key=lambda x: x.relevance_score, reverse=True)
            
            logger.info(f"Found {len(memory_results)} relevant memories for query: {query[:50]}...")
            return memory_results
            
        except Exception as e:
            logger.error(f"Error searching memories: {e}")
            return []
    
    def get_conversation_context(
        self, 
        db: Session, 
        user_id: str, 
        conversation_id: str,
        recent_messages: int = 5,
        memory_limit: int = 3
    ) -> str:
        """
        Get conversation context by combining recent messages with relevant memories.
        
        Args:
            db: Database session
            user_id: User ID
            conversation_id: Conversation ID
            recent_messages: Number of recent messages to include
            memory_limit: Number of relevant memories to include
            
        Returns:
            Formatted context string for LLM prompt
        """
        context_parts = []
        
        # Get recent conversation memories
        conversation_memories = memory.get_conversation_memories(
            db, conversation_id, limit=recent_messages
        )
        
        if conversation_memories:
            context_parts.append("Recent conversation context:")
            for mem in conversation_memories:
                context_parts.append(f"- {mem.content}")
        
        # Get relevant general memories (onboarding, facts, etc.)
        general_memories = self.search_memories(
            db=db,
            query="user preferences background information",
            user_id=user_id,
            content_types=["onboarding", "fact"],
            limit=memory_limit
        )
        
        if general_memories:
            context_parts.append("\nRelevant background information:")
            for mem in general_memories:
                context_parts.append(f"- {mem.content}")
        
        return "\n".join(context_parts) if context_parts else "No specific context available."
    
    def store_memory(
        self, 
        db: Session,
        content: str,
        content_type: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Store new memory in both FAISS and database.
        
        Args:
            db: Database session
            content: Text content to store
            content_type: Type of content (message, onboarding, fact, etc.)
            user_id: User ID
            conversation_id: Optional conversation ID
            metadata: Optional metadata
            
        Returns:
            FAISS ID if successful, None otherwise
        """
        if not settings.MEMORY_ENABLED:
            logger.info("Memory system disabled, skipping memory storage")
            return None
        
        try:
            # Generate embedding
            embedding = embed_texts([content])
            if embedding is None:
                logger.warning("Failed to generate embedding for memory storage")
                return None
            
            # Store in FAISS
            faiss_id = str(uuid.uuid4())  # Generate a unique ID
            faiss_add(user_id, [faiss_id], [embedding[0]])
            
            # Store in database
            memory_node = memory.create_memory_node(
                db=db,
                faiss_id=faiss_id,
                content=content,
                content_type=content_type,
                user_id=user_id,
                conversation_id=conversation_id,
                metadata=metadata
            )
            
            logger.info(f"Successfully stored memory: {content_type} for user {user_id}")
            return faiss_id
            
        except Exception as e:
            logger.error(f"Error storing memory: {e}")
            return None


# Global instance
memory_service = MemoryService()
