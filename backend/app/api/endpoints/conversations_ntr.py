"""
Handlers for notes, tasks, and reminders captured from chat text.
Extracted from conversations_messages.py to keep files small and modular.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging
import re
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.notes import NoteCreate
from app.schemas.tasks import TaskCreate
from app.schemas.reminders import ReminderCreate
from app.crud.notes import notes as crud_notes
from app.crud.tasks import tasks as crud_tasks
from app.crud.reminders import reminders as crud_reminders
from app.models.note import Note as NoteModel
from app.models.task import Task as TaskModel
from app.models.reminder import Reminder as ReminderModel
from app.services.auto_memory import auto_memory_service
from app.models.user import User

logger = logging.getLogger(__name__)


def handle_notes_tasks_reminders(db: Session, user: User, text: str) -> str | None:
    """
    Deterministic handling for notes, tasks, and reminders using memory_service.
    Returns assistant text if handled, otherwise None.
    """
    s = (text or "").strip()
    if not s:
        return None

    # Note capture: /note, note:, remember, save
    m_note = re.match(r"^(?:/note\b|note:\s*|remember\b|save\b)\s*(.+)$", s, re.IGNORECASE)
    if m_note:
        body = m_note.group(1).strip()
        if body:
            ctx = {
                "content_type": "note",
                "source": "chat:note",
                "metadata": {},
            }
            # Dual write: first persist to SQL if enabled, then memory (best-effort)
            if bool(getattr(settings, "DUAL_WRITE_ENABLED", False)):
                try:
                    # Use first 80 chars as title; keep body empty for now
                    nc = NoteCreate(title=body[:80], body=None, tags=None)
                    # Lightweight dedupe: check for recent identical title for this user within 2 minutes
                    try:
                        window = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=2)
                        norm_title = (nc.title or "").strip().lower()
                        existing = (
                            db.query(NoteModel)
                            .filter(
                                NoteModel.user_id == str(user.id),
                                NoteModel.created_at >= window,
                            )
                            .order_by(NoteModel.created_at.desc())
                            .all()
                        )
                        if not any((getattr(e, "title", "") or "").strip().lower() == norm_title for e in existing):
                            _db_note = crud_notes.create_for_user(db, user_id=user.id, obj_in=nc)
                    except Exception as _dedupe_e:
                        logger.debug(f"Note dedupe check failed: {_dedupe_e}")
                except Exception as _e:
                    logger.debug(f"Note SQL write failed: {_e}")
            try:
                auto_memory_service.auto_capture_memory(
                    db, user_id=str(user.id), content=body, context=ctx
                )
            except Exception as _e:
                logger.debug(f"Note capture failed: {_e}")
            return f"Saved note: {body[:80]}"  # deterministic receipt

    # Task/Todo capture: /todo, todo:, "add a todo"
    m_todo = re.match(r"^(?:/todo\b|todo:\s*|add\s+a\s+todo\b)\s*(.+)$", s, re.IGNORECASE)
    if m_todo:
        task_text = m_todo.group(1).strip()
        due_at: datetime | None = None
        # best-effort time parse using calendar parser
        try:
            from app.services.calendar_parser import parse_line

            pe = parse_line(task_text)
            if pe and getattr(pe, "start", None):
                due_at = pe.start
                # If parser separated title from time, prefer that title
                task_text = pe.title or task_text
        except Exception as _e:
            logger.debug(f"Task time parse skipped: {_e}")
        ctx = {
            "content_type": "task",
            "source": "chat:task",
            "metadata": {"due_at": (due_at.isoformat() if due_at else None)},
        }
        # Dual write: SQL first if enabled
        if bool(getattr(settings, "DUAL_WRITE_ENABLED", False)):
            try:
                tc = TaskCreate(title=task_text, due_at=due_at, status=None, priority=None, tags=None)
                # Lightweight dedupe: check for recent identical title and due_at within 2 minutes
                try:
                    window = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=2)
                    norm_title = (tc.title or "").strip().lower()
                    existing = (
                        db.query(TaskModel)
                        .filter(
                            TaskModel.user_id == str(user.id),
                            TaskModel.created_at >= window,
                        )
                        .order_by(TaskModel.created_at.desc())
                        .all()
                    )
                    def _same_due(a, b):
                        if not a and not b:
                            return True
                        if not a or not b:
                            return False
                        # within one minute considered same
                        return abs((a - b).total_seconds()) <= 60
                    if not any(
                        (getattr(e, "title", "") or "").strip().lower() == norm_title and _same_due(getattr(e, "due_at", None), due_at)
                        for e in existing
                    ):
                        _db_task = crud_tasks.create_for_user(db, user_id=user.id, obj_in=tc)
                except Exception as _dedupe_e:
                    logger.debug(f"Task dedupe check failed: {_dedupe_e}")
            except Exception as _e:
                logger.debug(f"Task SQL write failed: {_e}")
        try:
            auto_memory_service.auto_capture_memory(
                db, user_id=str(user.id), content=task_text, context=ctx
            )
        except Exception as _e:
            logger.debug(f"Task capture failed: {_e}")
        when = due_at.strftime("%b %d, %I:%M %p") if due_at else None
        return (
            f"Added task: {task_text}" + (f" • due {when}" if when else "")
        )

    # Reminder capture: "/remind ..." or "remind me ..."
    m_rem = re.match(r"^(?:/remind\b|remind\s+me\b)\s*(.+)$", s, re.IGNORECASE)
    if m_rem:
        rem_text = m_rem.group(1).strip()
        trigger: datetime | None = None
        # Try simple "in Xh/m" pattern first
        try:
            m_in = re.search(r"\bin\s*(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b", s, re.IGNORECASE)
            if m_in:
                amt = int(m_in.group(1))
                unit = m_in.group(2).lower()
                now = datetime.now(timezone.utc).replace(tzinfo=None)
                if unit.startswith("h"):
                    trigger = now + timedelta(hours=amt)
                else:
                    trigger = now + timedelta(minutes=amt)
        except Exception:
            pass
        # Fallback to date parser
        if trigger is None:
            try:
                from app.services.calendar_parser import parse_line

                pe = parse_line(rem_text)
                if pe and getattr(pe, "start", None):
                    trigger = pe.start
                    rem_text = pe.title or rem_text
            except Exception as _e:
                logger.debug(f"Reminder time parse skipped: {_e}")
        ctx = {
            "content_type": "reminder",
            "source": "chat:reminder",
            "metadata": {"trigger_at": (trigger.isoformat() if trigger else None)},
        }
        # Dual write: SQL first if enabled
        if bool(getattr(settings, "DUAL_WRITE_ENABLED", False)):
            try:
                rc = ReminderCreate(content=rem_text, trigger_at=trigger, channel=None)
                # Lightweight dedupe: check for recent identical content and trigger within 2 minutes
                try:
                    window = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=2)
                    norm_content = (rc.content or "").strip().lower()
                    existing = (
                        db.query(ReminderModel)
                        .filter(
                            ReminderModel.user_id == str(user.id),
                            ReminderModel.created_at >= window,
                        )
                        .order_by(ReminderModel.created_at.desc())
                        .all()
                    )
                    def _same_trigger(a, b):
                        if not a and not b:
                            return True
                        if not a or not b:
                            return False
                        return abs((a - b).total_seconds()) <= 60
                    if not any(
                        (getattr(e, "content", "") or "").strip().lower() == norm_content and _same_trigger(getattr(e, "trigger_at", None), trigger)
                        for e in existing
                    ):
                        _db_rem = crud_reminders.create_for_user(db, user_id=user.id, obj_in=rc)
                except Exception as _dedupe_e:
                    logger.debug(f"Reminder dedupe check failed: {_dedupe_e}")
            except Exception as _e:
                logger.debug(f"Reminder SQL write failed: {_e}")
        try:
            auto_memory_service.auto_capture_memory(
                db, user_id=str(user.id), content=rem_text, context=ctx
            )
        except Exception as _e:
            logger.debug(f"Reminder capture failed: {_e}")
        when = trigger.strftime("%b %d, %I:%M %p") if trigger else None
        return (
            f"Reminder set: {rem_text}" + (f" • at {when}" if when else "")
        )

    return None
