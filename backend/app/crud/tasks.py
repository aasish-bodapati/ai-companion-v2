from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.task import Task as TaskModel
from app.schemas.tasks import TaskCreate, TaskUpdate


class CRUDTasks:
    def __init__(self):
        self.model = TaskModel

    def get_user_tasks(self, db: Session, *, user_id: str, limit: int = 100) -> List[TaskModel]:
        q = db.query(self.model).filter(self.model.user_id == user_id).order_by(self.model.created_at.desc())
        if limit:
            q = q.limit(limit)
        return q.all()

    def create_for_user(self, db: Session, *, user_id: str, obj_in: TaskCreate) -> TaskModel:
        data = obj_in.model_dump()
        if not data.get("status"):
            data["status"] = "pending"
        db_obj = self.model(user_id=user_id, **data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_for_user(self, db: Session, *, user_id: str, task_id: str, obj_in: TaskUpdate) -> Optional[TaskModel]:
        db_obj = db.query(self.model).filter(self.model.id == task_id, self.model.user_id == user_id).first()
        if not db_obj:
            return None
        data = obj_in.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(db_obj, k, v)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_for_user(self, db: Session, *, user_id: str, task_id: str) -> bool:
        db_obj = db.query(self.model).filter(self.model.id == task_id, self.model.user_id == user_id).first()
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


tasks = CRUDTasks()
