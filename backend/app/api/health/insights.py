"""
Health Insights & Smart Suggestions API.
Provides instant feedback, pattern recognition, and personalized recommendations.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.health.fitness_log import FitnessLog, NutritionLog
from app.models.health.simple_routine import SimpleRoutine, SimpleUserRoutineProgress
from app.models.health.nutrition_routine import NutritionRoutine, NutritionUserRoutineProgress
from app.models.health.exercise_database import Exercise, UserExerciseHistory
from app.models.health.food_database import Food, UserFoodHistory
from app.schemas.health.insights import (
    InstantFeedback, ProgressInsight, PatternAnalysis, SmartRecommendation,
    PersonalizedSuggestions, HealthTrend, GoalProgress, ComparisonInsight,
    MotivationalMessage, AchievementUnlock, WeeklyReport, HealthScore
)
import logging
import statistics

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/instant-feedback/{log_type}/{log_id}", response_model=InstantFeedback)
async def get_instant_feedback(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_type: str,  # "fitness" or "nutrition"
    log_id: str
):
    """Get instant feedback after logging an activity."""
    try:
        if log_type == "fitness":
            log_entry = db.query(FitnessLog).filter(
                and_(FitnessLog.id == log_id, FitnessLog.user_id == current_user.id)
            ).first()
            
            if not log_entry:
                raise HTTPException(status_code=404, detail="Fitness log not found")
            
            feedback = await generate_fitness_feedback(db, current_user.id, log_entry)
            
        elif log_type == "nutrition":
            log_entry = db.query(NutritionLog).filter(
                and_(NutritionLog.id == log_id, NutritionLog.user_id == current_user.id)
            ).first()
            
            if not log_entry:
                raise HTTPException(status_code=404, detail="Nutrition log not found")
            
            feedback = await generate_nutrition_feedback(db, current_user.id, log_entry)
            
        else:
            raise HTTPException(status_code=400, detail="Invalid log type")
        
        return feedback
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating instant feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate feedback")


@router.get("/suggestions", response_model=PersonalizedSuggestions)
async def get_personalized_suggestions(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    suggestion_type: Optional[str] = Query(None, description="fitness, nutrition, or all"),
    time_context: Optional[str] = Query(None, description="morning, afternoon, evening"),
    limit: int = Query(10, ge=1, le=20, description="Number of suggestions")
):
    """Get personalized suggestions based on user patterns and context."""
    try:
        # Analyze user patterns
        patterns = await analyze_user_patterns(db, current_user.id)
        
        # Generate context-aware suggestions
        fitness_suggestions = []
        nutrition_suggestions = []
        
        if suggestion_type in [None, "fitness", "all"]:
            fitness_suggestions = await generate_fitness_suggestions(
                db, current_user.id, patterns, time_context, limit // 2
            )
        
        if suggestion_type in [None, "nutrition", "all"]:
            nutrition_suggestions = await generate_nutrition_suggestions(
                db, current_user.id, patterns, time_context, limit // 2
            )
        
        # Combine and rank suggestions
        all_suggestions = fitness_suggestions + nutrition_suggestions
        all_suggestions.sort(key=lambda x: x.priority_score, reverse=True)
        
        return PersonalizedSuggestions(
            suggestions=all_suggestions[:limit],
            user_patterns=patterns,
            context_factors=get_context_factors(time_context),
            generated_at=datetime.now(timezone.utc),
            refresh_interval_minutes=15
        )
        
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate suggestions")


@router.get("/patterns", response_model=List[PatternAnalysis])
async def get_user_patterns(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days_back: int = Query(30, ge=7, le=90, description="Days to analyze"),
    pattern_type: Optional[str] = Query(None, description="time, activity, nutrition")
):
    """Analyze user patterns and habits."""
    try:
        patterns = await analyze_detailed_patterns(
            db, current_user.id, days_back, pattern_type
        )
        
        return patterns
        
    except Exception as e:
        logger.error(f"Error analyzing patterns: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze patterns")


@router.get("/trends", response_model=List[HealthTrend])
async def get_health_trends(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    metric: Optional[str] = Query(None, description="calories, workouts, protein, etc."),
    period: str = Query("week", description="week, month, quarter"),
    trend_type: str = Query("all", description="positive, negative, all")
):
    """Get health trends and progress over time."""
    try:
        trends = await calculate_health_trends(
            db, current_user.id, metric, period, trend_type
        )
        
        return trends
        
    except Exception as e:
        logger.error(f"Error calculating trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate trends")


@router.get("/goals/progress", response_model=List[GoalProgress])
async def get_goal_progress(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    time_frame: str = Query("week", description="day, week, month"),
    goal_type: Optional[str] = Query(None, description="fitness, nutrition, overall")
):
    """Get progress towards user goals."""
    try:
        progress = await calculate_goal_progress(
            db, current_user.id, time_frame, goal_type
        )
        
        return progress
        
    except Exception as e:
        logger.error(f"Error calculating goal progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate goal progress")


@router.get("/comparisons", response_model=List[ComparisonInsight])
async def get_comparison_insights(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    comparison_type: str = Query("personal", description="personal, peer, optimal"),
    metric: Optional[str] = Query(None, description="Specific metric to compare")
):
    """Get comparison insights (vs previous periods, goals, etc.)."""
    try:
        insights = await generate_comparison_insights(
            db, current_user.id, comparison_type, metric
        )
        
        return insights
        
    except Exception as e:
        logger.error(f"Error generating comparisons: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate comparisons")


@router.get("/motivation", response_model=MotivationalMessage)
async def get_motivational_message(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    context: Optional[str] = Query(None, description="Context for motivation")
):
    """Get personalized motivational message."""
    try:
        message = await generate_motivational_message(
            db, current_user.id, context
        )
        
        return message
        
    except Exception as e:
        logger.error(f"Error generating motivation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate motivation")


@router.get("/achievements", response_model=List[AchievementUnlock])
async def check_achievements(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    check_recent: bool = Query(True, description="Only check recent achievements")
):
    """Check for unlocked achievements."""
    try:
        achievements = await check_user_achievements(
            db, current_user.id, check_recent
        )
        
        return achievements
        
    except Exception as e:
        logger.error(f"Error checking achievements: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check achievements")


@router.get("/weekly-report", response_model=WeeklyReport)
async def get_weekly_report(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    week_offset: int = Query(0, description="0 for current week, -1 for last week")
):
    """Get comprehensive weekly health report."""
    try:
        report = await generate_weekly_report(
            db, current_user.id, week_offset
        )
        
        return report
        
    except Exception as e:
        logger.error(f"Error generating weekly report: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate weekly report")


@router.get("/health-score", response_model=HealthScore)
async def get_health_score(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    time_period: str = Query("week", description="day, week, month")
):
    """Get overall health score based on activities."""
    try:
        score = await calculate_health_score(
            db, current_user.id, time_period
        )
        
        return score
        
    except Exception as e:
        logger.error(f"Error calculating health score: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate health score")


# Helper functions

async def generate_fitness_feedback(
    db: Session, user_id: str, log_entry: FitnessLog
) -> InstantFeedback:
    """Generate instant feedback for fitness logging."""
    
    insights = []
    achievements = []
    recommendations = []
    
    # Compare with recent workouts
    recent_workouts = db.query(FitnessLog).filter(
        and_(
            FitnessLog.user_id == user_id,
            FitnessLog.activity_type == log_entry.activity_type,
            FitnessLog.id != log_entry.id
        )
    ).order_by(desc(FitnessLog.activity_date)).limit(5).all()
    
    if recent_workouts:
        avg_duration = statistics.mean([w.duration_minutes for w in recent_workouts if w.duration_minutes])
        avg_calories = statistics.mean([w.calories_burned for w in recent_workouts if w.calories_burned])
        
        if log_entry.duration_minutes and avg_duration:
            duration_diff = log_entry.duration_minutes - avg_duration
            if duration_diff > 5:
                insights.append(f"Great job! You worked out {duration_diff:.0f} minutes longer than your average")
            elif duration_diff < -5:
                insights.append(f"Shorter workout today, but consistency matters more than duration")
        
        if log_entry.calories_burned and avg_calories:
            calorie_diff = log_entry.calories_burned - avg_calories
            if calorie_diff > 50:
                insights.append(f"You burned {calorie_diff:.0f} more calories than usual! 🔥")
    
    # Check for achievements
    total_workouts = db.query(func.count(FitnessLog.id)).filter(
        FitnessLog.user_id == user_id
    ).scalar()
    
    if total_workouts == 1:
        achievements.append("First workout logged! Welcome to your fitness journey! 🎉")
    elif total_workouts % 5 == 0:
        achievements.append(f"Milestone reached: {total_workouts} workouts completed! 🏆")
    
    # Generate recommendations
    if log_entry.intensity == "high":
        recommendations.append("Consider a recovery day or light activity tomorrow")
    elif log_entry.intensity == "low":
        recommendations.append("Try increasing intensity gradually in your next session")
    
    if log_entry.duration_minutes and log_entry.duration_minutes < 20:
        recommendations.append("Aim for at least 30 minutes next time for optimal benefits")
    
    return InstantFeedback(
        feedback_type="fitness",
        primary_message=f"Workout completed! {log_entry.duration_minutes or 0} minutes of {log_entry.activity_type}",
        insights=insights,
        achievements=achievements,
        recommendations=recommendations,
        celebration_worthy=len(achievements) > 0 or (log_entry.duration_minutes or 0) > 45,
        next_action_suggestion="Log your post-workout meal to complete your session",
        motivational_boost=get_fitness_motivation(total_workouts, log_entry)
    )


async def generate_nutrition_feedback(
    db: Session, user_id: str, log_entry: NutritionLog
) -> InstantFeedback:
    """Generate instant feedback for nutrition logging."""
    
    insights = []
    achievements = []
    recommendations = []
    
    # Calculate today's totals
    today = log_entry.meal_date.date()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    today_end = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)
    
    today_logs = db.query(NutritionLog).filter(
        and_(
            NutritionLog.user_id == user_id,
            NutritionLog.meal_date >= today_start,
            NutritionLog.meal_date <= today_end
        )
    ).all()
    
    total_calories = sum(log.total_calories for log in today_logs)
    total_protein = sum(log.protein_g or 0 for log in today_logs)
    total_meals = len(today_logs)
    
    # Generate insights
    insights.append(f"Today's total: {total_calories} calories, {total_protein:.1f}g protein from {total_meals} meal(s)")
    
    if total_protein >= 100:
        insights.append("Excellent! You've exceeded your daily protein goal 💪")
    elif total_protein >= 75:
        insights.append("You're on track with your protein intake!")
    
    # Check meal timing
    current_hour = datetime.now(timezone.utc).hour
    if log_entry.meal_type == "breakfast" and 6 <= current_hour <= 10:
        insights.append("Perfect timing for breakfast! Starting your day right")
    
    # Achievements
    total_meals_all_time = db.query(func.count(NutritionLog.id)).filter(
        NutritionLog.user_id == user_id
    ).scalar()
    
    if total_meals_all_time == 1:
        achievements.append("First meal logged! Great start to tracking your nutrition! 🍽️")
    elif total_meals_all_time % 10 == 0:
        achievements.append(f"Nutrition milestone: {total_meals_all_time} meals logged! 🌟")
    
    # Recommendations
    if (log_entry.protein_g or 0) < 15 and log_entry.meal_type in ["breakfast", "lunch", "dinner"]:
        recommendations.append("Try adding more protein to your next meal")
    
    if total_calories < 1200 and total_meals >= 2:
        recommendations.append("Make sure you're eating enough to fuel your activities")
    elif total_calories > 2500 and total_meals >= 3:
        recommendations.append("Consider portion sizes and nutrient density")
    
    return InstantFeedback(
        feedback_type="nutrition",
        primary_message=f"{log_entry.meal_type.title()} logged: {log_entry.total_calories} calories",
        insights=insights,
        achievements=achievements,
        recommendations=recommendations,
        celebration_worthy=len(achievements) > 0 or total_protein >= 100,
        next_action_suggestion=get_next_meal_suggestion(log_entry.meal_type, current_hour),
        motivational_boost=get_nutrition_motivation(total_meals_all_time, total_protein)
    )


async def analyze_user_patterns(db: Session, user_id: str) -> Dict[str, Any]:
    """Analyze user patterns for personalized suggestions."""
    
    # Get last 30 days of data
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
    
    fitness_logs = db.query(FitnessLog).filter(
        and_(
            FitnessLog.user_id == user_id,
            FitnessLog.activity_date >= cutoff_date
        )
    ).all()
    
    nutrition_logs = db.query(NutritionLog).filter(
        and_(
            NutritionLog.user_id == user_id,
            NutritionLog.meal_date >= cutoff_date
        )
    ).all()
    
    patterns = {
        "workout_frequency": len(fitness_logs) / 30,
        "meal_logging_frequency": len(nutrition_logs) / 30,
        "preferred_workout_times": [],
        "preferred_activities": {},
        "avg_workout_duration": 0,
        "consistency_score": 0
    }
    
    if fitness_logs:
        # Analyze workout times
        workout_hours = [log.activity_date.hour for log in fitness_logs]
        patterns["preferred_workout_times"] = list(set(workout_hours))
        
        # Analyze preferred activities
        activity_counts = {}
        for log in fitness_logs:
            activity_counts[log.activity_type] = activity_counts.get(log.activity_type, 0) + 1
        patterns["preferred_activities"] = activity_counts
        
        # Average duration
        durations = [log.duration_minutes for log in fitness_logs if log.duration_minutes]
        if durations:
            patterns["avg_workout_duration"] = statistics.mean(durations)
    
    return patterns


async def generate_fitness_suggestions(
    db: Session, user_id: str, patterns: Dict[str, Any], time_context: Optional[str], limit: int
) -> List[SmartRecommendation]:
    """Generate fitness suggestions based on patterns."""
    
    suggestions = []
    
    # Get user's favorite exercises
    user_history = db.query(UserExerciseHistory).filter(
        UserExerciseHistory.user_id == user_id
    ).order_by(desc(UserExerciseHistory.times_performed)).limit(5).all()
    
    for history in user_history[:limit]:
        if history.exercise:
            suggestion = SmartRecommendation(
                suggestion_type="fitness",
                title=f"Try {history.exercise.name}",
                description=f"You've done this {history.times_performed} times before",
                action_type="log_exercise",
                action_data={"exercise_id": history.exercise.id},
                priority_score=0.8,
                reasoning=f"Based on your exercise history",
                estimated_benefit="Familiar exercise you enjoy",
                time_sensitive=time_context in patterns.get("preferred_workout_times", [])
            )
            suggestions.append(suggestion)
    
    return suggestions


async def generate_nutrition_suggestions(
    db: Session, user_id: str, patterns: Dict[str, Any], time_context: Optional[str], limit: int
) -> List[SmartRecommendation]:
    """Generate nutrition suggestions based on patterns."""
    
    suggestions = []
    
    # Get user's favorite foods
    user_history = db.query(UserFoodHistory).filter(
        UserFoodHistory.user_id == user_id
    ).order_by(desc(UserFoodHistory.times_logged)).limit(5).all()
    
    for history in user_history[:limit]:
        if history.food:
            suggestion = SmartRecommendation(
                suggestion_type="nutrition",
                title=f"Log {history.food.name}",
                description=f"You've logged this {history.times_logged} times",
                action_type="log_food",
                action_data={"food_id": history.food.id},
                priority_score=0.7,
                reasoning="Based on your food preferences",
                estimated_benefit=f"Quick logging of familiar food",
                time_sensitive=False
            )
            suggestions.append(suggestion)
    
    return suggestions


def get_context_factors(time_context: Optional[str]) -> Dict[str, Any]:
    """Get context factors for suggestions."""
    
    factors = {
        "current_time": datetime.now(timezone.utc),
        "time_context": time_context
    }
    
    if time_context == "morning":
        factors.update({
            "energy_level": "high",
            "meal_suggestions": ["breakfast"],
            "workout_suitability": "excellent"
        })
    elif time_context == "evening":
        factors.update({
            "energy_level": "moderate",
            "meal_suggestions": ["dinner"],
            "workout_suitability": "good"
        })
    
    return factors


def get_fitness_motivation(total_workouts: int, log_entry: FitnessLog) -> str:
    """Get fitness-specific motivational message."""
    
    if total_workouts == 1:
        return "Every journey begins with a single step. You've taken yours! 🚀"
    elif total_workouts < 10:
        return "Building healthy habits one workout at a time! Keep going! 💪"
    elif total_workouts < 50:
        return "You're developing real consistency. Your body is getting stronger! 🔥"
    else:
        return "You're a fitness champion! Your dedication is truly inspiring! 🏆"


def get_nutrition_motivation(total_meals: int, protein: float) -> str:
    """Get nutrition-specific motivational message."""
    
    if total_meals == 1:
        return "Great start! Tracking nutrition is the first step to better health! 🌱"
    elif protein >= 100:
        return "Protein goal smashed! Your muscles are thanking you! 💪"
    elif total_meals % 10 == 0:
        return f"Wow! {total_meals} meals logged. You're building amazing habits! ⭐"
    else:
        return "Every healthy choice counts. You're doing great! 🌟"


def get_next_meal_suggestion(meal_type: str, current_hour: int) -> str:
    """Suggest next meal action based on current meal and time."""
    
    if meal_type == "breakfast":
        return "Stay hydrated and consider a healthy mid-morning snack"
    elif meal_type == "lunch":
        return "Great job! Plan a nutritious dinner for later"
    elif meal_type == "dinner":
        return "Perfect! Consider some light stretching before bed"
    else:
        return "Nice snack choice! Keep up the healthy eating"


# Additional helper functions would go here for:
# - analyze_detailed_patterns
# - calculate_health_trends  
# - calculate_goal_progress
# - generate_comparison_insights
# - generate_motivational_message
# - check_user_achievements
# - generate_weekly_report
# - calculate_health_score

# These would be implemented similarly with comprehensive analysis logic
