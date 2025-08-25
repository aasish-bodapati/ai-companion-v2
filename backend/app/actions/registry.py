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
        # Enhanced fitness actions for direct execution
        self.register(
            ActionDescriptor(
                name="fitness.log_workout",
                title="Log workout with exercises",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "exercises": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "sets": {"type": "integer"},
                                    "reps": {"type": "integer"},
                                    "weight_kg": {"type": "number"},
                                    "weight_lbs": {"type": "number"},
                                    "duration_min": {"type": "number"},
                                    "distance_km": {"type": "number"},
                                    "notes": {"type": "string"}
                                },
                                "required": ["name"],
                                "additionalProperties": False
                            }
                        },
                        "workout_name": {"type": "string"},
                        "when": {"type": "string", "format": "date-time"},
                        "duration_min": {"type": "number"},
                        "notes": {"type": "string"},
                        "idempotency_key": {"type": "string"}
                    },
                    "required": ["exercises"],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "workout_id": {"type": "string"},
                        "status": {"type": "string"},
                        "exercises_logged": {"type": "integer"},
                        "pr_achieved": {"type": "boolean"},
                        "pr_details": {"type": "string"},
                        "undo_token": {"type": "string"}
                    },
                    "required": ["workout_id", "status", "exercises_logged"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["fitness:write"],
            )
        )
        self.register(
            ActionDescriptor(
                name="fitness.create_goal",
                title="Create fitness goal",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "category": {"type": "string", "enum": ["strength", "cardio", "weight_loss", "muscle_gain", "endurance", "flexibility"]},
                        "target_date": {"type": "string", "format": "date"},
                        "target_value": {"type": "number"},
                        "target_unit": {"type": "string"},
                        "notes": {"type": "string"},
                        "idempotency_key": {"type": "string"}
                    },
                    "required": ["name"],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "goal_id": {"type": "string"},
                        "status": {"type": "string"},
                        "undo_token": {"type": "string"}
                    },
                    "required": ["goal_id", "status"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["fitness:write"],
            )
        )
        # Enhanced nutrition actions
        self.register(
            ActionDescriptor(
                name="nutrition.log_meal",
                title="Log meal with details",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "meal_type": {"type": "string", "enum": ["breakfast", "lunch", "dinner", "snack"]},
                        "foods": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "description": {"type": "string"},
                        "calories": {"type": "number"},
                        "protein_g": {"type": "number"},
                        "carbs_g": {"type": "number"},
                        "fat_g": {"type": "number"},
                        "when": {"type": "string", "format": "date-time"},
                        "notes": {"type": "string"},
                        "idempotency_key": {"type": "string"}
                    },
                    "anyOf": [
                        {"required": ["foods"]},
                        {"required": ["description"]}
                    ],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "meal_id": {"type": "string"},
                        "status": {"type": "string"},
                        "estimated_calories": {"type": "number"},
                        "undo_token": {"type": "string"}
                    },
                    "required": ["meal_id", "status"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["nutrition:write"],
            )
        )
        # Additional direct execution actions
        self.register(
            ActionDescriptor(
                name="hydration.log_water",
                title="Log water intake",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "amount_ml": {"type": "number"},
                        "amount_cups": {"type": "number"},
                        "when": {"type": "string", "format": "date-time"},
                        "idempotency_key": {"type": "string"}
                    },
                    "anyOf": [
                        {"required": ["amount_ml"]},
                        {"required": ["amount_cups"]}
                    ],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "log_id": {"type": "string"},
                        "amount_ml": {"type": "number"},
                        "daily_total_ml": {"type": "number"},
                        "goal_progress": {"type": "number"}
                    },
                    "required": ["log_id", "amount_ml"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["hydration:write"],
            )
        )
        self.register(
            ActionDescriptor(
                name="mood.log_checkin",
                title="Log mood check-in",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "mood_score": {"type": "integer", "minimum": 1, "maximum": 10},
                        "energy_level": {"type": "integer", "minimum": 1, "maximum": 10},
                        "stress_level": {"type": "integer", "minimum": 1, "maximum": 10},
                        "notes": {"type": "string"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "when": {"type": "string", "format": "date-time"},
                        "idempotency_key": {"type": "string"}
                    },
                    "required": ["mood_score"],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {
                        "checkin_id": {"type": "string"},
                        "status": {"type": "string"},
                        "trend": {"type": "string"}
                    },
                    "required": ["checkin_id", "status"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["mood:write"],
            )
        )
        # Calendar actions
        self.register(
            ActionDescriptor(
                name="calendar.add_event",
                title="Add calendar event",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "start": {"type": "string", "format": "date-time"},
                        "end": {"type": "string", "format": "date-time"},
                        "all_day": {"type": "boolean"},
                        "description": {"type": "string"}
                    },
                    "required": ["title", "start"],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {"event_id": {"type": "string"}},
                    "required": ["event_id"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["calendar:write"],
            )
        )
        self.register(
            ActionDescriptor(
                name="calendar.delete_event",
                title="Delete calendar event",
                params_schema={
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "event_id": {"type": "string"}
                    },
                    "required": ["event_id"],
                    "additionalProperties": False,
                },
                result_schema={
                    "type": "object",
                    "properties": {"deleted": {"type": "boolean"}},
                    "required": ["deleted"],
                    "additionalProperties": False,
                },
                risk="low",
                scopes=["calendar:write"],
            )
        )

    def register(self, desc: ActionDescriptor) -> None:
        self._catalog[desc.name] = desc

    def get(self, action_name: str) -> Optional[ActionDescriptor]:
        return self._catalog.get(action_name)

    def list(self) -> List[ActionDescriptor]:
        return list(self._catalog.values())


registry = ActionsRegistry()
