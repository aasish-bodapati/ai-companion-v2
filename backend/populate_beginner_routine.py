#!/usr/bin/env python3
"""
Populate the Beginner Full Body routine with proper workout data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.health.simple_routine import SimpleRoutine, RoutineWorkoutDay, RoutineExercise
from app.crud.health.simple_routine import simple_routine
from app.crud.health.routine_workout_day import routine_workout_day
from app.crud.health.routine_exercise import routine_exercise
import uuid

def populate_beginner_routine():
    """Populate the Beginner Full Body routine with proper workout data"""
    db = SessionLocal()
    
    try:
        # Find the Beginner Full Body routine
        routine = db.query(SimpleRoutine).filter(
            SimpleRoutine.name == "Beginner Full Body"
        ).first()
        
        if not routine:
            print("❌ Beginner Full Body routine not found")
            return
        
        print(f"🔍 Found routine: {routine.name} (ID: {routine.id})")
        
        # Check if it already has workout days
        existing_days = db.query(RoutineWorkoutDay).filter(
            RoutineWorkoutDay.routine_id == routine.id
        ).all()
        
        if existing_days:
            print(f"⚠️ Routine already has {len(existing_days)} workout days. Deleting existing data...")
            # Delete existing workout days and exercises
            for day in existing_days:
                db.query(RoutineExercise).filter(
                    RoutineExercise.workout_day_id == day.id
                ).delete()
                db.delete(day)
            db.commit()
        
        # Define the workout plan
        workout_plan = [
            {
                "day": "Monday",
                "day_order": 1,
                "workout_name": "Upper Body Strength",
                "description": "Focus on chest, shoulders, and arms",
                "exercises": [
                    {
                        "exercise_name": "Push-ups",
                        "sets": 3,
                        "reps": "8-12",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Keep core tight, full range of motion"
                    },
                    {
                        "exercise_name": "Dumbbell Rows",
                        "sets": 3,
                        "reps": "10-15",
                        "weight_notes": "moderate weight",
                        "rest_time": "60-90 seconds",
                        "notes": "Squeeze shoulder blades together"
                    },
                    {
                        "exercise_name": "Shoulder Press",
                        "sets": 3,
                        "reps": "8-12",
                        "weight_notes": "light to moderate weight",
                        "rest_time": "60-90 seconds",
                        "notes": "Keep core engaged, don't arch back"
                    },
                    {
                        "exercise_name": "Bicep Curls",
                        "sets": 3,
                        "reps": "10-15",
                        "weight_notes": "light weight",
                        "rest_time": "60-90 seconds",
                        "notes": "Control the weight, no swinging"
                    },
                    {
                        "exercise_name": "Tricep Dips",
                        "sets": 3,
                        "reps": "8-12",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Use chair or bench, keep elbows close"
                    }
                ]
            },
            {
                "day": "Wednesday",
                "day_order": 3,
                "workout_name": "Lower Body Strength",
                "description": "Focus on legs and glutes",
                "exercises": [
                    {
                        "exercise_name": "Bodyweight Squats",
                        "sets": 3,
                        "reps": "12-15",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Keep knees behind toes, full depth"
                    },
                    {
                        "exercise_name": "Lunges",
                        "sets": 3,
                        "reps": "10 each leg",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Alternate legs, keep front knee over ankle"
                    },
                    {
                        "exercise_name": "Glute Bridges",
                        "sets": 3,
                        "reps": "12-15",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Squeeze glutes at the top, hold for 1 second"
                    },
                    {
                        "exercise_name": "Calf Raises",
                        "sets": 3,
                        "reps": "15-20",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Rise up on toes, control the descent"
                    },
                    {
                        "exercise_name": "Wall Sit",
                        "sets": 3,
                        "reps": "30-45 seconds",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Hold position, thighs parallel to floor"
                    }
                ]
            },
            {
                "day": "Friday",
                "day_order": 5,
                "workout_name": "Full Body Circuit",
                "description": "High-intensity full body workout",
                "exercises": [
                    {
                        "exercise_name": "Burpees",
                        "sets": 3,
                        "reps": "5-8",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Full burpee with push-up and jump"
                    },
                    {
                        "exercise_name": "Mountain Climbers",
                        "sets": 3,
                        "reps": "20-30",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Keep core tight, alternate legs quickly"
                    },
                    {
                        "exercise_name": "Plank",
                        "sets": 3,
                        "reps": "30-45 seconds",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Straight line from head to heels"
                    },
                    {
                        "exercise_name": "Jumping Jacks",
                        "sets": 3,
                        "reps": "20-30",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Full range of motion, land softly"
                    },
                    {
                        "exercise_name": "Russian Twists",
                        "sets": 3,
                        "reps": "15 each side",
                        "weight_notes": "bodyweight",
                        "rest_time": "60-90 seconds",
                        "notes": "Keep feet off ground, rotate torso"
                    }
                ]
            }
        ]
        
        # Create workout days and exercises
        for day_data in workout_plan:
            print(f"📅 Creating {day_data['day']} workout...")
            
            # Create workout day
            workout_day = RoutineWorkoutDay(
                id=str(uuid.uuid4()),
                routine_id=routine.id,
                day_name=day_data["day"],
                day_order=day_data["day_order"],
                workout_name=day_data["workout_name"],
                description=day_data["description"]
            )
            db.add(workout_day)
            db.flush()  # Get the workout day ID
            
            # Create exercises for this day
            for i, exercise_data in enumerate(day_data["exercises"]):
                exercise = RoutineExercise(
                    id=str(uuid.uuid4()),
                    workout_day_id=workout_day.id,
                    exercise_name=exercise_data["exercise_name"],
                    sets=exercise_data["sets"],
                    reps=exercise_data["reps"],
                    weight_notes=exercise_data["weight_notes"],
                    rest_time=exercise_data["rest_time"],
                    notes=exercise_data["notes"],
                    order_index=i
                )
                db.add(exercise)
                print(f"  💪 Added: {exercise.exercise_name}")
        
        # Commit all changes
        db.commit()
        print(f"✅ Successfully populated {routine.name} with {len(workout_plan)} workout days!")
        print("🎯 Routine is now ready for smart workout logging!")
        
    except Exception as e:
        print(f"❌ Error populating routine: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    populate_beginner_routine()
