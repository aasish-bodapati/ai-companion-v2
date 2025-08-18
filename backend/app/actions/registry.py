from __future__ import annotations
from typing import Dict, List, Optional, Literal
from pydantic import BaseModel, Field

# Source of truth: docs/ground_truth/33_actions_registry.md

RiskLevel = Literal["low", "medium", "high"]


class ActionDescriptor(BaseModel):
    name: str
    title: str
    params_schema: Dict
    result_schema: Optional[Dict] = None
    risk: RiskLevel = "low"
    scopes: Optional[List[str]] = None


class ExecuteActionRequest(BaseModel):
    action: str
    params: Dict = Field(default_factory=dict)
    user_id: str
    conversation_id: Optional[str] = None
    client_action_id: Optional[str] = None


class ExecuteActionResponse(BaseModel):
    ok: bool
    action: str
    result: Optional[Dict] = None


class ActionsRegistry:
    def __init__(self) -> None:
        self._catalog: Dict[str, ActionDescriptor] = {}
        self._bootstrap()

    def _bootstrap(self) -> None:
        # Minimal seed catalog; expand to calendar/uploads/coaching/trackers
        self.register(
            ActionDescriptor(
                name="journal.add_entry",
                title="Add journal entry",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "content": {"type": "string"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["content"],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {"entry_id": {"type": "string"}},
                    "required": ["entry_id"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["journal:write"],
            )
        )
        self.register(
            ActionDescriptor(
                name="review.weekly_generate",
                title="Generate weekly review",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "week_start": {"type": "string", "format": "date"}
                    },
                    "additionalProperties": False,
                },
                result_schema={"type": "object"},
                risk="medium",
                scopes=["review:write"],
            )
        )
        # --- Chat-first Fitness/Nutrition controls ---
        self.register(
            ActionDescriptor(
                name="nutrition.set_current_plan",
                title="Set current nutrition plan",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "plan_id": {"type": "string"},
                        "plan_title": {"type": "string"},
                        "idempotency_key": {"type": "string"}
                    },
                    "anyOf": [
                        {"required": ["plan_id"]},
                        {"required": ["plan_title"]}
                    ],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"},
                        "current_plan_id": {"type": "string"},
                        "undo_token": {"type": "string"}
                    },
                    "required": ["status", "current_plan_id", "undo_token"],
                    "additionalProperties": False,
                },
                risk="medium",
                scopes=["nutrition:write"],
            )
        )
        self.register(
            ActionDescriptor(
                name="nutrition.archive_plan",
                title="Archive nutrition plan",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "plan_id": {"type": "string"},
                        "plan_title": {"type": "string"},
                        "idempotency_key": {"type": "string"}
                    },
                    "anyOf": [
                        {"required": ["plan_id"]},
                        {"required": ["plan_title"]}
                    ],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"},
                        "archived_plan_id": {"type": "string"},
                        "undo_token": {"type": "string"}
                    },
                    "required": ["status", "archived_plan_id", "undo_token"],
                    "additionalProperties": False,
                },
                risk="medium",
                scopes=["nutrition:write"],
            )
        )
        self.register(
            ActionDescriptor(
                name="fitness.add_workout",
                title="Add workout",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "when": {"type": "string"},
                        "duration_min": {"type": "number"},
                        "idempotency_key": {"type": "string"}
                    },
                    "required": ["name"],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "workout_id": {"type": "string"},
                        "status": {"type": "string"},
                        "undo_token": {"type": "string"}
                    },
                    "required": ["workout_id", "status", "undo_token"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["fitness:write"],
            )
        )
        self.register(
            ActionDescriptor(
                name="nutrition.log_meal",
                title="Log meal",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "meal": {"type": "string"},
                        "kcal": {"type": "number"},
                        "idempotency_key": {"type": "string"}
                    },
                    "required": ["meal"],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "meal_id": {"type": "string"},
                        "status": {"type": "string"},
                        "undo_token": {"type": "string"}
                    },
                    "required": ["meal_id", "status", "undo_token"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["nutrition:write"],
            )
        )

    def register(self, desc: ActionDescriptor) -> None:
        self._catalog[desc.name] = desc

    def get(self, action_name: str) -> Optional[ActionDescriptor]:
        return self._catalog.get(action_name)

    def list(self) -> List[ActionDescriptor]:
        return list(self._catalog.values())


registry = ActionsRegistry()
