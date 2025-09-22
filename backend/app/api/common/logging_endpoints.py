"""
Generic logging endpoints mixin for health logging APIs.
Provides reusable endpoint patterns for all health logging types.
"""

from typing import List, Optional, Dict, Any, Type, Callable
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.utils.date_helpers import DateRangeCalculator, DateValidator
from app.api.common.response_formatters import LoggingResponseFormatter
from app.services.common.statistics import HealthStatisticsCalculator


class LoggingEndpointsMixin:
    """Mixin class for creating standardized logging endpoints."""
    
    @staticmethod
    def create_logging_router(
        log_type: str,
        crud_service,
        schema_create,
        schema_update,
        response_formatter: Callable,
        stats_calculator: Callable,
        additional_filters: Optional[List[str]] = None
    ) -> APIRouter:
        """
        Create a complete logging router with standard endpoints.
        
        Args:
            log_type: Type of logs (e.g., "fitness", "nutrition", "mood")
            crud_service: CRUD service instance
            schema_create: Pydantic schema for creating logs
            schema_update: Pydantic schema for updating logs
            response_formatter: Function to format log responses
            stats_calculator: Function to calculate statistics
            additional_filters: List of additional filter field names
            
        Returns:
            Configured APIRouter
        """
        router = APIRouter()
        
        # Build query parameters for additional filters
        def get_query_params():
            params = {
                "period": Query("week", description="Filter by period: week, month, all"),
                "page": Query(1, ge=1, description="Page number"),
                "size": Query(50, ge=1, le=100, description="Page size"),
                "start_date": Query(None, description="Start date (YYYY-MM-DD)"),
                "end_date": Query(None, description="End date (YYYY-MM-DD)"),
                "timeoutMs": Query(None, description="Request timeout in milliseconds")
            }
            
            if additional_filters:
                for filter_field in additional_filters:
                    params[filter_field] = Query(None, description=f"Filter by {filter_field}")
            
            return params
        
        @router.get("/", response_model=dict)
        def get_logs(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            period: str = Query("week", description="Filter by period: week, month, all"),
            page: int = Query(1, ge=1, description="Page number"),
            size: int = Query(50, ge=1, le=100, description="Page size"),
            start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
            end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
            timeoutMs: Optional[int] = Query(None, description="Request timeout in milliseconds")
        ):
            """Get logs with optional filtering and pagination."""
            try:
                # Use the directly passed parameters
                start_date_str = start_date
                end_date_str = end_date
                timeout_ms = timeoutMs  # Ignore timeout parameter
                
                # Parse custom dates
                custom_start = None
                custom_end = None
                
                if start_date_str:
                    custom_start = DateValidator.parse_date_string(start_date_str)
                    if not custom_start:
                        raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
                
                if end_date_str:
                    custom_end = DateValidator.parse_date_string(end_date_str)
                    if not custom_end:
                        raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
                
                # Get date range
                start_date_obj, end_date_obj = DateRangeCalculator.get_period_range(
                    period, custom_start, custom_end
                )
                
                # Get logs from database
                logs = crud_service.get_user_logs(
                    db,
                    user_id=current_user.id,
                    start_date=start_date_obj,
                    end_date=end_date_obj,
                    skip=(page - 1) * size,
                    limit=size
                )
                
                # Calculate statistics
                all_logs = crud_service.get_user_logs(
                    db,
                    user_id=current_user.id,
                    start_date=start_date_obj,
                    end_date=end_date_obj
                )
                
                stats = stats_calculator(all_logs)
                
                # Format logs
                logs_data = [response_formatter(log) for log in logs]
                
                # Format pagination
                pagination = LoggingResponseFormatter.format_pagination_response(
                    page, size, len(all_logs)
                )
                
                return LoggingResponseFormatter.format_logs_response(
                    logs_data, stats, pagination, "logs"
                )
                
            except Exception as e:
                print(f"Error getting {log_type} logs: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to retrieve {log_type} logs")
        
        @router.get("/{id}", response_model=dict)
        def get_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            id: str
        ):
            """Get a specific log by ID."""
            log = crud_service.get(db, id=id)
            if not log or log.user_id != current_user.id:
                raise HTTPException(status_code=404, detail=f"{log_type.title()} log not found")
            
            return response_formatter(log)
        
        @router.post("/", response_model=dict)
        def create_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            log_data: schema_create
        ):
            """Create a new log."""
            try:
                log = crud_service.create_with_user(db, obj_in=log_data, user_id=current_user.id)
                return response_formatter(log)
            except Exception as e:
                print(f"Error creating {log_type} log: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create {log_type} log")
        
        @router.put("/{id}", response_model=dict)
        def update_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            id: str,
            log_data: schema_update
        ):
            """Update an existing log."""
            log = crud_service.get(db, id=id)
            if not log or log.user_id != current_user.id:
                raise HTTPException(status_code=404, detail=f"{log_type.title()} log not found")
            
            try:
                updated_log = crud_service.update(db, db_obj=log, obj_in=log_data)
                return response_formatter(updated_log)
            except Exception as e:
                print(f"Error updating {log_type} log: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to update {log_type} log")
        
        @router.delete("/{id}")
        def delete_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            id: str
        ):
            """Delete a log."""
            log = crud_service.get(db, id=id)
            if not log or log.user_id != current_user.id:
                raise HTTPException(status_code=404, detail=f"{log_type.title()} log not found")
            
            try:
                crud_service.remove(db, id=id)
                return {"message": f"{log_type.title()} log deleted successfully"}
            except Exception as e:
                print(f"Error deleting {log_type} log: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to delete {log_type} log")
        
        @router.get("/stats", response_model=dict)
        def get_stats(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            period: str = Query("week", description="Filter by period: week, month, all")
        ):
            """Get statistics."""
            try:
                start_date_obj, end_date_obj = DateRangeCalculator.get_period_range(period)
                
                logs = crud_service.get_user_logs(
                    db,
                    user_id=current_user.id,
                    start_date=start_date_obj,
                    end_date=end_date_obj
                )
                
                stats = stats_calculator(logs)
                return LoggingResponseFormatter.format_stats_response(stats)
                
            except Exception as e:
                print(f"Error getting {log_type} stats: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to retrieve {log_type} statistics")
        
        @router.get("/recent", response_model=List[dict])
        def get_recent_logs(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            """Get recent logs (last 7 days)."""
            try:
                start_date_obj, end_date_obj = DateRangeCalculator.get_period_range("week")
                
                logs = crud_service.get_user_logs(
                    db,
                    user_id=current_user.id,
                    start_date=start_date_obj,
                    end_date=end_date_obj,
                    limit=10
                )
                
                return [response_formatter(log) for log in logs]
                
            except Exception as e:
                print(f"Error getting recent {log_type} logs: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to retrieve recent {log_type} logs")
        
        @router.get("/streak", response_model=dict)
        def get_streak(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            """Get streak information."""
            try:
                logs = crud_service.get_user_logs(db, user_id=current_user.id)
                
                from app.utils.date_helpers import StreakCalculator
                current_streak = crud_service.calculate_user_streak(db, current_user.id)
                longest_streak = crud_service.calculate_longest_streak(db, current_user.id)
                
                # Get last log date
                last_log_date = None
                if logs:
                    last_log = max(logs, key=lambda x: getattr(x, crud_service.date_field) or x.created_at)
                    last_log_date = (getattr(last_log, crud_service.date_field) or last_log.created_at).isoformat()
                
                return {
                    "currentStreak": current_streak,
                    "longestStreak": longest_streak,
                    "lastLogDate": last_log_date
                }
                
            except Exception as e:
                print(f"Error getting {log_type} streak: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to retrieve {log_type} streak")
        
        return router


class FitnessLoggingEndpoints(LoggingEndpointsMixin):
    """Specialized endpoints for fitness logging."""
    
    @staticmethod
    def create_fitness_router(crud_service, schema_create, schema_update) -> APIRouter:
        """Create a fitness logging router."""
        return LoggingEndpointsMixin.create_logging_router(
            log_type="fitness",
            crud_service=crud_service,
            schema_create=schema_create,
            schema_update=schema_update,
            response_formatter=LoggingResponseFormatter.format_fitness_log,
            stats_calculator=HealthStatisticsCalculator.calculate_fitness_stats,
            additional_filters=["routine_id"]
        )


class NutritionLoggingEndpoints(LoggingEndpointsMixin):
    """Specialized endpoints for nutrition logging."""
    
    @staticmethod
    def create_nutrition_router(crud_service, schema_create, schema_update) -> APIRouter:
        """Create a nutrition logging router."""
        return LoggingEndpointsMixin.create_logging_router(
            log_type="nutrition",
            crud_service=crud_service,
            schema_create=schema_create,
            schema_update=schema_update,
            response_formatter=LoggingResponseFormatter.format_nutrition_log,
            stats_calculator=HealthStatisticsCalculator.calculate_nutrition_stats,
            additional_filters=["routine_id", "meal_type"]
        )
