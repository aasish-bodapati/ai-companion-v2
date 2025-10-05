from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/anomalies")
async def get_anomalies(current_user: User = Depends(get_current_user)):
    """
    Get anomaly detection results for the current user.
    This is a placeholder endpoint that returns mock data.
    """
    try:
        # Mock anomalies data
        anomalies = [
            {
                "type": "calorie_intake",
                "date": "2024-01-15",
                "value": 3200,
                "expected": 2000,
                "deviation": 0.6,
                "severity": "high",
                "description": "Calorie intake was 60% higher than usual"
            },
            {
                "type": "workout_duration",
                "date": "2024-01-12",
                "value": 25,
                "expected": 45,
                "deviation": -0.44,
                "severity": "medium",
                "description": "Workout was 44% shorter than usual"
            },
            {
                "type": "water_intake",
                "date": "2024-01-10",
                "value": 1.2,
                "expected": 3.0,
                "deviation": -0.6,
                "severity": "high",
                "description": "Water intake was 60% lower than target"
            },
            {
                "type": "sleep_duration",
                "date": "2024-01-08",
                "value": 4.5,
                "expected": 7.5,
                "deviation": -0.4,
                "severity": "high",
                "description": "Sleep duration was 40% shorter than recommended"
            }
        ]
        
        return anomalies
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching anomalies: {str(e)}")
