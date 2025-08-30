from __future__ import annotations

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app import crud
from app.models.user import User
from app.memory.service import memory_service
from app.services.summarization import generate_conversation_summary

router = APIRouter()


def _parse_iso_date(d: Optional[str]) -> Optional[datetime]:
    if not d:
        return None
    try:
        # Accept YYYY-MM-DD or ISO8601
        if len(d) == 10:
            return datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        # Fallback: fromisoformat (may produce naive); coerce to UTC
        dt = datetime.fromisoformat(d.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def _in_window(ts: Optional[datetime], start: datetime, end: datetime) -> bool:
    if ts is None:
        return False
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    ts = ts.astimezone(timezone.utc)
    return start <= ts <= end


def _safe_int(v: Any, default: int = 0) -> int:
    try:
        return int(v)
    except Exception:
        return default


def _extract_metadata(node) -> Dict[str, Any]:
    import json

    md: Dict[str, Any] = {}
    try:
        if getattr(node, "memory_metadata", None):
            md = json.loads(node.memory_metadata)
    except Exception:
        md = {}
    return md if isinstance(md, dict) else {}


class WeeklyDigestResponseDict(Dict[str, Any]):
    pass


@router.get("/users/me/weekly-digest", response_model=None)
def get_weekly_digest(
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD or ISO)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD or ISO)"),
    limit_conversations: int = Query(3, ge=1, le=10, description="Max conversations to summarize"),
    limit_highlights: int = Query(6, ge=1, le=20, description="Max highlights to return"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> dict:
    """
    Build a Weekly Digest for the authenticated user.

    - Summarizes up to `limit_conversations` most-active conversations in the window.
    - Returns top memory highlights based on recency, reinforced_count, and rank_boost.
    - Does NOT persist by default.
    """
    now_utc = datetime.now(timezone.utc)
    start_dt = _parse_iso_date(start) or (now_utc - timedelta(days=7))
    end_dt = _parse_iso_date(end) or now_utc

    # 1) Pick conversations in window by activity (updated_at)
    conversations = crud.conversation.get_multi_by_user(
        db, user_id=str(current_user.id), skip=0, limit=50
    )
    conv_in_window: List[Any] = []
    for c in conversations:
        ts = getattr(c, "updated_at", None)
        if _in_window(ts, start_dt, end_dt):
            conv_in_window.append(c)

    # Sort by updated_at desc and take top N
    conv_in_window.sort(key=lambda x: getattr(x, "updated_at", datetime.min), reverse=True)
    conv_selected = conv_in_window[:limit_conversations]

    # 2) Summarize each selected conversation and concatenate (simple join with headers)
    summaries: List[str] = []
    for c in conv_selected:
        try:
            s = generate_conversation_summary(
                db,
                conversation_id=c.id,
                user_id=current_user.id,
                limit_messages=30,
            )
            if s:
                title = (getattr(c, "title", "Conversation") or "Conversation").strip()
                summaries.append(f"{title}:\n{s}")
        except Exception:
            continue
    summary_text = (
        "\n\n".join(summaries) if summaries else "(No recent conversation activity in this period)"
    )

    # 3) Build highlights from user memories
    user_mems = crud.memory.get_user_memories(
        db, user_id=str(current_user.id), content_type=None, limit=100
    )

    # Score = weighted combination: recency + reinforced_count + rank_boost
    def _score(node) -> float:
        md = _extract_metadata(node)
        reinforced = _safe_int(md.get("reinforced_count", 0))
        rank_boost = float(md.get("rank_boost", 0.0) or 0.0)
        dt = getattr(node, "timestamp", None)
        # Recency in days (smaller is better). Convert to score in [0..1]
        if dt is None:
            recency = 0.0
        else:
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            age_days = max(0.0, (now_utc - dt).total_seconds() / 86400.0)
            recency = max(0.0, 1.0 - min(age_days / 14.0, 1.0))  # 1.0 if today, ~0 after 14 days
        return recency * 0.4 + min(reinforced / 5.0, 1.0) * 0.3 + min(rank_boost, 1.0) * 0.3

    # Sort and take top highlights; exclude auto summaries to keep digest focused
    mem_sorted = sorted(
        [m for m in user_mems if _extract_metadata(m).get("source") != "auto_summary"],
        key=_score,
        reverse=True,
    )

    highlights: List[Dict[str, Any]] = []
    for m in mem_sorted[:limit_highlights]:
        md = _extract_metadata(m)
        highlights.append(
            {
                "title": (m.content or "").split("\n", 1)[0][:120],
                "detail": (m.content or "").strip()[:500],
                "faiss_id": getattr(m, "faiss_id", None),
                "rank_boost": md.get("rank_boost"),
            }
        )

    # 4) Stats
    # Count messages and new memories in window
    total_messages = 0
    for c in conv_in_window:
        try:
            msgs = crud.message.get_by_conversation(db, conversation_id=c.id, skip=0, limit=1000)
            for msg in msgs:
                ts = getattr(msg, "created_at", None)
                if _in_window(ts, start_dt, end_dt):
                    total_messages += 1
        except Exception:
            continue

    new_memories = 0
    reinforced_count = 0
    for m in user_mems:
        ts = getattr(m, "timestamp", None)
        if _in_window(ts, start_dt, end_dt):
            new_memories += 1
        md = _extract_metadata(m)
        reinforced_count += _safe_int(md.get("reinforced_count", 0))

    payload: Dict[str, Any] = {
        "period": {"start": start_dt.date().isoformat(), "end": end_dt.date().isoformat()},
        "summary": summary_text,
        "highlights": highlights,
        "stats": {
            "messages": total_messages,
            "new_memories": new_memories,
            "reinforced": reinforced_count,
        },
        "provenance": {
            "model": getattr(memory_service, "MODEL", None)
            or "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            "source": "weekly_digest",
            "user_id": str(current_user.id),
        },
    }
    return payload
