from __future__ import annotations
from typing import Optional, List
import json
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.crud.base import CRUDBase
from app.models.coaching import Goal as GoalModel, Routine as RoutineModel
from app.models.coaching import WorkoutLog as WorkoutLogModel
from app.models.coaching import MealLog as MealLogModel
from app.models.coaching import HydrationLog as HydrationLogModel
from app.models.coaching import MoodLog as MoodLogModel
from app.models.coaching import JournalEntry as JournalEntryModel
from app.models.coaching import WorkoutPlan as WorkoutPlanModel, NutritionPlan as NutritionPlanModel
from app.schemas.coaching import (
    GoalCreate,
    GoalUpdate,
    RoutineCreate,
    RoutineUpdate,
    WorkoutLogCreate,
    MealLogCreate,
    HydrationLogCreate,
    MoodLogCreate,
    JournalEntryCreate,
    WorkoutPlanCreate,
    NutritionPlanCreate,
)


class CRUDGoal(CRUDBase[GoalModel, GoalCreate, GoalUpdate]):
    def create_for_user(self, db: Session, *, user_id: str, obj_in: GoalCreate) -> GoalModel:
        db_obj = GoalModel(
            user_id=user_id,
            name=obj_in.name,
            category=obj_in.category,
            status="active",
            target_date=obj_in.target_date.isoformat() if obj_in.target_date else None,
            notes=obj_in.notes,
            metrics=json.dumps(obj_in.metrics) if obj_in.metrics is not None else None,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self,
        db: Session,
        *,
        user_id: str,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[GoalModel]:
        q = db.query(GoalModel).filter(GoalModel.user_id == user_id)
        if category:
            q = q.filter(GoalModel.category == category)
        if status:
            q = q.filter(GoalModel.status == status)
        return q.order_by(GoalModel.created_at.desc()).all()


goal = CRUDGoal(GoalModel)


class CRUDRoutine(CRUDBase[RoutineModel, RoutineCreate, RoutineUpdate]):
    def create_for_user(self, db: Session, *, user_id: str, obj_in: RoutineCreate) -> RoutineModel:
        db_obj = RoutineModel(
            user_id=user_id,
            name=obj_in.name,
            category=obj_in.category,
            schedule=json.dumps(obj_in.schedule.model_dump()),
            goal_id=obj_in.goal_id,
            notes=obj_in.notes,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self, db: Session, *, user_id: str, category: Optional[str] = None
    ) -> List[RoutineModel]:
        q = db.query(RoutineModel).filter(RoutineModel.user_id == user_id)
        if category:
            q = q.filter(RoutineModel.category == category)
        return q.order_by(RoutineModel.created_at.desc()).all()


routine = CRUDRoutine(RoutineModel)


class CRUDWorkoutLog(CRUDBase[WorkoutLogModel, WorkoutLogCreate, WorkoutLogCreate]):
    def create_for_user(
        self, db: Session, *, user_id: str, obj_in: WorkoutLogCreate
    ) -> WorkoutLogModel:
        db_obj = WorkoutLogModel(user_id=user_id, **obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self, db: Session, *, user_id: str, from_dt=None, to_dt=None, limit: int = 100
    ) -> List[WorkoutLogModel]:
        q = db.query(WorkoutLogModel).filter(WorkoutLogModel.user_id == user_id)
        if from_dt is not None:
            q = q.filter(WorkoutLogModel.when >= from_dt)
        if to_dt is not None:
            q = q.filter(WorkoutLogModel.when <= to_dt)
        return q.order_by(WorkoutLogModel.when.desc()).limit(limit).all()


class CRUDMealLog(CRUDBase[MealLogModel, MealLogCreate, MealLogCreate]):
    def create_for_user(self, db: Session, *, user_id: str, obj_in: MealLogCreate) -> MealLogModel:
        payload = obj_in.model_dump()
        payload["items"] = (
            json.dumps(payload["items"]) if payload.get("items") is not None else json.dumps([])
        )
        db_obj = MealLogModel(user_id=user_id, **payload)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self, db: Session, *, user_id: str, from_dt=None, to_dt=None, limit: int = 100
    ) -> List[MealLogModel]:
        q = db.query(MealLogModel).filter(MealLogModel.user_id == user_id)
        if from_dt is not None:
            q = q.filter(MealLogModel.when >= from_dt)
        if to_dt is not None:
            q = q.filter(MealLogModel.when <= to_dt)
        return q.order_by(MealLogModel.when.desc()).limit(limit).all()


class CRUDHydrationLog(CRUDBase[HydrationLogModel, HydrationLogCreate, HydrationLogCreate]):
    def create_for_user(
        self, db: Session, *, user_id: str, obj_in: HydrationLogCreate
    ) -> HydrationLogModel:
        db_obj = HydrationLogModel(user_id=user_id, **obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self, db: Session, *, user_id: str, from_dt=None, to_dt=None, limit: int = 100
    ) -> List[HydrationLogModel]:
        q = db.query(HydrationLogModel).filter(HydrationLogModel.user_id == user_id)
        if from_dt is not None:
            q = q.filter(HydrationLogModel.when >= from_dt)
        if to_dt is not None:
            q = q.filter(HydrationLogModel.when <= to_dt)
        return q.order_by(HydrationLogModel.when.desc()).limit(limit).all()


