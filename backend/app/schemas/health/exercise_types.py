"""
Exercise Type Schemas - Flexible polymorphic system for different exercise types
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

class ExerciseTypeEnum(str, Enum):
    """Exercise type categories"""
    STRENGTH = "strength"
    CARDIO = "cardio"
    FLEXIBILITY = "flexibility"
    SPORTS = "sports"
    FUNCTIONAL = "functional"

class EquipmentTypeEnum(str, Enum):
    """Equipment types for strength exercises"""
    BARBELL = "barbell"
    DUMBBELL = "dumbbell"
    MACHINE = "machine"
    CABLE = "cable"
    BODYWEIGHT = "bodyweight"
    KETTLEBELL = "kettlebell"
    RESISTANCE_BAND = "resistance_band"
    NONE = "none"

# Base schemas for different exercise types

class StrengthExerciseAttributes(BaseModel):
    """Attributes for strength training exercises"""
    equipment_type: EquipmentTypeEnum
    weight_kg: Optional[float] = None
    sets: int = Field(..., ge=1, le=20)
    reps: Union[int, str] = Field(..., description="Number of reps or rep range like '8-12'")
    rest_time_seconds: Optional[int] = Field(None, ge=0, le=600)

    # Equipment-specific attributes
    barbell_weight: Optional[float] = Field(None, description="Weight of barbell (usually 20kg)")
    plate_weights: Optional[List[float]] = Field(None, description="Weights on each side")
    dumbbell_weight: Optional[float] = Field(None, description="Weight per dumbbell")

    # Advanced metrics
    rpe: Optional[int] = Field(None, ge=1, le=10, description="Rate of Perceived Exertion")
    tempo: Optional[str] = Field(None, description="Tempo like '3-1-2-1' (eccentric-pause-concentric-pause)")

    @validator('weight_kg')
    def validate_weight(cls, v, values):
        if v is not None and v < 0:
            raise ValueError('Weight cannot be negative')
        return v

class CardioExerciseAttributes(BaseModel):
    """Attributes for cardio exercises"""
    duration_minutes: int = Field(..., ge=1, le=300)
    distance_km: Optional[float] = Field(None, ge=0)
    pace_per_km: Optional[str] = Field(None, description="Pace like '5:30'")
    heart_rate_avg: Optional[int] = Field(None, ge=50, le=220)
    heart_rate_max: Optional[int] = Field(None, ge=50, le=220)
    calories_burned: Optional[int] = Field(None, ge=0)

    # Cardio-specific metrics
    elevation_gain: Optional[float] = Field(None, ge=0, description="Elevation gain in meters")
    cadence: Optional[int] = Field(None, ge=0, description="Steps per minute for running")
    power_watts: Optional[int] = Field(None, ge=0, description="Power output for cycling")

    @validator('heart_rate_max')
    def validate_heart_rate_max(cls, v, values):
        if v is not None and 'heart_rate_avg' in values and values['heart_rate_avg'] is not None:
            if v < values['heart_rate_avg']:
                raise ValueError('Max heart rate must be greater than average heart rate')
        return v

class FlexibilityExerciseAttributes(BaseModel):
    """Attributes for flexibility exercises"""
    duration_minutes: int = Field(..., ge=1, le=120)
    poses_held: Optional[List[str]] = Field(None, description="List of poses or stretches")
    difficulty_level: str = Field("beginner", description="beginner, intermediate, advanced")
    focus_areas: Optional[List[str]] = Field(None, description="Body areas focused on")

    # Flexibility-specific metrics
    flexibility_rating: Optional[int] = Field(None, ge=1, le=10, description="How flexible you felt")
    pain_level: Optional[int] = Field(None, ge=0, le=10, description="Pain level during stretches")
    relaxation_level: Optional[int] = Field(None, ge=1, le=10, description="How relaxed you felt")

class SportsExerciseAttributes(BaseModel):
    """Attributes for sports activities"""
    duration_minutes: int = Field(..., ge=1, le=300)
    sport_type: str = Field(..., description="Type of sport")
    intensity: str = Field("medium", description="low, medium, high")

    # Sport-specific metrics
    score: Optional[str] = Field(None, description="Game score or performance metric")
    opponent: Optional[str] = Field(None, description="Opponent or team")
    weather_conditions: Optional[str] = Field(None, description="Weather during activity")
    equipment_used: Optional[List[str]] = Field(None, description="Equipment used")

    # Performance metrics
    distance_covered: Optional[float] = Field(None, ge=0)
    calories_burned: Optional[int] = Field(None, ge=0)
    heart_rate_avg: Optional[int] = Field(None, ge=50, le=220)

class FunctionalExerciseAttributes(BaseModel):
    """Attributes for functional training exercises"""
    duration_minutes: int = Field(..., ge=1, le=120)
    movement_pattern: str = Field(..., description="push, pull, squat, hinge, carry, etc.")
    complexity: str = Field("simple", description="simple, moderate, complex")

    # Functional-specific metrics
    stability_challenge: Optional[int] = Field(None, ge=1, le=10, description="Stability difficulty")
    coordination_level: Optional[int] = Field(None, ge=1, le=10, description="Coordination required")
    unilateral: Optional[bool] = Field(False, description="Single limb exercise")

    # Equipment and setup
    equipment_used: Optional[List[str]] = Field(None)
    space_required: Optional[str] = Field(None, description="small, medium, large")

# Union type for all exercise attributes
ExerciseAttributes = Union[
    StrengthExerciseAttributes,
    CardioExerciseAttributes,
    FlexibilityExerciseAttributes,
    SportsExerciseAttributes,
    FunctionalExerciseAttributes
]

# Main schemas

class ExerciseTypeBase(BaseModel):
    """Base exercise type schema"""
    name: str = Field(..., min_length=1, max_length=100)
    category: ExerciseTypeEnum
    subcategory: Optional[str] = None
    equipment_type: Optional[EquipmentTypeEnum] = None
    equipment_required: Optional[List[str]] = None
    primary_muscles: Optional[List[str]] = None
    secondary_muscles: Optional[List[str]] = None
    movement_pattern: Optional[str] = None
    attributes_schema: Dict[str, Any] = Field(..., description="JSON schema for exercise attributes")
    description: Optional[str] = None
    instructions: Optional[List[str]] = None
    tips: Optional[List[str]] = None
    difficulty_level: str = Field("beginner", description="beginner, intermediate, advanced")

class ExerciseTypeCreate(ExerciseTypeBase):
    """Schema for creating exercise types"""
    pass

class ExerciseTypeUpdate(BaseModel):
    """Schema for updating exercise types"""
    name: Optional[str] = None
    subcategory: Optional[str] = None
    equipment_required: Optional[List[str]] = None
    primary_muscles: Optional[List[str]] = None
    secondary_muscles: Optional[List[str]] = None
    attributes_schema: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    instructions: Optional[List[str]] = None
    tips: Optional[List[str]] = None
    difficulty_level: Optional[str] = None
    is_active: Optional[bool] = None

class ExerciseType(ExerciseTypeBase):
    """Schema for reading exercise types"""
    id: str
    is_active: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoutineExerciseV2Base(BaseModel):
    """Base schema for routine exercises v2"""
    exercise_type_id: str
    attributes: Dict[str, Any] = Field(..., description="Exercise-specific attributes")
    order_index: int = Field(0, ge=0)
    rest_time_seconds: Optional[int] = Field(None, ge=0, le=600)
    notes: Optional[str] = None

class RoutineExerciseV2Create(RoutineExerciseV2Base):
    """Schema for creating routine exercises v2"""
    pass

class RoutineExerciseV2Update(BaseModel):
    """Schema for updating routine exercises v2"""
    attributes: Optional[Dict[str, Any]] = None
    order_index: Optional[int] = Field(None, ge=0)
    rest_time_seconds: Optional[int] = Field(None, ge=0, le=600)
    notes: Optional[str] = None

class RoutineExerciseV2(RoutineExerciseV2Base):
    """Schema for reading routine exercises v2"""
    id: str
    created_at: datetime
    updated_at: datetime
    exercise_type: Optional[ExerciseType] = None

    class Config:
        from_attributes = True

class WorkoutLogV2Base(BaseModel):
    """Base schema for workout logs v2"""
    exercise_type_id: str
    attributes: Dict[str, Any] = Field(..., description="Exercise-specific attributes")
    workout_date: datetime
    duration_minutes: Optional[int] = Field(None, ge=1, le=300)
    calories_burned: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    routine_id: Optional[str] = None
    workout_day_id: Optional[str] = None

class WorkoutLogV2Create(WorkoutLogV2Base):
    """Schema for creating workout logs v2"""
    pass

class WorkoutLogV2Update(BaseModel):
    """Schema for updating workout logs v2"""
    attributes: Optional[Dict[str, Any]] = None
    workout_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=300)
    calories_burned: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None

class WorkoutLogV2(WorkoutLogV2Base):
    """Schema for reading workout logs v2"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    exercise_type: Optional[ExerciseType] = None

    class Config:
        from_attributes = True

