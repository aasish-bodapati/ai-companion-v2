"""
Specialized water logging endpoints with water-specific functionality.
"""

from typing import List, Dict, Any
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.crud.health.water_log import CRUDWaterLog
from app.schemas.health.water_log import WaterLogCreate, WaterLogUpdate, WaterLogStats
from app.api.common.logging_endpoints import HealthLoggingEndpoints


class WaterLoggingEndpoints(HealthLoggingEndpoints):
    """Specialized endpoints for water logging with water-specific functionality."""
    
    def __init__(self):
        super().__init__(
            crud=CRUDWaterLog(),
            response_schema=None,  # We'll handle response formatting manually
            log_type_name="water"
        )
    
    def create_water_router(self) -> APIRouter:
        """Create a router with water-specific endpoints."""
        router = self.create_health_router()
        
        # GET /today - Get today's water logs (specialized for water)
        @router.get("/today", response_model=List[Dict[str, Any]])
        def get_todays_water_logs(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            """Get user's water logs for today."""
            try:
                logs = self.crud.get_user_logs_today(db, user_id=current_user.id)
                return [self._format_log_response(log) for log in logs]
                
            except Exception as e:
                raise HTTPException(status_code=500, detail="Failed to retrieve today's water logs")
        
        # GET /stats - Get water intake statistics for today
        @router.get("/stats", response_model=WaterLogStats)
        def get_water_stats(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            """Get water intake statistics for today."""
            try:
                stats = self.crud.get_water_stats_today(db, user_id=current_user.id)
                return WaterLogStats(**stats)
                
            except Exception as e:
                raise HTTPException(status_code=500, detail="Failed to retrieve water statistics")
        
        # POST /quick-log - Quick log water intake
        @router.post("/quick-log")
        def quick_log_water(
            *,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
            amount_ml: int = Query(..., gt=0, le=10000, description="Amount in milliliters")
        ):
            """Quick log water intake with default settings."""
            try:
                water_log_data = WaterLogCreate(
                    amount_ml=amount_ml,
                    log_type="manual",
                    log_date=datetime.now()
                )
                
                log_entry = self.crud.create_with_user(db, obj_in=water_log_data, user_id=current_user.id)
                
                # Get updated stats
                stats = self.crud.get_water_stats_today(db, user_id=current_user.id)
                
                return {
                    "message": f"Logged {amount_ml}ml of water",
                    "log_entry": self._format_log_response(log_entry),
                    "stats": stats
                }
                
            except Exception as e:
                raise HTTPException(status_code=500, detail="Failed to log water intake")
        
        return router
    
    def _format_log_response(self, log: Any) -> Dict[str, Any]:
        """Format a water log for API response."""
        return {
            "id": log.id,
            "user_id": log.user_id,
            "amount_ml": log.amount_ml,
            "amount_oz": log.amount_oz,
            "log_type": log.log_type,
            "notes": log.notes,
            "log_date": log.log_date.isoformat() if log.log_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "updated_at": log.updated_at.isoformat() if log.updated_at else None
        }


# Create the water endpoints instance
water_endpoints = WaterLoggingEndpoints()
