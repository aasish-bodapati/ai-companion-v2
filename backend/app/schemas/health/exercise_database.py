"""
Pydantic schemas for Exercise Database.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Exercise schemas
class ExerciseBase(BaseModel):
    name: str = Field(..., description="Exercise name")
    category: str = Field(..., description="Exercise category (cardio, strength, flexibility, sports)")
    subcategory: Optional[str] = Field(None, description="Exercise subcategory")
    muscle_groups: Optional[List[str]] = Field(None, description="Target muscle groups")
    equipment_needed: Optional[List[str]] = Field(None, description="Required equipment")
    difficulty_level: str = Field("beginner", description="Difficulty level")
    calories_per_minute: Optional[float] = Field(None, description="Average calories burned per minute")
    met_value: Optional[float] = Field(None, description="Metabolic Equivalent of Task")
    description: Optional[str] = Field(None, description="Exercise description")
    instructions: Optional[List[str]] = Field(None, description="Step-by-step instructions")
    tips: Optional[List[str]] = Field(None, description="Form tips and safety notes")
    variations: Optional[List[str]] = Field(None, description="Exercise variations")

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    muscle_groups: Optional[List[str]] = None
    equipment_needed: Optional[List[str]] = None
    difficulty_level: Optional[str] = None
    calories_per_minute: Optional[float] = None
    met_value: Optional[float] = None
    description: Optional[str] = None
    instructions: Optional[List[str]] = None
    tips: Optional[List[str]] = None
    variations: Optional[List[str]] = None

class Exercise(ExerciseBase):
    id: str
    is_popular: bool = False
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExerciseWithStats(Exercise):
    """Exercise with user-specific statistics."""
    user_times_performed: Optional[int] = 0
    user_last_performed: Optional[datetime] = None
    user_avg_duration: Optional[float] = None
    user_personal_records: Optional[Dict[str, Any]] = None

# User Exercise History schemas
class UserExerciseHistoryBase(BaseModel):
    exercise_id: str
    times_performed: int = 1
    avg_duration_minutes: Optional[float] = None
    avg_calories_burned: Optional[float] = None
    max_weight_kg: Optional[float] = None
    max_reps: Optional[int] = None
    max_distance_km: Optional[float] = None
    best_time_seconds: Optional[float] = None
    preferred_intensity: Optional[str] = None
    notes: Optional[str] = None

class UserExerciseHistoryCreate(UserExerciseHistoryBase):
    user_id: str

class UserExerciseHistoryUpdate(BaseModel):
    times_performed: Optional[int] = None
    avg_duration_minutes: Optional[float] = None
    avg_calories_burned: Optional[float] = None
    max_weight_kg: Optional[float] = None
    max_reps: Optional[int] = None
    max_distance_km: Optional[float] = None
    best_time_seconds: Optional[float] = None
    preferred_intensity: Optional[str] = None
    notes: Optional[str] = None

class UserExerciseHistory(UserExerciseHistoryBase):
    id: str
    user_id: str
    last_performed: datetime
    created_at: datetime
    updated_at: datetime
    exercise: Optional[Exercise] = None

    class Config:
        from_attributes = True

# Exercise Template schemas
class ExerciseTemplateBase(BaseModel):
    name: str = Field(..., description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    category: str = Field(..., description="Template category")
    difficulty_level: str = Field("beginner", description="Difficulty level")
    estimated_duration_minutes: Optional[int] = Field(None, description="Estimated duration")
    exercises: List[Dict[str, Any]] = Field(..., description="Exercise configurations")

class ExerciseTemplateCreate(ExerciseTemplateBase):
    pass

class ExerciseTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty_level: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    exercises: Optional[List[Dict[str, Any]]] = None

class ExerciseTemplate(ExerciseTemplateBase):
    id: str
    is_popular: bool = False
    usage_count: int = 0
    created_by_system: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Search and filter schemas
class ExerciseSearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    equipment: Optional[List[str]] = Field(None, description="Filter by equipment")
    difficulty: Optional[str] = Field(None, description="Filter by difficulty")
    muscle_groups: Optional[List[str]] = Field(None, description="Filter by muscle groups")
    limit: int = Field(20, ge=1, le=100, description="Result limit")
    offset: int = Field(0, ge=0, description="Result offset")

class ExerciseSearchResponse(BaseModel):
    exercises: List[ExerciseWithStats]
    total_count: int
    has_more: bool
    filters_applied: Dict[str, Any]

# Smart suggestions
class SmartSuggestion(BaseModel):
    exercise: Exercise
    reason: str = Field(..., description="Why this exercise is suggested")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence in suggestion")
    similar_to: Optional[List[str]] = Field(None, description="Similar exercises user has done")

class SmartSuggestionsResponse(BaseModel):
    suggestions: List[SmartSuggestion]
    user_preferences: Dict[str, Any]
    generated_at: datetime

# Exercise logging integration
class QuickExerciseLog(BaseModel):
    """Quick exercise logging with smart defaults."""
    exercise_id: str
    duration_minutes: Optional[float] = None
    intensity: Optional[str] = None
    weight_kg: Optional[float] = None
    reps: Optional[int] = None
    sets: Optional[int] = None
    distance_km: Optional[float] = None
    notes: Optional[str] = None
    use_smart_defaults: bool = True  # Fill in defaults based on user history

class ExerciseLogWithDefaults(BaseModel):
    """Exercise log data with smart defaults applied."""
    exercise: Exercise
    suggested_duration: Optional[float] = None
    suggested_intensity: Optional[str] = None
    suggested_weight: Optional[float] = None
    suggested_reps: Optional[int] = None
    suggested_sets: Optional[int] = None
    personal_records: Optional[Dict[str, Any]] = None
    last_performed: Optional[datetime] = None
    improvement_suggestions: Optional[List[str]] = None
