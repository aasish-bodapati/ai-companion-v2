"""
Pydantic schemas for Health Insights and Smart Suggestions.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# Instant Feedback schemas
class InstantFeedback(BaseModel):
    """Immediate feedback after logging an activity."""
    feedback_type: str = Field(..., description="fitness or nutrition")
    primary_message: str = Field(..., description="Main feedback message")

    # Detailed insights
    insights: List[str] = []
    achievements: List[str] = []
    recommendations: List[str] = []

    # Engagement
    celebration_worthy: bool = False
    next_action_suggestion: Optional[str] = None
    motivational_boost: str = Field(..., description="Motivational message")

    # Context
    generated_at: datetime = Field(default_factory=lambda: datetime.now())
    user_context: Optional[Dict[str, Any]] = None

# Progress and Insights
class ProgressInsight(BaseModel):
    """Insight about user's progress."""
    insight_type: str = Field(..., description="improvement, plateau, decline, milestone")
    title: str
    description: str
    metric_name: str

    # Data
    current_value: float
    previous_value: Optional[float] = None
    change_percentage: Optional[float] = None
    trend_direction: str = Field(..., description="up, down, stable")

    # Context
    time_period: str = Field(..., description="day, week, month")
    significance: str = Field(..., description="low, medium, high")
    actionable: bool = True

class PatternAnalysis(BaseModel):
    """Analysis of user behavior patterns."""
    pattern_type: str = Field(..., description="time, frequency, preference, consistency")
    pattern_name: str
    description: str

    # Pattern data
    frequency: str = Field(..., description="daily, weekly, monthly, sporadic")
    strength: float = Field(..., ge=0, le=1, description="Pattern strength score")
    consistency_score: float = Field(..., ge=0, le=1)

    # Insights
    insights: List[str] = []
    recommendations: List[str] = []

    # Supporting data
    data_points: Optional[List[Dict[str, Any]]] = None
    confidence: float = Field(..., ge=0, le=1)

# Smart Recommendations
class SmartRecommendation(BaseModel):
    """Intelligent recommendation based on user data."""
    suggestion_type: str = Field(..., description="fitness, nutrition, lifestyle, goal")
    title: str
    description: str

    # Action details
    action_type: str = Field(..., description="log_exercise, try_food, set_goal, etc.")
    action_data: Dict[str, Any] = {}

    # Scoring
    priority_score: float = Field(..., ge=0, le=1)
    relevance_score: float = Field(default=0.8, ge=0, le=1)

    # Context
    reasoning: str = Field(..., description="Why this is recommended")
    estimated_benefit: str
    time_sensitive: bool = False

    # User experience
    difficulty_level: str = Field(default="easy", description="easy, medium, hard")
    estimated_time_minutes: Optional[int] = None

class PersonalizedSuggestions(BaseModel):
    """Collection of personalized suggestions."""
    suggestions: List[SmartRecommendation]
    user_patterns: Dict[str, Any]
    context_factors: Dict[str, Any]

    # Metadata
    generated_at: datetime
    refresh_interval_minutes: int = 15
    total_suggestions_available: Optional[int] = None

# Health Trends
class HealthTrend(BaseModel):
    """Health trend analysis over time."""
    metric_name: str
    metric_display_name: str
    trend_type: str = Field(..., description="positive, negative, neutral")

    # Trend data
    current_period_value: float
    previous_period_value: float
    change_amount: float
    change_percentage: float

    # Analysis
    trend_strength: str = Field(..., description="weak, moderate, strong")
    statistical_significance: bool

    # Visualization data
    data_points: List[Dict[str, Any]] = []
    period_labels: List[str] = []

    # Insights
    interpretation: str
    recommendations: List[str] = []

# Goal Progress
class GoalProgress(BaseModel):
    """Progress towards specific goals."""
    goal_id: Optional[str] = None
    goal_name: str
    goal_type: str = Field(..., description="fitness, nutrition, weight, habit")

    # Progress data
    current_value: float
    target_value: float
    progress_percentage: float = Field(..., ge=0, le=100)

    # Timeline
    start_date: datetime
    target_date: datetime
    days_remaining: int

    # Analysis
    on_track: bool
    projected_completion: Optional[datetime] = None
    required_daily_rate: Optional[float] = None

    # Motivation
    milestone_reached: Optional[str] = None
    next_milestone: Optional[str] = None
    encouragement_message: str

