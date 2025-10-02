"""
Generic health logging service layer.
Provides high-level business logic for health logging operations.
"""

from typing import List, Optional, Dict, Any, Type, TypeVar, Generic
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.crud.common.generic_health_logging import GenericHealthLoggingCRUD
from app.services.common.statistics import HealthStatisticsCalculator
from app.utils.date_helpers import DateRangeCalculator, StreakCalculator, PeriodAggregator
from app.utils.timezone_handler import TimezoneHandler
from app.schemas.common.health_enums import TimePeriod, LogType, Priority

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class GenericHealthService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Generic service for health logging operations.
    Provides high-level business logic and orchestration.
    """
    
    def __init__(self, 
                 crud: GenericHealthLoggingCRUD[ModelType, CreateSchemaType, UpdateSchemaType],
                 log_type: LogType):
        """
        Initialize the generic health service.
        
        Args:
            crud: Generic CRUD instance
            log_type: Type of health log
        """
        self.crud = crud
        self.log_type = log_type
    
    async def get_user_insights(
        self, 
        db: Session, 
        user_id: int, 
        period: TimePeriod = TimePeriod.WEEK,
        user_timezone: str = "UTC"
    ) -> Dict[str, Any]:
        """
        Get comprehensive insights for a user's health logs.
        
        Args:
            db: Database session
            user_id: User ID
            period: Time period for analysis
            user_timezone: User's timezone
            
        Returns:
            Dictionary with insights and recommendations
        """
        # Get logs for the period
        if period == TimePeriod.CUSTOM:
            # For custom period, we'd need start/end dates
            logs = self.crud.get_user_logs(db, user_id)
        else:
            logs = self.crud.get_user_logs_by_period(db, user_id, period.value)
        
        # Calculate basic statistics
        stats = self.crud.calculate_user_stats(db, user_id, period.value)
        
        # Calculate trends
        trends = self.crud.get_weekly_trends(db, user_id, weeks=4)
        
        # Calculate streaks
        current_streak = self.crud.get_user_streak(db, user_id)
        longest_streak = self.crud.get_user_longest_streak(db, user_id)
        
        # Generate insights
        insights = self._generate_insights(logs, stats, trends, current_streak)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(logs, stats, current_streak)
        
        return {
            "log_type": self.log_type.value,
            "period": period.value,
            "stats": stats,
            "trends": trends,
            "streaks": {
                "current": current_streak,
                "longest": longest_streak
            },
            "insights": insights,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }
    
    async def get_user_dashboard_data(
        self, 
        db: Session, 
        user_id: int,
        user_timezone: str = "UTC"
    ) -> Dict[str, Any]:
        """
        Get dashboard data for a user.
        
        Args:
            db: Database session
            user_id: User ID
            user_timezone: User's timezone
            
        Returns:
            Dictionary with dashboard data
        """
        # Get today's logs
        today_logs = self.crud.get_user_logs_today(db, user_id)
        
        # Get recent logs
        recent_logs = self.crud.get_recent_logs(db, user_id, limit=5)
        
        # Get weekly stats
        weekly_stats = self.crud.calculate_user_stats(db, user_id, TimePeriod.WEEK.value)
        
        # Get current streak
        current_streak = self.crud.get_user_streak(db, user_id)
        
        # Get quick insights
        quick_insights = self._generate_quick_insights(today_logs, weekly_stats, current_streak)
        
        return {
            "log_type": self.log_type.value,
            "today": {
                "count": len(today_logs),
                "logs": today_logs
            },
            "recent": recent_logs,
            "weekly_stats": weekly_stats,
            "current_streak": current_streak,
            "quick_insights": quick_insights,
            "last_updated": datetime.now().isoformat()
        }
    
    async def get_user_analytics(
        self, 
        db: Session, 
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_timezone: str = "UTC"
    ) -> Dict[str, Any]:
        """
        Get detailed analytics for a user's health logs.
        
        Args:
            db: Database session
            user_id: User ID
            start_date: Start date for analysis
            end_date: End date for analysis
            user_timezone: User's timezone
            
        Returns:
            Dictionary with detailed analytics
        """
        # Get logs for the period
        logs = self.crud.get_user_logs_with_filters(
            db, user_id, start_date=start_date, end_date=end_date
        )
        
        # Calculate comprehensive statistics
        stats = self.crud.calculate_user_stats(db, user_id, start_date=start_date, end_date=end_date)
        
        # Calculate trends
        trends = self.crud.get_weekly_trends(db, user_id, weeks=12)
        
        # Calculate correlations (if applicable)
        correlations = self._calculate_correlations(logs)
        
        # Generate detailed insights
        detailed_insights = self._generate_detailed_insights(logs, stats, trends)
        
        return {
            "log_type": self.log_type.value,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "total_logs": len(logs),
            "stats": stats,
            "trends": trends,
            "correlations": correlations,
            "insights": detailed_insights,
            "generated_at": datetime.now().isoformat()
        }
    
    async def search_user_logs(
        self, 
        db: Session, 
        user_id: int,
        search_term: str,
        search_fields: List[str],
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search user logs by text.
        
        Args:
            db: Database session
            user_id: User ID
            search_term: Search term
            search_fields: Fields to search in
            limit: Maximum number of results
            
        Returns:
            List of matching logs
        """
        logs = self.crud.search_logs(db, user_id, search_term, search_fields, limit)
        
        # Format results
        return [self._format_log_for_search(log) for log in logs]
    
    async def get_user_goals_progress(
        self, 
        db: Session, 
        user_id: int,
        goal_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get progress towards user goals.
        
        Args:
            db: Database session
            user_id: User ID
            goal_type: Type of goal to filter by
            
        Returns:
            Dictionary with goal progress data
        """
        # This would integrate with a goals system
        # For now, return basic progress data
        current_streak = self.crud.get_user_streak(db, user_id)
        longest_streak = self.crud.get_user_longest_streak(db, user_id)
        
        # Get recent activity
        recent_logs = self.crud.get_recent_logs(db, user_id, limit=7)
        
        return {
            "log_type": self.log_type.value,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "recent_activity": len(recent_logs),
            "goal_type": goal_type,
            "progress_percentage": min(100, (current_streak / 7) * 100) if current_streak > 0 else 0
        }
    
    def _generate_insights(
        self, 
        logs: List[ModelType], 
        stats: Dict[str, Any], 
        trends: Dict[str, Any],
        current_streak: int
    ) -> List[Dict[str, Any]]:
        """Generate insights based on user data."""
        insights = []
        
        # Streak insights
        if current_streak >= 7:
            insights.append({
                "type": "achievement",
                "title": "Great Streak!",
                "description": f"You've logged {self.log_type.value} for {current_streak} days in a row!",
                "priority": Priority.HIGH.value
            })
        elif current_streak == 0 and len(logs) > 0:
            insights.append({
                "type": "recommendation",
                "title": "Start a New Streak",
                "description": f"Try logging {self.log_type.value} daily to build a consistent habit.",
                "priority": Priority.MEDIUM.value
            })
        
        # Activity insights
        if len(logs) > 0:
            recent_logs = logs[:7]  # Last 7 logs
            if len(recent_logs) >= 5:
                insights.append({
                    "type": "trend",
                    "title": "Consistent Activity",
                    "description": f"You've been very active with {self.log_type.value} logging recently.",
                    "priority": Priority.LOW.value
                })
        
        return insights
    
    def _generate_recommendations(
        self, 
        logs: List[ModelType], 
        stats: Dict[str, Any], 
        current_streak: int
    ) -> List[Dict[str, Any]]:
        """Generate recommendations based on user data."""
        recommendations = []
        
        # Streak-based recommendations
        if current_streak == 0:
            recommendations.append({
                "type": "action",
                "title": "Log Today",
                "description": f"Start logging your {self.log_type.value} today to begin a new streak.",
                "action": f"Create a new {self.log_type.value} log",
                "priority": Priority.HIGH.value
            })
        elif current_streak < 3:
            recommendations.append({
                "type": "motivation",
                "title": "Keep Going!",
                "description": f"You're on a {current_streak}-day streak. Keep it up!",
                "action": f"Continue logging {self.log_type.value}",
                "priority": Priority.MEDIUM.value
            })
        
        # Activity-based recommendations
        if len(logs) < 3:
            recommendations.append({
                "type": "suggestion",
                "title": "Increase Activity",
                "description": f"Try logging {self.log_type.value} more frequently for better insights.",
                "action": f"Set a goal to log {self.log_type.value} 3 times this week",
                "priority": Priority.MEDIUM.value
            })
        
        return recommendations
    
    def _generate_quick_insights(
        self, 
        today_logs: List[ModelType], 
        weekly_stats: Dict[str, Any],
        current_streak: int
    ) -> List[str]:
        """Generate quick insights for dashboard."""
        insights = []
        
        if len(today_logs) > 0:
            insights.append(f"Great! You've logged {self.log_type.value} today.")
        
        if current_streak > 0:
            insights.append(f"You're on a {current_streak}-day streak!")
        
        if weekly_stats.get("total_count", 0) > 5:
            insights.append("You've been very active this week!")
        
        return insights
    
    def _calculate_correlations(self, logs: List[ModelType]) -> List[Dict[str, Any]]:
        """Calculate correlations between different metrics."""
        # This would implement correlation analysis
        # For now, return empty list
        return []
    
    def _generate_detailed_insights(
        self, 
        logs: List[ModelType], 
        stats: Dict[str, Any], 
        trends: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate detailed insights for analytics."""
        insights = []
        
        # Trend analysis
        if trends.get("weekly_data"):
            recent_weeks = trends["weekly_data"][-4:]  # Last 4 weeks
            if len(recent_weeks) >= 2:
                recent_activity = sum(week.get("count", 0) for week in recent_weeks[-2:])
                older_activity = sum(week.get("count", 0) for week in recent_weeks[:2])
                
                if recent_activity > older_activity * 1.2:
                    insights.append({
                        "type": "trend",
                        "title": "Increasing Activity",
                        "description": "Your activity has been increasing over the past few weeks.",
                        "priority": Priority.LOW.value
                    })
        
        return insights
    
    def _format_log_for_search(self, log: ModelType) -> Dict[str, Any]:
        """Format a log for search results."""
        # This would format the log appropriately for search results
        # For now, return basic format
        return {
            "id": getattr(log, "id", None),
            "type": self.log_type.value,
            "created_at": getattr(log, "created_at", None),
            "summary": str(log)  # Basic string representation
        }
