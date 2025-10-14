"""
Consolidated Health Logging API - All health logging endpoints in one place
Combines: fitness_logging, nutrition_logging, mood_logging, water_logs, simple_water_logs
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.health.fitness_log import FitnessLog, NutritionLog, MoodLog
from app.models.health.water_log import WaterLog
from app.crud.health import fitness_log, nutrition_log, mood_log
from app.crud.health.water_log import water_log
from app.schemas.health.fitness_log import (
    FitnessLogCreate, FitnessLogUpdate, FitnessLogResponse,
    NutritionLogCreate, NutritionLogUpdate, NutritionLogResponse,
    MoodLogCreate, MoodLogUpdate, MoodLogResponse
)
from app.schemas.health.water_log import WaterLogCreate, WaterLogUpdate, WaterLogResponse
from app.utils.response_utils import HealthLogResponseFormatter

router = APIRouter()

# ============================================================================
# FITNESS LOGGING ENDPOINTS
# ============================================================================

@router.post("/fitness", response_model=FitnessLogResponse)
async def create_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    fitness_log_in: FitnessLogCreate
):
    """Create a new fitness log entry"""
    try:
        fitness_log_obj = fitness_log.create_with_user(db=db, obj_in=fitness_log_in, user_id=current_user.id)
        return HealthLogResponseFormatter.format_fitness_log(fitness_log_obj)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create fitness log: {str(e)}")

@router.get("/fitness", response_model=List[FitnessLogResponse])
async def get_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """Get fitness logs for the current user"""
    try:
        fitness_logs = fitness_log.get_multi_by_user(
            db=db, 
            user_id=current_user.id, 
            skip=skip, 
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        return [HealthLogResponseFormatter.format_fitness_log(log) for log in fitness_logs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve fitness logs: {str(e)}")

@router.put("/fitness/{log_id}", response_model=FitnessLogResponse)
async def update_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: int,
    fitness_log_in: FitnessLogUpdate
):
    """Update a fitness log entry"""
    try:
        fitness_log_obj = fitness_log.get_by_user(db=db, id=log_id, user_id=current_user.id)
        if not fitness_log_obj:
            raise HTTPException(status_code=404, detail="Fitness log not found")
        
        updated_log = fitness_log.update(db=db, db_obj=fitness_log_obj, obj_in=fitness_log_in)
        return HealthLogResponseFormatter.format_fitness_log(updated_log)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update fitness log: {str(e)}")

@router.delete("/fitness/{log_id}")
async def delete_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: int
):
    """Delete a fitness log entry"""
    try:
        fitness_log_obj = fitness_log.get_by_user(db=db, id=log_id, user_id=current_user.id)
        if not fitness_log_obj:
            raise HTTPException(status_code=404, detail="Fitness log not found")
        
        fitness_log.remove(db=db, id=log_id)
        return {"message": "Fitness log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete fitness log: {str(e)}")

# ============================================================================
# NUTRITION LOGGING ENDPOINTS
# ============================================================================

@router.post("/nutrition", response_model=NutritionLogResponse)
async def create_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    nutrition_log_in: NutritionLogCreate
):
    """Create a new nutrition log entry"""
    try:
        nutrition_log_obj = nutrition_log.create_with_user(db=db, obj_in=nutrition_log_in, user_id=current_user.id)
        return HealthLogResponseFormatter.format_nutrition_log(nutrition_log_obj)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create nutrition log: {str(e)}")

@router.get("/nutrition", response_model=List[NutritionLogResponse])
async def get_nutrition_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """Get nutrition logs for the current user"""
    try:
        nutrition_logs = nutrition_log.get_multi_by_user(
            db=db, 
            user_id=current_user.id, 
            skip=skip, 
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        return [HealthLogResponseFormatter.format_nutrition_log(log) for log in nutrition_logs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve nutrition logs: {str(e)}")

@router.put("/nutrition/{log_id}", response_model=NutritionLogResponse)
async def update_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: int,
    nutrition_log_in: NutritionLogUpdate
):
    """Update a nutrition log entry"""
    try:
        nutrition_log_obj = nutrition_log.get_by_user(db=db, id=log_id, user_id=current_user.id)
        if not nutrition_log_obj:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        
        updated_log = nutrition_log.update(db=db, db_obj=nutrition_log_obj, obj_in=nutrition_log_in)
        return HealthLogResponseFormatter.format_nutrition_log(updated_log)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update nutrition log: {str(e)}")

@router.delete("/nutrition/{log_id}")
async def delete_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: int
):
    """Delete a nutrition log entry"""
    try:
        nutrition_log_obj = nutrition_log.get_by_user(db=db, id=log_id, user_id=current_user.id)
        if not nutrition_log_obj:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        
        nutrition_log.remove(db=db, id=log_id)
        return {"message": "Nutrition log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete nutrition log: {str(e)}")

# ============================================================================
# MOOD LOGGING ENDPOINTS
# ============================================================================

@router.post("/mood", response_model=MoodLogResponse)
async def create_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    mood_log_in: MoodLogCreate
):
    """Create a new mood log entry"""
    try:
        mood_log_obj = mood_log.create_with_user(db=db, obj_in=mood_log_in, user_id=current_user.id)
        return HealthLogResponseFormatter.format_mood_log(mood_log_obj)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create mood log: {str(e)}")

@router.get("/mood", response_model=List[MoodLogResponse])
async def get_mood_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """Get mood logs for the current user"""
    try:
        mood_logs = mood_log.get_multi_by_user(
            db=db, 
            user_id=current_user.id, 
            skip=skip, 
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        return [HealthLogResponseFormatter.format_mood_log(log) for log in mood_logs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve mood logs: {str(e)}")

# ============================================================================
# WATER LOGGING ENDPOINTS
# ============================================================================

@router.post("/water", response_model=WaterLogResponse)
async def create_water_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    water_log_in: WaterLogCreate
):
    """Create a new water log entry"""
    try:
        water_log_obj = water_log.create_with_user(db=db, obj_in=water_log_in, user_id=current_user.id)
        return HealthLogResponseFormatter.format_water_log(water_log_obj)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create water log: {str(e)}")

@router.get("/water", response_model=List[WaterLogResponse])
async def get_water_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """Get water logs for the current user"""
    try:
        water_logs = water_log.get_multi_by_user(
            db=db, 
            user_id=current_user.id, 
            skip=skip, 
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        return [HealthLogResponseFormatter.format_water_log(log) for log in water_logs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve water logs: {str(e)}")

# ============================================================================
# SIMPLE WATER LOGGING ENDPOINTS (for quick logging)
# ============================================================================

@router.post("/water/quick")
async def log_water_quick(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    amount_ml: int = Query(..., ge=1, le=10000, description="Amount of water in milliliters")
):
    """Quick water logging - just amount"""
    try:
        water_log_in = WaterLogCreate(
            amount_ml=amount_ml,
            log_type="quick",
            log_date=datetime.now()
        )
        water_log_obj = water_log.create_with_user(db=db, obj_in=water_log_in, user_id=current_user.id)
        return {"message": "Water logged successfully", "log_id": water_log_obj.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log water: {str(e)}")

@router.get("/water/today")
async def get_today_water_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's water intake statistics"""
    try:
        today = date.today()
        water_logs = water_log.get_multi_by_user(
            db=db, 
            user_id=current_user.id, 
            start_date=today,
            end_date=today
        )
        
        total_ml = sum(log.amount_ml for log in water_logs if log.amount_ml)
        total_oz = round(total_ml * 0.033814, 1)
        
        return {
            "total_ml": total_ml,
            "total_oz": total_oz,
            "logs_count": len(water_logs),
            "goal_ml": 3200,  # Default goal
            "progress_percentage": min(100, (total_ml / 3200) * 100)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get water stats: {str(e)}")
