from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import json

from app.crud.base import CRUDBase
from app.models.memory import MemoryNode
from app.schemas.memory import MemoryNodeCreate, MemoryNodeUpdate


class CRUDMemory(CRUDBase[MemoryNode, MemoryNodeCreate, MemoryNodeUpdate]):
    """CRUD operations for MemoryNode model."""
    
    def create_memory_node(
        self, 
        db: Session, 
        *, 
        faiss_id: str,
        content: str,
        content_type: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> MemoryNode:
        """Create a new memory node."""
        memory_data = MemoryNodeCreate(
            faiss_id=faiss_id,
            content=content,
            content_type=content_type,
            user_id=user_id,
            conversation_id=conversation_id,
            memory_metadata=json.dumps(metadata) if metadata else None
        )
        return super().create(db, obj_in=memory_data)
    
    def get_memory_by_faiss_id(self, db: Session, faiss_id: str) -> Optional[MemoryNode]:
        """Get memory node by FAISS ID."""
        return db.query(MemoryNode).filter(MemoryNode.faiss_id == faiss_id).first()
    
    def get_user_memories(
        self, 
        db: Session, 
        user_id: str, 
        content_type: Optional[str] = None,
        limit: int = 100
    ) -> List[MemoryNode]:
        """Get memories for a specific user, optionally filtered by content type."""
        query = db.query(MemoryNode).filter(MemoryNode.user_id == user_id)
        if content_type:
            query = query.filter(MemoryNode.content_type == content_type)
        return query.order_by(MemoryNode.timestamp.desc()).limit(limit).all()
    
    def get_conversation_memories(
        self, 
        db: Session, 
        conversation_id: str, 
        limit: int = 50
    ) -> List[MemoryNode]:
        """Get memories for a specific conversation."""
        return db.query(MemoryNode).filter(
            MemoryNode.conversation_id == conversation_id
        ).order_by(MemoryNode.timestamp.desc()).limit(limit).all()
    
    def delete_user_memories(self, db: Session, user_id: str) -> int:
        """Delete all memories for a user (for cleanup)."""
        result = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).delete()
        db.commit()
        return result
    
    def update_relevance_score(self, db: Session, faiss_id: str, score: float) -> Optional[MemoryNode]:
        """Update the relevance score of a memory node."""
        memory = self.get_memory_by_faiss_id(db, faiss_id)
        if memory:
            memory.relevance_score = score
            db.commit()
            db.refresh(memory)
        return memory


memory = CRUDMemory(MemoryNode)
