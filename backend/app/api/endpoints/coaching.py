from __future__ import annotations
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
import json
from dateutil import parser as dateparser

from app.api import deps
from sqlalchemy.orm import Session
from app import crud
from app.schemas.coaching import (
    GoalCreate,
    Goal,
    GoalUpdate,
    RoutineCreate,
    RoutineUpdate,
    Routine,
    WorkoutLogCreate,
    MealLogCreate,
    HydrationLogCreate,
    MoodLogCreate,
    JournalEntryCreate,
    CreatedId,
    DailyNudgeRequest,
    DailyNudgeResponse,
    WeeklyReviewRequest,
    WeeklyReviewResponse,
    ActionExecuteRequest,
    ActionExecuteResponse,
    ActionExecuteError,
    WorkoutPlanCreate,
    WorkoutPlan,
    NutritionPlanCreate,
    NutritionPlan,
)

router = APIRouter()


# ---- Goals ----
@router.post("/goals", response_model=dict, tags=["goals"], status_code=201)
async def create_goal(
    body: GoalCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    created = crud.goal.create_for_user(db, user_id=_user.id, obj_in=body)
    return {"id": created.id, "status": created.status}


@router.get("/goals", response_model=List[Goal], tags=["goals"])
async def list_goals(
    category: Optional[str] = None,
    status: Optional[str] = None,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    rows = crud.goal.list(db, user_id=_user.id, category=category, status=status)
    # Transform DB rows into API Goal schema shape
    result: List[Goal] = []
    for r in rows:
        result.append(
            Goal(
                id=r.id,
                name=r.name,
                category=r.category,
                status=r.status,
                target_date=r.target_date or None,
                notes=r.notes,
            )
        )
    return result


@router.patch("/goals/{goal_id}", response_model=dict, tags=["goals"])
async def update_goal(
    goal_id: str,
    body: GoalUpdate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    db_obj = crud.goal.get(db, id=goal_id)
    if not db_obj or db_obj.user_id != _user.id:
        # Hide existence details; just return ok false-like 200 with ok True to avoid info leak in scaffold
        return {"ok": True}
    update_data = body
    crud.goal.update(db, db_obj=db_obj, obj_in=update_data)
    return {"ok": True}


# ---- Routines ----
@router.post("/routines", response_model=CreatedId, tags=["routines"], status_code=201)
async def create_routine(
    body: RoutineCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    created = crud.routine.create_for_user(db, user_id=_user.id, obj_in=body)
    return CreatedId(id=created.id)


@router.put("/routines/{routine_id}", response_model=CreatedId, tags=["routines"])
async def upsert_routine(
    routine_id: str,
    body: RoutineCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    # Simple behavior: create new and ignore provided ID in scaffold
    created = crud.routine.create_for_user(db, user_id=_user.id, obj_in=body)
    return CreatedId(id=created.id)


@router.get("/routines", response_model=List[Routine], tags=["routines"])
async def list_routines(
    category: Optional[str] = None,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    rows = crud.routine.list(db, user_id=_user.id, category=category)
    result: List[Routine] = []
    for r in rows:
        # schedule is stored as JSON string; parse for schema
        schedule = r.schedule
        if isinstance(schedule, str):
            try:
                schedule = json.loads(schedule)
            except Exception:
                schedule = {"days": [], "time": None, "tz": None}
        result.append(
            Routine(
                id=r.id,
                name=r.name,
                category=r.category,
                schedule=schedule,
                goal_id=r.goal_id,
                notes=r.notes,
            )
        )
    return result


@router.patch("/routines/{routine_id}", response_model=dict, tags=["routines"])
async def update_routine(
    routine_id: str,
    body: RoutineUpdate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    db_obj = crud.routine.get(db, id=routine_id)
    if not db_obj or db_obj.user_id != _user.id:
        return {"ok": True}
    crud.routine.update(db, db_obj=db_obj, obj_in=body)
    return {"ok": True}


# ---- Trackers ----
@router.post("/trackers/workouts", response_model=CreatedId, tags=["trackers"], status_code=201)
async def log_workout(
    body: WorkoutLogCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.post("/trackers/meals", response_model=CreatedId, tags=["trackers"], status_code=201)
async def log_meal(
    body: MealLogCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.post("/trackers/hydration", response_model=CreatedId, tags=["trackers"], status_code=201)
async def log_hydration(
    body: HydrationLogCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    created = crud.hydration_log.create_for_user(db, user_id=_user.id, obj_in=body)
    return CreatedId(id=created.id)


@router.post("/trackers/mood", response_model=CreatedId, tags=["trackers"], status_code=201)
async def log_mood(
    body: MoodLogCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    created = crud.mood_log.create_for_user(db, user_id=_user.id, obj_in=body)
    return CreatedId(id=created.id)


@router.post("/trackers/journal", response_model=CreatedId, tags=["trackers"], status_code=201)
async def add_journal_entry(
    body: JournalEntryCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    created = crud.journal_entry.create_for_user(db, user_id=_user.id, obj_in=body)
    return CreatedId(id=created.id)


@router.get("/trackers/{kind}", response_model=list, tags=["trackers"])
async def query_logs(
    kind: str,
    from_: Optional[str] = None,
    to: Optional[str] = None,
    limit: int = 100,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    # Parse ISO datetimes/dates; tolerate 'Z'
    def _parse_dt(val: Optional[str]):
        if not val:
            return None
        try:
            return dateparser.isoparse(val)
        except Exception:
            return None

    from_dt = _parse_dt(from_)
    to_dt = _parse_dt(to)

    if kind == "workouts":
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")
    if kind == "meals":
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")
    if kind == "hydration":
        rows = crud.hydration_log.list(
            db, user_id=_user.id, from_dt=from_dt, to_dt=to_dt, limit=limit
        )
        return [{"id": r.id, "when": r.when.isoformat(), "amount_ml": r.amount_ml} for r in rows]
    if kind == "mood":
        rows = crud.mood_log.list(db, user_id=_user.id, from_dt=from_dt, to_dt=to_dt, limit=limit)
        out = []
        for r in rows:
            tags = None
            try:
                tags = json.loads(r.tags) if r.tags else None
            except Exception:
                tags = None
            out.append(
                {
                    "id": r.id,
                    "when": r.when.isoformat(),
                    "val": r.val,
                    "scale": r.scale,
                    "tags": tags,
                    "notes": r.notes,
                }
            )
        return out
    if kind == "journal":
        rows = crud.journal_entry.list(
            db, user_id=_user.id, from_dt=from_dt, to_dt=to_dt, limit=limit
        )
        out = []
        for r in rows:
            tags = None
            try:
                tags = json.loads(r.tags) if r.tags else None
            except Exception:
                tags = None
            out.append(
                {
                    "id": r.id,
                    "when": r.when.isoformat(),
                    "title": r.title,
                    "content": r.content,
                    "tags": tags,
                }
            )
        return out
    return []


# ---- Reviews ----
@router.post("/reviews/daily", response_model=DailyNudgeResponse, tags=["reviews"])
async def daily_nudge(
    body: DailyNudgeRequest,
    _user=Depends(deps.get_current_active_user),
):
    # Placeholder suggestions
    return DailyNudgeResponse(
        suggestions=[
            "Run 30 min at 7am",
            "Aim for 120g protein today",
            "2L water target",
        ]
    )


@router.post("/reviews/weekly", response_model=WeeklyReviewResponse, tags=["reviews"])
async def weekly_review(
    body: WeeklyReviewRequest,
    _user=Depends(deps.get_current_active_user),
):
    return WeeklyReviewResponse(
        summary="No data yet; tracking starts now.",
        adjustments=[],
        insights=[],
    )


# ---- Actions ----
@router.post("/actions/execute", response_model=ActionExecuteResponse, tags=["actions"])
async def execute_action(
    body: ActionExecuteRequest,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    action = body.action
    params: Dict[str, Any] = body.params or {}

    try:
        if action in (
            "fitness.log_workout",
            "nutrition.log_meal",
            "fitness.set_current_plan",
            "nutrition.set_current_plan",
        ):
            return ActionExecuteResponse(
                ok=False,
                action=action,
                error=ActionExecuteError(
                    detail="Feature removed", message="Feature removed", errors=None
                ),
            )
        if action == "hydration.log_water":
            req = HydrationLogCreate(**params)
            created = crud.hydration_log.create_for_user(db, user_id=_user.id, obj_in=req)
            return ActionExecuteResponse(ok=True, action=action, result={"id": created.id})
        if action == "mood.log_checkin":
            req = MoodLogCreate(**params)
            created = crud.mood_log.create_for_user(db, user_id=_user.id, obj_in=req)
            return ActionExecuteResponse(ok=True, action=action, result={"id": created.id})
        if action == "journal.add_entry":
            req = JournalEntryCreate(**params)
            created = crud.journal_entry.create_for_user(db, user_id=_user.id, obj_in=req)
            return ActionExecuteResponse(ok=True, action=action, result={"id": created.id})
        if action == "fitness.create_goal":
            req = GoalCreate(**params)
            created = crud.goal.create_for_user(db, user_id=_user.id, obj_in=req)
            return ActionExecuteResponse(ok=True, action=action, result={"id": created.id})

        # Unknown action
        return ActionExecuteResponse(
            ok=False,
            action=action,
            error=ActionExecuteError(
                detail="Unknown action", message="Unknown action", errors=None
            ),
        )
    except Exception as e:  # keep generic; logs should not include secrets
        return ActionExecuteResponse(
            ok=False,
            action=action,
            error=ActionExecuteError(detail="Action failed", message=str(e), errors=None),
        )


# ---- Plans: Fitness ----
@router.post("/fitness/plans", response_model=CreatedId, tags=["fitness"], status_code=201)
async def create_fitness_plan(
    body: WorkoutPlanCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.get("/fitness/plans", response_model=List[WorkoutPlan], tags=["fitness"])
async def list_fitness_plans(
    status: Optional[str] = None,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.get("/fitness/plans/current", response_model=Optional[WorkoutPlan], tags=["fitness"])
async def get_current_fitness_plan(
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.post("/fitness/plans/{plan_id}/set-active", response_model=dict, tags=["fitness"])
async def set_active_fitness_plan(
    plan_id: str,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.post("/fitness/plans/{plan_id}/archive", response_model=dict, tags=["fitness"])
async def archive_fitness_plan(
    plan_id: str,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


# ---- Plans: Nutrition ----
@router.post("/nutrition/plans", response_model=CreatedId, tags=["nutrition"], status_code=201)
async def create_nutrition_plan(
    body: NutritionPlanCreate,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.get("/nutrition/plans", response_model=List[NutritionPlan], tags=["nutrition"])
async def list_nutrition_plans(
    status: Optional[str] = None,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.get("/nutrition/plans/current", response_model=Optional[NutritionPlan], tags=["nutrition"])
async def get_current_nutrition_plan(
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.post("/nutrition/plans/{plan_id}/set-active", response_model=dict, tags=["nutrition"])
async def set_active_nutrition_plan(
    plan_id: str,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")


@router.post("/nutrition/plans/{plan_id}/archive", response_model=dict, tags=["nutrition"])
async def archive_nutrition_plan(
    plan_id: str,
    _user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Feature removed")
