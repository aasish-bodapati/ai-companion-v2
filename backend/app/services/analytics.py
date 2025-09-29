"""
Analytics service for health data insights and trends.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.models.health.fitness_log import FitnessLog, NutritionLog, MoodLog
from app.models.health.food_log_items import FoodLogItem
from app.services.common.statistics import HealthStatisticsCalculator
from app.utils.date_helpers import PeriodAggregator


class HealthAnalyticsService:
    """Service for analyzing health data and generating insights."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_weekly_trends(self, user_id: str, weeks: int = 4) -> Dict[str, any]:
        """Get weekly trends for fitness and nutrition."""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(weeks=weeks)
        
        # Fitness trends
        fitness_logs = self.db.query(FitnessLog).filter(
            and_(
                FitnessLog.user_id == user_id,
                FitnessLog.activity_date >= start_date,
                FitnessLog.activity_date <= end_date
            )
        ).all()
        
        # Nutrition trends
        nutrition_logs = self.db.query(NutritionLog).filter(
            and_(
                NutritionLog.user_id == user_id,
                NutritionLog.meal_date >= start_date,
                NutritionLog.meal_date <= end_date
            )
        ).all()
        
        # Calculate trends
        fitness_trends = self._calculate_fitness_trends(fitness_logs)
        nutrition_trends = self._calculate_nutrition_trends(nutrition_logs)
        
        return {
            "fitness": fitness_trends,
            "nutrition": nutrition_trends,
            "period": f"Last {weeks} weeks",
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_correlation_insights(self, user_id: str, days: int = 30) -> Dict[str, any]:
        """Find correlations between mood, nutrition, and fitness."""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Get all logs for the period
        fitness_logs = self.db.query(FitnessLog).filter(
            and_(
                FitnessLog.user_id == user_id,
                FitnessLog.activity_date >= start_date,
                FitnessLog.activity_date <= end_date
            )
        ).all()
        
        nutrition_logs = self.db.query(NutritionLog).filter(
            and_(
                NutritionLog.user_id == user_id,
                NutritionLog.meal_date >= start_date,
                NutritionLog.meal_date <= end_date
            )
        ).all()
        
        mood_logs = self.db.query(MoodLog).filter(
            and_(
                MoodLog.user_id == user_id,
                MoodLog.log_date >= start_date,
                MoodLog.log_date <= end_date
            )
        ).all()
        
        # Analyze correlations
        correlations = self._analyze_correlations(fitness_logs, nutrition_logs, mood_logs)
        
        return {
            "correlations": correlations,
            "period": f"Last {days} days",
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_personalized_recommendations(self, user_id: str) -> Dict[str, any]:
        """Generate personalized recommendations based on user data."""
        # Get recent data (last 30 days)
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=30)
        
        fitness_logs = self.db.query(FitnessLog).filter(
            and_(
                FitnessLog.user_id == user_id,
                FitnessLog.activity_date >= start_date,
                FitnessLog.activity_date <= end_date
            )
        ).all()
        
        nutrition_logs = self.db.query(NutritionLog).filter(
            and_(
                NutritionLog.user_id == user_id,
                NutritionLog.meal_date >= start_date,
                NutritionLog.meal_date <= end_date
            )
        ).all()
        
        # Generate recommendations
        recommendations = self._generate_recommendations(fitness_logs, nutrition_logs)
        
        return {
            "recommendations": recommendations,
            "based_on": "Last 30 days of data",
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    def _calculate_fitness_trends(self, logs: List[FitnessLog]) -> Dict[str, any]:
        """Calculate fitness trends from logs using centralized statistics."""
        if not logs:
            return {"message": "No fitness data available"}
        
        # Use the centralized weekly trends calculator
        trends = HealthStatisticsCalculator.calculate_weekly_trends(
            logs, 
            date_field="activity_date", 
            metric_field="duration_minutes"
        )
        
        # Add fitness-specific metrics
        weekly_data = trends.get("weekly_data", [])
        for week_data in weekly_data:
            week_logs = [log for log in logs if log.activity_date.strftime("%Y-%m-%d") == week_data["week"]]
            week_data["unique_activities"] = len(set(log.activity_type for log in week_logs))
            week_data["total_calories"] = sum(log.calories_burned or 0 for log in week_logs)
        
        return {
            "weekly_data": weekly_data,
            "trend": trends.get("trend", "insufficient_data"),
            "total_workouts": trends.get("total_count", 0),
            "avg_workouts_per_week": trends.get("avg_per_week", 0)
        }
    
    def _calculate_nutrition_trends(self, logs: List[NutritionLog]) -> Dict[str, any]:
        """Calculate nutrition trends from logs using centralized statistics."""
        if not logs:
            return {"message": "No nutrition data available"}
        
        # Use the centralized weekly trends calculator
        trends = HealthStatisticsCalculator.calculate_weekly_trends(
            logs, 
            date_field="meal_date", 
            metric_field="total_calories"
        )
        
        # Add nutrition-specific metrics
        weekly_data = trends.get("weekly_data", [])
        for week_data in weekly_data:
            week_logs = [log for log in logs if log.meal_date.strftime("%Y-%m-%d") == week_data["week"]]
            week_data["meals"] = len(week_logs)
            week_data["avg_calories_per_meal"] = week_data["total"] / max(1, len(week_logs))
            week_data["total_protein"] = sum(log.protein_g or 0 for log in week_logs)
            week_data["total_carbs"] = sum(log.carbs_g or 0 for log in week_logs)
            week_data["total_fat"] = sum(log.fat_g or 0 for log in week_logs)
        
        return {
            "weekly_data": weekly_data,
            "total_meals": trends.get("total_count", 0),
            "avg_meals_per_week": trends.get("avg_per_week", 0)
        }
    
    def _analyze_correlations(self, fitness_logs: List[FitnessLog], 
                            nutrition_logs: List[NutritionLog], 
                            mood_logs: List[MoodLog]) -> List[Dict[str, any]]:
        """Analyze correlations between different health metrics using centralized calculator."""
        correlations = []
        
        # Use the centralized correlation calculator
        if fitness_logs and nutrition_logs:
            correlations.extend(
                HealthStatisticsCalculator.calculate_correlations(
                    fitness_logs, nutrition_logs,
                    "activity_date", "meal_date",
                    "calories_burned", "total_calories"
                )
            )
        
        # Add custom correlation analysis
        if fitness_logs and nutrition_logs:
            # Check if workout days have different nutrition patterns
            workout_days = set(log.activity_date.date() for log in fitness_logs)
            non_workout_days = set()
            
            # Find non-workout days
            all_dates = set()
            for log in nutrition_logs:
                all_dates.add(log.meal_date.date())
            
            non_workout_days = all_dates - workout_days
            
            if workout_days and non_workout_days:
                workout_calories = [
                    log.total_calories for log in nutrition_logs 
                    if log.meal_date.date() in workout_days
                ]
                non_workout_calories = [
                    log.total_calories for log in nutrition_logs 
                    if log.meal_date.date() in non_workout_days
                ]
                
                if workout_calories and non_workout_calories:
                    avg_workout_calories = sum(workout_calories) / len(workout_calories)
                    avg_non_workout_calories = sum(non_workout_calories) / len(non_workout_calories)
                    
                    if avg_workout_calories > avg_non_workout_calories * 1.1:
                        correlations.append({
                            "type": "nutrition_workout",
                            "description": "You tend to eat more calories on workout days",
                            "strength": "moderate",
                            "data": {
                                "workout_days_avg": round(avg_workout_calories, 1),
                                "non_workout_days_avg": round(avg_non_workout_calories, 1)
                            }
                        })
        
        return correlations
    
    def _generate_recommendations(self, fitness_logs: List[FitnessLog], 
                                nutrition_logs: List[NutritionLog]) -> List[Dict[str, any]]:
        """Generate personalized recommendations."""
        recommendations = []
        
        # Fitness recommendations
        if fitness_logs:
            recent_workouts = [log for log in fitness_logs if log.activity_date >= datetime.now(timezone.utc) - timedelta(days=7)]
            
            if len(recent_workouts) < 3:
                recommendations.append({
                    "category": "fitness",
                    "priority": "high",
                    "title": "Increase Workout Frequency",
                    "description": "You've only worked out {} times this week. Try to aim for at least 3 workouts per week.".format(len(recent_workouts)),
                    "action": "Schedule your next workout"
                })
            
            # Check for variety
            activity_types = set(log.activity_type for log in recent_workouts)
            if len(activity_types) < 2:
                recommendations.append({
                    "category": "fitness",
                    "priority": "medium",
                    "title": "Add Variety to Your Workouts",
                    "description": "You've been doing mostly {} workouts. Try adding some variety!".format(list(activity_types)[0]),
                    "action": "Try a different type of exercise"
                })
        
        # Nutrition recommendations
        if nutrition_logs:
            recent_meals = [log for log in nutrition_logs if log.meal_date >= datetime.now(timezone.utc) - timedelta(days=7)]
            
            if recent_meals:
                avg_calories = sum(log.total_calories for log in recent_meals) / len(recent_meals)
                avg_protein = sum(log.protein_g or 0 for log in recent_meals) / len(recent_meals)
                
                if avg_protein < 20:  # Low protein
                    recommendations.append({
                        "category": "nutrition",
                        "priority": "medium",
                        "title": "Increase Protein Intake",
                        "description": "Your average protein intake is {:.1f}g per meal. Consider adding more protein-rich foods.".format(avg_protein),
                        "action": "Add lean protein to your next meal"
                    })
        
        return recommendations
