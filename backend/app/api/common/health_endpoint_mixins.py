"""
Generic API endpoint mixins for health logging.
Provides reusable endpoint patterns to reduce duplication across health logging APIs.
"""

from typing import List, Optional, Dict, Any, Type, Callable
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.crud.common.generic_health_logging import GenericHealthLoggingCRUD
from app.api.common.response_formatter import HealthLogResponseFormatter
from app.utils.timezone_handler import TimezoneHandler
from app.utils.date_helpers import DateRangeCalculator


class HealthLoggingEndpoints:
    """
    Mixin class providing common health logging endpoint patterns.
    """
    
    def __init__(self, 
                 crud: GenericHealthLoggingCRUD,
                 response_formatter: Callable,
                 log_type: str):
        """
        Initialize the health logging endpoints mixin.
        
        Args:
            crud: Generic CRUD instance
            response_formatter: Function to format log responses
            log_type: Type of health log ('fitness', 'nutrition', 'water', 'mood')
        """
        self.crud = crud
        self.response_formatter = response_formatter
        self.log_type = log_type
    
    def create_get_logs_endpoint(self) -> Callable:
        """
        Create a generic GET logs endpoint.
        
        Returns:
            FastAPI endpoint function
        """
        async def get_logs(
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
            """Get health logs with optional filtering and pagination."""
            try:
                # Parse date filters using centralized handler
                start_date_obj = TimezoneHandler.parse_date_string(start_date) if start_date else None
                end_date_obj = TimezoneHandler.parse_date_string(end_date) if end_date else None
                
                # If end_date is provided, set it to end of day
                if end_date_obj:
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
                
                # Use period-based filtering if no custom dates
                if not start_date_obj and not end_date_obj:
                    start_date_obj, end_date_obj = DateRangeCalculator.get_period_range(period)
                
                # Get logs using the CRUD
                skip = (page - 1) * size
                logs = self.crud.get_user_logs_with_filters(
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
                all_logs = self.crud.get_user_logs_with_filters(
                    db,
                    user_id=current_user.id,
                    start_date=start_date_obj,
                    end_date=end_date_obj,
                    **filters
                )
                
                stats = self.crud.calculate_user_stats(
                    db,
                    user_id=current_user.id,
                    start_date=start_date_obj,
                    end_date=end_date_obj
                )
                
                # Format response using centralized formatter
                logs_data = [self.response_formatter(log) for log in logs]
                
                # Calculate pagination
                pagination = {
                    "page": page,
                    "size": size,
                    "total": total_count,
                    "totalPages": (total_count + size - 1) // size
                }
                
                return HealthLogResponseFormatter.format_logs_response(
                    logs_data, stats, pagination, self.log_type
                )
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve {self.log_type} logs")
        
        return get_logs
    
    def create_get_stats_endpoint(self) -> Callable:
        """
        Create a generic GET stats endpoint.
        
        Returns:
            FastAPI endpoint function
        """
        async def get_stats(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            period: str = Query("week", description="Filter by period: week, month, all")
        ):
            """Get health statistics."""
            try:
                # Use TimezoneHandler for proper timezone handling
                user_timezone = current_user.timezone or "UTC"
                
                if period == "week":
                    start_date, end_date = TimezoneHandler.get_user_week_range(user_timezone)
                elif period == "month":
                    start_date, end_date = TimezoneHandler.get_user_month_range(user_timezone)
                else:
                    start_date, end_date = DateRangeCalculator.get_period_range(period)
                
                stats = self.crud.calculate_user_stats(
                    db,
                    user_id=current_user.id,
                    start_date=start_date,
                    end_date=end_date
                )
                
                return stats
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve {self.log_type} statistics")
        
        return get_stats
    
    def create_get_today_endpoint(self) -> Callable:
        """
        Create a generic GET today endpoint.
        
        Returns:
            FastAPI endpoint function
        """
        async def get_today(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            """Get today's health logs."""
            try:
                # Use TimezoneHandler for proper timezone handling
                user_timezone = current_user.timezone or "UTC"
                
                # Get today's date range in user's timezone
                start_of_day, end_of_day = TimezoneHandler.get_user_timezone_range(datetime.now(), user_timezone)
                
                logs = self.crud.get_user_logs_with_filters(
                    db,
                    user_id=current_user.id,
                    start_date=start_of_day,
                    end_date=end_of_day
                )
                
                logs_data = [self.response_formatter(log) for log in logs]
                
                return logs_data
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve today's {self.log_type} logs")
        
        return get_today
    
    def create_get_recent_endpoint(self) -> Callable:
        """
        Create a generic GET recent endpoint.
        
        Returns:
            FastAPI endpoint function
        """
        async def get_recent(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            limit: int = Query(10, ge=1, le=50, description="Number of recent logs")
        ):
            """Get recent health logs."""
            try:
                logs = self.crud.get_recent_logs(db, user_id=current_user.id, limit=limit)
                
                logs_data = [self.response_formatter(log) for log in logs]
                
                return logs_data
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to retrieve recent {self.log_type} logs")
        
        return get_recent
    
    def create_create_log_endpoint(self, create_schema: Type[BaseModel]) -> Callable:
        """
        Create a generic POST create log endpoint.
        
        Args:
            create_schema: Pydantic schema for creating logs
            
        Returns:
            FastAPI endpoint function
        """
        async def create_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            log_data: create_schema
        ):
            """Create a new health log entry."""
            try:
                log = self.crud.create_with_user(db, obj_in=log_data, user_id=current_user.id)
                return self.response_formatter(log)
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to create {self.log_type} log")
        
        return create_log
    
    def create_get_log_endpoint(self) -> Callable:
        """
        Create a generic GET single log endpoint.
        
        Returns:
            FastAPI endpoint function
        """
        async def get_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            log_id: int = Path(..., description="Log ID")
        ):
            """Get a specific health log entry."""
            log = self.crud.get(db, id=log_id)
            if not log:
                raise HTTPException(status_code=404, detail=f"{self.log_type.title()} log not found")
            
            if log.user_id != current_user.id:
                raise HTTPException(status_code=403, detail=f"Not authorized to access this {self.log_type} log")
            
            return self.response_formatter(log)
        
        return get_log
    
    def create_update_log_endpoint(self, update_schema: Type[BaseModel]) -> Callable:
        """
        Create a generic PUT update log endpoint.
        
        Args:
            update_schema: Pydantic schema for updating logs
            
        Returns:
            FastAPI endpoint function
        """
        async def update_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            log_id: int = Path(..., description="Log ID"),
            log_data: update_schema
        ):
            """Update a health log entry."""
            log = self.crud.get(db, id=log_id)
            if not log:
                raise HTTPException(status_code=404, detail=f"{self.log_type.title()} log not found")
            
            if log.user_id != current_user.id:
                raise HTTPException(status_code=403, detail=f"Not authorized to update this {self.log_type} log")
            
            try:
                updated_log = self.crud.update(db, db_obj=log, obj_in=log_data)
                return self.response_formatter(updated_log)
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to update {self.log_type} log")
        
        return update_log
    
    def create_delete_log_endpoint(self) -> Callable:
        """
        Create a generic DELETE log endpoint.
        
        Returns:
            FastAPI endpoint function
        """
        async def delete_log(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            log_id: int = Path(..., description="Log ID")
        ):
            """Delete a health log entry."""
            log = self.crud.get(db, id=log_id)
            if not log:
                raise HTTPException(status_code=404, detail=f"{self.log_type.title()} log not found")
            
            if log.user_id != current_user.id:
                raise HTTPException(status_code=403, detail=f"Not authorized to delete this {self.log_type} log")
            
            try:
                self.crud.remove(db, id=log_id)
                return {"message": f"{self.log_type.title()} log deleted successfully"}
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to delete {self.log_type} log")
        
        return delete_log
    
    def create_router(self, 
                     create_schema: Type[BaseModel],
                     update_schema: Type[BaseModel],
                     prefix: str = "") -> APIRouter:
        """
        Create a complete router with all common endpoints.
        
        Args:
            create_schema: Pydantic schema for creating logs
            update_schema: Pydantic schema for updating logs
            prefix: URL prefix for the router
            
        Returns:
            FastAPI router with all endpoints
        """
        router = APIRouter(prefix=prefix)
        
        # Add all common endpoints
        router.add_api_route("/", self.create_get_logs_endpoint(), methods=["GET"], response_model=dict)
        router.add_api_route("/stats", self.create_get_stats_endpoint(), methods=["GET"], response_model=dict)
        router.add_api_route("/today", self.create_get_today_endpoint(), methods=["GET"], response_model=List[dict])
        router.add_api_route("/recent", self.create_get_recent_endpoint(), methods=["GET"], response_model=List[dict])
        router.add_api_route("/", self.create_create_log_endpoint(create_schema), methods=["POST"], response_model=dict)
        router.add_api_route("/{log_id}", self.create_get_log_endpoint(), methods=["GET"], response_model=dict)
        router.add_api_route("/{log_id}", self.create_update_log_endpoint(update_schema), methods=["PUT"], response_model=dict)
        router.add_api_route("/{log_id}", self.create_delete_log_endpoint(), methods=["DELETE"], response_model=dict)
        
        return router
