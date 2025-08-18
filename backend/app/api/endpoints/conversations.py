import logging
import asyncio
import anyio
from typing import List
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta
import json
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from fastapi.encoders import jsonable_encoder
import concurrent.futures as _f
import time as _t
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.schemas.conversation import (
    Conversation,
    ConversationCreate,
    ConversationUpdate,
    ConversationWithMessages,
    Message,
    MessageCreate,
    AssistantReply,
)
from app.core.config import settings
from app.memory import memory_enabled
from app.core.llm import generate_with_together, generate_with_together_stream
from app.db.session import SessionLocal
from app.memory.service import memory_service
from app.crud.calendar import calendar as crud_calendar
from app.schemas.calendar import CalendarEventCreate
from app.services.calendar_parser import parse_block, parse_line
from app.services.calendar_intent_extractor import extract_calendar_intent
from app.schemas.calendar_intent import CalendarIntent
import re

logger = logging.getLogger(__name__)
logger.info("Initializing conversations router...")

router = APIRouter()
logger.info("Created conversations router")

def _normalize_user_text(text: str) -> str:
    """Lightweight normalization for common benign typos.

    - "inlike" -> "i like"
    - "ilike" -> "i like"
    - collapse multiple spaces
    - trim
    """
    s = (text or "")
    if not s:
        return s
    t = s.strip()
    lo = t.lower()
    # Only apply if it's not a slash command
    if lo.startswith("/"):
        return t
    # Specific safe corrections
    lo = re.sub(r"\binlike\b", "i like", lo)
    lo = re.sub(r"\bilike\b", "i like", lo)
    # Collapse repeated spaces
    lo = re.sub(r"\s+", " ", lo).strip()
    return lo

def _maybe_capture_preference(db: Session, user: User, conversation_id: UUID, text: str):
    """Detect simple preference statements and store them.

    Returns (subject, is_pure):
      - subject: the extracted liked thing, or None
      - is_pure: True if the whole message is just the preference statement, False if it's embedded
    """
    try:
        s = (text or "").strip()
        if not s or s.startswith("/"):
            return None, False
        lo = s.lower()
        # Helper: sanitize subject by trimming at any subsequent 'i like/love/enjoy'
        def _clean_subject(subj: str) -> str:
            subj = subj.strip()
            # If another preference phrase appears inside, keep only the first clause
            parts = re.split(r"\bi\s+(?:like|love|enjoy)\b", subj)
            cleaned = parts[0].strip() if parts else subj
            # Remove trailing punctuation/spaces
            cleaned = re.sub(r"[\s\.;,!]+$", "", cleaned)
            return cleaned

        # If the message is just repeated preference lines for the same subject, treat as pure
        reps = re.findall(r"\bi\s+(?:like|love|enjoy)\s+([^\.;,!?\n]+)", lo)
        if reps:
            cleaned_subjects = [_clean_subject(x) for x in reps if _clean_subject(x)]
            if cleaned_subjects:
                uniq = set(cleaned_subjects)
                # Remove all preference clauses and check nothing else remains
                remainder = re.sub(r"\bi\s+(?:like|love|enjoy)\s+[^\.;,!?\n]+", " ", lo)
                if len(uniq) == 1 and remainder.strip() == "":
                    subject = list(uniq)[0]
                    if 2 <= len(subject) <= 80:
                        if memory_enabled():
                            memory_service.store_memory(
                                db=db,
                                content=f"I like {subject}",
                                content_type="preference",
                                user_id=str(user.id),
                                conversation_id=str(conversation_id),
                                metadata={"extracted": True, "source": "preprocessor"},
                            )
                        return subject, True

        # Full-message match counts as a pure preference
        m_full = re.fullmatch(r"i\s+(like|love|enjoy)\s+(.+)", lo)
        if m_full:
            subject = _clean_subject(m_full.group(2))
            if 2 <= len(subject) <= 80:
                if memory_enabled():
                    memory_service.store_memory(
                        db=db,
                        content=f"I like {subject}",
                        content_type="preference",
                        user_id=str(user.id),
                        conversation_id=str(conversation_id),
                        metadata={"extracted": True, "source": "preprocessor"},
                    )
                return subject, True
            return None, False
        # Otherwise, look for an embedded clause like "i like X, and ..."
        m = re.search(r"\bi\s+(like|love|enjoy)\s+([^\.;,!?\n]+)", lo)
        if not m:
            return None, False
        subject = _clean_subject(m.group(2))
        if len(subject) < 2 or len(subject) > 80:
            return None, False
        if memory_enabled():
            memory_service.store_memory(
                db=db,
                content=f"I like {subject}",
                content_type="preference",
                user_id=str(user.id),
                conversation_id=str(conversation_id),
                metadata={"extracted": True, "source": "preprocessor"},
            )
        return subject, False
    except Exception as e:
        logger.warning(f"Preference capture failed: {e}")
        return None, False


@router.get("/", response_model=List[Conversation])
async def list_conversations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    logger.info(f"List conversations endpoint called by user {current_user.id}")
    """
    Retrieve all conversations for the current user, ordered by most recently updated.
    """
    conversations = crud.conversation.get_multi_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return conversations