# Comparisons
class ComparisonInsight(BaseModel):
    """Comparison insights (vs previous periods, goals, etc.)."""
    comparison_type: str = Field(..., description="vs_previous, vs_goal, vs_average")
    metric_name: str

    # Comparison data
    current_value: float
    comparison_value: float
    difference: float
    difference_percentage: float

    # Analysis
    performance_rating: str = Field(..., description="excellent, good, average, below_average")
    trend_direction: str = Field(..., description="improving, declining, stable")

    # Context
    time_frame: str
    interpretation: str
    actionable_insights: List[str] = []

# Motivation and Achievements
class MotivationalMessage(BaseModel):
    """Personalized motivational message."""
    message_type: str = Field(..., description="encouragement, celebration, challenge, tip")
    title: str
    message: str

    # Personalization
    user_name_included: bool = False
    context_specific: bool = True

    # Engagement
    call_to_action: Optional[str] = None
    related_goal: Optional[str] = None

    # Metadata
    generated_at: datetime
    expires_at: Optional[datetime] = None

class AchievementUnlock(BaseModel):
    """Achievement unlocked notification."""
    achievement_id: str
    title: str
    description: str
    category: str = Field(..., description="fitness, nutrition, consistency, milestone")

    # Achievement data
    icon: str
    rarity: str = Field(..., description="common, rare, epic, legendary")
    points_earned: int = 0

    # Context
    unlocked_at: datetime
    trigger_activity: Optional[str] = None

    # Sharing
    shareable: bool = True
    share_message: Optional[str] = None

# Reports
class WeeklyReport(BaseModel):
    """Comprehensive weekly health report."""
    week_start: datetime
    week_end: datetime

    # Summary stats
    total_workouts: int
    total_meals_logged: int
    total_calories_burned: int
    total_calories_consumed: int

    # Highlights
    best_day: str
    top_achievement: str
    consistency_score: float = Field(..., ge=0, le=1)

    # Detailed insights
    fitness_insights: List[str] = []
    nutrition_insights: List[str] = []
    patterns_discovered: List[str] = []

    # Goals
    goals_progress: List[GoalProgress] = []

    # Next week
    recommendations: List[str] = []
    suggested_focus: str

class HealthScore(BaseModel):
    """Overall health score calculation."""
    overall_score: int = Field(..., ge=0, le=100)
    score_category: str = Field(..., description="excellent, good, fair, needs_improvement")

    # Component scores
    fitness_score: int = Field(..., ge=0, le=100)
    nutrition_score: int = Field(..., ge=0, le=100)
    consistency_score: int = Field(..., ge=0, le=100)

    # Analysis
    strengths: List[str] = []
    improvement_areas: List[str] = []

    # Trends
    score_trend: str = Field(..., description="improving, stable, declining")
    previous_score: Optional[int] = None

    # Recommendations
    quick_wins: List[str] = []
    long_term_goals: List[str] = []

    # Metadata
    calculated_at: datetime
    time_period: str
    data_quality: str = Field(..., description="excellent, good, limited")

# Specialized insights
class NutritionInsight(BaseModel):
    """Nutrition-specific insights."""
    insight_type: str = Field(..., description="macro_balance, timing, variety, quality")

    # Macro analysis
    protein_adequacy: Optional[str] = None
    carb_timing: Optional[str] = None
    fat_quality: Optional[str] = None

    # Patterns
    meal_timing_pattern: Optional[str] = None
    food_variety_score: Optional[float] = None

    # Recommendations
    macro_adjustments: List[str] = []
    timing_suggestions: List[str] = []
    food_suggestions: List[str] = []

class FitnessInsight(BaseModel):
    """Fitness-specific insights."""
    insight_type: str = Field(..., description="intensity, variety, recovery, progression")

    # Training analysis
    workout_variety_score: Optional[float] = None
    intensity_balance: Optional[str] = None
    recovery_adequacy: Optional[str] = None

    # Progression
    strength_progression: Optional[str] = None
    endurance_progression: Optional[str] = None

    # Recommendations
    training_adjustments: List[str] = []
    recovery_suggestions: List[str] = []
    progression_plan: List[str] = []

# Real-time insights
class LiveInsight(BaseModel):
    """Real-time insight during activity."""
    insight_type: str = Field(..., description="pace, form, hydration, energy")
    priority: str = Field(..., description="low, medium, high, critical")

    message: str
    action_required: bool = False
    dismiss_after_seconds: Optional[int] = 10

    # Context
    activity_context: Dict[str, Any] = {}
    user_safety_related: bool = False
