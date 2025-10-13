"""
User Profile API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.profile import UserProfile, HealthProfile

router = APIRouter()

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get complete user profile including health data and onboarding status
    """
    try:
        # Get health profile from JSON field
        health_profile_data = current_user.health_profile or {}
        health_data = None
        if health_profile_data:
            health_data = HealthProfile(
                age=str(health_profile_data.get('age', '')) if health_profile_data.get('age') else None,
                height=str(health_profile_data.get('height_cm', '')) if health_profile_data.get('height_cm') else None,
                weight=str(health_profile_data.get('current_weight_kg', '')) if health_profile_data.get('current_weight_kg') else None,
                gender=health_profile_data.get('gender'),
                activity_level=health_profile_data.get('activity_level'),
                smm=str(health_profile_data.get('smm_kg', '')) if health_profile_data.get('smm_kg') else None,
                body_fat_percentage=str(health_profile_data.get('body_fat_percentage', '')) if health_profile_data.get('body_fat_percentage') else None,
                ffm=str(health_profile_data.get('ffm_kg', '')) if health_profile_data.get('ffm_kg') else None,
                workout_days_per_week=str(health_profile_data.get('workout_days_per_week', '')) if health_profile_data.get('workout_days_per_week') else None
            )
        
        # Get goals from JSON field
        goals_data = current_user.goals or {}
        goals = []
        if goals_data.get('goals'):
            goals = [goal.get('title', '') for goal in goals_data['goals'] if goal.get('title')]
        
        # Get body type goal from onboarding data
        onboarding_data = current_user.onboarding_data or {}
        user_body_type_goal_name = onboarding_data.get('body_type_goal')
        
        # Get onboarding completion status
        onboarding_completed = onboarding_data.get('completed', False)
        
        return UserProfile(
            user_id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            timezone=current_user.timezone,
            health_data=health_data,
            goals=goals,
            bodyTypeGoal=user_body_type_goal_name,
            bodyTypeGoals=[],  # No longer using separate body type goals table
            preferences=current_user.preferences or {
                "notifications": True,
                "reminders": True,
                "dataSharing": False
            },
            onboarding_completed=onboarding_completed
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user profile: {str(e)}")

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    profile_data: UserProfile
):
    """
    Update user profile data
    """
    try:
        # Update health profile if provided
        if profile_data.health_data:
            health_profile_data = current_user.health_profile or {}
            
            # Update health profile fields
            if profile_data.health_data.age:
                health_profile_data['age'] = int(profile_data.health_data.age)
            if profile_data.health_data.height:
                health_profile_data['height_cm'] = float(profile_data.health_data.height)
            if profile_data.health_data.weight:
                health_profile_data['current_weight_kg'] = float(profile_data.health_data.weight)
            if profile_data.health_data.gender:
                health_profile_data['gender'] = profile_data.health_data.gender
            if profile_data.health_data.activity_level:
                health_profile_data['activity_level'] = profile_data.health_data.activity_level
            if profile_data.health_data.smm:
                health_profile_data['smm_kg'] = float(profile_data.health_data.smm)
            if profile_data.health_data.body_fat_percentage:
                health_profile_data['body_fat_percentage'] = float(profile_data.health_data.body_fat_percentage)
            if profile_data.health_data.ffm:
                health_profile_data['ffm_kg'] = float(profile_data.health_data.ffm)
            if profile_data.health_data.workout_days_per_week:
                health_profile_data['workout_days_per_week'] = int(profile_data.health_data.workout_days_per_week)
            
            current_user.health_profile = health_profile_data
        
        # Update goals if provided
        if profile_data.goals is not None:
            goals_data = current_user.goals or {}
            goals_data['goals'] = [
                {
                    'id': i + 1,
                    'title': goal_name,
                    'description': '',
                    'category': 'health',
                    'status': 'active',
                    'priority': 'medium',
                    'created_at': '2024-01-01T00:00:00Z'
                }
                for i, goal_name in enumerate(profile_data.goals)
            ]
            current_user.goals = goals_data
        
        # Update user timezone if provided
        if profile_data.timezone:
            current_user.timezone = profile_data.timezone
        
        # Update bodyTypeGoal if provided
        if profile_data.bodyTypeGoal is not None:
            onboarding_data = current_user.onboarding_data or {}
            onboarding_data['body_type_goal'] = profile_data.bodyTypeGoal
            onboarding_data['completed'] = True
            current_user.onboarding_data = onboarding_data
        
        # Update preferences if provided
        if profile_data.preferences:
            current_user.preferences = profile_data.preferences
        
        db.commit()
        
        # Return updated profile
        return await get_user_profile(db=db, current_user=current_user)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user profile: {str(e)}")
