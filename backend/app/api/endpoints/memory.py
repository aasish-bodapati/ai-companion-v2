from typing import List, Optional, Literal, TypedDict, Any, Dict
from uuid import UUID, uuid4, UUID as _UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.crud.memory import memory as memory_crud
from app.crud.memory_audit import memory_audit
from app.models.user import User
from app.schemas.memory import MemoryNodeResponse, MemorySearchResult
from app.schemas.memory_audit import MemoryAuditResponse
from app.memory.service import memory_service
from app.memory.context_tracker import context_tracker
from app import crud
from app.services.summarization import generate_conversation_summary
from pydantic import BaseModel, Field
from app.privacy.redaction import redact_text, redact_metadata

router = APIRouter()


class MemoryUpdateRequest(BaseModel):
    content: str
    content_type: Optional[str] = None
    importance_score: Optional[float] = None


class MemoryStatusResponse(BaseModel):
    enabled: bool
    stats: Dict[str, Any]


class MemoryToggleRequest(BaseModel):
    enabled: bool


@router.get("/status", response_model=MemoryStatusResponse)
def get_memory_status(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get memory system status and statistics."""
    # Effective flag: global unless user override set
    enabled = bool(settings.MEMORY_ENABLED)
    try:
        if getattr(current_user, "memory_enabled", None) is not None:
            enabled = bool(current_user.memory_enabled)
    except Exception:
        pass
    
    stats = {
        "totalMemories": 0,
        "lastIndexed": None,
    }
    
    if enabled:
        try:
            # Get total memory count for user
            memories = memory_crud.get_user_memories(
                db=db, user_id=str(current_user.id), limit=1000
            )
            stats["totalMemories"] = len(memories)
            
            # Get last indexed timestamp
            if memories:
                latest = max(memories, key=lambda m: m.timestamp if hasattr(m, 'timestamp') else m.created_at)
                stats["lastIndexed"] = (latest.timestamp if hasattr(latest, 'timestamp') else latest.created_at).isoformat()
        except Exception:
            pass
    
    return MemoryStatusResponse(enabled=enabled, stats=stats)


@router.post("/toggle")
def toggle_memory(
    request: MemoryToggleRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Toggle memory system for this user by setting a per-user override.

    If global is disabled, user cannot enable it (returns global false).
    If global is enabled, set user override to request.enabled and return effective value.
    """
    # If globally off, respect global off regardless of user toggle
    if not bool(settings.MEMORY_ENABLED):
        return {"enabled": False, "message": "Memory system globally disabled by admin"}

    # Persist per-user override
    try:
        from app.crud.user import user as user_crud

        updated = user_crud.update(db, db_obj=current_user, obj_in={"memory_enabled": bool(request.enabled)})
        db.refresh(updated)
        effective = bool(updated.memory_enabled) if updated.memory_enabled is not None else bool(settings.MEMORY_ENABLED)
        return {"enabled": effective}
    except Exception:
        # Fallback to current effective
        eff = bool(current_user.memory_enabled) if getattr(current_user, "memory_enabled", None) is not None else bool(settings.MEMORY_ENABLED)
        return {"enabled": eff}


@router.get("/users/me/memories", response_model=List[MemoryNodeResponse])
def list_my_memories(
    content_type: Optional[str] = None,
    core: Optional[bool] = None,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    List memories for the current user, optionally filtered by content_type.
    Results are ordered by most recent first and include timestamps.
    """
    items = memory_crud.get_user_memories(
        db=db, user_id=str(current_user.id), content_type=content_type, limit=limit
    )
    # Filter out soft-deleted items via metadata.deleted
    try:
        import json as _json
        items = [
            it for it in items
            if not (
                (lambda _md: bool(_md.get("deleted")))(
                    (_json.loads(it.memory_metadata) if it.memory_metadata else {})
                )
            )
        ]
    except Exception:
        pass
    # Deduplicate by normalized content (case-insensitive, whitespace-collapsed)
    # Keep the first occurrence (most recent due to DESC ordering)
    seen: set[str] = set()
    deduped: List[MemoryNodeResponse] = []
    import re
    boilerplate_patterns = [
        r"\bplease\s+remember\s+it\b",
        r"\bremember\s+this\b",
        r"\bremember\s+that\b",
        r"\bplease\s+remember\b",
        r"\bremember\b",
        r"\bplease\b",
        r"\bit\b",
    ]
    for it in items:
        try:
            raw = (it.content or "").strip().lower()
            # Remove common boilerplate phrases often present in prompts
            for pat in boilerplate_patterns:
                raw = re.sub(pat, " ", raw)
            # Remove punctuation and non-alphanumeric (keep letters/numbers/spaces)
            raw = re.sub(r"[^a-z0-9\s]+", " ", raw)
            # Collapse whitespace
            norm = " ".join(raw.split())
        except Exception:
            norm = (it.content or "")
        if not norm:
            # Allow empty content entries through once
            key = "__empty__"
        else:
            key = norm
        if key in seen:
            continue
        seen.add(key)
        deduped.append(it)

    items = deduped
    # Optional filter by memory_metadata.core without changing SQL shape
    if core is not None:
        filtered: List[MemoryNodeResponse] = []
        import json

        for it in items:
            try:
                md = json.loads(it.memory_metadata) if it.memory_metadata else {}
                is_core = bool(md.get("core"))
                if is_core == core:
                    filtered.append(it)
            except Exception:
                # If metadata unparsable, treat as non-core
                if core is False:
                    filtered.append(it)
        return filtered
    return items


@router.get("/users/me/memories/search", response_model=List[MemorySearchResult])
def search_my_memories(
    query: str,
    content_type: Optional[str] = None,
    limit: int = 8,
    min_relevance: float = 0.5,
    debug: bool = False,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Semantic search over my memories with optional debug scoring output.

    When `debug=true` and `settings.DEBUG_RETRIEVAL_ENABLED` is True, each item's
    `memory_metadata` will include a `_retrieval_debug` object containing raw and
    post-tunable scores for diagnostics.
    """
    cts = [content_type] if content_type else None
    allow_debug = bool(getattr(settings, "DEBUG_RETRIEVAL_ENABLED", False)) and bool(debug)
    results = memory_service.search_memories(
        db,
        query=query,
        user_id=str(current_user.id),
        content_types=cts,
        limit=max(1, min(50, int(limit))),
        min_relevance=float(min_relevance),
        debug=allow_debug,
    )
    return results


class DeleteMemoryResponse(BaseModel):
    success: bool
    mode: Literal["soft", "hard"]


@router.delete("/memories/faiss/{faiss_id}", response_model=DeleteMemoryResponse)
def soft_delete_memory(
    faiss_id: str,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Capture before snapshot
    node = memory_crud.get_memory_by_faiss_id(db, faiss_id)
    before_content = getattr(node, "content", None) if node and str(node.user_id) == str(current_user.id) else None
    before_metadata = getattr(node, "memory_metadata", None) if node and str(node.user_id) == str(current_user.id) else None
    ok = memory_crud.soft_delete_by_faiss_id(db, user_id=str(current_user.id), faiss_id=faiss_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    try:
        req_ip = (request.client.host if getattr(request, "client", None) else None)
        ua = request.headers.get("user-agent") if request else None
        memory_audit.log(
            db,
            user_id=str(current_user.id),
            faiss_id=faiss_id,
            action="soft_delete",
            source="api",
            before_content=before_content,
            after_content=None,
            before_metadata=before_metadata,
            after_metadata=None,
            request_ip=req_ip,
            user_agent=ua,
        )
    except Exception:
        pass
    return DeleteMemoryResponse(success=True, mode="soft")

@router.delete("/{faiss_id}", response_model=DeleteMemoryResponse)
def soft_delete_memory_flat(
    faiss_id: str,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Alias for DELETE /memories/{faiss_id} mapping to soft delete by FAISS id."""
    return soft_delete_memory(faiss_id, request, db, current_user)


@router.delete("/memories/faiss/{faiss_id}/hard", response_model=DeleteMemoryResponse)
def hard_delete_memory(
    faiss_id: str,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Capture before snapshot
    node = memory_crud.get_memory_by_faiss_id(db, faiss_id)
    before_content = getattr(node, "content", None) if node and str(node.user_id) == str(current_user.id) else None
    before_metadata = getattr(node, "memory_metadata", None) if node and str(node.user_id) == str(current_user.id) else None
    ok = memory_crud.delete_by_faiss_id(db, user_id=str(current_user.id), faiss_id=faiss_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    try:
        req_ip = (request.client.host if getattr(request, "client", None) else None)
        ua = request.headers.get("user-agent") if request else None
        memory_audit.log(
            db,
            user_id=str(current_user.id),
            faiss_id=faiss_id,
            action="hard_delete",
            source="api",
            before_content=before_content,
            after_content=None,
            before_metadata=before_metadata,
            after_metadata=None,
            request_ip=req_ip,
            user_agent=ua,
        )
    except Exception:
        pass
    return DeleteMemoryResponse(success=True, mode="hard")

@router.delete("/{faiss_id}/hard", response_model=DeleteMemoryResponse)
def hard_delete_memory_flat(
    faiss_id: str,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Alias for DELETE /memories/{faiss_id}/hard mapping to hard delete by FAISS id."""
    return hard_delete_memory(faiss_id, request, db, current_user)


@router.delete("/memories/{id}", response_model=DeleteMemoryResponse)
def delete_memory_by_id(
    id: str,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Soft delete a memory by its primary key id (tests expect DELETE by id)."""
    node = crud.memory.get(db, id=id)
    if not node or str(node.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")

    # If already soft-deleted, behave as not found for id-based DELETE
    try:
        import json as _json

        md = _json.loads(node.memory_metadata) if getattr(node, "memory_metadata", None) else {}
        if isinstance(md, dict) and md.get("deleted") is True:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    except HTTPException:
        raise
    except Exception:
        # If metadata is malformed, proceed with delete attempt
        pass

    # Reuse soft-delete by faiss id to keep audit trails consistent
    ok = memory_crud.soft_delete_by_faiss_id(db, user_id=str(current_user.id), faiss_id=str(node.faiss_id))
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    try:
        req_ip = (request.client.host if getattr(request, "client", None) else None)
        ua = request.headers.get("user-agent") if request else None
        memory_audit.log(
            db,
            user_id=str(current_user.id),
            faiss_id=str(node.faiss_id),
            action="soft_delete",
            source="api",
            before_content=getattr(node, "content", None),
            after_content=None,
            before_metadata=getattr(node, "memory_metadata", None),
            after_metadata=None,
            request_ip=req_ip,
            user_agent=ua,
        )
    except Exception:
        pass
    return DeleteMemoryResponse(success=True, mode="soft")

class UpdateMemoryIn(BaseModel):
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    importance_score: Optional[int] = Field(None, ge=0, le=100)
    source: Optional[str] = Field(None, description="Provenance of edit: chat|api|system")
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    # Test-facing convenience fields
    core: Optional[bool] = Field(None, description="Toggle core flag in metadata")
    relevance_score: Optional[float] = Field(None, description="Set relevance score for node")


@router.patch("/memories/{id}", response_model=MemoryNodeResponse)
def update_memory(
    id: str,
    payload: UpdateMemoryIn,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Update a memory's content and/or metadata with audit logging."""
    # Look up by primary key id for compatibility with tests
    node = crud.memory.get(db, id=id)
    if not node or str(node.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")

    # Before snapshot
    before_content = getattr(node, "content", None)
    before_metadata = getattr(node, "memory_metadata", None)

    # Prepare updates
    new_content = before_content
    if payload.content is not None:
        try:
            red_c, _red_info = redact_text(payload.content)
            new_content = red_c
        except Exception:
            new_content = payload.content

    new_metadata_str = before_metadata
    if payload.metadata is not None:
        try:
            red_md = redact_metadata(payload.metadata)
            import json as _json

            new_metadata_str = _json.dumps(red_md)
        except Exception:
            try:
                import json as _json

                new_metadata_str = _json.dumps(payload.metadata)
            except Exception:
                new_metadata_str = before_metadata

    # Merge core toggle into metadata if provided
    if payload.core is not None:
        try:
            import json as _json
            base_md = _json.loads(new_metadata_str) if isinstance(new_metadata_str, str) and new_metadata_str else {}
        except Exception:
            base_md = {}
        base_md["core"] = bool(payload.core)
        try:
            import json as _json
            new_metadata_str = _json.dumps(base_md)
        except Exception:
            # fallback: ignore merge failure
            pass

    # Apply content + metadata updates
    updated = memory_crud.update_content_and_metadata(
        db,
        node=node,
        content=new_content if new_content is not None else before_content or "",
        metadata=None if new_metadata_str is None else (None if new_metadata_str is None else __import__("json").loads(new_metadata_str) if isinstance(new_metadata_str, str) else new_metadata_str),
    )

    # Optional importance update
    if payload.importance_score is not None:
        try:
            updated = memory_crud.update_importance_score(db, faiss_id=str(updated.faiss_id), score=int(payload.importance_score)) or updated
        except Exception:
            pass

    # Optional relevance score update
    if payload.relevance_score is not None:
        try:
            updated = memory_crud.update_relevance_score(db, faiss_id=str(updated.faiss_id), score=float(payload.relevance_score)) or updated
        except Exception:
            pass

    # After snapshot from updated
    after_content = getattr(updated, "content", None)
    after_metadata = getattr(updated, "memory_metadata", None)

    # Audit log
    try:
        req_ip = (request.client.host if getattr(request, "client", None) else None)
        ua = request.headers.get("user-agent") if request else None
        memory_audit.log(
            db,
            user_id=str(current_user.id),
            faiss_id=str(updated.faiss_id),
            action="update",
            source=payload.source or "api",
            conversation_id=payload.conversation_id,
            message_id=payload.message_id,
            before_content=before_content,
            after_content=after_content,
            before_metadata=before_metadata,
            after_metadata=after_metadata,
            request_ip=req_ip,
            user_agent=ua,
        )
    except Exception:
        pass

    return updated

@router.patch("/{faiss_id}", response_model=MemoryNodeResponse)
def update_memory_by_faiss_id(
    faiss_id: str,
    payload: UpdateMemoryIn,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Alias for PATCH /memories/{faiss_id} by resolving FAISS id to primary id and reusing update logic."""
    node = memory_crud.get_memory_by_faiss_id(db, faiss_id)
    if not node or str(node.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    return update_memory(id=str(node.id), payload=payload, request=request, db=db, current_user=current_user)


class DeleteAllMemoriesResponse(BaseModel):
    deleted: int


@router.delete("/users/me/memories", response_model=DeleteAllMemoriesResponse)
def delete_all_my_memories(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    count = memory_crud.delete_user_memories(db, user_id=str(current_user.id))
    return DeleteAllMemoriesResponse(deleted=int(count))


class CreateMemoryIn(BaseModel):
    content: str = Field(..., description="Memory content text")
    content_type: Optional[str] = Field(
        "fact", description="Type of memory (e.g., conversation|message|fact|onboarding)"
    )
    conversation_id: Optional[UUID] = Field(None, description="Optional related conversation id")
    core: Optional[bool] = Field(None, description="Create as core memory")
    importance: Optional[float] = Field(
        None, description="Optional importance score used by evolution logic"
    )
    importance_score: Optional[int] = Field(
        None, ge=0, le=100, description="UI-facing importance score 0..100"
    )
    source: Optional[str] = Field(
        None,
        description="Provenance of memory capture (e.g., chat:remember|chat:assistant_selection)",
    )
    message_id: Optional[_UUID] = Field(None, description="Related chat message id for provenance")
    # Optional richer metadata to improve consolidation and ranking
    category: Optional[str] = Field(
        None,
        description="High-level category for this memory (e.g., profile|preference|habit|goal|log)",
    )
    consolidation_key: Optional[str] = Field(
        None,
        description="Stable normalized key used to deduplicate/merge similar memories",
    )
    rank_boost: Optional[float] = Field(
        None,
        description="Optional manual boost (0..1) that can influence retrieval ranking",
    )


@router.post("/memories", response_model=MemoryNodeResponse)
def create_memory(
    payload: CreateMemoryIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Create a memory node for the current user.

    Generates a FAISS id placeholder; vector indexing can run asynchronously.
    """

    metadata: Dict[str, Any] = {}
    if payload.core is not None:
        metadata["core"] = bool(payload.core)
    if payload.importance is not None:
        metadata["importance"] = float(payload.importance)
    if payload.source:
        metadata["source"] = payload.source
    else:
        metadata.setdefault("source", "chat:remember")
    if payload.message_id:
        metadata["message_id"] = str(payload.message_id)
    # Optional enrichment fields
    if payload.category:
        metadata["category"] = payload.category
    if payload.consolidation_key:
        metadata["consolidation_key"] = payload.consolidation_key
    if payload.rank_boost is not None:
        try:
            rb = float(payload.rank_boost)
        except Exception:
            rb = 0.0
        metadata["rank_boost"] = max(0.0, min(1.0, rb))

    # Preserve the original content as the stored value (tests expect exact text)
    # Compute a normalized shadow string only for consolidation/dedupe/ranking purposes.
    raw_content = (payload.content or "").strip()
    try:
        import re as _re

        _boilerplate_patterns = [
            r"\bplease\s+remember\s+it\b",
            r"\bremember\s+this\b",
            r"\bremember\s+that\b",
            r"\bplease\s+remember\b",
            r"\bremember\b",
            r"\bplease\b",
            r"\bit\b",
        ]
        _norm = raw_content.lower()
        for _pat in _boilerplate_patterns:
            _norm = _re.sub(_pat, " ", _norm)
        _norm = _re.sub(r"[^a-z0-9\s]+", " ", _norm)
        _norm = " ".join(_norm.split())
    except Exception:
        _norm = raw_content

    # Persist original text as content
    canonical_content = raw_content

    # Save normalization for internal use
    if _norm:
        metadata["norm_content"] = _norm

    # Auto-populate consolidation_key if not provided (prefer normalized form)
    if not metadata.get("consolidation_key"):
        key_src = _norm or canonical_content
        metadata["consolidation_key"] = key_src[:160]

    # Determine importance_score:
    # 1) Prefer explicit importance_score (including 0)
    # 2) Else if 'importance' (0..1) provided, scale to 0..100
    # 3) Else derive via MemoryService.grade_importance(content, content_type)
    imp_score: int = 0
    try:
        if payload.importance_score is not None:
            imp_score = max(0, min(100, int(payload.importance_score)))
        elif payload.importance is not None:
            imp_score = max(0, min(100, int(round(float(payload.importance) * 100))))
        else:
            imp_score = int(
                max(
                    0,
                    min(
                        100,
                        memory_service.grade_importance(
                            raw_content,
                            (payload.content_type or "fact"),
                        ),
                    ),
                )
            )
    except Exception:
        imp_score = 0

    # Apply privacy redaction before persistence
    red_content = canonical_content
    red_meta = metadata
    try:
        red_content, red_info = redact_text(canonical_content)
        red_meta = redact_metadata(metadata)
        if isinstance(red_meta, dict):
            red_meta.setdefault("redaction", {}).update({
                "enabled": True,
                "counts": {k: int(v) for k, v in (red_info or {}).items() if k != "enabled"}
            })
    except Exception:
        red_content = canonical_content
        red_meta = metadata

    node = memory_crud.create_memory_node(
        db=db,
        faiss_id=str(uuid4()),
        content=red_content,
        content_type=payload.content_type or "fact",
        user_id=str(current_user.id),
        conversation_id=str(payload.conversation_id) if payload.conversation_id else None,
        metadata=red_meta,
        importance_score=imp_score,
    )
    return node

@router.post("", response_model=MemoryNodeResponse)
def create_memory_flat(
    payload: CreateMemoryIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Alias for POST /memories when this router is mounted at prefix '/memories'."""
    return create_memory(payload, db, current_user)


class MemoryAuditListResponse(BaseModel):
    items: list[MemoryAuditResponse]
    total: int


@router.get("/memories/{faiss_id}/audit", response_model=MemoryAuditListResponse)
def list_memory_audit(
    faiss_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Return paginated audit history for a memory, newest first."""
    # Ownership check to avoid leaking existence
    node = memory_crud.get_memory_by_faiss_id(db, faiss_id)
    if not node or str(node.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")

    items = memory_audit.list_by_faiss_id(
        db, user_id=str(current_user.id), faiss_id=faiss_id, skip=skip, limit=limit
    )
    total = memory_audit.count_by_faiss_id(db, user_id=str(current_user.id), faiss_id=faiss_id)
    return MemoryAuditListResponse(items=items, total=int(total))

@router.get("/{faiss_id}/audit", response_model=MemoryAuditListResponse)
def list_memory_audit_flat(
    faiss_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Alias for GET /memories/{faiss_id}/audit when mounted at '/memories'."""
    return list_memory_audit(faiss_id=faiss_id, skip=skip, limit=limit, db=db, current_user=current_user)


class MemoryContextItem(TypedDict):
    id: str
    content: str
    type: Literal["conversation", "profile", "preference", "onboarding", "message", "fact"]
    relevance: float
    timestamp: str
    reason: str


@router.get("/conversations/{conversation_id}/memory-context")
def get_memory_context(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Return memory items influencing the conversation reply.
    Shapes payload for the existing frontend `MemoryContext` component.
    """
    # Verify conversation belongs to user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    context_items: List[MemoryContextItem] = []
    seen_norm: set[str] = set()

    # Honor per-user memory flag
    if not bool(settings.MEMORY_ENABLED) or (getattr(current_user, "memory_enabled", None) is False):
        return {"context": context_items}

    # Use last user message to shape context and detect self-referential prompt
    recent_msgs = crud.message.get_by_conversation(
        db, conversation_id=conversation_id, skip=0, limit=10
    )
    user_texts = [m.content for m in recent_msgs if m.role == "user"]
    last_user_input = user_texts[-1] if user_texts else ""

    def _asks_about_user(t: str) -> bool:
        lu = (t or "").strip().lower()
        return (
            ("what do you know" in lu and ("about me" in lu or "about my" in lu or "about us" in lu))
            or ("what do you remember" in lu and ("about me" in lu or "about us" in lu))
            or ("what do you have" in lu and "on me" in lu)
            or ("my profile" in lu and ("what" in lu or "tell" in lu))
            or ("tell me about myself" in lu)
            or ("tell me about me" in lu)
            or ("about myself" in lu and ("tell" in lu or "what" in lu or "who" in lu or "describe" in lu or "summarize" in lu))
            or ("describe me" in lu)
            or ("summarize me" in lu)
            or ("who am i" in lu and "to you" in lu)
        )

    is_self_ref = _asks_about_user(last_user_input)

    # Attempt to include user's profile memory as a baseline item (with redaction rules)
    try:
        profile_text = memory_service.get_user_profile_memory(db=db, user_id=str(current_user.id))
        if profile_text:
            # Redact verbatim disclosure for self-referential queries unless explicitly allowed
            content_for_ctx = profile_text
            reason = "User profile baseline"
            if is_self_ref and not settings.PROFILE_VERBATIM_DISCLOSURE_ALLOWED:
                # Build high-level bullets using keys only (no values)
                bullets = []
                for seg in (profile_text or "").split(" | "):
                    seg = seg.strip()
                    if not seg:
                        continue
                    if ":" in seg:
                        key = seg.split(":", 1)[0].strip()
                    else:
                        key = seg
                    if key:
                        bullets.append(f"- {key}")
                    if len(bullets) >= 3:
                        break
                content_for_ctx = "\n".join(bullets) if bullets else "- Profile available (redacted)"
                reason = "Profile highlights (redacted)"

            # Deduplicate based on normalized content to avoid duplicates
            norm = content_for_ctx.strip().lower()
            if norm and norm not in seen_norm:
                seen_norm.add(norm)
                context_items.append(
                    {
                        "id": "profile",
                        "content": content_for_ctx,
                        "type": "profile",
                        "relevance": 1.0,
                        "timestamp": (
                            conversation.updated_at or conversation.created_at
                        ).isoformat(),
                        "reason": reason,
                    }
                )
    except Exception:
        # Non-fatal; continue with other context
        pass

    seen_faiss_ids: list[str] = []
    if last_user_input:
        try:
            results = memory_service.search_memories(
                db=db,
                query=last_user_input,
                user_id=str(current_user.id),
                content_types=None,
                limit=settings.RETRIEVAL_TOP_K,
                # Use a very permissive threshold to ensure recall; downstream caps/filters apply
                min_relevance=-1.0,
            )
            # Enforce per-type caps for diversity
            type_caps = {
                "profile": 1,
                "preference": 3,
                "conversation": 3,
                "fact": 3,
                "message": 2,
            }
            type_counts: dict[str, int] = {k: 0 for k in type_caps.keys()}

            # Prevent repetition: fetch ids already used in this conversation
            used_ids = set(context_tracker.get_used_memory_ids(str(conversation_id)))

            for r in results:
                try:
                    # Avoid echoing the user's current question back as a "memory"
                    try:
                        if r.content.strip() == last_user_input.strip():
                            continue
                    except Exception:
                        pass

                    # Skip memories already used in this conversation to reduce repetition
                    try:
                        if getattr(r, "faiss_id", None) in used_ids:
                            continue
                    except Exception:
                        pass

                    # Parse metadata once for category and reasons
                    try:
                        import json as _json
                        md = _json.loads(r.memory_metadata) if r.memory_metadata else {}
                    except Exception:
                        md = {}

                    mapped_type: MemoryContextItem["type"]
                    if r.content_type in ("onboarding", "profile"):
                        mapped_type = "profile"
                    elif r.content_type in ("preference",):
                        mapped_type = "preference"
                    elif r.content_type in ("message", "conversation"):
                        mapped_type = "conversation"
                    else:
                        # fall back to original type name if fits allowed set else 'fact'
                        mapped_type = (
                            "fact"
                            if r.content_type
                            not in (
                                "conversation",
                                "profile",
                                "preference",
                                "onboarding",
                                "message",
                                "fact",
                            )
                            else r.content_type
                        )  # type: ignore

                    # Prefer metadata.category when it maps to allowed types
                    try:
                        cat = str(md.get("category") or "").strip().lower()
                        if cat in ("conversation", "profile", "preference", "onboarding", "message", "fact"):
                            mapped_type = cat  # type: ignore[assignment]
                    except Exception:
                        pass

                    # Safe timestamp formatting with fallback
                    try:
                        ts = r.timestamp.isoformat()  # type: ignore[attr-defined]
                    except Exception:
                        ts = (conversation.updated_at or conversation.created_at).isoformat()

                    # Build a short explanation for why this memory appeared
                    reason_parts: list[str] = []
                    reason_parts.append(f"score={r.relevance_score:.2f}")
                    if md.get("core"):
                        reason_parts.append("core=true")
                    if md.get("importance") is not None:
                        try:
                            reason_parts.append(f"importance={float(md.get('importance')):.2f}")
                        except Exception:
                            pass
                    if md.get("reinforced_count") is not None:
                        try:
                            reason_parts.append(f"reinforced={int(md.get('reinforced_count'))}")
                        except Exception:
                            pass

                    # Simple dedupe by normalized content
                    norm = (r.content or "").strip().lower()
                    if not norm or norm in seen_norm:
                        continue
                    seen_norm.add(norm)

                    context_items.append(
                        {
                            "id": r.faiss_id,
                            "content": r.content,
                            "type": mapped_type,
                            "relevance": r.relevance_score,
                            "timestamp": ts,
                            "reason": ", ".join(reason_parts),
                        }
                    )
                    # Track as seen for lifecycle analytics and ranking features
                    try:
                        seen_faiss_ids.append(r.faiss_id)
                    except Exception:
                        pass
                    type_counts[mapped_type] = type_counts.get(mapped_type, 0) + 1
                except Exception:
                    # Skip bad item but keep others
                    continue
            # Fallback: if retrieval returned nothing, include recent conversation and
            # preference memories and interleave them for diversity.
            if not results:
                import json as _json
                # Collect recent conversation memories
                try:
                    conv_mems = memory_crud.get_conversation_memories(
                        db, conversation_id=str(conversation_id), limit=10
                    )
                except Exception:
                    conv_mems = []

                conv_ctx: list[dict] = []
                for m in conv_mems:
                    try:
                        if str(m.user_id) != str(current_user.id):
                            continue
                        # Filter suppressed
                        md = {}
                        try:
                            md = _json.loads(m.memory_metadata) if m.memory_metadata else {}
                        except Exception:
                            md = {}
                        # Skip soft-deleted
                        try:
                            if bool(md.get("deleted")):
                                continue
                        except Exception:
                            pass
                        sup = md.get("suppressed_until")
                        if sup:
                            try:
                                from datetime import datetime, timezone

                                sup_dt = datetime.fromisoformat(sup)
                                if sup_dt.tzinfo is None:
                                    sup_dt = sup_dt.replace(tzinfo=timezone.utc)
                                if sup_dt > datetime.now(timezone.utc):
                                    continue
                            except Exception:
                                pass
                        norm = (m.content or "").strip().lower()
                        if not norm:
                            continue
                        conv_ctx.append(
                            {
                                "id": m.faiss_id,
                                "content": m.content,
                                "type": "conversation",
                                "relevance": float(m.relevance_score or 1.0),
                                "timestamp": m.timestamp.isoformat()
                                if getattr(m, "timestamp", None)
                                else (
                                    conversation.updated_at or conversation.created_at
                                ).isoformat(),
                                "reason": "fallback_recent_conversation",
                                "_norm": norm,
                            }
                        )
                    except Exception:
                        continue

                # Collect recent user preferences
                try:
                    pref_mems = memory_crud.get_user_memories(
                        db=db, user_id=str(current_user.id), content_type="preference", limit=10
                    )
                except Exception:
                    pref_mems = []

                pref_ctx: list[dict] = []
                for m in pref_mems:
                    try:
                        md = {}
                        try:
                            md = _json.loads(m.memory_metadata) if m.memory_metadata else {}
                        except Exception:
                            md = {}
                        # Skip soft-deleted
                        try:
                            if bool(md.get("deleted")):
                                continue
                        except Exception:
                            pass
                        mtype: MemoryContextItem["type"] = "preference"
                        try:
                            cat = str(md.get("category") or "").strip().lower()
                            if cat in ("conversation", "profile", "preference", "onboarding", "message", "fact"):
                                mtype = cat  # type: ignore[assignment]
                        except Exception:
                            pass
                        norm = (m.content or "").strip().lower()
                        if not norm:
                            continue
                        # Compute a priority score to help internal ordering
                        rb = 0.0
                        try:
                            rb = float(md.get("rank_boost") or 0.0)
                        except Exception:
                            rb = 0.0
                        imp = 0.0
                        try:
                            imp = float(md.get("importance") or getattr(m, "importance", 0) or 0)
                        except Exception:
                            imp = 0.0
                        rel = float(m.relevance_score or 0.8)
                        _score = rel + 0.1 * rb + 0.01 * imp
                        pref_ctx.append(
                            {
                                "id": m.faiss_id,
                                "content": m.content,
                                "type": mtype,
                                "relevance": rel,
                                "timestamp": m.timestamp.isoformat()
                                if getattr(m, "timestamp", None)
                                else (
                                    conversation.updated_at or conversation.created_at
                                ).isoformat(),
                                "reason": "fallback_recent_preferences",
                                "_norm": norm,
                                "_score": _score,
                            }
                        )
                    except Exception:
                        continue

                # Collect recent user profile memories as secondary source (if prefs are sparse)
                try:
                    profile_mems = memory_crud.get_user_memories(
                        db=db, user_id=str(current_user.id), content_type="profile", limit=10
                    )
                except Exception:
                    profile_mems = []

                profile_ctx: list[dict] = []
                for m in profile_mems:
                    try:
                        md = {}
                        try:
                            md = _json.loads(m.memory_metadata) if m.memory_metadata else {}
                        except Exception:
                            md = {}
                        # Skip soft-deleted
                        try:
                            if bool(md.get("deleted")):
                                continue
                        except Exception:
                            pass
                        mtype: MemoryContextItem["type"] = "profile"
                        try:
                            cat = str(md.get("category") or "").strip().lower()
                            if cat in ("conversation", "profile", "preference", "onboarding", "message", "fact"):
                                mtype = cat  # type: ignore[assignment]
                        except Exception:
                            pass
                        norm = (m.content or "").strip().lower()
                        if not norm:
                            continue
                        rb = 0.0
                        try:
                            rb = float(md.get("rank_boost") or 0.0)
                        except Exception:
                            rb = 0.0
                        imp = 0.0
                        try:
                            imp = float(md.get("importance") or getattr(m, "importance", 0) or 0)
                        except Exception:
                            imp = 0.0
                        rel = float(m.relevance_score or 0.9)
                        _score = rel + 0.1 * rb + 0.01 * imp
                        profile_ctx.append(
                            {
                                "id": m.faiss_id,
                                "content": m.content,
                                "type": mtype,
                                "relevance": rel,
                                "timestamp": m.timestamp.isoformat()
                                if getattr(m, "timestamp", None)
                                else (
                                    conversation.updated_at or conversation.created_at
                                ).isoformat(),
                                "reason": "fallback_recent_profile",
                                "_norm": norm,
                                "_score": _score,
                            }
                        )
                    except Exception:
                        continue

                # Interleave up to K items ensuring no duplicates, priority, and per-type caps
                # 0) Sort each list by computed score (if present) descending
                def _sort_key(d: dict) -> float:
                    try:
                        return float(d.get("_score", d.get("relevance", 0)))
                    except Exception:
                        return 0.0

                pref_ctx.sort(key=_sort_key, reverse=True)
                profile_ctx.sort(key=_sort_key, reverse=True)
                # For conversation, compute scores lightly from relevance
                for _d in conv_ctx:
                    _d["_score"] = float(_d.get("relevance", 1.0))
                conv_ctx.sort(key=_sort_key, reverse=True)

                # 1) Drop conversation items that duplicate preference/profile content
                drop_norms = {p["_norm"] for p in pref_ctx} | {p["_norm"] for p in profile_ctx}
                if drop_norms:
                    conv_ctx = [c for c in conv_ctx if c.get("_norm") not in drop_norms]

                K = int(getattr(settings, "RETRIEVAL_TOP_K", 8) or 8)
                from math import ceil
                per_type_cap = ceil(K / 2)

                type_counts: dict[str, int] = {}
                i = j = k = 0
                # 2) Cycle preference -> conversation -> profile to maintain diversity
                while len(context_items) < K and (i < len(conv_ctx) or j < len(pref_ctx) or k < len(profile_ctx)):
                    # preference
                    if j < len(pref_ctx) and len(context_items) < K:
                        item = pref_ctx[j]
                        if item["_norm"] not in seen_norm and type_counts.get(str(item.get("type")), 0) < per_type_cap:
                            seen_norm.add(item["_norm"])  # reserve
                            item.pop("_norm", None)
                            item.pop("_score", None)
                            context_items.append(item)  # type: ignore[arg-type]
                            type_counts[str(item.get("type"))] = type_counts.get(str(item.get("type")), 0) + 1
                        j += 1
                        if len(context_items) >= K:
                            break
                    # conversation
                    if i < len(conv_ctx) and len(context_items) < K:
                        item = conv_ctx[i]
                        if item["_norm"] not in seen_norm and type_counts.get(str(item.get("type", "conversation")), 0) < per_type_cap:
                            seen_norm.add(item["_norm"])  # reserve
                            item.pop("_norm", None)
                            item.pop("_score", None)
                            context_items.append(item)  # type: ignore[arg-type]
                            type_counts[str(item.get("type", "conversation"))] = type_counts.get(str(item.get("type", "conversation")), 0) + 1
                        i += 1
                        if len(context_items) >= K:
                            break
                    # profile
                    if k < len(profile_ctx) and len(context_items) < K:
                        item = profile_ctx[k]
                        if item["_norm"] not in seen_norm and type_counts.get(str(item.get("type", "profile")), 0) < per_type_cap:
                            seen_norm.add(item["_norm"])  # reserve
                            item.pop("_norm", None)
                            item.pop("_score", None)
                            context_items.append(item)  # type: ignore[arg-type]
                            type_counts[str(item.get("type", "profile"))] = type_counts.get(str(item.get("type", "profile")), 0) + 1
                        k += 1
        except Exception:
            # Don't fail; return what we have
            pass

    # Mark retrieved memories as seen to update last_seen_at/seen_count
    try:
        if seen_faiss_ids:
            memory_service.mark_memories_seen(
                db, user_id=str(current_user.id), faiss_ids=seen_faiss_ids
            )
    except Exception:
        pass

    # Track discussed content and used memory ids to reduce repetition next turn
    try:
        context_tracker.track_discussed_content(
            str(conversation_id), last_user_input or "", "conversation", memory_ids=[str(x) for x in seen_faiss_ids]
        )
    except Exception:
        pass

    return {"context": context_items}


@router.delete("/memories/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    memory_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Delete a memory item owned by the current user."""
    node = memory_crud.get(db, id=memory_id)
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    if str(node.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    memory_crud.remove(db, id=memory_id)
    return


class MemoryPatchIn(BaseModel):
    """Payload for updating a memory node. Supports toggling core via memory_metadata.

    We keep this narrow for safety; extend as needed.
    """

    content: Optional[str] = Field(None, description="Updated content text")
    relevance_score: Optional[float] = Field(None, description="Updated relevance score")
    core: Optional[bool] = Field(
        None, description="Promote/demote to core via memory_metadata.core"
    )
    importance_score: Optional[int] = Field(
        None, ge=0, le=100, description="Updated importance score 0..100"
    )


@router.patch("/memories/{memory_id}")
def patch_memory(
    memory_id: str,
    payload: MemoryPatchIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Update a memory node the user owns. Allows toggling core in memory_metadata.

    Returns the updated memory node on success.
    """
    node = memory_crud.get(db, id=memory_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Memory not found"},
        )
    if str(node.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "forbidden", "message": "Not enough permissions"},
        )

    # Prepare new values
    new_content = payload.content if payload.content is not None else node.content
    import json

    try:
        md: Dict[str, Any] = json.loads(node.memory_metadata) if node.memory_metadata else {}
    except Exception:
        md = {}
    if payload.core is not None:
        md["core"] = bool(payload.core)

    # Use CRUD helper when updating content/metadata together
    updated = memory_crud.update_content_and_metadata(
        db,
        node=node,
        content=new_content,
        metadata=md,
    )

    # Optionally update relevance score
    if payload.relevance_score is not None:
        try:
            updated.relevance_score = float(payload.relevance_score)
            db.commit()
            db.refresh(updated)
        except Exception:
            # Keep content/metadata changes even if relevance update fails silently
            pass

    # Optionally update importance score (0..100)
    if payload.importance_score is not None:
        try:
            updated.importance_score = max(0, min(100, int(payload.importance_score)))
            db.commit()
            db.refresh(updated)
        except Exception:
            pass

    # Shape like MemoryNodeResponse (Pydantic model will coerce)
    return updated


class CheckInIn(BaseModel):
    prompt: Optional[str] = Field(
        None, description="Optional prompt shown to the user; stored as source context"
    )
    content: str = Field(..., description="User's check-in text")
    cadence: Optional[Literal["daily", "weekly"]] = Field("daily", description="Check-in cadence")


@router.post("/users/me/checkins", response_model=MemoryNodeResponse)
def create_checkin_memory(
    payload: CheckInIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Create a check-in memory node for the current user."""
    source = f"checkin:{payload.cadence or 'daily'}"
    md: Dict[str, Any] = {"source": source}
    if payload.prompt:
        md["prompt"] = payload.prompt
    node = memory_crud.create_memory_node(
        db=db,
        faiss_id=str(uuid4()),
        content=payload.content,
        content_type="fact",
        user_id=str(current_user.id),
        conversation_id=None,
        metadata=md,
    )
    return node


class FeedbackIn(BaseModel):
    signal: Literal["up", "down"] = Field(..., description="Thumbs up or down")
    reason: Optional[str] = Field(None, description="Optional reason or comment")
    faiss_id: Optional[str] = Field(
        None, description="Optional FAISS memory id to reinforce/suppress"
    )


@router.post("/messages/{message_id}/feedback")
def message_feedback(
    message_id: UUID,
    payload: FeedbackIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Record feedback on an assistant message. For now, we log the signal and
    pave the way for future suppression/reinforcement logic in memory_service.
    """
    msg = crud.message.get(db, id=message_id)
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    # Ensure user owns the conversation this message belongs to
    conv = crud.conversation.get(db, id=msg.conversation_id)
    if not conv or str(conv.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Learning action: reinforce/suppress specific memory if provided
    try:
        from logging import getLogger

        logger = getLogger(__name__)
        logger.info(
            "Feedback received | user=%s conv=%s msg=%s signal=%s reason=%s",
            current_user.id,
            conv.id,
            message_id,
            payload.signal,
            payload.reason,
        )
        if payload.faiss_id:
            if payload.signal == "down":
                ok = memory_service.suppress_memory_by_faiss_id(
                    db, user_id=str(current_user.id), faiss_id=payload.faiss_id, ttl_days=14
                )
                logger.info(
                    "Memory suppress | user=%s faiss=%s ok=%s",
                    current_user.id,
                    payload.faiss_id,
                    ok,
                )
            elif payload.signal == "up":
                ok1 = memory_service.reinforce_memory_by_faiss_id(
                    db, user_id=str(current_user.id), faiss_id=payload.faiss_id, increment=1
                )
                ok2 = memory_service.increase_rank_boost_by_faiss_id(
                    db, user_id=str(current_user.id), faiss_id=payload.faiss_id, delta=0.2, cap=1.0
                )
                logger.info(
                    "Memory reinforce/rank_boost | user=%s faiss=%s reinforce=%s rank_boost=%s",
                    current_user.id,
                    payload.faiss_id,
                    ok1,
                    ok2,
                )
    except Exception:
        pass

    return {"status": "recorded", "signal": payload.signal}


@router.post("/conversations/{conversation_id}/auto-summarize", response_model=MemoryNodeResponse)
def auto_summarize_conversation(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Create a lightweight automatic summary memory for the conversation.

    This is a minimal stub. Future iterations should call the LLM with
    user_id and conversation_id and store a higher-quality summary.
    """
    # Ownership checks
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Generate LLM summary per AI Integration Rules (pass user_id & conversation_id)
    summary = generate_conversation_summary(
        db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        limit_messages=30,
    )

    md: Dict[str, Any] = {
        "source": "auto_summary",
        "meta": True,
        "llm": "openrouter:deepseek/deepseek-chat-v3.1",
    }

    node = memory_crud.create_memory_node(
        db=db,
        faiss_id=str(uuid4()),
        content=summary,
        content_type="fact",
        user_id=str(current_user.id),
        conversation_id=str(conversation_id),
        metadata=md,
    )
    return node


class ReinforceIn(BaseModel):
    amount: int = Field(1, ge=1, le=10, description="Reinforcement amount to add")


@router.post("/memories/{memory_id}/reinforce", response_model=MemoryNodeResponse)
def reinforce_memory(
    memory_id: str,
    payload: ReinforceIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Reinforce a memory the user owns. Increments reinforced_count in metadata.

    Returns the updated memory node on success.
    """
    node = memory_crud.get(db, id=memory_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": "Memory not found"},
        )
    if str(node.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "forbidden", "message": "Not enough permissions"},
        )

    try:
        ok = memory_service.reinforce_memory_by_faiss_id(
            db,
            user_id=str(current_user.id),
            faiss_id=node.faiss_id,
            increment=int(payload.amount),
        )
        from logging import getLogger

        getLogger(__name__).info(
            "Memory reinforce via API | user=%s memory=%s ok=%s amount=%s",
            current_user.id,
            memory_id,
            ok,
            payload.amount,
        )
    except Exception:
        # Non-fatal; still try to return current node state
        pass

    # Re-fetch and return current state
    refreshed = memory_crud.get(db, id=memory_id)
    return refreshed


class MemoryDigestOut(BaseModel):
    total_count: int
    core_count: int
    reinforced_sum: int
    level: int
    candidate_ids: List[str] = Field(default_factory=list, description="IDs likely worth promoting")


@router.get("/users/me/memories/digest", response_model=MemoryDigestOut)
def get_memory_digest(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Return lightweight memory stats and promotion candidates for the brain meter.

    Level heuristic (1..5):
      derived from core_count buckets: [0-2]->1, [3-6]->2, [7-12]->3, [13-20]->4, >20->5
    Candidates: non-core memories that are near auto-promotion thresholds.
    """
    import json
    from app.crud.memory import memory as memory_crud

    items = memory_crud.get_user_memories(
        db=db, user_id=str(current_user.id), content_type=None, limit=1000
    )
    total = len(items)
    core_count = 0
    reinforced_sum = 0
    candidate_ids: List[str] = []
    imp_min = float(getattr(settings, "MEMORY_CORE_IMPORTANCE_MIN", 0.85))
    reinf_min = int(getattr(settings, "MEMORY_CORE_REINFORCE_MIN", 2))
    for it in items:
        md = {}
        try:
            md = json.loads(it.memory_metadata) if it.memory_metadata else {}
        except Exception:
            md = {}
        is_core = bool(md.get("core"))
        if is_core:
            core_count += 1
        reinforced = int(md.get("reinforced_count", 0) or 0)
        reinforced_sum += reinforced
        imp = float(md.get("importance", 0.0) or 0.0)
        if not is_core and ((imp >= (imp_min - 0.05)) or (reinforced >= max(0, reinf_min - 1))):
            candidate_ids.append(it.id)

    # Level buckets
    if core_count <= 2:
        level = 1
    elif core_count <= 6:
        level = 2
    elif core_count <= 12:
        level = 3
    elif core_count <= 20:
        level = 4
    else:
        level = 5

    return MemoryDigestOut(
        total_count=total,
        core_count=core_count,
        reinforced_sum=reinforced_sum,
        level=level,
        candidate_ids=candidate_ids[:10],
    )


class LifecycleOut(BaseModel):
    suppressed: int = 0
    consolidated: int = 0


@router.post("/users/me/memories/lifecycle", response_model=LifecycleOut)
def enforce_my_lifecycle(
    consolidate: bool = True,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Run lifecycle maintenance for the current user: soft-forget and optional consolidation."""
    res = memory_service.enforce_lifecycle(
        db, user_id=str(current_user.id), consolidate=consolidate
    )
    return LifecycleOut(**res)


@router.post("/users/me/memories/consolidate")
def consolidate_my_memories(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Consolidate duplicates by consolidation_key for the current user."""
    res = memory_service.consolidate_user_memories(db, user_id=str(current_user.id), limit=2000)
    return {"status": "ok", **res}


@router.put("/users/me/memories/{memory_id}", response_model=MemoryNodeResponse)
def update_my_memory(
    memory_id: str,
    update_request: MemoryUpdateRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Update a memory's content and metadata for the current user."""
    # Get existing memory and verify ownership
    existing = memory_crud.get(db, id=memory_id)
    if not existing or existing.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Memory not found")
    
    # Update content
    updated_data = {"content": update_request.content.strip()}
    
    # Update metadata if provided
    import json
    try:
        metadata = json.loads(existing.memory_metadata) if existing.memory_metadata else {}
        
        if update_request.content_type:
            metadata["content_type"] = update_request.content_type
            
        if update_request.importance_score is not None:
            metadata["importance"] = max(0.0, min(1.0, update_request.importance_score))
            
        # Add edit timestamp
        from datetime import datetime, timezone
        metadata["last_edited"] = datetime.now(timezone.utc).isoformat()
        metadata["edited_by"] = "user"
        
        updated_data["memory_metadata"] = json.dumps(metadata)
    except Exception:
        pass
    
    # Perform update
    updated = memory_crud.update(db, db_obj=existing, obj_in=updated_data)
    
    # Update vector store if enabled
    try:
        from app.memory.vector_store.factory import get_vector_store
        vs = get_vector_store()
        if vs and hasattr(vs, 'update_memory'):
            vs.update_memory(memory_id, update_request.content)
    except Exception as e:
        # Non-fatal: log but don't fail the update
        import logging
        logging.getLogger(__name__).warning(f"Failed to update vector store for memory {memory_id}: {e}")
    
    return updated


@router.delete("/users/me/memories/{memory_id}")
def delete_my_memory(
    memory_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Delete a memory for the current user."""
    # Get existing memory and verify ownership
    existing = memory_crud.get(db, id=memory_id)
    if not existing or existing.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Memory not found")
    
    # Soft delete by updating metadata
    import json
    from datetime import datetime, timezone
    
    try:
        metadata = json.loads(existing.memory_metadata) if existing.memory_metadata else {}
        metadata["deleted"] = True
        metadata["deleted_at"] = datetime.now(timezone.utc).isoformat()
        metadata["deleted_by"] = "user"
        
        memory_crud.update(db, db_obj=existing, obj_in={"memory_metadata": json.dumps(metadata)})
    except Exception:
        # Fallback to hard delete if soft delete fails
        memory_crud.remove(db, id=memory_id)
    
    # Remove from vector store if enabled
    try:
        from app.memory.vector_store.factory import get_vector_store
        vs = get_vector_store()
        if vs and hasattr(vs, 'delete_memory'):
            vs.delete_memory(memory_id)
    except Exception as e:
        # Non-fatal: log but don't fail the delete
        import logging
        logging.getLogger(__name__).warning(f"Failed to delete from vector store for memory {memory_id}: {e}")
    
    return {"status": "deleted", "memory_id": memory_id}


@router.get("/users/me/memories/daily-learnings")
def get_daily_learnings(
    days: int = 7,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get daily learning summaries for the past N days."""
    from datetime import datetime, timedelta, timezone
    import json
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get memories in date range
    memories = memory_crud.get_user_memories(
        db=db, 
        user_id=str(current_user.id), 
        limit=1000
    )
    
    # Filter by date and group by day
    daily_learnings = {}
    
    for memory in memories:
        # Use timestamp if available, otherwise created_at
        mem_date = getattr(memory, 'timestamp', None) or getattr(memory, 'created_at', None)
        if not mem_date or mem_date < start_date:
            continue
            
        date_key = mem_date.date().isoformat()
        
        if date_key not in daily_learnings:
            daily_learnings[date_key] = {
                "date": date_key,
                "memories_learned": 0,
                "key_insights": [],
                "categories": set()
            }
        
        daily_learnings[date_key]["memories_learned"] += 1
        
        # Extract key insights from high-importance memories
        try:
            metadata = json.loads(memory.memory_metadata) if memory.memory_metadata else {}
            importance = float(metadata.get("importance", 0.0))
            
            if importance > 0.7 and memory.content:
                insight = memory.content[:100] + ("..." if len(memory.content) > 100 else "")
                if len(daily_learnings[date_key]["key_insights"]) < 5:
                    daily_learnings[date_key]["key_insights"].append(insight)
            
            # Track content types
            content_type = getattr(memory, 'content_type', None) or metadata.get('content_type')
            if content_type:
                daily_learnings[date_key]["categories"].add(content_type)
                
        except Exception:
            pass
    
    # Convert sets to lists and sort by date
    result = []
    for date_key in sorted(daily_learnings.keys(), reverse=True):
        learning = daily_learnings[date_key]
        learning["categories"] = list(learning["categories"])
        result.append(learning)
    
    return result


# Admin-only maintenance endpoints (moved to bottom to avoid interrupting other handlers)
@router.post("/admin/users/{user_id}/memory/soft-forget")
def admin_soft_forget_user(
    user_id: UUID,
    db: Session = Depends(deps.get_db),
    current_superuser: User = Depends(deps.get_current_active_superuser),
):
    """Soft-forget stale, low-importance memories for a user. Admin-only."""
    try:
        count = memory_service._maybe_soft_forget(db, str(user_id))  # returns int
        return {"status": "ok", "suppressed": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"soft-forget failed: {e}")


@router.post("/admin/users/{user_id}/memory/consolidate")
def admin_consolidate_user(
    user_id: UUID,
    db: Session = Depends(deps.get_db),
    current_superuser: User = Depends(deps.get_current_active_superuser),
):
    """Consolidate user memories by consolidation_key. Admin-only."""
    try:
        res = memory_service.consolidate_user_memories(db, user_id=str(user_id))
        return {"status": "ok", **res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"consolidate failed: {e}")
