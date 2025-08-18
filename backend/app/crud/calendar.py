from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.models.calendar import CalendarEvent as CalendarEventModel
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate


class CRUDCalendar:
    def __init__(self):
        self.model = CalendarEventModel

    def get_user_events(
        self, db: Session, *, user_id: str, start: Optional[str] = None, end: Optional[str] = None
    ) -> List[CalendarEventModel]:
        try:
            q = db.query(self.model).filter(self.model.user_id == user_id)
            if start:
                q = q.filter(self.model.start >= start)
            if end:
                q = q.filter((self.model.end != None) & (self.model.end <= end) | ((self.model.end == None) & (self.model.start <= end)))  # noqa: E711
            return q.order_by(self.model.start.asc()).all()
        except OperationalError as e:
            # Likely table missing (migrations not run)
            raise

    def create_for_user(self, db: Session, *, user_id: str, obj_in: CalendarEventCreate) -> CalendarEventModel:
        db_obj = self.model(user_id=user_id, **obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_for_user(
        self, db: Session, *, user_id: str, event_id: str, obj_in: CalendarEventUpdate
    ) -> Optional[CalendarEventModel]:
        db_obj = db.query(self.model).filter(self.model.id == event_id, self.model.user_id == user_id).first()
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
        db_obj = db.query(self.model).filter(self.model.id == event_id, self.model.user_id == user_id).first()
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


calendar = CRUDCalendar()
