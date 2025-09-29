"""
Generic logging endpoint patterns for health logging APIs.
Provides reusable endpoint mixins to reduce code duplication.
"""

from typing import List, Optional, Dict, Any, Type, TypeVar, Generic
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.crud.common.user_logging import UserLoggingCRUD
from app.utils.date_helpers import DateRangeCalculator, StreakCalculator
from app.services.common.statistics import HealthStatisticsCalculator

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)
ResponseSchemaType = TypeVar("ResponseSchemaType", bound=BaseModel)


class GenericLoggingEndpoints(Generic[ModelType, CreateSchemaType, UpdateSchemaType, ResponseSchemaType]):
    """
    Generic mixin for health logging endpoints.
    Provides common CRUD patterns for all health logging types.
    """
    
    def __init__(
        self, 
        crud: UserLoggingCRUD[ModelType, CreateSchemaType, UpdateSchemaType],
        response_schema: Type[ResponseSchemaType],
        log_type_name: str
    ):
        self.crud = crud
        self.response_schema = response_schema
        self.log_type_name = log_type_name
    
    def create_router(self) -> APIRouter:
        """Create a FastAPI router with standard logging endpoints."""
        router = APIRouter()
        
        # GET / - List logs with pagination and filtering
        @router.get("/", response_model=Dict[str, Any])
        def get_logs(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            period: str = Query("week", description="Filter by period: week, month, all"),
            page: int = Query(1, ge=1, description="Page number"),
            size: int = Query(50, ge=1, le=100, description="Page size"),
            start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
            end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
            **filters
        ):
            """Get logs with optional filtering and pagination."""
            try:
                # Parse date filters
                start_date_obj = None
                end_date_obj = None
                
                if start_date:
                    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
                if end_date:
                    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
                
                # Use period-based filtering if no custom dates
                if not start_date_obj and not end_date_obj:
                    start_date_obj, end_date_obj = DateRangeCalculator.get_period_range(period)
                
                # Get logs
                skip = (page - 1) * size
                logs = self.crud.get_user_logs(
                    db,
                    user_id=current_user.id,
                    skip=skip,
                    limit=size,
                    start_date=start_date_obj,
                    end_date=end_date_obj,
                    **filters
                )
                
                # Get total count for pagination
                total_count = self.crud.get_user_logs_count(
                    db,
                    user_id=current_user.id,
                    start_date=start_date_obj,
                    end_date=end_date_obj,
                    **filters
                )
                
                # Calculate statistics
                all_logs = self.crud.get_user_logs(
                    db,
                    user_id=current_user.id,
                    start_date=start_date_obj,
                    end_date=end_date_obj,
                    **filters
                )
                
                stats = self._calculate_stats(all_logs)
                
                # Format response
                logs_data = [self._format_log_response(log) for log in logs]
                
                return {
                    "logs": logs_data,
                    "stats": stats,
                    "pagination": {
                        "page": page,
                        "size": size,
                        "total": total_count,
                        "totalPages": (total_count + size - 1) // size
                    }
                }
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve {self.log_type_name} logs")
        
        # GET /stats - Get statistics
        @router.get("/stats", response_model=Dict[str, Any])
        def get_stats(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            period: str = Query("week", description="Filter by period: week, month, all")
        ):
            """Get statistics for the log type."""
            try:
                start_date, end_date = DateRangeCalculator.get_period_range(period)
                logs = self.crud.get_user_logs(
                    db,
                    user_id=current_user.id,
                    start_date=start_date,
                    end_date=end_date
                )
                
                stats = self._calculate_stats(logs)
                return stats
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve {self.log_type_name} statistics")
        
        # GET /recent - Get recent logs
        @router.get("/recent", response_model=List[Dict[str, Any]])
        def get_recent_logs(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            limit: int = Query(10, ge=1, le=50, description="Number of recent logs")
        ):
            """Get recent logs."""
            try:
                logs = self.crud.get_recent_logs(
                    db,
                    user_id=current_user.id,
                    limit=limit
                )
                
                return [self._format_log_response(log) for log in logs]
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve recent {self.log_type_name} logs")
        
        # GET /{id} - Get specific log
        @router.get("/{id}", response_model=Dict[str, Any])
        def get_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            id: str
        ):
            """Get a specific log by ID."""
            log = self.crud.get(db, id=id)
            if not log or log.user_id != current_user.id:
                raise HTTPException(status_code=404, detail=f"{self.log_type_name.title()} log not found")
            
            return self._format_log_response(log)
        
        # POST / - Create new log
        @router.post("/", response_model=Dict[str, Any])
        def create_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            log_data: CreateSchemaType
        ):
            """Create a new log entry."""
            try:
                log = self.crud.create_with_user(db, obj_in=log_data, user_id=current_user.id)
                return self._format_log_response(log)
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to create {self.log_type_name} log")
        
        # PUT /{id} - Update log
        @router.put("/{id}", response_model=Dict[str, Any])
        def update_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            id: str,
            log_data: UpdateSchemaType
        ):
            """Update an existing log."""
            log = self.crud.get(db, id=id)
            if not log or log.user_id != current_user.id:
                raise HTTPException(status_code=404, detail=f"{self.log_type_name.title()} log not found")
            
            try:
                updated_log = self.crud.update(db, db_obj=log, obj_in=log_data)
                return self._format_log_response(updated_log)
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to update {self.log_type_name} log")
        
        # DELETE /{id} - Delete log
        @router.delete("/{id}")
        def delete_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            id: str
        ):
            """Delete a log entry."""
            log = self.crud.get(db, id=id)
            if not log or log.user_id != current_user.id:
                raise HTTPException(status_code=404, detail=f"{self.log_type_name.title()} log not found")
            
            try:
                self.crud.remove(db, id=id)
                return {"message": f"{self.log_type_name.title()} log deleted successfully"}
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to delete {self.log_type_name} log")
        
        return router
    
    def _calculate_stats(self, logs: List[ModelType]) -> Dict[str, Any]:
        """Calculate statistics for the logs. Override in subclasses for specific stats."""
        if not logs:
            return {
                "totalCount": 0,
                "currentStreak": 0,
                "longestStreak": 0
            }
        
        # Get basic stats from UserLoggingCRUD
        stats = self.crud.get_user_stats(
            db=None,  # We already have the logs
            user_id=logs[0].user_id if logs else 0,
            start_date=None,
            end_date=None
        )
        
        # Calculate streaks
        current_streak = StreakCalculator.calculate_streak(logs, self.crud.date_field)
        longest_streak = StreakCalculator.calculate_longest_streak(logs, self.crud.date_field)
        
        return {
            "totalCount": len(logs),
            "currentStreak": current_streak,
            "longestStreak": longest_streak,
            "firstLog": getattr(logs[0], self.crud.date_field).isoformat() if logs else None,
            "lastLog": getattr(logs[-1], self.crud.date_field).isoformat() if logs else None
        }
    
    def _format_log_response(self, log: ModelType) -> Dict[str, Any]:
        """Format a log object for API response. Override in subclasses for specific formatting."""
        # Convert to dict and handle common fields
        log_dict = {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "created_at": log.created_at.isoformat() if hasattr(log, 'created_at') and log.created_at else None,
            "updated_at": log.updated_at.isoformat() if hasattr(log, 'updated_at') and log.updated_at else None
        }
        
        # Add date field
        date_value = getattr(log, self.crud.date_field, None)
        if date_value:
            log_dict[self.crud.date_field] = date_value.isoformat()
        
        # Add all other attributes
        for attr in dir(log):
            if not attr.startswith('_') and not callable(getattr(log, attr)) and attr not in log_dict:
                value = getattr(log, attr)
                if value is not None:
                    if hasattr(value, 'isoformat'):  # datetime objects
                        log_dict[attr] = value.isoformat()
                    else:
                        log_dict[attr] = value
        
        return log_dict


