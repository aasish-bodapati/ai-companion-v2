from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
import logging

from app.core.config import settings

from app.models.calendar import CalendarEvent as CalendarEventModel
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate


class CRUDCalendar:
    def __init__(self):
        self.model = CalendarEventModel

    def get_user_events(
        self, db: Session, *, user_id: str, start: Optional[datetime] = None, end: Optional[datetime] = None
    ) -> List[CalendarEventModel]:
        try:
            # Normalize user_id to string to avoid UUID vs str mismatches
            uid = str(user_id) if user_id is not None else None
            q = db.query(self.model).filter(self.model.user_id == uid)
            # Use start-in-window semantics for simplicity and to include open-ended events
            if start is not None:
                q = q.filter(self.model.start >= start)
            if end is not None:
                q = q.filter(self.model.start <= end)
            return q.order_by(self.model.start.asc()).all()
        except OperationalError:
            # Likely table missing (migrations not run)
            raise

    def create_for_user(self, db: Session, *, user_id: str, obj_in: CalendarEventCreate) -> CalendarEventModel:
        def _to_aware_utc(dt: Optional[datetime]) -> Optional[datetime]:
            """Return a timezone-aware UTC datetime for storage in timezone=True columns.

            - If input is naive, assume it's local time and attach UTC (best-effort) for consistency.
            - Always return tz-aware UTC to satisfy SQLAlchemy's timezone=True expectation.
            """
            if dt is None:
                return None
            if dt.tzinfo is None:
                # Treat naive as UTC to avoid local-time ambiguity
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)

        data = obj_in.model_dump()
        data["start"] = _to_aware_utc(data.get("start"))
        data["end"] = _to_aware_utc(data.get("end"))
        db_obj = self.model(user_id=str(user_id) if user_id is not None else None, **data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_for_user(
        self, db: Session, *, user_id: str, event_id: str, obj_in: CalendarEventUpdate
    ) -> Optional[CalendarEventModel]:
        uid = str(user_id) if user_id is not None else None
        db_obj = db.query(self.model).filter(self.model.id == event_id, self.model.user_id == uid).first()
        if not db_obj:
            return None
        data = obj_in.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(db_obj, k, v)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_for_user(self, db: Session, *, user_id: str, event_id: str) -> bool:
        uid = str(user_id) if user_id is not None else None
        _log = logging.getLogger(__name__)
        if getattr(settings, "CALENDAR_DEBUG_ENABLED", False):
            _log.info(f"calendar.delete_for_user start user_id={uid} event_id={event_id}")
        # Primary path: direct delete by id and user
        try:
            affected = (
                db.query(self.model)
                .filter(self.model.id == event_id, self.model.user_id == uid)
                .delete(synchronize_session=False)
            )
            db.commit()
            if getattr(settings, "CALENDAR_DEBUG_ENABLED", False):
                _log.info(f"calendar.delete_for_user commit affected={affected}")
            if affected and affected > 0:
                return True
        except Exception as e:
            if getattr(settings, "CALENDAR_DEBUG_ENABLED", False):
                _log.warning(f"calendar.delete_for_user error: {e}")
            db.rollback()
        # Fallback: nothing deleted; return False
        return False


calendar = CRUDCalendar()
