"""
Pydantic schemas for Contextual Logging.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


# Context schemas
class LoggingContext(BaseModel):
    """Complete logging context for smart suggestions."""
    context_type: str = Field(..., description="Type of current context")
    current_time: datetime
    time_of_day: str = Field(..., description="morning, afternoon, evening, night")
    
    # Suggestions
    workout_suggestions: List['ContextualWorkoutSuggestion'] = []
    meal_suggestions: List['ContextualMealSuggestion'] = []
    
    # Current state
    active_routines_count: int = 0
    today_logs_count: int = 0
    progress_metrics: Dict[str, Any]
    smart_reminders: List[str] = []


class ContextualWorkoutSuggestion(BaseModel):
    """Smart workout suggestion based on context."""
    # Routine-based suggestion
    routine_id: Optional[str] = None
    routine_name: Optional[str] = None
    
    # Exercise-based suggestion
    exercise_id: Optional[str] = None
    exercise_name: Optional[str] = None
    
    # Suggested parameters
    suggested_exercises: List[Dict[str, Any]] = []
    suggested_duration: Optional[int] = None
    suggested_intensity: Optional[str] = None
    estimated_duration: Optional[int] = None
    difficulty: Optional[str] = None
    
    # Context
    reason: str = Field(..., description="Why this workout is suggested")
    confidence_score: float = Field(..., ge=0, le=1)
    time_sensitive: bool = False
    
    # Additional info
    equipment_needed: Optional[List[str]] = None
    muscle_groups: Optional[List[str]] = None


class ContextualMealSuggestion(BaseModel):
    """Smart meal suggestion based on context."""
    meal_type: str = Field(..., description="breakfast, lunch, dinner, snack")
    
    # Food-based suggestion
    food_id: Optional[str] = None
    food_name: Optional[str] = None
    
    # Template-based suggestion
    template_id: Optional[str] = None
    template_name: Optional[str] = None
    
    # Suggested parameters
    suggested_serving_grams: Optional[float] = None
    estimated_calories: Optional[float] = None
    estimated_protein: Optional[float] = None
    
    # Context
    reason: str = Field(..., description="Why this meal is suggested")
    confidence_score: float = Field(..., ge=0, le=1)
    time_sensitive: bool = False
    
    # Additional info
    prep_time_minutes: Optional[int] = None
    dietary_tags: Optional[List[str]] = None


# Smart logging schemas
class SmartWorkoutLog(BaseModel):
    """Smart workout logging with context awareness."""
    # Basic workout info
    activity_type: str = Field(..., description="Type of activity")
    activity_name: Optional[str] = None
    
    # Optional - will be filled with smart defaults if not provided
    duration_minutes: Optional[int] = None
    intensity: Optional[str] = Field(None, description="Intensity level: low, medium, or high")
    calories_burned: Optional[int] = None
    
    # Exercise-specific
    exercise_id: Optional[str] = None
    weight_kg: Optional[float] = None
    reps: Optional[int] = None
    sets: Optional[int] = None
    distance_km: Optional[float] = None
    
    # Context
    routine_id: Optional[str] = None
    activity_date: Optional[datetime] = None
    notes: Optional[str] = None
    
    # Smart features
    use_smart_defaults: bool = True
    context_aware: bool = True


class SmartMealLog(BaseModel):
    """Smart meal logging with context awareness."""
    # Basic meal info - will be auto-detected if not provided
    meal_type: Optional[str] = None
    meal_name: Optional[str] = None
    
    # Nutritional info - will be calculated if foods provided
    total_calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    
    # Food items
    food_ids: Optional[List[str]] = None
    food_items: str = Field(default="[]", description="JSON string of food items")
    
    # Context
    routine_id: Optional[str] = None
    meal_date: Optional[datetime] = None
    notes: Optional[str] = None
    mood_before: Optional[str] = None
    mood_after: Optional[str] = None
    
    # Smart features
    use_smart_defaults: bool = True
    context_aware: bool = True


# Response schemas
class QuickLogResponse(BaseModel):
    """Response from smart logging operations."""
    success: bool
    log_id: str
    applied_defaults: List[str] = []
    routine_updates: List['RoutineProgressUpdate'] = []
    insights: 'LoggingInsights'
    next_suggestions: List[str] = []


class RoutineProgressUpdate(BaseModel):
    """Update on routine progress after logging."""
    routine_id: str
    routine_type: str = Field(..., description="fitness or nutrition")
    workouts_completed: Optional[int] = None
    meals_completed: Optional[int] = None
    week_progress: Optional[float] = None
    achievement_unlocked: bool = False
    next_milestone: Optional[str] = None


class LoggingInsights(BaseModel):
    """Insights generated after logging activity."""
    insights: List[str] = []
    achievements: List[str] = []
    progress_summary: str
    next_goals: List[str] = []
    comparisons: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None


# Quick action schemas
class QuickWorkoutAction(BaseModel):
    """Quick workout action from dashboard/suggestions."""
    action_type: str = Field(..., description="start_routine, log_exercise, repeat_last")
    routine_id: Optional[str] = None
    exercise_id: Optional[str] = None
    template_id: Optional[str] = None
    duration_override: Optional[int] = None


class QuickMealAction(BaseModel):
    """Quick meal action from dashboard/suggestions."""
    action_type: str = Field(..., description="log_template, repeat_meal, quick_snack")
    template_id: Optional[str] = None
    food_id: Optional[str] = None
    meal_type_override: Optional[str] = None
    serving_override: Optional[float] = None


# Batch logging schemas
class BatchWorkoutLog(BaseModel):
    """Log multiple exercises in one session."""
    session_name: Optional[str] = None
    total_duration_minutes: Optional[int] = None
    exercises: List[SmartWorkoutLog]
    routine_id: Optional[str] = None
    session_notes: Optional[str] = None


class BatchMealLog(BaseModel):
    """Log multiple food items as one meal."""
    meal_type: str
    meal_name: Optional[str] = None
    foods: List[Dict[str, Any]]  # Food items with quantities
    routine_id: Optional[str] = None
    meal_notes: Optional[str] = None


# Analytics and patterns
class LoggingPattern(BaseModel):
    """Detected logging patterns for suggestions."""
    pattern_type: str = Field(..., description="time_based, routine_based, preference_based")
    pattern_description: str
    confidence: float = Field(..., ge=0, le=1)
    frequency: str = Field(..., description="daily, weekly, occasional")
    
    # Pattern data
    typical_times: Optional[List[int]] = None  # Hours of day
    preferred_activities: Optional[List[str]] = None
    average_duration: Optional[int] = None
    consistency_score: Optional[float] = None


class SmartReminder(BaseModel):
    """Smart reminder based on user patterns and context."""
    reminder_type: str = Field(..., description="workout, meal, hydration, rest")
    message: str
    priority: str = Field(..., description="low, medium, high")
    suggested_time: Optional[datetime] = None
    
    # Action data
    suggested_action: Optional[Union[QuickWorkoutAction, QuickMealAction]] = None
    dismiss_until: Optional[datetime] = None


# Integration schemas
class RoutineIntegration(BaseModel):
    """Integration with routine data for contextual logging."""
    routine_id: str
    routine_type: str
    today_plan: Optional[Dict[str, Any]] = None
    completion_status: Dict[str, bool] = {}
    next_activity: Optional[Dict[str, Any]] = None
    
    # Progress tracking
    current_week: int = 1
    total_weeks: int
    adherence_rate: float = Field(..., ge=0, le=1)


class ContextualDefaults(BaseModel):
    """Smart defaults applied based on context."""
    applied_defaults: Dict[str, Any]
    reasoning: Dict[str, str]  # Field -> reason for default
    confidence_scores: Dict[str, float]  # Field -> confidence in default
    user_overrides_allowed: List[str]  # Fields user can override


# Update forward references
LoggingContext.model_rebuild()
QuickLogResponse.model_rebuild()
