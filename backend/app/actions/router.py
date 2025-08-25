from __future__ import annotations
from typing import Any, Dict, Callable, Optional
from dataclasses import dataclass
import uuid

from app.actions.registry import ExecuteActionRequest, ActionDescriptor, registry
from app.services.intent_parser import intent_parser
from app.memory.service import MemoryService
from app.services.auto_memory import auto_memory_service
from app.api.deps import get_db
from app.schemas.calendar import CalendarEventCreate
from app.crud.calendar import calendar as crud_calendar
from app.models.calendar import CalendarEvent as CalendarEventModel


@dataclass
class ActionResult:
    ok: bool
    action: str
    result: Dict[str, Any] | None = None
    error: str | None = None
    code: str | None = None


class ActionRouter:
    """
    Centralized action execution router.
    - Validates action exists in registry
    - Emits timeline start/end hooks (stubs for now)
    - Standardizes success/error shapes
    """

    def __init__(self) -> None:
        self._handlers: dict[str, Callable[[ExecuteActionRequest], Dict[str, Any]]] = {}
        # Simple in-memory undo registry: undo_token -> callable
        self._undo_registry: dict[str, Callable[[], Dict[str, Any]]] = {}
        # Memory service for auto-saving
        self._memory_service = MemoryService()
        # Register minimal built-in handlers; these can be overwritten via register()
        self._handlers["journal.add_entry"] = self._handle_journal_add_entry
        self._handlers["review.weekly_generate"] = self._handle_review_weekly_generate
        # Chat-first Fitness/Nutrition actions
        self._handlers["nutrition.set_current_plan"] = self._handle_nutrition_set_current
        self._handlers["nutrition.archive_plan"] = self._handle_nutrition_archive
        self._handlers["fitness.log_workout"] = self._handle_fitness_log_workout
        self._handlers["fitness.create_goal"] = self._handle_fitness_create_goal
        self._handlers["nutrition.log_meal"] = self._handle_nutrition_log_meal
        self._handlers["hydration.log_water"] = self._handle_hydration_log_water
        self._handlers["mood.log_checkin"] = self._handle_mood_log_checkin
        # Calendar handlers
        self._handlers["calendar.add_event"] = self._handle_calendar_add_event
        self._handlers["calendar.delete_event"] = self._handle_calendar_delete_event

    def register(self, action: str, handler: Callable[[ExecuteActionRequest], Dict[str, Any]]) -> None:
        self._handlers[action] = handler

    def get_descriptor(self, action: str) -> ActionDescriptor | None:
        return registry.get(action)

    def execute(self, req: ExecuteActionRequest) -> ActionResult:
        desc = self.get_descriptor(req.action)
        if not desc:
            return ActionResult(ok=False, action=req.action, error="Unknown action", code="not_found")

        # Timeline start (stub): In future, emit SSE/timeline events
        try:
            handler = self._handlers.get(req.action)
            if not handler:
                # Default echo handler
                result = {"received": req.params or {}}
            else:
                result = handler(req)
            # Timeline end (stub)
            return ActionResult(ok=True, action=req.action, result=result)
        except ValueError as ve:
            return ActionResult(ok=False, action=req.action, error=str(ve), code="validation_error")
        except PermissionError as pe:
            return ActionResult(ok=False, action=req.action, error=str(pe), code="forbidden")
        except Exception as e:  # noqa: BLE001
            return ActionResult(ok=False, action=req.action, error=str(e), code="internal_error")
    
    def execute_action(self, req: ExecuteActionRequest) -> ActionResult:
        """Alias for execute method to maintain compatibility with tests."""
        return self.execute(req)
    
    def parse_and_execute_from_text(self, text: str, user_id: str, conversation_id: Optional[str] = None) -> ActionResult | None:
        """Parse natural language and execute action if detected."""
        intent = intent_parser.parse_any_intent(text)
        if not intent:
            return None
            
        req = ExecuteActionRequest(
            action=intent['action'],
            params=intent['params'],
            user_id=user_id,
            conversation_id=conversation_id
        )
        
        return self.execute(req)

    # ---- Built-in handlers (MVP stubs) ----
    def _handle_journal_add_entry(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        # Note: integrate with actual journal persistence service when available
        title = (req.params or {}).get("title")
        content = (req.params or {}).get("content")
        if not content:
            raise ValueError("content is required")
        entry_id = str(uuid.uuid4())
        undo_token = str(uuid.uuid4())
        # Register a no-op undo for now
        self._undo_registry[undo_token] = lambda: {"status": "reverted", "entry_id": entry_id}
        return {"entry_id": entry_id, "title": title, "undo_token": undo_token}

    def _handle_review_weekly_generate(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        # Note: schedule background weekly digest job via APScheduler when available
        digest_id = str(uuid.uuid4())
        return {"message": "Weekly digest scheduled", "digest_id": digest_id}

    # ---- Fitness/Nutrition handlers (stubs for MVP) ----
    def _handle_nutrition_set_current(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        plan_id = params.get("plan_id") or ("title:" + (params.get("plan_title") or ""))
        if not plan_id:
            raise ValueError("plan_id or plan_title required")
        undo_token = str(uuid.uuid4())
        # Register undo stub: unsets current (no-op in MVP)
        self._undo_registry[undo_token] = lambda: {"status": "unset", "previous_plan_id": plan_id}
        return {"status": "ok", "current_plan_id": plan_id, "undo_token": undo_token}

    def _handle_nutrition_archive(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        plan_id = params.get("plan_id") or ("title:" + (params.get("plan_title") or ""))
        if not plan_id:
            raise ValueError("plan_id or plan_title required")
        undo_token = str(uuid.uuid4())
        # Register undo stub: un-archive
        self._undo_registry[undo_token] = lambda: {"status": "unarchived", "plan_id": plan_id}
        return {"status": "archived", "archived_plan_id": plan_id, "undo_token": undo_token}

    def _handle_fitness_log_workout(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        exercises = params.get("exercises", [])
        if not exercises:
            raise ValueError("exercises is required")
        
        workout_id = str(uuid.uuid4())
        undo_token = str(uuid.uuid4())
        
        # Check for PRs (simple logic for demo)
        pr_achieved = False
        pr_details = ""
        for exercise in exercises:
            if exercise.get("weight_kg", 0) > 100:  # Simple PR threshold
                pr_achieved = True
                pr_details = f"New PR on {exercise['name']}: {exercise.get('weight_kg')}kg!"
                break
        
        # Auto-save to memory
        try:
            workout_summary = f"Workout logged: {', '.join([f"{ex['name']} ({ex.get('sets', 1)} sets)" for ex in exercises])}"
            if pr_achieved:
                workout_summary += f" • {pr_details}"
            
            self._memory_service.create_memory(
                user_id=req.user_id,
                content=workout_summary,
                content_type="workout_log",
                importance_score=0.7,
                conversation_id=req.conversation_id
            )
        except Exception:
            pass  # Don't fail action if memory save fails
        
        # Register undo stub
        self._undo_registry[undo_token] = lambda: {"status": "deleted", "workout_id": workout_id}
        
        return {
            "workout_id": workout_id,
            "status": "logged",
            "exercises_logged": len(exercises),
            "pr_achieved": pr_achieved,
            "pr_details": pr_details,
            "undo_token": undo_token
        }
    
    def _handle_fitness_create_goal(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        name = params.get("name")
        if not name:
            raise ValueError("name is required")
        
        goal_id = str(uuid.uuid4())
        undo_token = str(uuid.uuid4())
        
        # Auto-save to memory
        try:
            goal_summary = f"Fitness goal created: {name}"
            # Auto-capture memory using new automatic system
            try:
                from app.api.deps import get_db
                db = next(get_db())
                auto_memory_service.capture_from_action(
                    db=db,
                    user_id=req.user_id,
                    action_name=req.action,
                    action_params=req.params,
                    result={"goal_id": goal_id, "status": "created"}
                )
            except Exception as e:
                logger.warning(f"Failed to auto-capture action memory: {e}")
        except Exception:
            pass  # Don't fail action if memory save fails
        
        # Register undo stub
        self._undo_registry[undo_token] = lambda: {"status": "deleted", "goal_id": goal_id}
        
        return {
            "goal_id": goal_id,
            "status": "created",
            "undo_token": undo_token
        }

    def _handle_nutrition_log_meal(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        foods = params.get("foods")
        description = params.get("description")
        
        if not foods and not description:
            raise ValueError("foods or description is required")
        
        meal_id = str(uuid.uuid4())
        undo_token = str(uuid.uuid4())
        
        # Simple calorie estimation (demo logic)
        estimated_calories = params.get("calories")
        if not estimated_calories and foods:
            estimated_calories = len(foods) * 150  # Rough estimate
        
        # Auto-save to memory
        try:
            meal_summary = f"Meal logged: {description or ', '.join(foods)}"
            if estimated_calories:
                meal_summary += f" (~{estimated_calories} cal)"
            
            self._memory_service.create_memory(
                user_id=req.user_id,
                content=meal_summary,
                content_type="meal_log",
                importance_score=0.6,
                conversation_id=req.conversation_id
            )
        except Exception:
            pass  # Don't fail action if memory save fails
        
        # Register undo stub
        self._undo_registry[undo_token] = lambda: {"status": "deleted", "meal_id": meal_id}
        
        return {
            "meal_id": meal_id,
            "status": "logged",
            "estimated_calories": estimated_calories,
            "undo_token": undo_token
        }
    
    def _handle_hydration_log_water(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        amount_ml = params.get("amount_ml")
        amount_cups = params.get("amount_cups")
        
        if not amount_ml and not amount_cups:
            raise ValueError("amount_ml or amount_cups is required")
        
        # Convert cups to ml if needed
        if amount_cups and not amount_ml:
            amount_ml = amount_cups * 240  # 1 cup = 240ml
        
        log_id = str(uuid.uuid4())
        
        # Mock daily total and goal progress
        daily_total_ml = amount_ml + 1200  # Mock existing intake
        goal_progress = min(daily_total_ml / 2000, 1.0)  # 2L daily goal
        
        return {
            "log_id": log_id,
            "amount_ml": amount_ml,
            "daily_total_ml": daily_total_ml,
            "goal_progress": goal_progress
        }
    
    def _handle_mood_log_checkin(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        mood_score = params.get("mood_score")
        
        if mood_score is None:
            raise ValueError("mood_score is required")
        
        if not (1 <= mood_score <= 10):
            raise ValueError("mood_score must be between 1 and 10")
        
        checkin_id = str(uuid.uuid4())
        
        # Simple trend analysis
        trend = "stable"
        if mood_score >= 8:
            trend = "positive"
        elif mood_score <= 4:
            trend = "concerning"
        
        return {
            "checkin_id": checkin_id,
            "status": "logged",
            "trend": trend
        }

    # ---- Calendar handlers ----
    def _handle_calendar_add_event(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        title = params.get("title")
        start = params.get("start")
        if not title or not start:
            raise ValueError("title and start are required")
        obj = CalendarEventCreate(
            title=title,
            start=start,
            end=params.get("end"),
            all_day=bool(params.get("all_day") or False),
            description=params.get("description"),
        )
        try:
            db = next(get_db())
            created = crud_calendar.create_for_user(db, user_id=req.user_id, obj_in=obj)
        finally:
            try:
                db.close()  # type: ignore[reportGeneralTypeIssues]
            except Exception:
                pass
        event_id = created.id
        undo_token = str(uuid.uuid4())
        # Register undo to delete the created event
        def _undo_delete_created() -> Dict[str, Any]:
            try:
                dbu = next(get_db())
                crud_calendar.delete_for_user(dbu, user_id=req.user_id, event_id=event_id)
                return {"status": "deleted", "event_id": event_id}
            finally:
                try:
                    dbu.close()  # type: ignore
                except Exception:
                    pass
        self._undo_registry[undo_token] = _undo_delete_created
        return {"event_id": event_id, "undo_token": undo_token}

    def _handle_calendar_delete_event(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        event_id = params.get("event_id")
        if not event_id:
            raise ValueError("event_id is required")
        # Snapshot event for undo
        snap: Dict[str, Any] | None = None
        try:
            db = next(get_db())
            row: CalendarEventModel | None = (
                db.query(CalendarEventModel)
                .filter(CalendarEventModel.id == event_id, CalendarEventModel.user_id == req.user_id)
                .first()
            )
            if not row:
                # Nothing to delete
                return {"deleted": False}
            snap = {
                "title": row.title,
                "start": row.start,
                "end": row.end,
                "all_day": row.all_day,
                "description": row.description,
            }
            crud_calendar.delete_for_user(db, user_id=req.user_id, event_id=event_id)
        finally:
            try:
                db.close()  # type: ignore
            except Exception:
                pass
        undo_token = str(uuid.uuid4())
        # Register undo to recreate the deleted event
        def _undo_recreate_deleted() -> Dict[str, Any]:
            try:
                dbu = next(get_db())
                obj = CalendarEventCreate(**snap)  # type: ignore[arg-type]
                recreated = crud_calendar.create_for_user(dbu, user_id=req.user_id, obj_in=obj)
                return {"status": "restored", "event_id": recreated.id}
            finally:
                try:
                    dbu.close()  # type: ignore
                except Exception:
                    pass
        self._undo_registry[undo_token] = _undo_recreate_deleted
        return {"deleted": True, "undo_token": undo_token}

    # ---- Undo API ----
    def undo(self, undo_token: str) -> ActionResult:
        fn = self._undo_registry.pop(undo_token, None)
        if not fn:
            return ActionResult(ok=False, action="undo", error="Invalid or expired undo token", code="not_found")
        try:
            result = fn()
            return ActionResult(ok=True, action="undo", result=result)
        except Exception as e:  # noqa: BLE001
            return ActionResult(ok=False, action="undo", error=str(e), code="internal_error")


# Singleton router instance
router = ActionRouter()