@router.post("/", response_model=Conversation, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_in: ConversationCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new conversation.
    """
    conversation = crud.conversation.create_with_owner(
        db=db, obj_in=conversation_in, owner_id=current_user.id
    )
    return conversation


def _handle_calendar_command(db: Session, user: User, text: str) -> str | None:
    """Return assistant text if this is a /calendar command; otherwise None.

    Supported:
    - /calendar add <free-form line>
    - /calendar bulk\n<lines>
    - /calendar list [today|tomorrow|next week]
    - /calendar delete <id|free-form>
    """
    s = text.strip()
    if not s.lower().startswith("/calendar"):
        return None

    # Split command and payload
    first_line, *rest = s.splitlines()
    parts = first_line.split()
    if len(parts) < 2:
        return (
            "Calendar commands:\n"
            "- /calendar add <date/time range> <title>\n"
            "- /calendar bulk\\n<one event per line>\n"
            "- /calendar list [today|tomorrow|next week]\n"
            "- /calendar delete <event-id or short description>\n"
        )

    sub = parts[1].lower()
    payload = first_line[len("/calendar") :].strip()
    payload = payload[len(sub) :].strip()

    if sub == "add":
        # Use single-line parser
        pe = parse_line(payload)
        if not pe:
            return "Sorry, I couldn't parse that event. Try: 2025-08-13 09:00-10:00 Standup"
        obj = CalendarEventCreate(
            title=pe.title,
            description=pe.description,
            start=pe.start,
            end=pe.end,
            all_day=pe.all_day,
        )
        ev = crud_calendar.create_for_user(db, user_id=user.id, obj_in=obj)
        return f"Added: {ev.title} @ {ev.start.isoformat()}" + (f" - {ev.end.isoformat()}" if ev.end else "")

    if sub in ("bulk", "hydrate"):
        block = "\n".join(rest)
        events = parse_block(block)
        if not events:
            return "No events recognized in bulk text. One per line, e.g. '2025-08-13 09:00-10:00 Standup'"
        created = []
        for pe in events:
            ev = crud_calendar.create_for_user(
                db,
                user_id=user.id,
                obj_in=CalendarEventCreate(
                    title=pe.title,
                    description=pe.description,
                    start=pe.start,
                    end=pe.end,
                    all_day=pe.all_day,
                ),
            )
            created.append(ev)
        return f"Bulk added {len(created)} event(s)."

    if sub == "list":
        # Determine range
        rng = payload.lower()
        start = None
        end = None
        now = datetime.now(timezone.utc)
        if "tomorrow" in rng:
            day = now + timedelta(days=1)
            start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
            end = start + timedelta(days=1)
        elif "next week" in rng:
            start = now + timedelta(days=7 - now.weekday())
            start = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
            end = start + timedelta(days=7)
        else:  # today or default
            start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
            end = start + timedelta(days=1)
        items = crud_calendar.get_user_events(db, user_id=str(user.id), start=start.isoformat(), end=end.isoformat())
        if not items:
            return "No events in range."
        lines = []
        for ev in items:
            when = ev.start.isoformat()
            if ev.end:
                when += f" - {ev.end.isoformat()}"
            lines.append(f"- {when} | {ev.title}")
        return "Events:\n" + "\n".join(lines)

    if sub == "delete":
        rest_text = payload.strip()
        # UUID?
        if re.fullmatch(r"[0-9a-fA-F-]{36}", rest_text):
            ok = crud_calendar.delete_for_user(db, user_id=user.id, event_id=rest_text)
            return "Deleted." if ok else "Event not found."
        # Otherwise try parse a line and match by date+title substring in that day
        pe = parse_line(rest_text)
        if not pe or not pe.start:
            return "Provide an event id or a date/title I can parse."
        # Day range
        day_start = datetime(pe.start.year, pe.start.month, pe.start.day, tzinfo=pe.start.tzinfo)
        day_end = day_start + timedelta(days=1)
        items = crud_calendar.get_user_events(db, user_id=str(user.id), start=day_start.isoformat(), end=day_end.isoformat())
        # title contains match
        for ev in items:
            if pe.title.lower() in (ev.title or "").lower():
                ok = crud_calendar.delete_for_user(db, user_id=user.id, event_id=ev.id)
                return "Deleted." if ok else "Event not found."
        return "No matching event on that day."

    return "Unknown /calendar subcommand."


def _handle_calendar_nl(db: Session, user: User, text: str) -> str | None:
    """Very small NL intent handler for calendar when users don't use /calendar.

    Current heuristic support (focused on the reported user phrasing):
    - "wake up at 6:00 AM every day for the next week"
      -> creates 7 short events (5 minutes) starting next Monday if phrase contains "next week",
         otherwise next 7 days starting tomorrow.

    Returns assistant confirmation text if handled; otherwise None.
    """
    try:
        s = (text or "").strip().lower()
        if not s or s.startswith("/" ):
            return None

        # Only proceed if it looks like a scheduling intent
        looks_like_calendar = any(k in s for k in ["calendar", "schedule", "add to calendar", "put on calendar", "wake"])
        if not looks_like_calendar:
            return None

        # Detect a simple "wake up" recurring pattern the user asked for
        is_wake = "wake" in s
        has_every_day = ("every day" in s) or ("everyday" in s)
        has_next_week = "next week" in s or "for the next week" in s
        weekdays_only = (
            "monday to friday" in s
            or "mon to fri" in s
            or "mon-fri" in s
            or "weekdays" in s
        )
        weekdays_mon_sat = (
            "monday to saturday" in s
            or "mon to sat" in s
            or "mon-sat" in s
        )

        # Prepare timezone anchors
        from dateutil.tz import tzlocal
        local_tz = tzlocal()
        now = datetime.now(local_tz)

        # Extract a time like 6am, 6:00 am, 06:00, 11 30, 11.30, etc.
        tmatch = re.search(r"\b(\d{1,2})(?:[:.\s](\d{2}))?\s*(am|pm)?\b", s)
        # Also support ranges like "8 to 9 am" / "8-9 am" / "8:00-9:00"
        range_match = re.search(r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|\-|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", s)
        hour = 6
        minute = 0
        duration_minutes = 30
        if range_match:
            sh = int(range_match.group(1)); sm = int(range_match.group(2) or 0); sap = (range_match.group(3) or '').lower()
            eh = int(range_match.group(4)); em = int(range_match.group(5) or 0); eap = (range_match.group(6) or '').lower()
            if sap == 'pm' and sh < 12: sh += 12
            if sap == 'am' and sh == 12: sh = 0
            if eap == 'pm' and eh < 12: eh += 12
            if eap == 'am' and eh == 12: eh = 0
            hour = sh; minute = sm
            # compute duration in minutes
            duration_minutes = max(5, (eh * 60 + em) - (sh * 60 + sm))
        elif tmatch:
            hour = int(tmatch.group(1))
            minute = int(tmatch.group(2) or 0)
            ampm = (tmatch.group(3) or '').lower()
            if ampm == 'pm' and hour < 12:
                hour += 12
            if ampm == 'am' and hour == 12:
                hour = 0

        # Determine starting day for scheduling window
        if has_next_week:
            # Next Monday (ISO weekday: Monday = 1)
            days_ahead = (7 - now.isoweekday() + 1) % 7
            days_ahead = 7 if days_ahead == 0 else days_ahead
            start_day = now + timedelta(days=days_ahead)
        else:
            # Next 7 days starting tomorrow
            start_day = now + timedelta(days=1)

        # Try to infer a title if not wake
        inferred_title = None
        try:
            m = re.search(r"\bschedule\s+([^\d\n]+?)\s+(?:at|from|for|on|\d)", text, re.IGNORECASE)
            if m:
                inferred_title = m.group(1).strip().strip('.').strip()
        except Exception:
            inferred_title = None
        title = "Wake up" if is_wake else (inferred_title or "Scheduled item")
        duration_minutes = 5 if is_wake else duration_minutes

        # If user asked to remove/delete, attempt deletion for the inferred window (word-boundary match)
        # Avoid false positives when the user is asking to schedule/add.
        wants_delete = bool(re.search(r"\b(delete|remove|clear|reset)\b", s)) and not bool(re.search(r"\b(schedule|add|create|put)\b", s))
        wants_delete_all = bool(re.search(r"\b(delete\s+everything|delete\s+all\s+events|clear\s+calendar|wipe\s+calendar|reset\s+(my\s+)?calendar)\b", s))
        if (wants_delete_all or (wants_delete and not bool(re.search(r"\b(schedule|add|create|put)\b", s)))):
            deleted = 0
            if wants_delete_all:
                # Broad window: past year to next year
                # local_tz and now already initialized above
                start_default = now - timedelta(days=365)
                end_default = now + timedelta(days=365)
                cur = datetime(start_default.year, start_default.month, start_default.day, tzinfo=local_tz)
                end = datetime(end_default.year, end_default.month, end_default.day, tzinfo=local_tz)
                while cur <= end:
                    day_start_local = datetime(cur.year, cur.month, cur.day, 0, 0, tzinfo=local_tz)
                    day_end_local = day_start_local + timedelta(days=1)
                    day_start = day_start_local.astimezone(timezone.utc)
                    day_end = day_end_local.astimezone(timezone.utc)
                    items = crud_calendar.get_user_events(
                        db,
                        user_id=str(user.id),
                        start=day_start.isoformat(),
                        end=day_end.isoformat(),
                    )
                    for ev in items:
                        if crud_calendar.delete_for_user(db, user_id=user.id, event_id=ev.id):
                            deleted += 1
                    cur = cur + timedelta(days=1)
                return f"Deleted {deleted} event(s)." if deleted else "No events found to delete."
            else:
                day_indices = list(range(5)) if weekdays_only else (list(range(6)) if has_next_week and weekdays_mon_sat else list(range(7)))
                for i in day_indices:
                    d = start_day + timedelta(days=i)
                    # Day window in UTC for query
                    day_start_local = datetime(d.year, d.month, d.day, 0, 0, tzinfo=local_tz)
                    day_end_local = day_start_local + timedelta(days=1)
                    day_start = day_start_local.astimezone(timezone.utc)
                    day_end = day_end_local.astimezone(timezone.utc)
                    items = crud_calendar.get_user_events(
                        db,
                        user_id=str(user.id),
                        start=day_start.isoformat(),
                        end=day_end.isoformat(),
                    )
                    for ev in items:
                        if is_wake:
                            if (ev.title or '').lower().startswith('wake'):
                                if crud_calendar.delete_for_user(db, user_id=user.id, event_id=ev.id):
                                    deleted += 1
                        else:
                            if title.lower() in (ev.title or "").lower():
                                if crud_calendar.delete_for_user(db, user_id=user.id, event_id=ev.id):
                                    deleted += 1
                return f"Deleted {deleted} Wake up event(s)." if deleted else "No matching Wake up events found to delete."

        if has_every_day or has_next_week or is_wake or weekdays_only or weekdays_mon_sat:
            day_indices = (
                list(range(5)) if (weekdays_only and has_next_week) else (
                    list(range(6)) if (weekdays_mon_sat and has_next_week) else list(range(7))
                )
            )
            for i in day_indices:
                d = start_day + timedelta(days=i)
                # Interpret requested time in local timezone first
                start_dt_local = datetime(d.year, d.month, d.day, hour, minute, tzinfo=local_tz)
                end_dt_local = start_dt_local + timedelta(minutes=duration_minutes)
                # Store in UTC for consistency across APIs
                start_dt = start_dt_local.astimezone(timezone.utc)
                end_dt = end_dt_local.astimezone(timezone.utc)
                ev = crud_calendar.create_for_user(
                    db,
                    user_id=user.id,
                    obj_in=CalendarEventCreate(
                        title=title,
                        start=start_dt,
                        end=end_dt,
                        all_day=False,
                    ),
                )
                events.append(ev)
            if weekdays_only and has_next_week:
                span_txt = "5 weekday(s)"
            elif weekdays_mon_sat and has_next_week:
                span_txt = "6 day(s) (Mon–Sat)"
            else:
                span_txt = "7 day(s)"
            return f"Scheduled {title} at {hour:02d}:{minute:02d} for {span_txt}."

        return None
    except Exception as e:
        logger.warning(f"Calendar NL handler failed: {e}")
        return None


def _handle_calendar_llm(db: Session, user: User, text: str) -> str | None:
    """Use LLM extractor to parse calendar intent and persist accordingly.

    Returns assistant text if intent is valid and applied; otherwise None to fall back.
    """
    try:
        if not settings.CALENDAR_NL_LLM_ENABLED:
            return None
        s = (text or "").strip()
        if not s or s.startswith("/"):
            return None
        intent = extract_calendar_intent(s)
        if not intent:
            return None

        # Resolve time
        from dateutil.tz import tzlocal
        local_tz = tzlocal()
        hour = None
        minute = None
        if intent.time:
            try:
                hh, mm = intent.time.split(":")
                hour = int(hh)
                minute = int(mm)
            except Exception:
                hour = None
                minute = None

        title_raw = (intent.title or "").strip()
        title = title_raw or "Scheduled item"
        duration_minutes = (
            intent.duration_minutes if isinstance(intent.duration_minutes, int) and intent.duration_minutes > 0 else (5 if "wake" in title.lower() else 30)
        )

        # Determine window start list of dates
        now_local = datetime.now(local_tz)
        dates: list[datetime] = []
        rec = intent.recurrence.type if intent.recurrence else "none"
        count = intent.recurrence.count if (intent.recurrence and isinstance(intent.recurrence.count, int)) else None

        if intent.window and intent.window.mode == "next_week":
            # Next Monday start
            iso = now_local.isoweekday()  # 1..7
            days_ahead = (7 - iso + 1) % 7
            days_ahead = 7 if days_ahead == 0 else days_ahead
            start_day = now_local + timedelta(days=days_ahead)
            if rec == "weekdays":
                for i in range(5):
                    dates.append(start_day + timedelta(days=i))
            else:
                span = count if (count and count > 0) else 7
                for i in range(span):
                    dates.append(start_day + timedelta(days=i))
        elif intent.window and intent.window.mode == "next_7_days":
            start_day = now_local + timedelta(days=1)
            span = count if (count and count > 0) else 7
            for i in range(span):
                dates.append(start_day + timedelta(days=i))
        elif intent.window and intent.window.mode == "date_range" and intent.window.start_date and intent.window.end_date:
            try:
                y1, m1, d1 = [int(x) for x in intent.window.start_date.split("-")]
                y2, m2, d2 = [int(x) for x in intent.window.end_date.split("-")]
                cur = datetime(y1, m1, d1, tzinfo=local_tz)
                end = datetime(y2, m2, d2, tzinfo=local_tz)
                while cur <= end:
                    dates.append(cur)
                    cur = cur + timedelta(days=1)
            except Exception:
                return None
        else:
            # If no window provided:
            # - For create: cannot proceed without a concrete window; require date logic elsewhere
            # - For delete/list: use a broad default window to cover existing events
            if intent.action == "create":
                return None
            # Default wide window: past 365 days to next 365 days
            start_default = now_local - timedelta(days=365)
            end_default = now_local + timedelta(days=365)
            cur = datetime(start_default.year, start_default.month, start_default.day, tzinfo=local_tz)
            end = datetime(end_default.year, end_default.month, end_default.day, tzinfo=local_tz)
            while cur <= end:
                dates.append(cur)
                cur = cur + timedelta(days=1)

        # Actions
        if intent.action == "create":
            if hour is None or minute is None:
                return None
            created = 0
            for d in dates:
                # If weekdays recurrence requested, skip weekends
                if rec == "weekdays" and d.isoweekday() > 5:
                    continue
                start_local = datetime(d.year, d.month, d.day, hour, minute, tzinfo=local_tz)
                end_local = start_local + timedelta(minutes=duration_minutes)
                start_utc = start_local.astimezone(timezone.utc)
                end_utc = end_local.astimezone(timezone.utc)
                crud_calendar.create_for_user(
                    db,
                    user_id=user.id,
                    obj_in=CalendarEventCreate(title=title, start=start_utc, end=end_utc, all_day=False),
                )
                created += 1
            return f"Scheduled {title} at {hour:02d}:{minute:02d} for {created} event(s)."

        if intent.action == "delete":
            deleted = 0
            delete_all_titles = (not title_raw) or (title_raw.lower() in {"everything", "all", "*"})
            for d in dates:
                day_start_local = datetime(d.year, d.month, d.day, 0, 0, tzinfo=local_tz)
                day_end_local = day_start_local + timedelta(days=1)
                day_start = day_start_local.astimezone(timezone.utc)
                day_end = day_end_local.astimezone(timezone.utc)
                items = crud_calendar.get_user_events(
                    db,
                    user_id=str(user.id),
                    start=day_start.isoformat(),
                    end=day_end.isoformat(),
                )
                for ev in items:
                    if delete_all_titles or (title.lower() in (ev.title or "").lower()):
                        if crud_calendar.delete_for_user(db, user_id=user.id, event_id=ev.id):
                            deleted += 1
            if delete_all_titles:
                return f"Deleted {deleted} event(s)." if deleted else "No events found to delete."
            else:
                return f"Deleted {deleted} {title} event(s)." if deleted else f"No matching {title} events found to delete."

        if intent.action == "list":
            # Keep it simple: suggest slash list for now
            return "You can list with /calendar list [today|tomorrow|next week]."

        return None
    except Exception as e:
        logger.warning(f"Calendar LLM handler failed: {e}")
        return None


def _suggest_actions_for(text: str) -> list[dict]:
    """Very small heuristic to produce action suggestions from a user utterance.

    Returns a list of action suggestion dicts like:
      {"action":"journal.add_entry","label":"Save to journal","params":{...}}

    Frontend will render and ask for confirmation per risk tier.
    """
    try:
        s = (text or "").strip()
        if not s or s.startswith("/"):
            return []
        lo = s.lower()
        suggestions: list[dict] = []

        # Journal capture
        if any(k in lo for k in ["journal", "diary", "note to self", "write this down", "remember this"]):
            suggestions.append(
                {
                    "action": "journal.add_entry",
                    "label": "Save to journal",
                    "params": {"text": s},
                }
            )

        # Nutrition logging
        if any(k in lo for k in ["log meal", "ate", "calories", "meal:", "breakfast", "lunch", "dinner", "snack"]):
            suggestions.append(
                {
                    "action": "nutrition.log_meal",
                    "label": "Log meal",
                    "params": {"description": s, "when": "now"},
                }
            )

        # Fitness/workout
        if any(k in lo for k in ["workout", "gym", "exercise", "run", "lift", "yoga"]):
            # Attempt a tiny name inference
            inferred = "Workout"
            m = re.search(r"(workout|gym|exercise|run|lift|yoga)\s*(?:-\s*)?([\w\s]+)?", lo)
            if m and m.group(2):
                name = m.group(2).strip().strip(".-")
                if 2 <= len(name) <= 40:
                    inferred = name.title()
            suggestions.append(
                {
                    "action": "fitness.add_workout",
                    "label": "Add workout",
                    "params": {"name": inferred, "when": "today"},
                }
            )

        # Weekly review
        if any(k in lo for k in ["weekly review", "reflect on the week", "summarize my week", "week in review"]):
            suggestions.append(
                {
                    "action": "review.weekly_generate",
                    "label": "Generate weekly review",
                    "params": {},
                }
            )

        return suggestions[:3]
    except Exception:
        return []

@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get a specific conversation with all its messages.
    """
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return conversation


@router.put("/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: UUID,
    conversation_in: ConversationUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update conversation fields (e.g., title).
    """
    # Ensure the conversation exists and belongs to the user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    updated = crud.conversation.update(db, db_obj=conversation, obj_in=conversation_in)
    return updated


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Delete a conversation owned by the current user.
    """
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    crud.conversation.remove(db, id=str(conversation_id))
    return None


@router.get("/{conversation_id}/messages", response_model=List[Message])
async def list_messages(
    conversation_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get all messages for a specific conversation.
    """
    # Verify conversation exists and belongs to user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    messages = crud.message.get_by_conversation(
        db, conversation_id=conversation_id, skip=skip, limit=limit
    )
    return messages


@router.post(
    "/{conversation_id}/messages",
    response_model=Message,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    conversation_id: UUID,
    message_in: MessageCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new message in a conversation.
    """
    # Verify conversation exists and belongs to user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    # Intercept calendar commands (non-streamed path)
    cal_resp = _handle_calendar_command(db, current_user, message_in.content)
    if cal_resp is not None:
        # Persist assistant message immediately and return
        assistant = crud.message.create_with_conversation(
            db=db, obj_in=MessageCreate(role="assistant", content=cal_resp), conversation_id=conversation_id
        )
        return assistant
    # Lightweight normalization and preference capture (after calendar handling)
    norm_note = ""
    try:
        normalized = _normalize_user_text(message_in.content or "")
        if normalized != (message_in.content or ""):
            norm_note = f"(Note: normalize user's last message as: '{normalized}')\n"
        _maybe_capture_preference(db, current_user, conversation_id, normalized)
    except Exception as e:
        logger.debug(f"Normalization/preference step skipped: {e}")

    # Create the message
    message = crud.message.create_with_conversation(
        db=db, obj_in=message_in, conversation_id=conversation_id
    )

    # Auto-title conversation on first user message if title is default/empty
    try:
        if message.role == "user":
            current_title = (conversation.title or "").strip()
            is_default_title = current_title in ("", "New Conversation")
            # Check if this is the first message in the conversation (after creation)
            prior_msgs = crud.message.get_by_conversation(
                db, conversation_id=conversation_id, skip=0, limit=2
            )
            is_first_message = len(prior_msgs) == 1  # only this newly created message exists
            if is_default_title and is_first_message:
                proposed = (message.content or "").strip().split("\n", 1)[0][:80]
                if proposed:
                    from app.schemas.conversation import ConversationUpdate

                    updated = crud.conversation.update(
                        db=db, db_obj=conversation, obj_in=ConversationUpdate(title=proposed)
                    )
                    conversation = updated
    except Exception as e:
        logger.warning(f"Failed to auto-title conversation: {e}")
    # Store message in memory system if enabled
    try:
        if memory_enabled():
            memory_service.store_memory(
                db=db,
                content=message.content,
                content_type="message",
                user_id=str(current_user.id),
                conversation_id=str(conversation_id),
                metadata={
                    "message_id": str(message.id),
                    "role": message.role,
                    "remember": bool(getattr(message_in, "remember", False) is True),
                },
            )
    except Exception as e:
        logger.warning(f"Failed to store message in memory: {e}")
        # Do not fail the request if memory operations fail

    return message


@router.post("/{conversation_id}/reply", response_model=AssistantReply)
async def reply(
    conversation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    mode: str = "default",
    debug: bool = False,
):
    """
    Generate an assistant reply using Together AI.
    - Retrieves top-k memories from FAISS if enabled; otherwise falls back to recent messages.
    - Builds a personalized system prompt based on user's onboarding profile.
    - Always includes user profile context for personalized responses.
    """
    # Validate conversation and permissions
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Fast mode knobs
    fast = mode == "fast"
    recent_limit = 10 if not fast else 3
    retrieval_recent = settings.RETRIEVAL_RECENT_MESSAGES if not fast else 2
    retrieval_top_k = settings.RETRIEVAL_TOP_K if not fast else 1
    llm_max_tokens = 1024 if not fast else 128
    # Fetch recent messages for context and to build a query
    _t0 = _t.perf_counter()
    recent_msgs = crud.message.get_by_conversation(
        db, conversation_id=conversation_id, skip=0, limit=recent_limit
    )
    _t1 = _t.perf_counter()
    logger.info(
        "reply.step recent_messages_ms=%.2f count=%d",
        (_t1 - _t0) * 1000.0,
        len(recent_msgs),
    )
    user_texts = [m.content for m in recent_msgs if m.role == "user"]
    last_user_input = user_texts[-1] if user_texts else ""
    # Initialize provenance early so it's available for early-return branches
    provenance = []  # type: ignore[var-annotated]
    # Intercept calendar slash-commands in non-streaming reply: persist and return immediately
    cal_resp = _handle_calendar_command(db, current_user, last_user_input)
    if cal_resp is not None:
        assistant = crud.message.create_with_conversation(
            db=db,
            obj_in=MessageCreate(role="assistant", content=cal_resp),
            conversation_id=conversation_id,
        )
        # Store assistant message in memory if enabled (best-effort)
        try:
            if memory_enabled():
                memory_service.store_memory(
                    db=db,
                    content=cal_resp,
                    content_type="message",
                    user_id=str(current_user.id),
                    conversation_id=str(conversation_id),
                    metadata={"message_id": str(assistant.id), "role": "assistant"},
                )
        except Exception as e:
            logger.warning(f"Failed to store calendar assistant message in memory: {e}")
        return AssistantReply(id=assistant.id, message=assistant, provenance=provenance)
    # Intercept LLM-based NL calendar intents
    llm_resp = _handle_calendar_llm(db, current_user, last_user_input)
    if llm_resp is not None:
        assistant = crud.message.create_with_conversation(
            db=db,
            obj_in=MessageCreate(role="assistant", content=llm_resp),
            conversation_id=conversation_id,
        )
        try:
            if memory_enabled():
                memory_service.store_memory(
                    db=db,
                    content=llm_resp,
                    content_type="message",
                    user_id=str(current_user.id),
                    conversation_id=str(conversation_id),
                    metadata={"message_id": str(assistant.id), "role": "assistant", "source": "calendar_llm"},
                )
        except Exception as e:
            logger.warning(f"Failed to store LLM calendar assistant message in memory: {e}")
        return AssistantReply(id=assistant.id, message=assistant, provenance=provenance)

    # Intercept simple natural-language calendar intents (heuristic)
    nl_resp = _handle_calendar_nl(db, current_user, last_user_input)
    if nl_resp is not None:
        assistant = crud.message.create_with_conversation(
            db=db,
            obj_in=MessageCreate(role="assistant", content=nl_resp),
            conversation_id=conversation_id,
        )
        try:
            if memory_enabled():
                memory_service.store_memory(
                    db=db,
                    content=nl_resp,
                    content_type="message",
                    user_id=str(current_user.id),
                    conversation_id=str(conversation_id),
                    metadata={"message_id": str(assistant.id), "role": "assistant"},
                )
        except Exception as e:
            logger.warning(f"Failed to store NL calendar assistant message in memory: {e}")
        return AssistantReply(id=assistant.id, message=assistant, provenance=provenance)
    # Lightweight normalization and preference capture (after calendar handling)
    norm_note = ""
    try:
        normalized = _normalize_user_text(last_user_input)
        if normalized != last_user_input:
            norm_note = f"(Note: normalize user's last message as: '{normalized}')\n"
        _maybe_capture_preference(db, current_user, conversation_id, normalized)
        # Use normalized input for specificity gating below
        last_user_input = normalized
    except Exception as e:
        logger.debug(f"Normalization/preference step skipped: {e}")
    # Find a prior meaningful user message to maintain continuity when the latest input is vague
    prior_meaningful = ""
    if len(user_texts) >= 2:
        for txt in reversed(user_texts[:-1]):
            if txt and len(txt.strip()) >= 20:
                prior_meaningful = txt.strip()[:160]
                break

    # Get personalized system prompt and context from memory service if enabled
    system_prompt = ""
    context = ""

    # Personalization toggle: if disabled on the conversation, skip memory/profile context entirely
    personalization_on = getattr(conversation, "personalization_enabled", True)

    # Lightweight relevance gating: skip memory context for very short/generic inputs
    def _seems_specific(text: str) -> bool:
        t = (text or "").strip().lower()
        if len(t) >= 32:
            return True
        keywords = [
            "file",
            "document",
            "upload",
            "image",
            "photo",
            "resume",
            "cv",
            "project",
            "code",
            "plan",
            "notes",
            "profile",
            "memory",
        ]
        return any(k in t for k in keywords)

    # Detect meta-questions about user's profile or stored knowledge
    lu = (last_user_input or "").strip().lower()
    asks_about_user = (
        ("what do you know" in lu and ("about me" in lu or "about my" in lu or "about us" in lu))
        or ("what do you remember" in lu and ("about me" in lu or "about us" in lu))
        or ("what do you have" in lu and "on me" in lu)
        or ("my profile" in lu and ("what" in lu or "tell me" in lu))
        or ("tell me about myself" in lu)
        or ("tell me about me" in lu)
        or ("about myself" in lu and ("tell" in lu or "what" in lu or "who" in lu or "describe" in lu or "summarize" in lu))
        or ("describe me" in lu)
        or ("summarize me" in lu)
        or ("who am i" in lu and "to you" in lu)
    )
    mem_ms = 0.0
    allow_memory_context = (
        memory_enabled()
        and personalization_on
        and not fast
        and (_seems_specific(last_user_input) or asks_about_user)
    )
    # provenance already initialized above
    include_debug = bool(debug and getattr(settings, "DEBUG_RETRIEVAL_ENABLED", True))
    if allow_memory_context:
        try:
            _tm0 = _t.perf_counter()
            # Build personalized system prompt based on user's onboarding profile
            system_prompt = memory_service.build_personalized_system_prompt(
                db=db, user_id=str(current_user.id)
            )
            if norm_note:
                system_prompt += "\n" + norm_note
            # Guardrails: answer-first, minimal chit-chat, use memory only if relevant
            system_prompt += (
                "\n\nBehavior:\n"
                "- Answer the user's latest message directly and concisely.\n"
                "- Follow the topic of the latest user message; if it differs from earlier topics, "
                "pivot to the latest and ignore earlier topics unless the user explicitly asks to "
                "continue.\n"
                "- Do not greet or engage in small talk unless the user initiates it (e.g., avoid "
                "asking about their day).\n"
                "- Strictly avoid mentioning past files, uploads, or memory unless the latest user "
                "message explicitly includes terms like: file, document, upload, image, photo, "
                "memory.\n"
                "- Do not disclose that you are using memory or files unless the user asks.\n"
                "- If any prior assistant message conflicts with the latest user request/topic, "
                "ignore the prior assistant message.\n"
                "- Do not comment on typos or earlier misspellings unless the latest message asks about writing quality or contains that typo; never bring up older typos.\n"
            )
            system_prompt += (
                "\n\nBehavior (continued):\n"
                "- If any prior assistant message conflicts with the latest user request/topic, "
                "ignore the prior assistant message.\n"
            )
            if asks_about_user:
                system_prompt += (
                    "\nWhen the user asks what you know or remember about them:\n"
                    "- Summarize only high-level, non-sensitive details as a few short bullets.\n"
                    "- Do NOT quote or reproduce onboarding/profile text verbatim.\n"
                    "- If details might be sensitive or specific (e.g., addresses, numbers, full quotes), ask the user if they'd like those included before sharing.\n"
                    "- Use only what's in Context; if nothing is available, say you don't have any saved information yet.\n"
                )

            # Get conversation context including profile memory
            context = memory_service.get_conversation_context(
                db=db,
                user_id=str(current_user.id),
                conversation_id=str(conversation_id),
                recent_messages=retrieval_recent,
                memory_limit=retrieval_top_k,
                self_referential=bool(asks_about_user),
            )
            _tm1 = _t.perf_counter()
            mem_ms = (_tm1 - _tm0) * 1000.0
            logger.info(
                "reply.step memory_context_ms=%.2f recent_limit=%d top_k=%d",
                mem_ms,
                settings.RETRIEVAL_RECENT_MESSAGES,
                settings.RETRIEVAL_TOP_K,
            )
            # Compute provenance via direct search (mirrors memory selection)
            try:
                provenance = memory_service.search_memories(
                    db=db,
                    query=last_user_input or "",
                    user_id=str(current_user.id),
                    content_types=None,
                    limit=retrieval_top_k,
                    debug=include_debug,
                ) or []
            except Exception as pe:
                logger.debug(f"Provenance search failed: {pe}")
        except Exception as e:
            logger.warning(f"Failed to retrieve memory context: {e}")
            # Fallback to basic system prompt
            system_prompt = (
                "You are a helpful, attentive AI companion. "
                "Be concise, friendly, and context-aware.\n\n"
                "Behavior:\n"
                "- Answer the user's latest message directly and concisely.\n"
                "- Follow the topic of the latest user message; if it differs from earlier topics, "
                "pivot to the latest and ignore earlier topics unless the user explicitly asks to "
                "continue.\n"
                "- Do not greet or engage in small talk unless the user initiates it (e.g., avoid "
                "asking about their day).\n"
                "- Strictly avoid mentioning past files, uploads, or memory unless the latest user "
                "message explicitly includes terms like: file, document, upload, image, photo, "
                "memory.\n"
                "- Do not disclose that you are using memory or files unless the user asks.\n"
                "- If any prior assistant message conflicts with the latest user request/topic, "
                "ignore the prior assistant message.\n"
                "- Do not comment on typos or earlier misspellings unless the latest message asks about writing quality or contains that typo; never bring up older typos.\n"
            )
            context = ""
    else:
        # Fallback when memory is disabled
        system_prompt = (
            "You are a helpful, attentive AI companion. "
            "Be concise, friendly, and context-aware.\n\n"
            "Behavior:\n"
            "- Answer the user's latest message directly and concisely.\n"
            "- Follow the topic of the latest user message; if it differs from earlier topics, "
            "pivot to the latest and ignore earlier topics unless the user explicitly asks to "
            "continue.\n"
            "- Do not greet or engage in small talk unless the user initiates it (e.g., avoid "
            "asking about their day).\n"
            "- Strictly avoid mentioning past files, uploads, or memory unless the latest user "
            "message explicitly includes terms like: file, document, upload, image, photo, "
            "memory.\n"
            "- Do not disclose that you are using memory or files unless the user asks.\n"
            "- If any prior assistant message conflicts with the latest user request/topic, "
            "ignore the prior assistant message.\n"
            "- Do not comment on typos or earlier misspellings unless the latest message asks about writing quality or contains that typo; never bring up older typos.\n"
        )
        context = ""

    # Add context to system prompt if available
    if context:
        system_prompt += f"\n\nContext:\n{context}"
    # Continuity hint: if latest is vague but a recent meaningful user message exists, keep thread
    if prior_meaningful and len((last_user_input or "").strip()) < 12:
        system_prompt += (
            "\n\nConversation continuity:\n"
            f"- The user recently discussed: '{prior_meaningful}'.\n"
            "- If the latest message is vague, assume it relates to the above and ask a concise "
            "clarifying question or provide the next helpful step on that topic."
        )
    # Anchor model on the exact latest user input
    # Style nudge if preference was detected but message wasn't purely a preference
    pref_subject, pref_pure = _maybe_capture_preference(db, current_user, conversation_id, last_user_input)
    if pref_subject and not pref_pure:
        system_prompt += (
            "\n\nPreference handling:\n"
            "- If the latest message includes a simple preference (e.g., 'I like X'), briefly acknowledge it in one short sentence.\n"
            "- Do not probe for more unless the user explicitly asks."
        )
    if last_user_input:
        system_prompt += (
            "\n\nFocus (latest user message):\n"
            f"""{last_user_input.strip()}\n"""
            "Respond only to the latest user message above, unless the user explicitly asks to "
            "continue an earlier topic."
        )
    if fast:
        system_prompt = (
            system_prompt or ""
        ) + "\n\nReply in 1–2 concise sentences. If user asks to expand, elaborate then."

    chat_messages = [
        {"role": m.role, "content": m.content} for m in recent_msgs[-(6 if not fast else 2) :]
    ]
    # If the latest user input is specific enough, reduce history to minimize drift toward older topics
    if len((last_user_input or "").strip()) >= 24:
        # Keep only the last assistant turn (if any) and the last user message
        trimmed: list[dict] = []
        # Find the last assistant before the last user in recent order
        last_assistant_idx = None
        for i in range(len(recent_msgs) - 2, -1, -1):
            if recent_msgs[i].role == "assistant":
                last_assistant_idx = i
                break
        if last_assistant_idx is not None:
            trimmed.append({"role": recent_msgs[last_assistant_idx].role, "content": recent_msgs[last_assistant_idx].content})
        if recent_msgs:
            trimmed.append({"role": recent_msgs[-1].role, "content": recent_msgs[-1].content})
        chat_messages = trimmed
    # Select model via settings with fallbacks
    default_model = (
        getattr(settings, "LLM_MODEL_DEFAULT", None)
        or "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    ).strip()
    fast_model = (getattr(settings, "LLM_MODEL_FAST", None) or default_model).strip()
    model = fast_model if fast else default_model
    # Monitoring: measure Together API latency and log sizes
    try:
        _ts = _t.perf_counter()
        content = generate_with_together(
            model=model,
            system_prompt=system_prompt,
            messages=chat_messages,
            max_tokens=llm_max_tokens,
        )
        _te = _t.perf_counter()
        logger.info(
            "Together call success | model=%s | latency_ms=%.2f | "
            "sys_len=%d | msgs=%d | last_user_len=%d",
            model,
            (_te - _ts) * 1000.0,
            len(system_prompt or ""),
            len(chat_messages),
            len(last_user_input or ""),
        )
    except Exception as e:
        logger.error(
            "Together call failed | model=%s | sys_len=%d | msgs=%d | error=%s",
            model,
            len(system_prompt or ""),
            len(chat_messages),
            str(e),
        )
        # Re-raise to surface standardized error handling upstream if any
        raise

    # Sanitize empty or provider-stub content to avoid empty bubbles
    safe_content = (content or "").strip()
    low = safe_content.lower()
    if not safe_content or low.startswith("(stub)") or "no content returned by provider" in low:
        safe_content = (
            "Sorry — I couldn't generate a response just now. "
            "Please try again."
        )
    # Persist assistant message
    _tp0 = _t.perf_counter()
    assistant = crud.message.create_with_conversation(
        db=db,
        obj_in=MessageCreate(role="assistant", content=safe_content),
        conversation_id=conversation_id,
    )
    _tp1 = _t.perf_counter()
    logger.info("reply.step persist_ms=%.2f", (_tp1 - _tp0) * 1000.0)

    # Store assistant message in memory system if enabled
    try:
        if memory_enabled():
            memory_service.store_memory(
                db=db,
                content=safe_content,
                content_type="message",
                user_id=str(current_user.id),
                conversation_id=str(conversation_id),
                metadata={"message_id": str(assistant.id), "role": "assistant"},
            )
    except Exception as e:
        logger.warning(f"Failed to store assistant message in memory: {e}")
        # Do not fail the request if memory operations fail

    _tend = _t.perf_counter()
    total_ms = (_tend - _t0) * 1000.0
    logger.info(
        "reply.total_ms=%.2f recent_ms=%.2f memory_ms=%.2f persist_ms=%.2f",
        total_ms,
        (_t1 - _t0) * 1000.0,
        mem_ms,
        (_tp1 - _tp0) * 1000.0,
    )
    return AssistantReply(id=assistant.id, message=assistant, provenance=provenance)


@router.post("/{conversation_id}/reply/stream")
async def reply_stream(
    conversation_id: UUID,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    mode: str = "default",
    debug: bool = False,
):
    """
    Stream an assistant reply using Server-Sent Events (SSE).
    Sends incremental `data: <chunk>\n\n` events. After streaming completes,
    the full assistant message is persisted to the database.
    """
    # Verify conversation belongs to user
    conversation = crud.conversation.get(db, id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if str(conversation.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Build context similar to reply()
    fast = mode == "fast"
    recent_limit = 10 if not fast else 4
    retrieval_recent = settings.RETRIEVAL_RECENT_MESSAGES if not fast else 3
    retrieval_top_k = settings.RETRIEVAL_TOP_K if not fast else 2
    llm_max_tokens = 1024 if not fast else 256

    # Parallelize helpers use their own DB sessions
    def _fetch_recent_messages(conv_id, limit):
        _lt0 = _t.perf_counter()
        _db = SessionLocal()
        try:
            msgs = crud.message.get_by_conversation(
                _db, conversation_id=conv_id, skip=0, limit=limit
            )
        finally:
            _db.close()
        _lt1 = _t.perf_counter()
        logger.info(
            "reply.stream.step recent_messages_ms=%.2f count=%d",
            (_lt1 - _lt0) * 1000.0,
            len(msgs),
        )
        return msgs, (_lt1 - _lt0) * 1000.0

    def _build_memory(user_id_str: str, conv_id_str: str, recent_n: int, top_k: int):
        _mt0 = _t.perf_counter()
        _db = SessionLocal()
        try:
            sys_prompt = memory_service.build_personalized_system_prompt(
                db=_db, user_id=user_id_str
            )
            ctx = memory_service.get_conversation_context(
                db=_db,
                user_id=user_id_str,
                conversation_id=conv_id_str,
                recent_messages=recent_n,
                memory_limit=top_k,
            )
        finally:
            _db.close()
        _mt1 = _t.perf_counter()
        logger.info("reply.stream.step memory_context_ms=%.2f", (_mt1 - _mt0) * 1000.0)
        return sys_prompt, ctx

    recent_msgs = []
    system_prompt = ""
    context = ""
    personalization_on = getattr(conversation, "personalization_enabled", True)
    recent_ms: float = 0.0
    mem_ms: float = 0.0

    # 1) Fetch recent messages first
    with _f.ThreadPoolExecutor(max_workers=1) as ex:
        fut_msgs = ex.submit(_fetch_recent_messages, conversation_id, recent_limit)
        try:
            _res = fut_msgs.result(timeout=5)
            if isinstance(_res, tuple):
                recent_msgs, recent_ms = _res
            else:
                recent_msgs = _res  # backward safety
        except Exception as e:
            logger.warning("Failed to fetch recent messages in parallel: %s", e)
            _t0 = _t.perf_counter()
            recent_msgs = crud.message.get_by_conversation(
                db, conversation_id=conversation_id, skip=0, limit=recent_limit
            )
            _t1 = _t.perf_counter()
            logger.info(
                "reply.stream.step recent_messages_ms=%.2f count=%d",
                (_t1 - _t0) * 1000.0,
                len(recent_msgs),
            )
            recent_ms = (_t1 - _t0) * 1000.0

    # 2) Identify latest user input and continuity
    user_texts = [m.content for m in recent_msgs if m.role == "user"]
    last_user_input = user_texts[-1] if user_texts else ""
    prior_meaningful = ""
    if len(user_texts) >= 2:
        for txt in reversed(user_texts[:-1]):
            if txt and len(txt.strip()) >= 20:
                prior_meaningful = txt.strip()[:160]
                break

    # Early interception: handle /calendar commands with immediate SSE response
    cal_resp = _handle_calendar_command(db, current_user, last_user_input)
    if cal_resp is not None:
        async def sse_generator_calendar():
            try:
                # Helper to check client disconnect
                async def _client_gone() -> bool:
                    try:
                        return await request.is_disconnected()
                    except Exception:
                        return False

                # Stream the immediate calendar response (guard disconnect first)
                if await _client_gone():
                    return
                try:
                    yield f"data: {cal_resp}\n\n"
                except Exception:
                    return
                # Always try to send done if still connected
                if not await _client_gone():
                    try:
                        yield "event: done\ndata: end\n\n"
                    except Exception:
                        pass
                # Persist assistant message after streaming (if client is still connected)
                try:
                    if not await _client_gone():
                        crud.message.create_with_conversation(
                            db=db,
                            obj_in=MessageCreate(role="assistant", content=cal_resp),
                            conversation_id=conversation_id,
                        )
                except Exception as e:
                    logger.warning(f"Failed to persist calendar response (stream): {e}")
            except BaseException:
                # Swallow disconnect cancellations or transport errors
                return

        headers = {
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
        return StreamingResponse(
            sse_generator_calendar(), media_type="text/event-stream; charset=utf-8", headers=headers
        )

    # Early interception: handle LLM NL calendar intents with immediate SSE response
    llm_resp = _handle_calendar_llm(db, current_user, last_user_input)
    if llm_resp is not None:
        async def sse_generator_calendar_llm():
            try:
                async def _client_gone() -> bool:
                    try:
                        return await request.is_disconnected()
                    except Exception:
                        return False
                if await _client_gone():
                    return
                try:
                    yield f"data: {llm_resp}\n\n"
                except Exception:
                    return
                if not await _client_gone():
                    try:
                        yield "event: done\ndata: end\n\n"
                    except Exception:
                        pass
                try:
                    if not await _client_gone():
                        crud.message.create_with_conversation(
                            db=db,
                            obj_in=MessageCreate(role="assistant", content=llm_resp),
                            conversation_id=conversation_id,
                        )
                except Exception as e:
                    logger.warning(f"Failed to persist LLM calendar response (stream): {e}")
            except BaseException:
                return

        headers = {
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
        return StreamingResponse(
            sse_generator_calendar_llm(), media_type="text/event-stream; charset=utf-8", headers=headers
        )

    # Early interception: handle NL calendar intents (heuristic) with immediate SSE response
    nl_resp = _handle_calendar_nl(db, current_user, last_user_input)
    if nl_resp is not None:
        async def sse_generator_calendar_nl():
            try:
                async def _client_gone() -> bool:
                    try:
                        return await request.is_disconnected()
                    except Exception:
                        return False
                if await _client_gone():
                    return
                try:
                    yield f"data: {nl_resp}\n\n"
                except Exception:
                    return
                if not await _client_gone():
                    try:
                        yield "event: done\ndata: end\n\n"
                    except Exception:
                        pass
                try:
                    if not await _client_gone():
                        crud.message.create_with_conversation(
                            db=db,
                            obj_in=MessageCreate(role="assistant", content=nl_resp),
                            conversation_id=conversation_id,
                        )
                except Exception as e:
                    logger.warning(f"Failed to persist NL calendar response (stream): {e}")
            except BaseException:
                return

        headers = {
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
        return StreamingResponse(
            sse_generator_calendar_nl(), media_type="text/event-stream; charset=utf-8", headers=headers
        )

    # Normalization and preference capture (after calendar handling)
    norm_note = ""
    try:
        normalized = _normalize_user_text(last_user_input)
        pref_subject, pref_pure = _maybe_capture_preference(db, current_user, conversation_id, normalized)
        if pref_pure:
            async def sse_generator_pure():
                try:
                    ack = f"Noted — I'll remember you like {pref_subject}."
                    yield f"data: {ack}\n\n"
                    yield "event: done\ndata: end\n\n"
                    crud.message.create_with_conversation(
                        db=db,
                        obj_in=MessageCreate(role="assistant", content=ack),
                        conversation_id=conversation_id,
                    )
                except BaseException:
                    # Swallow disconnect cancellations or transport errors
                    return

            headers = {
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
            return StreamingResponse(
                sse_generator_pure(), media_type="text/event-stream; charset=utf-8", headers=headers
            )
        if normalized != last_user_input:
            norm_note = f"(Note: normalize user's last message as: '{normalized}')\n"
        last_user_input = normalized
    except Exception as e:
        logger.debug(f"Normalization/preference (stream) skipped: {e}")

    # 3) Lightweight relevance gating (reuse reply() heuristic)
    def _seems_specific(text: str) -> bool:
        t = (text or "").strip().lower()
        if len(t) >= 32:
            return True
        keywords = [
            "file",
            "document",
            "upload",
            "image",
            "photo",
            "resume",
            "cv",
            "project",
            "code",
            "plan",
            "notes",
            "profile",
            "memory",
        ]
        return any(k in t for k in keywords)

    # Detect meta-questions about user's profile or stored knowledge (mirror reply())
    lu = (last_user_input or "").strip().lower()
    asks_about_user = (
        ("what do you know" in lu and ("about me" in lu or "about my" in lu or "about us" in lu))
        or ("what do you remember" in lu and ("about me" in lu or "about us" in lu))
        or ("what do you have" in lu and "on me" in lu)
        or ("my profile" in lu and ("what" in lu or "tell me" in lu))
    )

    allow_memory_context = (
        memory_enabled()
        and personalization_on
        and not fast
        and (_seems_specific(last_user_input) or asks_about_user)
    )

    # 4) Optionally build memory context
    provenance_stream = []
    include_debug_stream = bool(debug and getattr(settings, "DEBUG_RETRIEVAL_ENABLED", True))
    if allow_memory_context:
        try:
            _mt0_overall = _t.perf_counter()
            system_prompt, context = _build_memory(
                str(current_user.id), str(conversation_id), retrieval_recent, retrieval_top_k
            )
            _mt1_overall = _t.perf_counter()
            mem_ms = (_mt1_overall - _mt0_overall) * 1000.0
            # Add behavior guardrails
            system_prompt += (
                "\n\nBehavior:\n"
                "- Answer the user's latest message directly and concisely.\n"
                "- Follow the topic of the latest user message; if it differs from earlier topics, "
                "pivot to the latest and ignore earlier topics unless the user explicitly asks to "
                "continue.\n"
                "- Do not greet or engage in small talk unless the user initiates it (e.g., avoid "
                "asking about their day).\n"
                "- Strictly avoid mentioning past files, uploads, or memory unless the latest user "
                "message explicitly includes terms like: file, document, upload, image, photo, "
                "memory.\n"
                "- Do not disclose that you are using memory or files unless the user asks.\n"
                "- If any prior assistant message conflicts with the latest user request/topic, "
                "ignore the prior assistant message.\n"
            )
            if asks_about_user:
                system_prompt += (
                    "\nWhen the user asks what you know or remember about them:\n"
                    "- From the Context below, extract factual details about the user (profile, "
                    "preferences, goals, recent uploads).\n"
                    "- Present them as a short bullet list.\n"
                    "- If nothing is available, say you don't have any saved information yet.\n"
                )
            # Compute provenance via direct search
            try:
                _db_tmp = SessionLocal()
                try:
                    provenance_stream = memory_service.search_memories(
                        db=_db_tmp,
                        query=last_user_input or "",
                        user_id=str(current_user.id),
                        content_types=None,
                        limit=retrieval_top_k,
                        debug=include_debug_stream,
                    ) or []
                finally:
                    _db_tmp.close()
            except Exception as pe:
                logger.debug(f"Provenance search (stream) failed: {pe}")
        except Exception as e:
            logger.warning("Failed to retrieve memory context (stream): %s", e)
            system_prompt = (
                "You are a helpful, attentive AI companion. Be concise, friendly, and "
                "context-aware.\n\n"
                "Behavior:\n"
                "- Answer the user's latest message directly and concisely.\n"
                "- Follow the topic of the latest user message; if it differs from earlier topics, "
                "pivot to the latest and ignore earlier topics unless the user explicitly asks to "
                "continue.\n"
                "- Do not greet or engage in small talk unless the user initiates it (e.g., avoid "
                "asking about their day).\n"
                "- Strictly avoid mentioning past files, uploads, or memory unless the latest user "
                "message explicitly includes terms like: file, document, upload, image, photo, "
                "memory.\n"
                "- Do not disclose that you are using memory or files unless the user asks.\n"
                "- If any prior assistant message conflicts with the latest user request/topic, "
                "ignore the prior assistant message.\n"
            )
            context = ""
    else:
        system_prompt = (
            "You are a helpful, attentive AI companion. "
            "Be concise, friendly, and context-aware.\n\n"
            "Behavior:\n"
            "- Answer the user's latest message directly and concisely.\n"
            "- Follow the topic of the latest user message; if it differs from earlier topics, "
            "pivot to the latest and ignore earlier topics unless the user explicitly asks to "
            "continue.\n"
            "- Do not greet or engage in small talk unless the user initiates it (e.g., avoid "
            "asking about their day).\n"
            "- Strictly avoid mentioning past files, uploads, or memory unless the latest user "
            "message explicitly includes terms like: file, document, upload, image, photo, "
            "memory.\n"
            "- Do not disclose that you are using memory or files unless the user asks.\n"
            "- If any prior assistant message conflicts with the latest user request/topic, "
            "ignore the prior assistant message.\n"
        )
        context = ""

    # 5) Attach context and continuity/focus anchors
    if context:
        system_prompt += f"\n\nContext:\n{context}"
    if prior_meaningful and len((last_user_input or "").strip()) < 12:
        system_prompt += (
            "\n\nConversation continuity:\n"
            f"- The user recently discussed: '{prior_meaningful}'.\n"
            "- If the latest message is vague, assume it relates to the above and ask a concise "
            "clarifying question or provide the next helpful step on that topic."
        )
    if last_user_input:
        system_prompt += (
            "\n\nFocus (latest user message):\n"
            f"""{last_user_input.strip()}\n"""
            "Respond only to the latest user message above, unless the user explicitly asks to "
            "continue an earlier topic."
        )
    if fast:
        system_prompt = (
            system_prompt or ""
        ) + "\n\nReply in 1–2 concise sentences. If user asks to expand, elaborate then."

    chat_messages = [
        {"role": m.role, "content": m.content} for m in recent_msgs[-(6 if not fast else 3) :]
    ]
    # If the latest user input is specific enough, reduce history to minimize drift toward older topics
    if len((last_user_input or "").strip()) >= 24:
        trimmed: list[dict] = []
        last_assistant_idx = None
        for i in range(len(recent_msgs) - 2, -1, -1):
            if recent_msgs[i].role == "assistant":
                last_assistant_idx = i
                break
        if last_assistant_idx is not None:
            trimmed.append({"role": recent_msgs[last_assistant_idx].role, "content": recent_msgs[last_assistant_idx].content})
        if recent_msgs:
            trimmed.append({"role": recent_msgs[-1].role, "content": recent_msgs[-1].content})
        chat_messages = trimmed
    # Select model via settings with fallbacks
    default_model = (
        getattr(settings, "LLM_MODEL_DEFAULT", None)
        or "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    ).strip()
    fast_model = (getattr(settings, "LLM_MODEL_FAST", None) or default_model).strip()
    model = fast_model if fast else default_model

    async def sse_generator():
        """Async SSE generator with disconnect handling."""
        try:
            combined: list[str] = []
            _ts = _t.perf_counter()
            trace_id = str(uuid4())
            received_at = datetime.now(timezone.utc).isoformat()
            cancelled = False
            first_token_ms: float | None = None

            # Helper: check client connection
            async def _client_gone() -> bool:
                try:
                    return await request.is_disconnected()
                except Exception:
                    return False

            # Send provenance event before token streaming (even if empty list)
            if not await _client_gone():
                try:
                    # Emit provenance as a JSON object envelope expected by tests
                    prov_payload = json.dumps(
                        {"provenance": jsonable_encoder(provenance_stream or [])},
                        separators=(",", ":"),
                    )
                    yield f"event: provenance\ndata: {prov_payload}\n\n"
                    # Nudge the server to flush this as a distinct chunk so tests can parse cleanly
                    try:
                        await anyio.sleep(0.1)
                    except Exception:
                        pass
                except Exception:
                    pass

            # Send initial timeline prelude (if enabled) after provenance.
            # Suppress when debug=True to avoid coalescing with provenance in tests.
            if settings.TIMELINE_ENABLED and not debug and not await _client_gone():
                try:
                    start_payload = {
                        "trace_id": trace_id,
                        "timeline": {
                            "received_at_server": received_at,
                            "recent_messages_ms": round(recent_ms, 2),
                            "memory_context_ms": round(mem_ms, 2),
                        },
                    }
                    yield f"event: timeline-start\ndata: {json.dumps(start_payload)}\n\n"
                except Exception:
                    pass

            # Avoid priming yield to reduce race with client disconnects
            if await _client_gone():
                cancelled = True
                return

            # Stream tokens from the sync generator in a thread, yielding asynchronously
            # Small delay helps separate the prior provenance event from first data chunk in some clients
            try:
                await anyio.sleep(0.3)
            except Exception:
                pass
            try:
                emitted_any = False
                for chunk in generate_with_together_stream(
                    model=model,
                    system_prompt=system_prompt,
                    messages=chat_messages,
                    max_tokens=llm_max_tokens,
                ):
                    if await _client_gone():
                        cancelled = True
                        break
                    if not chunk:
                        continue
                    # Sanitize provider stub/empty chunks
                    _s = (chunk or "").strip()
                    if not _s:
                        continue
                    low = _s.lower()
                    if low.startswith("(stub)") or "no content returned by provider" in low:
                        if not emitted_any:
                            chunk = (
                                "Sorry — I couldn't generate a response just now. "
                                "Please try again."
                            )
                        else:
                            # Skip subsequent stub chunks
                            continue
                    combined.append(chunk)
                    if first_token_ms is None:
                        first_token_ms = (_t.perf_counter() - _ts) * 1000.0
                    try:
                        yield f"data: {chunk}\n\n"
                        emitted_any = True
                    except Exception:
                        cancelled = True
                        break

                _te = _t.perf_counter()
                logger.info(
                    "Together stream success | model=%s | latency_ms=%.2f | sys_len=%d | msgs=%d",
                    model,
                    (_te - _ts) * 1000.0,
                    len(system_prompt or ""),
                    len(chat_messages),
                )
            except Exception as e:
                logger.error("Together stream failed | model=%s | err=%s", model, str(e))
                if not await _client_gone():
                    try:
                        yield f"event: error\ndata: {str(e)}\n\n"
                    except Exception:
                        cancelled = True
            finally:
                # Persist assistant message only if client is still connected and we weren't cancelled
                persist_ms = 0.0
                try:
                    if not cancelled and not await _client_gone():
                        content = "".join(combined)
                        # Fallback: if no streamed chunks were produced, generate once and yield it
                        if not content:
                            try:
                                _fg_ts = _t.perf_counter()
                                content = generate_with_together(
                                    model=model,
                                    system_prompt=system_prompt,
                                    messages=chat_messages,
                                    max_tokens=llm_max_tokens,
                                ) or ""
                                # If we now have content, send it to the client so UI shows something
                                if content and not await _client_gone():
                                    # Mark first token latency if not set
                                    if first_token_ms is None:
                                        first_token_ms = (_t.perf_counter() - _fg_ts) * 1000.0
                                    try:
                                        yield f"data: {content}\n\n"
                                    except Exception:
                                        cancelled = True
                            except Exception as fe:
                                logger.error("Fallback non-stream generation failed: %s", str(fe))
                                content = ""
                        # If still empty, emit a short fallback so the client shows something
                        if not content and not await _client_gone():
                            content = (
                                "Sorry — I couldn't generate a response just now. "
                                "Please try again."
                            )
                            try:
                                yield f"data: {content}\n\n"
                            except Exception:
                                cancelled = True
                        # Sanitize provider stub responses
                        if content and (
                            content.strip().lower().startswith("(stub)")
                            or "no content returned by provider" in content.strip().lower()
                        ):
                            content = (
                                "Sorry — I couldn't generate a response just now. "
                                "Please try again."
                            )
                        if content:
                            # Optionally append fenced action suggestions to the final content and stream them
                            if getattr(settings, "ACTIONS_SUGGESTIONS_ENABLED", False):
                                try:
                                    suggestions = _suggest_actions_for(last_user_input or "")
                                except Exception:
                                    suggestions = []
                                if suggestions and not await _client_gone():
                                    fence = "```actions\n" + json.dumps(suggestions) + "\n```\n"
                                    try:
                                        yield f"data: {fence}\n\n"
                                    except Exception:
                                        cancelled = True
                                    content = content + ("\n\n" if not content.endswith("\n") else "") + fence
                            _tp0 = _t.perf_counter()
                            crud.message.create_with_conversation(
                                db=db,
                                obj_in=MessageCreate(role="assistant", content=content),
                                conversation_id=conversation_id,
                            )
                            _tp1 = _t.perf_counter()
                            persist_ms = (_tp1 - _tp0) * 1000.0
                            logger.info("reply.stream.step persist_ms=%.2f", persist_ms)
                except Exception as pe:
                    logger.warning(f"Failed persisting streamed assistant message: {pe}")

                # Emit timeline end and done only if still connected
                # Suppress timeline events when debug=True to avoid coalescing issues in tests
                if settings.TIMELINE_ENABLED and not debug and not await _client_gone():
                    try:
                        end_payload = {
                            "trace_id": trace_id,
                            "timeline": {
                                "llm_started_at": datetime.now(timezone.utc).isoformat(),
                                "first_token_ms": round((first_token_ms or 0.0), 2),
                                "llm_total_ms": round(((_t.perf_counter() - _ts) * 1000.0), 2),
                                "persist_ms": round(persist_ms, 2),
                            },
                        }
                        # Record latency metrics into app.state for lightweight reporting
                        app_obj = request.app  # FastAPI app from Request
                        store = getattr(app_obj.state, "llm_latency", None)
                        if store is None:
                            from collections import deque
                            app_obj.state.llm_latency = {
                                "first_token_ms": deque(maxlen=200),
                                "llm_total_ms": deque(maxlen=200),
                            }
                            store = app_obj.state.llm_latency
                        ft_ms = round((first_token_ms or 0.0), 2)
                        total_ms = round(((_t.perf_counter() - _ts) * 1000.0), 2)
                        store["first_token_ms"].append(ft_ms)
                        store["llm_total_ms"].append(total_ms)
                    except Exception:
                        pass
                    if not await _client_gone():
                        yield f"event: timeline-end\ndata: {json.dumps(end_payload)}\n\n"
                if not await _client_gone():
                    try:
                        yield "event: done\ndata: end\n\n"
                    except Exception:
                        pass
        except BaseException:
            # Swallow disconnect cancellations or transport errors at top-level
            return

    # (Note) No duplicate calendar generator here; the calendar SSE generator is defined
    # earlier inside the calendar-command branch above.

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",  # disable buffering on some proxies
    }
    return StreamingResponse(
        sse_generator(), media_type="text/event-stream; charset=utf-8", headers=headers
    )
