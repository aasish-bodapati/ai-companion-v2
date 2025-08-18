from __future__ import annotations
from typing import Any, Dict, Callable
from dataclasses import dataclass
import uuid

from app.actions.registry import ExecuteActionRequest, ActionDescriptor, registry


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
        # Register minimal built-in handlers; these can be overwritten via register()
        self._handlers["journal.add_entry"] = self._handle_journal_add_entry
        self._handlers["review.weekly_generate"] = self._handle_review_weekly_generate
        # Chat-first Fitness/Nutrition actions
        self._handlers["nutrition.set_current_plan"] = self._handle_nutrition_set_current
        self._handlers["nutrition.archive_plan"] = self._handle_nutrition_archive
        self._handlers["fitness.add_workout"] = self._handle_fitness_add_workout
        self._handlers["nutrition.log_meal"] = self._handle_nutrition_log_meal

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

    # ---- Built-in handlers (MVP stubs) ----
    def _handle_journal_add_entry(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        # TODO: integrate with actual journal persistence service
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
        # TODO: schedule background weekly digest job via APScheduler
        return {"status": "scheduled"}

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

    def _handle_fitness_add_workout(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        name = params.get("name")
        if not name:
            raise ValueError("name is required")
        workout_id = str(uuid.uuid4())
        undo_token = str(uuid.uuid4())
        # Register undo stub: delete created workout
        self._undo_registry[undo_token] = lambda: {"status": "deleted", "workout_id": workout_id}
        return {"workout_id": workout_id, "status": "created", "undo_token": undo_token}

    def _handle_nutrition_log_meal(self, req: ExecuteActionRequest) -> Dict[str, Any]:
        params = req.params or {}
        meal = params.get("meal")
        if not meal:
            raise ValueError("meal is required")
        meal_id = str(uuid.uuid4())
        undo_token = str(uuid.uuid4())
        # Register undo stub: delete created meal log
        self._undo_registry[undo_token] = lambda: {"status": "deleted", "meal_id": meal_id}
        return {"meal_id": meal_id, "status": "logged", "undo_token": undo_token}

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
