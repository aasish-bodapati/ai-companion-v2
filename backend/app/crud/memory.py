from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
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
        metadata: Optional[Dict[str, Any]] = None,
        importance_score: Optional[int] = None,
    ) -> MemoryNode:
        """Create a new memory node."""
        memory_data = MemoryNodeCreate(
            faiss_id=faiss_id,
            content=content,
            content_type=content_type,
            user_id=user_id,
            conversation_id=conversation_id,
            memory_metadata=json.dumps(metadata) if metadata else None,
            importance_score=(importance_score if importance_score is not None else 0),
        )
        return super().create(db, obj_in=memory_data)

    def get_memory_by_faiss_id(self, db: Session, faiss_id: str) -> Optional[MemoryNode]:
        """Get memory node by FAISS ID."""
        return db.query(MemoryNode).filter(MemoryNode.faiss_id == faiss_id).first()

    def get_by_consolidation_key(self, db: Session, user_id: str, key: str) -> Optional[MemoryNode]:
        """Find a memory node by consolidation_key in JSON metadata for a given user."""
        # metadata is stored as JSON string in memory_metadata
        like_pattern = f'%"consolidation_key": "{key}"%'
        return (
            db.query(MemoryNode)
            .filter(
                and_(
                    MemoryNode.user_id == user_id,
                    MemoryNode.memory_metadata.like(like_pattern),
                )
            )
            .order_by(MemoryNode.timestamp.desc())
            .first()
        )

    def update_content_and_metadata(
        self,
        db: Session,
        *,
        node: MemoryNode,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryNode:
        """Update memory content and metadata."""
        node.content = content
        if metadata is not None:
            node.memory_metadata = json.dumps(metadata)
        db.commit()
        db.refresh(node)
        return node

    def get_user_memories_by_category(
        self, db: Session, user_id: str, category: str, limit: int = 10
    ) -> List[MemoryNode]:
        """Get memories for a specific user filtered by category in metadata."""
        # Search for memories that have the category in their metadata
        like_pattern = f'%"categories": ["%{category}%"%'
        return (
            db.query(MemoryNode)
            .filter(
                and_(
                    MemoryNode.user_id == user_id,
                    MemoryNode.memory_metadata.like(like_pattern),
                )
            )
            .order_by(MemoryNode.timestamp.desc())
            .limit(limit)
            .all()
        )

    def get_user_memories(
        self, db: Session, user_id: str, content_type: Optional[str] = None, limit: int = 100
    ) -> List[MemoryNode]:
        """Get memories for a specific user, optionally filtered by content type."""
        query = db.query(MemoryNode).filter(MemoryNode.user_id == user_id)
        if content_type:
            query = query.filter(MemoryNode.content_type == content_type)
        return query.order_by(MemoryNode.timestamp.desc()).limit(limit).all()

    def get_conversation_memories(
        self, db: Session, conversation_id: str, limit: int = 50
    ) -> List[MemoryNode]:
        """Get memories for a specific conversation."""
        return (
            db.query(MemoryNode)
            .filter(MemoryNode.conversation_id == conversation_id)
            .order_by(MemoryNode.timestamp.desc())
            .limit(limit)
            .all()
        )

    def delete_user_memories(self, db: Session, user_id: str) -> int:
        """Delete all memories for a user (for cleanup)."""
        result = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).delete()
        db.commit()
        return result

    def delete_by_faiss_id(self, db: Session, user_id: str, faiss_id: str) -> bool:
        """Hard delete a single memory by faiss_id ensuring ownership."""
        node = self.get_memory_by_faiss_id(db, faiss_id)
        if not node or str(node.user_id) != str(user_id):
            return False
        db.delete(node)
        db.commit()
        # Best-effort vector store removal
        try:
            from app.memory.vector_store.factory import get_vector_store

            vs = get_vector_store()
            vs.delete(str(user_id), str(faiss_id))
        except Exception:
            pass
        return True

    def soft_delete_by_faiss_id(self, db: Session, user_id: str, faiss_id: str) -> bool:
        """Soft delete by setting metadata.deleted=true and deleted_at timestamp."""
        import json as _json
        from datetime import datetime, timezone

        node = self.get_memory_by_faiss_id(db, faiss_id)
        if not node or str(node.user_id) != str(user_id):
            return False
        try:
            md: Dict[str, Any]
            if node.memory_metadata:
                try:
                    md = _json.loads(node.memory_metadata)
                except Exception:
                    md = {}
            else:
                md = {}
            # If already deleted, report no-op to caller
            if isinstance(md, dict) and md.get("deleted") is True:
                return False
            md["deleted"] = True
            md["deleted_at"] = datetime.now(timezone.utc).isoformat()
            node.memory_metadata = _json.dumps(md)
            db.commit()
            db.refresh(node)
            return True
        except Exception:
            db.rollback()
            return False

    def update_relevance_score(
        self, db: Session, faiss_id: str, score: float
    ) -> Optional[MemoryNode]:
        """Update the relevance score of a memory node."""
        memory = self.get_memory_by_faiss_id(db, faiss_id)
        if memory:
            memory.relevance_score = score
            db.commit()
            db.refresh(memory)
        return memory

    def update_importance_score(
        self, db: Session, faiss_id: str, score: int
    ) -> Optional[MemoryNode]:
        """Update the importance score (0..100) of a memory node."""
        memory = self.get_memory_by_faiss_id(db, faiss_id)
        if memory:
            memory.importance_score = max(0, min(100, int(score)))
            db.commit()
            db.refresh(memory)
        return memory


memory = CRUDMemory(MemoryNode)
