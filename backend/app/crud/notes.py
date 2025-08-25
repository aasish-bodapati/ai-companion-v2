from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.note import Note as NoteModel
from app.schemas.notes import NoteCreate, NoteUpdate


class CRUDNotes:
    def __init__(self):
        self.model = NoteModel

    def get_user_notes(self, db: Session, *, user_id: str, limit: int = 100) -> List[NoteModel]:
        q = db.query(self.model).filter(self.model.user_id == user_id).order_by(self.model.created_at.desc())
        if limit:
            q = q.limit(limit)
        return q.all()

    def create_for_user(self, db: Session, *, user_id: str, obj_in: NoteCreate) -> NoteModel:
        db_obj = self.model(user_id=user_id, **obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_for_user(self, db: Session, *, user_id: str, note_id: str, obj_in: NoteUpdate) -> Optional[NoteModel]:
        db_obj = db.query(self.model).filter(self.model.id == note_id, self.model.user_id == user_id).first()
        if not db_obj:
            return None
        data = obj_in.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(db_obj, k, v)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_for_user(self, db: Session, *, user_id: str, note_id: str) -> bool:
        db_obj = db.query(self.model).filter(self.model.id == note_id, self.model.user_id == user_id).first()
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


notes = CRUDNotes()
