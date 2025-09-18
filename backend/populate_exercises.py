"""
Populate the exercise database with comprehensive exercise data.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.health.exercise_database import Exercise, ExerciseTemplate
from app.core.config import settings
import json


def populate_exercises():
    """Populate the database with comprehensive exercise data."""
    
    db = SessionLocal()
    
    try:
        print("🏋️ Populating Exercise Database...")
        
        # Check if exercises already exist
        existing_count = db.query(Exercise).count()
        if existing_count > 0:
            print(f"⚠️  Database already contains {existing_count} exercises. Skipping population.")
            return
        
        # Comprehensive exercise data
        exercises_data = [
            # CARDIO EXERCISES
            {
                "name": "Running",
                "category": "cardio",
                "subcategory": "outdoor",
                "muscle_groups": ["legs", "core", "cardiovascular"],
                "equipment_needed": ["none"],
                "difficulty_level": "beginner",
                "calories_per_minute": 10.0,
                "met_value": 8.0,
                "description": "Classic cardiovascular exercise for building endurance",
                "instructions": [
                    "Start with a light warm-up walk",
                    "Maintain a steady pace you can sustain",
                    "Land on the middle of your foot",
                    "Keep your arms relaxed and swinging naturally",
                    "Cool down with a walk and stretching"
                ],
                "tips": [
                    "Start slowly and build up distance gradually",
                    "Invest in proper running shoes",
                    "Stay hydrated",
                    "Listen to your body and rest when needed"
                ],
                "is_popular": True
            },
            {
                "name": "Cycling",
                "category": "cardio",
                "subcategory": "outdoor",
                "muscle_groups": ["legs", "glutes", "core"],
                "equipment_needed": ["bicycle"],
                "difficulty_level": "beginner",
                "calories_per_minute": 8.0,
                "met_value": 6.8,
                "description": "Low-impact cardio exercise great for all fitness levels",
                "instructions": [
                    "Adjust bike seat to proper height",
                    "Start with a gentle pace",
                    "Maintain proper posture",
                    "Use gears appropriately for terrain",
                    "Stay aware of traffic and surroundings"
                ],
                "tips": [
                    "Wear a helmet for safety",
                    "Start with flat terrain",
                    "Keep a steady cadence",
                    "Hydrate regularly on longer rides"
                ],
                "is_popular": True
            },
            {
                "name": "Jump Rope",
                "category": "cardio",
                "subcategory": "indoor",
                "muscle_groups": ["legs", "shoulders", "core"],
                "equipment_needed": ["jump_rope"],
                "difficulty_level": "intermediate",
                "calories_per_minute": 12.0,
                "met_value": 11.0,
                "description": "High-intensity cardio that improves coordination",
                "instructions": [
                    "Hold handles at hip level",
                    "Jump on balls of feet",
                    "Keep elbows close to body",
                    "Turn rope with wrists, not arms",
                    "Start with short intervals"
                ],
                "tips": [
                    "Choose proper rope length",
                    "Start with basic bounce",
                    "Land softly to protect joints",
                    "Practice rhythm before speed"
                ],
                "is_popular": True
            },
            
            # STRENGTH EXERCISES
            {
                "name": "Push-ups",
                "category": "strength",
                "subcategory": "bodyweight",
                "muscle_groups": ["chest", "triceps", "shoulders", "core"],
                "equipment_needed": ["none"],
                "difficulty_level": "beginner",
                "calories_per_minute": 6.0,
                "met_value": 3.8,
                "description": "Classic bodyweight exercise for upper body strength",
                "instructions": [
                    "Start in plank position",
                    "Hands slightly wider than shoulders",
                    "Lower body as one unit",
                    "Push back to starting position",
                    "Keep core engaged throughout"
                ],
                "tips": [
                    "Modify on knees if needed",
                    "Keep body straight",
                    "Control the movement",
                    "Breathe out on the push up"
                ],
                "variations": ["Knee push-ups", "Diamond push-ups", "Wide-grip push-ups"],
                "is_popular": True
            },
            {
                "name": "Squats",
                "category": "strength",
                "subcategory": "bodyweight",
                "muscle_groups": ["quadriceps", "glutes", "hamstrings", "core"],
                "equipment_needed": ["none"],
                "difficulty_level": "beginner",
                "calories_per_minute": 5.0,
                "met_value": 5.0,
                "description": "Fundamental lower body exercise",
                "instructions": [
                    "Stand with feet hip-width apart",
                    "Lower hips back and down",
                    "Keep chest up and knees tracking over toes",
                    "Lower until thighs are parallel to ground",
                    "Push through heels to stand"
                ],
                "tips": [
                    "Keep weight in heels",
                    "Don't let knees cave inward",
                    "Go only as low as comfortable",
                    "Engage core throughout movement"
                ],
                "variations": ["Goblet squats", "Jump squats", "Single-leg squats"],
                "is_popular": True
            },
            {
                "name": "Deadlifts",
                "category": "strength",
                "subcategory": "weightlifting",
                "muscle_groups": ["hamstrings", "glutes", "back", "traps", "core"],
                "equipment_needed": ["barbell", "weights"],
                "difficulty_level": "intermediate",
                "calories_per_minute": 6.0,
                "met_value": 6.0,
                "description": "Compound exercise targeting posterior chain",
                "instructions": [
                    "Stand with feet hip-width apart",
                    "Grip bar with hands just outside legs",
                    "Keep chest up and shoulders back",
                    "Lift by driving through heels",
                    "Stand tall at the top, then lower with control"
                ],
                "tips": [
                    "Start with light weight to learn form",
                    "Keep bar close to body",
                    "Don't round your back",
                    "Engage lats to protect spine"
                ],
                "variations": ["Romanian deadlifts", "Sumo deadlifts", "Single-leg deadlifts"],
                "is_popular": True
            },
            {
                "name": "Bench Press",
                "category": "strength",
                "subcategory": "weightlifting",
                "muscle_groups": ["chest", "triceps", "shoulders"],
                "equipment_needed": ["barbell", "bench", "weights"],
                "difficulty_level": "intermediate",
                "calories_per_minute": 5.0,
                "met_value": 6.0,
                "description": "Primary chest building exercise",
                "instructions": [
                    "Lie on bench with eyes under bar",
                    "Grip bar slightly wider than shoulders",
                    "Unrack and lower to chest with control",
                    "Press bar back to starting position",
                    "Keep feet flat on floor"
                ],
                "tips": [
                    "Always use a spotter",
                    "Keep shoulder blades pinched",
                    "Don't bounce bar off chest",
                    "Maintain tight core"
                ],
                "variations": ["Dumbbell press", "Incline bench press", "Close-grip bench press"],
                "is_popular": True
            },
            
            # FLEXIBILITY EXERCISES
            {
                "name": "Forward Fold",
                "category": "flexibility",
                "subcategory": "stretching",
                "muscle_groups": ["hamstrings", "calves", "back"],
                "equipment_needed": ["none"],
                "difficulty_level": "beginner",
                "calories_per_minute": 2.0,
                "met_value": 2.3,
                "description": "Basic forward bend for hamstring flexibility",
                "instructions": [
                    "Stand with feet hip-width apart",
                    "Hinge at hips and fold forward",
                    "Let arms hang or hold opposite elbows",
                    "Keep knees slightly bent",
                    "Hold for 30-60 seconds"
                ],
                "tips": [
                    "Don't force the stretch",
                    "Breathe deeply",
                    "Bend knees if hamstrings are tight",
                    "Focus on hip hinge, not rounding spine"
                ],
                "is_popular": True
            },
            {
                "name": "Cat-Cow Stretch",
                "category": "flexibility",
                "subcategory": "mobility",
                "muscle_groups": ["spine", "core", "neck"],
                "equipment_needed": ["none"],
                "difficulty_level": "beginner",
                "calories_per_minute": 2.0,
                "met_value": 2.3,
                "description": "Spinal mobility exercise",
                "instructions": [
                    "Start on hands and knees",
                    "Arch back and lift head (cow)",
                    "Round spine and tuck chin (cat)",
                    "Move slowly between positions",
                    "Repeat 10-15 times"
                ],
                "tips": [
                    "Move with your breath",
                    "Keep movements slow and controlled",
                    "Don't force the range of motion",
                    "Focus on spinal articulation"
                ],
                "is_popular": True
            },
            
            # SPORTS EXERCISES
            {
                "name": "Basketball",
                "category": "sports",
                "subcategory": "team_sport",
                "muscle_groups": ["legs", "core", "arms", "cardiovascular"],
                "equipment_needed": ["basketball", "hoop"],
                "difficulty_level": "intermediate",
                "calories_per_minute": 8.0,
                "met_value": 8.0,
                "description": "Team sport combining cardio and skill",
                "instructions": [
                    "Warm up with light jogging",
                    "Practice basic dribbling and shooting",
                    "Play with proper form",
                    "Stay hydrated during breaks",
                    "Cool down with stretching"
                ],
                "tips": [
                    "Wear proper basketball shoes",
                    "Learn basic rules and positions",
                    "Focus on teamwork",
                    "Practice fundamentals regularly"
                ],
                "is_popular": True
            },
            {
                "name": "Swimming",
                "category": "sports",
                "subcategory": "water_sport",
                "muscle_groups": ["full_body", "cardiovascular"],
                "equipment_needed": ["pool", "swimwear"],
                "difficulty_level": "beginner",
                "calories_per_minute": 11.0,
                "met_value": 8.0,
                "description": "Low-impact full-body exercise",
                "instructions": [
                    "Start with basic strokes",
                    "Focus on breathing technique",
                    "Maintain steady rhythm",
                    "Use proper form over speed",
                    "Cool down with easy swimming"
                ],
                "tips": [
                    "Learn proper breathing technique",
                    "Start with shorter distances",
                    "Use pool equipment if needed",
                    "Consider swimming lessons"
                ],
                "is_popular": True
            },
            
            # FUNCTIONAL EXERCISES
            {
                "name": "Burpees",
                "category": "functional",
                "subcategory": "full_body",
                "muscle_groups": ["full_body", "cardiovascular"],
                "equipment_needed": ["none"],
                "difficulty_level": "advanced",
                "calories_per_minute": 15.0,
                "met_value": 8.0,
                "description": "High-intensity full-body exercise",
                "instructions": [
                    "Start in standing position",
                    "Drop into squat and place hands on floor",
                    "Jump feet back into plank",
                    "Do a push-up (optional)",
                    "Jump feet back to squat and jump up"
                ],
                "tips": [
                    "Modify by stepping instead of jumping",
                    "Focus on form over speed",
                    "Take breaks as needed",
                    "Build up intensity gradually"
                ],
                "is_popular": True
            },
            {
                "name": "Mountain Climbers",
                "category": "functional",
                "subcategory": "cardio_strength",
                "muscle_groups": ["core", "shoulders", "legs", "cardiovascular"],
                "equipment_needed": ["none"],
                "difficulty_level": "intermediate",
                "calories_per_minute": 10.0,
                "met_value": 8.0,
                "description": "Dynamic core and cardio exercise",
                "instructions": [
                    "Start in plank position",
                    "Bring one knee toward chest",
                    "Quickly switch legs",
                    "Maintain plank throughout",
                    "Keep core engaged"
                ],
                "tips": [
                    "Keep hips level",
                    "Don't let hips pike up",
                    "Start slowly to learn movement",
                    "Breathe consistently"
                ],
                "is_popular": True
            }
        ]
        
        # Add exercises to database
        exercises_added = 0
        for exercise_data in exercises_data:
            exercise = Exercise(**exercise_data)
            db.add(exercise)
            exercises_added += 1
        
        # Add exercise templates
        templates_data = [
            {
                "name": "Quick Cardio Blast",
                "description": "15-minute high-intensity cardio workout",
                "category": "cardio",
                "difficulty_level": "intermediate",
                "estimated_duration_minutes": 15,
                "exercises": [
                    {"exercise_name": "Jump Rope", "duration_minutes": 3, "intensity": "high"},
                    {"exercise_name": "Mountain Climbers", "duration_minutes": 2, "intensity": "high"},
                    {"exercise_name": "Burpees", "duration_minutes": 2, "intensity": "high"},
                    {"exercise_name": "Running in Place", "duration_minutes": 3, "intensity": "medium"},
                    {"exercise_name": "Jump Rope", "duration_minutes": 3, "intensity": "high"},
                    {"exercise_name": "Mountain Climbers", "duration_minutes": 2, "intensity": "high"}
                ],
                "is_popular": True
            },
            {
                "name": "Beginner Strength Circuit",
                "description": "20-minute bodyweight strength workout for beginners",
                "category": "strength",
                "difficulty_level": "beginner",
                "estimated_duration_minutes": 20,
                "exercises": [
                    {"exercise_name": "Push-ups", "sets": 3, "reps": 8, "rest_seconds": 60},
                    {"exercise_name": "Squats", "sets": 3, "reps": 12, "rest_seconds": 60},
                    {"exercise_name": "Plank", "duration_seconds": 30, "sets": 3, "rest_seconds": 60},
                    {"exercise_name": "Lunges", "sets": 2, "reps": 8, "rest_seconds": 60}
                ],
                "is_popular": True
            },
            {
                "name": "Morning Mobility Flow",
                "description": "10-minute gentle stretching routine to start your day",
                "category": "flexibility",
                "difficulty_level": "beginner",
                "estimated_duration_minutes": 10,
                "exercises": [
                    {"exercise_name": "Cat-Cow Stretch", "duration_minutes": 2},
                    {"exercise_name": "Forward Fold", "duration_minutes": 2},
                    {"exercise_name": "Side Stretch", "duration_minutes": 2},
                    {"exercise_name": "Hip Circles", "duration_minutes": 2},
                    {"exercise_name": "Shoulder Rolls", "duration_minutes": 2}
                ],
                "is_popular": True
            }
        ]
        
        templates_added = 0
        for template_data in templates_data:
            template = ExerciseTemplate(**template_data)
            db.add(template)
            templates_added += 1
        
        # Commit all changes
        db.commit()
        
        print(f"✅ Successfully added {exercises_added} exercises and {templates_added} templates to the database!")
        print("🎯 Exercise database is ready for use!")
        
    except Exception as e:
        print(f"❌ Error populating exercises: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    populate_exercises()
