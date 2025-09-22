"""
Centralized statistics calculation for health data.
Provides reusable statistical analysis functions for all health logging types.
"""

from typing import List, Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from app.utils.date_helpers import DateRangeCalculator, PeriodAggregator


class HealthStatisticsCalculator:
    """Centralized statistics calculation for health data."""
    
    @staticmethod
    def calculate_aggregates(
        logs: List[Any], 
        fields_to_sum: List[str], 
        fields_to_avg: Optional[List[str]] = None,
        count_field: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate basic aggregates (sum, average, count) for specified fields.
        
        Args:
            logs: List of log objects
            fields_to_sum: List of field names to sum
            fields_to_avg: List of field names to average (optional)
            count_field: Field name to count (defaults to counting all logs)
            
        Returns:
            Dictionary with calculated aggregates
        """
        if not logs:
            return {field: 0 for field in fields_to_sum + (fields_to_avg or [])}
        
        results = {}
        
        # Calculate sums
        for field in fields_to_sum:
            total = sum(getattr(log, field, 0) or 0 for log in logs)
            results[f"total_{field}"] = total
        
        # Calculate averages
        if fields_to_avg:
            for field in fields_to_avg:
                values = [getattr(log, field, 0) or 0 for log in logs if getattr(log, field, None) is not None]
                avg = sum(values) / len(values) if values else 0
                results[f"avg_{field}"] = round(avg, 1)
        
        # Calculate count
        if count_field:
            count = sum(1 for log in logs if getattr(log, count_field, None) is not None)
        else:
            count = len(logs)
        
        results["count"] = count
        
        return results
    
    @staticmethod
    def calculate_fitness_stats(logs: List[Any]) -> Dict[str, Any]:
        """Calculate fitness-specific statistics."""
        if not logs:
            return {
                "totalWorkouts": 0,
                "totalDuration": 0,
                "totalCalories": 0,
                "averageDifficulty": 0,
                "currentStreak": 0
            }
        
        aggregates = HealthStatisticsCalculator.calculate_aggregates(
            logs,
            fields_to_sum=["duration_minutes", "calories_burned"],
            count_field="activity_type"
        )
        
        # Calculate current streak
        from app.utils.date_helpers import StreakCalculator
        current_streak = StreakCalculator.calculate_streak(logs, "activity_date")
        
        return {
            "totalWorkouts": aggregates["count"],
            "totalDuration": aggregates["total_duration_minutes"],
            "totalCalories": aggregates["total_calories_burned"],
            "averageDifficulty": 0,  # Not available in current model
            "currentStreak": current_streak
        }
    
    @staticmethod
    def calculate_nutrition_stats(logs: List[Any]) -> Dict[str, Any]:
        """Calculate nutrition-specific statistics."""
        if not logs:
            return {
                "totalMeals": 0,
                "totalCalories": 0,
                "totalProtein": 0,
                "totalCarbs": 0,
                "totalFat": 0,
                "totalFiber": 0,
                "totalSugar": 0,
                "totalSodium": 0,
                "avgCaloriesPerMeal": 0,
                "currentStreak": 0
            }
        
        aggregates = HealthStatisticsCalculator.calculate_aggregates(
            logs,
            fields_to_sum=["total_calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg"],
            count_field="meal_type"
        )
        
        # Calculate average calories per meal
        avg_calories_per_meal = aggregates["total_calories"] / aggregates["count"] if aggregates["count"] > 0 else 0
        
        # Calculate current streak
        from app.utils.date_helpers import StreakCalculator
        current_streak = StreakCalculator.calculate_streak(logs, "meal_date")
        
        return {
            "totalMeals": aggregates["count"],
            "totalCalories": aggregates["total_calories"],
            "totalProtein": round(aggregates["total_protein_g"], 1),
            "totalCarbs": round(aggregates["total_carbs_g"], 1),
            "totalFat": round(aggregates["total_fat_g"], 1),
            "totalFiber": round(aggregates["total_fiber_g"], 1),
            "totalSugar": round(aggregates["total_sugar_g"], 1),
            "totalSodium": round(aggregates["total_sodium_mg"], 1),
            "avgCaloriesPerMeal": round(avg_calories_per_meal, 1),
            "currentStreak": current_streak
        }
    
    @staticmethod
    def calculate_weekly_trends(logs: List[Any], date_field: str, 
                              metric_field: str) -> Dict[str, Any]:
        """
        Calculate weekly trends for a specific metric.
        
        Args:
            logs: List of log objects
            date_field: Name of the date field
            metric_field: Name of the metric field to analyze
            
        Returns:
            Dictionary with weekly trend data
        """
        if not logs:
            return {"message": "No data available"}
        
        # Group by week
        weekly_data = PeriodAggregator.group_by_week(logs, date_field)
        
        # Calculate weekly metrics
        weeks = []
        for week, week_logs in sorted(weekly_data.items()):
            week_total = sum(getattr(log, metric_field, 0) or 0 for log in week_logs)
            weeks.append({
                "week": week,
                "count": len(week_logs),
                "total": week_total,
                "average": week_total / len(week_logs) if week_logs else 0
            })
        
        # Calculate trend
        if len(weeks) >= 2:
            recent_avg = sum(w["total"] for w in weeks[-2:]) / 2
            older_avg = sum(w["total"] for w in weeks[:-2]) / max(1, len(weeks) - 2)
            trend = "increasing" if recent_avg > older_avg else "decreasing" if recent_avg < older_avg else "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "weekly_data": weeks,
            "trend": trend,
            "total_count": sum(w["count"] for w in weeks),
            "avg_per_week": sum(w["count"] for w in weeks) / max(1, len(weeks))
        }
    
    @staticmethod
    def calculate_daily_breakdown(logs: List[Any], date_field: str, 
                                group_field: str) -> Dict[str, Any]:
        """
        Calculate daily breakdown by grouping field.
        
        Args:
            logs: List of log objects
            date_field: Name of the date field
            group_field: Name of the field to group by
            
        Returns:
            Dictionary with daily breakdown
        """
        if not logs:
            return {}
        
        daily_data = PeriodAggregator.group_by_day(logs, date_field)
        
        breakdown = {}
        for day, day_logs in daily_data.items():
            day_breakdown = {}
            for log in day_logs:
                group_value = getattr(log, group_field, "unknown")
                day_breakdown[group_value] = day_breakdown.get(group_value, 0) + 1
            breakdown[day] = day_breakdown
        
        return breakdown
    
    @staticmethod
    def calculate_correlations(logs_a: List[Any], logs_b: List[Any], 
                             date_field_a: str, date_field_b: str,
                             metric_field_a: str, metric_field_b: str) -> List[Dict[str, Any]]:
        """
        Calculate correlations between two sets of logs.
        
        Args:
            logs_a: First set of logs
            logs_b: Second set of logs
            date_field_a: Date field name for logs_a
            date_field_b: Date field name for logs_b
            metric_field_a: Metric field name for logs_a
            metric_field_b: Metric field name for logs_b
            
        Returns:
            List of correlation insights
        """
        correlations = []
        
        if not logs_a or not logs_b:
            return correlations
        
        # Group by date
        dates_a = {getattr(log, date_field_a, log.created_at).date(): log for log in logs_a}
        dates_b = {getattr(log, date_field_b, log.created_at).date(): log for log in logs_b}
        
        # Find common dates
        common_dates = set(dates_a.keys()) & set(dates_b.keys())
        
        if len(common_dates) < 2:
            return correlations
        
        # Calculate correlation
        values_a = [getattr(dates_a[date], metric_field_a, 0) or 0 for date in common_dates]
        values_b = [getattr(dates_b[date], metric_field_b, 0) or 0 for date in common_dates]
        
        if values_a and values_b:
            avg_a = sum(values_a) / len(values_a)
            avg_b = sum(values_b) / len(values_b)
            
            if avg_a > avg_b * 1.1:
                correlations.append({
                    "type": "positive_correlation",
                    "description": f"Higher {metric_field_a} correlates with higher {metric_field_b}",
                    "strength": "moderate",
                    "data": {
                        f"avg_{metric_field_a}": round(avg_a, 1),
                        f"avg_{metric_field_b}": round(avg_b, 1)
                    }
                })
        
        return correlations