class HealthLoggingEndpoints(GenericLoggingEndpoints[ModelType, CreateSchemaType, UpdateSchemaType, ResponseSchemaType]):
    """
    Specialized logging endpoints for health data with additional health-specific methods.
    """
    
    def create_health_router(self) -> APIRouter:
        """Create a router with additional health-specific endpoints."""
        router = self.create_router()
        
        # GET /today - Get today's logs
        @router.get("/today", response_model=List[Dict[str, Any]])
        def get_todays_logs(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            """Get today's logs."""
            try:
                today = datetime.now()
                logs = self.crud.get_daily_logs(db, user_id=current_user.id, date=today)
                return [self._format_log_response(log) for log in logs]
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve today's {self.log_type_name} logs")
        
        # GET /weekly - Get weekly summary
        @router.get("/weekly", response_model=Dict[str, Any])
        def get_weekly_summary(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            """Get weekly summary."""
            try:
                today = datetime.now()
                week_start = DateRangeCalculator.get_week_start(today)
                
                if hasattr(self.crud, 'get_weekly_summary'):
                    summary = self.crud.get_weekly_summary(db, user_id=current_user.id, week_start=week_start)
                    return summary
                else:
                    # Fallback to basic weekly data
                    logs = self.crud.get_weekly_logs(db, user_id=current_user.id, week_start=week_start)
                    return {
                        "week_start": week_start.isoformat(),
                        "total_logs": len(logs),
                        "logs": [self._format_log_response(log) for log in logs]
                    }
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve weekly {self.log_type_name} summary")
        
        return router