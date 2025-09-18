#!/usr/bin/env python3
"""
Populate database with routine templates
"""

import sys
from pathlib import Path
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.health.routine import Routine, RoutineWorkout
from app.crud.health import routine

def populate_routines():
    """Populate database with routine templates"""
    db = SessionLocal()
    try:
        # Check if routines already exist
        existing_routines = routine.get_templates(db, skip=0, limit=1)
        if existing_routines:
            print("Routines already exist in database")
            return
        
        # Create Push/Pull/Legs Split routine
        push_pull_legs_data = {
            "name": "Push/Pull/Legs Split (Rehab-Friendly)",
            "description": "6-day routine: Daily warm-up + 3-day split that repeats (Mon-Wed, Thu-Sat)",
            "difficulty": "intermediate",
            "duration_weeks": 6,
            "tags": ["split", "rehab-friendly", "6x-week", "injury-prevention"],
            "is_template": True,
            "is_active": True,
            "workouts": [
                # Monday - Push Day
                {
                    "day": "Monday",
                    "activity_type": "stretching",
                    "activity_name": "Daily Warm-Up",
                    "duration_minutes": 8,
                    "intensity": "low",
                    "calories_burned": 30,
                    "notes": "Cat-Cow, Hip Flexor Stretch, Banded Rotations, Bodyweight Squats, Band Rows",
                    "order_in_day": 1
                },
                {
                    "day": "Monday",
                    "activity_type": "weightlifting",
                    "activity_name": "Push Day - Chest, Shoulders, Triceps",
                    "duration_minutes": 60,
                    "intensity": "medium",
                    "calories_burned": 300,
                    "notes": "Seated Machine Chest Press 4x8-12, Incline DB Press 3x8-12, Seated DB Shoulder Press 3x10-12, Chest Fly 3x12-15, DB Lateral Raises 3x12-15, Rope Tricep Pushdowns 3x10-12",
                    "order_in_day": 2
                },
                
                # Tuesday - Pull Day
                {
                    "day": "Tuesday",
                    "activity_type": "stretching",
                    "activity_name": "Daily Warm-Up",
                    "duration_minutes": 8,
                    "intensity": "low",
                    "calories_burned": 30,
                    "notes": "Cat-Cow, Hip Flexor Stretch, Banded Rotations, Bodyweight Squats, Band Rows",
                    "order_in_day": 1
                },
                {
                    "day": "Tuesday",
                    "activity_type": "weightlifting",
                    "activity_name": "Pull Day - Back, Biceps, Rear Delts",
                    "duration_minutes": 60,
                    "intensity": "medium",
                    "calories_burned": 300,
                    "notes": "Lat Pulldown 4x8-12, Seated Cable Row 3x8-12, DB Chest-Supported Rows 3x10-12, Barbell Bicep Curl 3x8-12, Hammer Curl 2x10-12, Face Pulls 3x12-15, Wrist Curls 2x15-20 each",
                    "order_in_day": 2
                },
                
                # Wednesday - Leg Day
                {
                    "day": "Wednesday",
                    "activity_type": "stretching",
                    "activity_name": "Daily Warm-Up",
                    "duration_minutes": 8,
                    "intensity": "low",
                    "calories_burned": 30,
                    "notes": "Cat-Cow, Hip Flexor Stretch, Banded Rotations, Bodyweight Squats, Band Rows",
                    "order_in_day": 1
                },
                {
                    "day": "Wednesday",
                    "activity_type": "weightlifting",
                    "activity_name": "Leg Day - Quads, Hamstrings, Glutes",
                    "duration_minutes": 60,
                    "intensity": "medium",
                    "calories_burned": 300,
                    "notes": "Seated Leg Extensions 3x12-15, Seated Hamstring Curl 3x12-15, Glute Bridges 4x12-15, Leg Press 3x10-12, Standing Calf Raises 3x15-20, Side-Lying Leg Raises 3x15/side, Plank 2x30s",
                    "order_in_day": 2
                },
                
                # Thursday - Push Day (Repeat)
                {
                    "day": "Thursday",
                    "activity_type": "stretching",
                    "activity_name": "Daily Warm-Up",
                    "duration_minutes": 8,
                    "intensity": "low",
                    "calories_burned": 30,
                    "notes": "Cat-Cow, Hip Flexor Stretch, Banded Rotations, Bodyweight Squats, Band Rows",
                    "order_in_day": 1
                },
                {
                    "day": "Thursday",
                    "activity_type": "weightlifting",
                    "activity_name": "Push Day - Chest, Shoulders, Triceps",
                    "duration_minutes": 60,
                    "intensity": "medium",
                    "calories_burned": 300,
                    "notes": "Seated Machine Chest Press 4x8-12, Incline DB Press 3x8-12, Seated DB Shoulder Press 3x10-12, Chest Fly 3x12-15, DB Lateral Raises 3x12-15, Rope Tricep Pushdowns 3x10-12",
                    "order_in_day": 2
                },
                
                # Friday - Pull Day (Repeat)
                {
                    "day": "Friday",
                    "activity_type": "stretching",
                    "activity_name": "Daily Warm-Up",
                    "duration_minutes": 8,
                    "intensity": "low",
                    "calories_burned": 30,
                    "notes": "Cat-Cow, Hip Flexor Stretch, Banded Rotations, Bodyweight Squats, Band Rows",
                    "order_in_day": 1
                },
                {
                    "day": "Friday",
                    "activity_type": "weightlifting",
                    "activity_name": "Pull Day - Back, Biceps, Rear Delts",
                    "duration_minutes": 60,
                    "intensity": "medium",
                    "calories_burned": 300,
                    "notes": "Lat Pulldown 4x8-12, Seated Cable Row 3x8-12, DB Chest-Supported Rows 3x10-12, Barbell Bicep Curl 3x8-12, Hammer Curl 2x10-12, Face Pulls 3x12-15, Wrist Curls 2x15-20 each",
                    "order_in_day": 2
                },
                
                # Saturday - Leg Day (Repeat)
                {
                    "day": "Saturday",
                    "activity_type": "stretching",
                    "activity_name": "Daily Warm-Up",
                    "duration_minutes": 8,
                    "intensity": "low",
                    "calories_burned": 30,
                    "notes": "Cat-Cow, Hip Flexor Stretch, Banded Rotations, Bodyweight Squats, Band Rows",
                    "order_in_day": 1
                },
                {
                    "day": "Saturday",
                    "activity_type": "weightlifting",
                    "activity_name": "Leg Day - Quads, Hamstrings, Glutes",
                    "duration_minutes": 60,
                    "intensity": "medium",
                    "calories_burned": 300,
                    "notes": "Seated Leg Extensions 3x12-15, Seated Hamstring Curl 3x12-15, Glute Bridges 4x12-15, Leg Press 3x10-12, Standing Calf Raises 3x15-20, Side-Lying Leg Raises 3x15/side, Plank 2x30s",
                    "order_in_day": 2
                }
            ]
        }
        
        # Create the routine
        from app.schemas.health.routine import RoutineCreate, RoutineWorkoutCreate
        
        routine_workouts = [RoutineWorkoutCreate(**workout) for workout in push_pull_legs_data["workouts"]]
        routine_data = RoutineCreate(
            name=push_pull_legs_data["name"],
            description=push_pull_legs_data["description"],
            difficulty=push_pull_legs_data["difficulty"],
            duration_weeks=push_pull_legs_data["duration_weeks"],
            tags=push_pull_legs_data["tags"],
            is_template=push_pull_legs_data["is_template"],
            is_active=push_pull_legs_data["is_active"],
            workouts=routine_workouts
        )
        
        created_routine = routine.create_with_workouts(db, obj_in=routine_data, user_id=None)
        print(f"Created routine: {created_routine.name} with {len(created_routine.workouts)} workouts")
        
    except Exception as e:
        print(f"Error populating routines: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
    
    print("Routine population complete!")

if __name__ == "__main__":
    populate_routines()
