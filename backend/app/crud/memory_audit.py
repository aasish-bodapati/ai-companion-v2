from typing import Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.core.metrics import record_audit_write
from app.models.memory_audit import MemoryAudit
from app.schemas.memory_audit import MemoryAuditCreate


class CRUDMemoryAudit(CRUDBase[MemoryAudit, MemoryAuditCreate, MemoryAuditCreate]):
    def log(
        self,
        db: Session,
        *,
        user_id: str,
        faiss_id: str,
        action: str,
        source: Optional[str] = None,
        conversation_id: Optional[str] = None,
        message_id: Optional[str] = None,
        before_content: Optional[str] = None,
        after_content: Optional[str] = None,
        before_metadata: Optional[str] = None,
        after_metadata: Optional[str] = None,
        request_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> MemoryAudit:
        # Defensive truncation for compliance
        if user_agent is not None:
            user_agent = user_agent[:256]
        if request_ip is not None:
            request_ip = request_ip[:64]
        payload = MemoryAuditCreate(
            user_id=user_id,
            faiss_id=faiss_id,
            action=action,
            source=source,
            conversation_id=conversation_id,
            message_id=message_id,
            before_content=before_content,
            after_content=after_content,
            before_metadata=before_metadata,
            after_metadata=after_metadata,
            request_ip=request_ip,
            user_agent=user_agent,
        )
        try:
            obj = super().create(db, obj_in=payload)
            # Metrics: success
            try:
                record_audit_write(action=action, success=True)
            except Exception:
                pass
            return obj
        except Exception:
            # Metrics: failure
            try:
                record_audit_write(action=action, success=False)
            except Exception:
                pass
            raise

    def list_by_faiss_id(
        self,
        db: Session,
        *,
        user_id: str,
        faiss_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> list[MemoryAudit]:
        q = (
            db.query(MemoryAudit)
            .filter(MemoryAudit.user_id == user_id, MemoryAudit.faiss_id == faiss_id)
            .order_by(MemoryAudit.created_at.desc())
            .offset(max(0, int(skip)))
            .limit(max(1, min(200, int(limit))))
        )
        return q.all()

    def count_by_faiss_id(self, db: Session, *, user_id: str, faiss_id: str) -> int:
        return (
            db.query(MemoryAudit)
            .filter(MemoryAudit.user_id == user_id, MemoryAudit.faiss_id == faiss_id)
            .count()
        )


memory_audit = CRUDMemoryAudit(MemoryAudit)