class CRUDMoodLog(CRUDBase[MoodLogModel, MoodLogCreate, MoodLogCreate]):
    def create_for_user(self, db: Session, *, user_id: str, obj_in: MoodLogCreate) -> MoodLogModel:
        payload = obj_in.model_dump()
        if payload.get("tags") is not None:
            payload["tags"] = json.dumps(payload["tags"])
        db_obj = MoodLogModel(user_id=user_id, **payload)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self, db: Session, *, user_id: str, from_dt=None, to_dt=None, limit: int = 100
    ) -> List[MoodLogModel]:
        q = db.query(MoodLogModel).filter(MoodLogModel.user_id == user_id)
        if from_dt is not None:
            q = q.filter(MoodLogModel.when >= from_dt)
        if to_dt is not None:
            q = q.filter(MoodLogModel.when <= to_dt)
        return q.order_by(MoodLogModel.when.desc()).limit(limit).all()


class CRUDJournalEntry(CRUDBase[JournalEntryModel, JournalEntryCreate, JournalEntryCreate]):
    def create_for_user(
        self, db: Session, *, user_id: str, obj_in: JournalEntryCreate
    ) -> JournalEntryModel:
        payload = obj_in.model_dump()
        if payload.get("tags") is not None:
            payload["tags"] = json.dumps(payload["tags"])
        db_obj = JournalEntryModel(user_id=user_id, **payload)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self, db: Session, *, user_id: str, from_dt=None, to_dt=None, limit: int = 100
    ) -> List[JournalEntryModel]:
        q = db.query(JournalEntryModel).filter(JournalEntryModel.user_id == user_id)
        if from_dt is not None:
            q = q.filter(JournalEntryModel.when >= from_dt)
        if to_dt is not None:
            q = q.filter(JournalEntryModel.when <= to_dt)
        return q.order_by(JournalEntryModel.when.desc()).limit(limit).all()


workout_log = CRUDWorkoutLog(WorkoutLogModel)
meal_log = CRUDMealLog(MealLogModel)

hydration_log = CRUDHydrationLog(HydrationLogModel)
mood_log = CRUDMoodLog(MoodLogModel)
journal_entry = CRUDJournalEntry(JournalEntryModel)


class CRUDWorkoutPlan(CRUDBase[WorkoutPlanModel, WorkoutPlanCreate, WorkoutPlanCreate]):
    def create_for_user(
        self, db: Session, *, user_id: str, obj_in: WorkoutPlanCreate
    ) -> WorkoutPlanModel:
        payload = obj_in.model_dump()
        if payload.get("structured") is not None:
            payload["structured"] = json.dumps(payload["structured"])  # store as JSON string
        db_obj = WorkoutPlanModel(user_id=user_id, **payload)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self, db: Session, *, user_id: str, status: Optional[str] = None
    ) -> list[WorkoutPlanModel]:
        q = db.query(WorkoutPlanModel).filter(WorkoutPlanModel.user_id == user_id)
        if status:
            q = q.filter(WorkoutPlanModel.status == status)
        return q.order_by(WorkoutPlanModel.created_at.desc()).all()

    def get_current(self, db: Session, *, user_id: str) -> Optional[WorkoutPlanModel]:
        return (
            db.query(WorkoutPlanModel)
            .filter(and_(WorkoutPlanModel.user_id == user_id, WorkoutPlanModel.status == "active"))
            .order_by(WorkoutPlanModel.created_at.desc())
            .first()
        )

    def set_active(self, db: Session, *, user_id: str, plan_id: str) -> Optional[WorkoutPlanModel]:
        # archive previous
        db.query(WorkoutPlanModel).filter(
            and_(WorkoutPlanModel.user_id == user_id, WorkoutPlanModel.status == "active")
        ).update({WorkoutPlanModel.status: "archived"})
        # set new active
        db_obj = (
            db.query(WorkoutPlanModel)
            .filter(and_(WorkoutPlanModel.id == plan_id, WorkoutPlanModel.user_id == user_id))
            .first()
        )
        if not db_obj:
            db.commit()
            return None
        db_obj.status = "active"
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDNutritionPlan(CRUDBase[NutritionPlanModel, NutritionPlanCreate, NutritionPlanCreate]):
    def create_for_user(
        self, db: Session, *, user_id: str, obj_in: NutritionPlanCreate
    ) -> NutritionPlanModel:
        payload = obj_in.model_dump()
        if payload.get("structured") is not None:
            payload["structured"] = json.dumps(payload["structured"])  # store as JSON string
        db_obj = NutritionPlanModel(user_id=user_id, **payload)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def list(
        self, db: Session, *, user_id: str, status: Optional[str] = None
    ) -> list[NutritionPlanModel]:
        q = db.query(NutritionPlanModel).filter(NutritionPlanModel.user_id == user_id)
        if status:
            q = q.filter(NutritionPlanModel.status == status)
        return q.order_by(NutritionPlanModel.created_at.desc()).all()

    def get_current(self, db: Session, *, user_id: str) -> Optional[NutritionPlanModel]:
        return (
            db.query(NutritionPlanModel)
            .filter(
                and_(NutritionPlanModel.user_id == user_id, NutritionPlanModel.status == "active")
            )
            .order_by(NutritionPlanModel.created_at.desc())
            .first()
        )

    def set_active(
        self, db: Session, *, user_id: str, plan_id: str
    ) -> Optional[NutritionPlanModel]:
        # archive previous
        db.query(NutritionPlanModel).filter(
            and_(NutritionPlanModel.user_id == user_id, NutritionPlanModel.status == "active")
        ).update({NutritionPlanModel.status: "archived"})
        # set new active
        db_obj = (
            db.query(NutritionPlanModel)
            .filter(and_(NutritionPlanModel.id == plan_id, NutritionPlanModel.user_id == user_id))
            .first()
        )
        if not db_obj:
            db.commit()
            return None
        db_obj.status = "active"
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


workout_plan = CRUDWorkoutPlan(WorkoutPlanModel)
nutrition_plan = CRUDNutritionPlan(NutritionPlanModel)
