"""
Analytics service for health data insights and trends.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.models.health.fitness_log import FitnessLog, NutritionLog, MoodLog
from app.models.health.food_log_items import FoodLogItem


class HealthAnalyticsService:
    """Service for analyzing health data and generating insights."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_weekly_trends(self, user_id: str, weeks: int = 4) -> Dict[str, any]:
        """Get weekly trends for fitness and nutrition."""
        end_date = datetime.now()
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
            "generated_at": datetime.now().isoformat()
        }
    
    async def get_correlation_insights(self, user_id: str, days: int = 30) -> Dict[str, any]:
        """Find correlations between mood, nutrition, and fitness."""
        end_date = datetime.now()
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
            "generated_at": datetime.now().isoformat()
        }
    
    async def get_personalized_recommendations(self, user_id: str) -> Dict[str, any]:
        """Generate personalized recommendations based on user data."""
        # Get recent data (last 30 days)
        end_date = datetime.now()
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
            "generated_at": datetime.now().isoformat()
        }
    
    def _calculate_fitness_trends(self, logs: List[FitnessLog]) -> Dict[str, any]:
        """Calculate fitness trends from logs."""
        if not logs:
            return {"message": "No fitness data available"}
        
        # Group by week
        weekly_data = {}
        for log in logs:
            week_start = log.activity_date - timedelta(days=log.activity_date.weekday())
            week_key = week_start.strftime("%Y-%m-%d")
            
            if week_key not in weekly_data:
                weekly_data[week_key] = {
                    "workouts": 0,
                    "total_duration": 0,
                    "total_calories": 0,
                    "activities": set()
                }
            
            weekly_data[week_key]["workouts"] += 1
            weekly_data[week_key]["total_duration"] += log.duration_minutes
            weekly_data[week_key]["total_calories"] += log.calories_burned or 0
            weekly_data[week_key]["activities"].add(log.activity_type)
        
        # Convert to list and calculate trends
        weeks = []
        for week, data in sorted(weekly_data.items()):
            weeks.append({
                "week": week,
                "workouts": data["workouts"],
                "total_duration": data["total_duration"],
                "total_calories": data["total_calories"],
                "unique_activities": len(data["activities"])
            })
        
        # Calculate trends
        if len(weeks) >= 2:
            recent_avg = sum(w["workouts"] for w in weeks[-2:]) / 2
            older_avg = sum(w["workouts"] for w in weeks[:-2]) / max(1, len(weeks) - 2)
            trend = "increasing" if recent_avg > older_avg else "decreasing" if recent_avg < older_avg else "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "weekly_data": weeks,
            "trend": trend,
            "total_workouts": sum(w["workouts"] for w in weeks),
            "avg_workouts_per_week": sum(w["workouts"] for w in weeks) / max(1, len(weeks))
        }
    
    def _calculate_nutrition_trends(self, logs: List[NutritionLog]) -> Dict[str, any]:
        """Calculate nutrition trends from logs."""
        if not logs:
            return {"message": "No nutrition data available"}
        
        # Group by week
        weekly_data = {}
        for log in logs:
            week_start = log.meal_date - timedelta(days=log.meal_date.weekday())
            week_key = week_start.strftime("%Y-%m-%d")
            
            if week_key not in weekly_data:
                weekly_data[week_key] = {
                    "meals": 0,
                    "total_calories": 0,
                    "total_protein": 0,
                    "total_carbs": 0,
                    "total_fat": 0
                }
            
            weekly_data[week_key]["meals"] += 1
            weekly_data[week_key]["total_calories"] += log.total_calories
            weekly_data[week_key]["total_protein"] += log.protein_g or 0
            weekly_data[week_key]["total_carbs"] += log.carbs_g or 0
            weekly_data[week_key]["total_fat"] += log.fat_g or 0
        
        # Convert to list
        weeks = []
        for week, data in sorted(weekly_data.items()):
            weeks.append({
                "week": week,
                "meals": data["meals"],
                "avg_calories_per_meal": data["total_calories"] / max(1, data["meals"]),
                "total_protein": data["total_protein"],
                "total_carbs": data["total_carbs"],
                "total_fat": data["total_fat"]
            })
        
        return {
            "weekly_data": weeks,
            "total_meals": sum(w["meals"] for w in weeks),
            "avg_meals_per_week": sum(w["meals"] for w in weeks) / max(1, len(weeks))
        }
    
    def _analyze_correlations(self, fitness_logs: List[FitnessLog], 
                            nutrition_logs: List[NutritionLog], 
                            mood_logs: List[MoodLog]) -> List[Dict[str, any]]:
        """Analyze correlations between different health metrics."""
        correlations = []
        
        # Example correlation analysis
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
            recent_workouts = [log for log in fitness_logs if log.activity_date >= datetime.now() - timedelta(days=7)]
            
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
            recent_meals = [log for log in nutrition_logs if log.meal_date >= datetime.now() - timedelta(days=7)]
            
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
