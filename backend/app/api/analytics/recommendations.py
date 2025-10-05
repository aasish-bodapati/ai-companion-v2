from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/recommendations")
async def get_personalized_recommendations(current_user: User = Depends(get_current_user)):
    """
    Get personalized recommendations based on user patterns.
    This is a placeholder endpoint that returns mock data.
    """
    try:
        # Mock recommendations data
        recommendations = {
            "fitness": [
                "Try morning workouts for better consistency",
                "Add 10 minutes of stretching after each workout",
                "Consider joining a fitness class for motivation",
                "Track your workout intensity to optimize results"
            ],
            "nutrition": [
                "Meal prep on Sundays for the week ahead",
                "Add more vegetables to your lunch",
                "Drink water before each meal",
                "Consider intermittent fasting if it fits your schedule"
            ],
            "wellness": [
                "Practice 5 minutes of meditation daily",
                "Take a 10-minute walk after lunch",
                "Limit screen time 1 hour before bed",
                "Try deep breathing exercises during stress"
            ],
            "goals": [
                "Break your big goal into smaller milestones",
                "Celebrate small wins along the way",
                "Track progress weekly instead of daily",
                "Find an accountability partner"
            ]
        }
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {str(e)}")
