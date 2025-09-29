"""
User Profile API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.health.user_goal import UserGoal
from app.models.health.user_goals import UserHealthProfile
from app.models.onboarding import OnboardingProfile
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
        # Get health profile
        health_profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()
        
        # Get onboarding status
        onboarding_status = db.query(OnboardingProfile).filter(
            OnboardingProfile.user_id == current_user.id
        ).first()
        
        # Debug: Check all onboarding profiles
        all_onboarding = db.query(OnboardingProfile).all()
        print(f"All onboarding profiles in DB: {len(all_onboarding)}")
        for profile in all_onboarding:
            print(f"  - User {profile.user_id}: completed={profile.completed}, body_type_goal={profile.body_type_goal}")
        
        # Get user goals (if table exists)
        goals = []
        try:
            goals = db.query(UserGoal).filter(
                UserGoal.user_id == current_user.id
            ).all()
        except Exception as e:
            print(f"Warning: Could not query user_goals table: {e}")
            goals = []
        
        # Build health profile data
        health_data = None
        if health_profile:
            health_data = HealthProfile(
                age=str(health_profile.age) if health_profile.age else None,
                height=str(health_profile.height_cm) if health_profile.height_cm else None,
                weight=str(health_profile.current_weight_kg) if health_profile.current_weight_kg else None,
                gender=health_profile.gender,
                activity_level=health_profile.activity_level,
                smm=str(health_profile.smm_kg) if health_profile.smm_kg else None,
                body_fat_percentage=str(health_profile.body_fat_percentage) if health_profile.body_fat_percentage else None,
                workout_days_per_week=str(health_profile.workout_days_per_week) if health_profile.workout_days_per_week else None
            )
        
        # Get body type goal from onboarding status
        body_type_goal = onboarding_status.body_type_goal if onboarding_status else None
        print(f"Profile API Debug - User {current_user.id}:")
        print(f"  - onboarding_status exists: {onboarding_status is not None}")
        print(f"  - body_type_goal: {body_type_goal}")
        if onboarding_status:
            print(f"  - onboarding_status.body_type_goal: {onboarding_status.body_type_goal}")
            print(f"  - onboarding_status.completed: {onboarding_status.completed}")
        
        # Build onboarding status
        onboarding_completed = onboarding_status.completed if onboarding_status else False
        
        return UserProfile(
            user_id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            timezone=current_user.timezone,
            health_data=health_data,
            bodyTypeGoal=body_type_goal,
            preferences={
                "notifications": True,  # Default values
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
            health_profile = db.query(UserHealthProfile).filter(
                UserHealthProfile.user_id == current_user.id
            ).first()
            
            if health_profile:
                # Update existing health profile
                if profile_data.health_data.age:
                    health_profile.age = int(profile_data.health_data.age)
                if profile_data.health_data.height:
                    health_profile.height_cm = float(profile_data.health_data.height)
                if profile_data.health_data.weight:
                    health_profile.current_weight_kg = float(profile_data.health_data.weight)
                if profile_data.health_data.gender:
                    health_profile.gender = profile_data.health_data.gender
                if profile_data.health_data.activity_level:
                    health_profile.activity_level = profile_data.health_data.activity_level
            else:
                # Create new health profile
                health_profile = UserHealthProfile(
                    user_id=current_user.id,
                    age=int(profile_data.health_data.age) if profile_data.health_data.age else None,
                    height_cm=float(profile_data.health_data.height) if profile_data.health_data.height else None,
                    current_weight_kg=float(profile_data.health_data.weight) if profile_data.health_data.weight else None,
                    gender=profile_data.health_data.gender,
                    activity_level=profile_data.health_data.activity_level
                )
                db.add(health_profile)
        
        # Update goals if provided (if table exists)
        if profile_data.goals is not None:
            try:
                # Delete existing goals
                db.query(UserGoal).filter(UserGoal.user_id == current_user.id).delete()
                
                # Add new goals
                for goal_name in profile_data.goals:
                    goal = UserGoal(
                        user_id=current_user.id,
                        title=goal_name
                    )
                    db.add(goal)
            except Exception as e:
                print(f"Warning: Could not update user_goals table: {e}")
                # Continue without goals
        
        # Update user timezone if provided
        if profile_data.timezone:
            current_user.timezone = profile_data.timezone
        
        # Update bodyTypeGoal if provided
        if profile_data.bodyTypeGoal is not None:
            # Get or create onboarding profile
            onboarding_status = db.query(OnboardingProfile).filter(
                OnboardingProfile.user_id == current_user.id
            ).first()
            
            if onboarding_status:
                onboarding_status.body_type_goal = profile_data.bodyTypeGoal
            else:
                # Create new onboarding profile
                onboarding_status = OnboardingProfile(
                    user_id=current_user.id,
                    body_type_goal=profile_data.bodyTypeGoal,
                    completed=True
                )
                db.add(onboarding_status)
        
        db.commit()
        
        # Return updated profile
        return await get_user_profile(db=db, current_user=current_user)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user profile: {str(e)}")
