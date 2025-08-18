from typing import List, Optional, Literal, TypedDict, Any, Dict
from uuid import UUID, uuid4, UUID as _UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.crud.memory import memory as memory_crud
from app.models.user import User
from app.schemas.memory import MemoryNodeResponse, MemorySearchResult
from app.memory.service import memory_service
from app import crud
from app.services.summarization import generate_conversation_summary
from pydantic import BaseModel, Field

router = APIRouter()


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
                            payload.content,
                            (payload.content_type or "fact"),
                        ),
                    ),
                )
            )
    except Exception:
        imp_score = 0

    node = memory_crud.create_memory_node(
        db=db,
        faiss_id=str(uuid4()),
        content=payload.content,
        content_type=payload.content_type or "fact",
        user_id=str(current_user.id),
        conversation_id=str(payload.conversation_id) if payload.conversation_id else None,
        metadata=metadata,
        importance_score=imp_score,
    )
    return node


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

    if not settings.MEMORY_ENABLED:
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

            for r in results:
                try:
                    # Avoid echoing the user's current question back as a "memory"
                    try:
                        if r.content.strip() == last_user_input.strip():
                            continue
                    except Exception:
                        pass

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

                    # Safe timestamp formatting with fallback
                    try:
                        ts = r.timestamp.isoformat()  # type: ignore[attr-defined]
                    except Exception:
                        ts = (conversation.updated_at or conversation.created_at).isoformat()

                    # Build a short explanation for why this memory appeared
                    reason_parts: list[str] = []
                    reason_parts.append(f"score={r.relevance_score:.2f}")
                    try:
                        import json as _json

                        md = _json.loads(r.memory_metadata) if r.memory_metadata else {}
                    except Exception:
                        md = {}
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
                    type_counts[mapped_type] = type_counts.get(mapped_type, 0) + 1
                except Exception:
                    # Skip bad item but keep others
                    continue
            # Fallback: if retrieval returned nothing, include recent conversation memories directly
            if not results:
                try:
                    conv_mems = memory_crud.get_conversation_memories(
                        db, conversation_id=str(conversation_id), limit=10
                    )
                except Exception:
                    conv_mems = []
                import json as _json

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
                        if not norm or norm in seen_norm:
                            continue
                        seen_norm.add(norm)
                        context_items.append(
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
                            }
                        )
                    except Exception:
                        continue
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
        "llm": "together:meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
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