# Helper functions for creating exercise type schemas

def create_strength_exercise_schema() -> Dict[str, Any]:
    """Create JSON schema for strength exercises"""
    return {
        "type": "object",
        "properties": {
            "equipment_type": {"type": "string", "enum": [e.value for e in EquipmentTypeEnum]},
            "weight_kg": {"type": "number", "minimum": 0},
            "sets": {"type": "integer", "minimum": 1, "maximum": 20},
            "reps": {"oneOf": [{"type": "integer", "minimum": 1}, {"type": "string"}]},
            "rest_time_seconds": {"type": "integer", "minimum": 0, "maximum": 600},
            "barbell_weight": {"type": "number", "minimum": 0},
            "plate_weights": {"type": "array", "items": {"type": "number", "minimum": 0}},
            "dumbbell_weight": {"type": "number", "minimum": 0},
            "rpe": {"type": "integer", "minimum": 1, "maximum": 10},
            "tempo": {"type": "string"}
        },
        "required": ["equipment_type", "sets", "reps"]
    }

def create_cardio_exercise_schema() -> Dict[str, Any]:
    """Create JSON schema for cardio exercises"""
    return {
        "type": "object",
        "properties": {
            "duration_minutes": {"type": "integer", "minimum": 1, "maximum": 300},
            "distance_km": {"type": "number", "minimum": 0},
            "pace_per_km": {"type": "string"},
            "heart_rate_avg": {"type": "integer", "minimum": 50, "maximum": 220},
            "heart_rate_max": {"type": "integer", "minimum": 50, "maximum": 220},
            "calories_burned": {"type": "integer", "minimum": 0},
            "elevation_gain": {"type": "number", "minimum": 0},
            "cadence": {"type": "integer", "minimum": 0},
            "power_watts": {"type": "integer", "minimum": 0}
        },
        "required": ["duration_minutes"]
    }

def create_flexibility_exercise_schema() -> Dict[str, Any]:
    """Create JSON schema for flexibility exercises"""
    return {
        "type": "object",
        "properties": {
            "duration_minutes": {"type": "integer", "minimum": 1, "maximum": 120},
            "poses_held": {"type": "array", "items": {"type": "string"}},
            "difficulty_level": {"type": "string", "enum": ["beginner", "intermediate", "advanced"]},
            "focus_areas": {"type": "array", "items": {"type": "string"}},
            "flexibility_rating": {"type": "integer", "minimum": 1, "maximum": 10},
            "pain_level": {"type": "integer", "minimum": 0, "maximum": 10},
            "relaxation_level": {"type": "integer", "minimum": 1, "maximum": 10}
        },
        "required": ["duration_minutes"]
    }
