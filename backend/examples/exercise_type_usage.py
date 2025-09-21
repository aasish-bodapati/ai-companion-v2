"""
Exercise Type Usage Examples - How to use the flexible exercise system
"""

from datetime import datetime
from app.schemas.health.exercise_types import (
    StrengthExerciseAttributes,
    CardioExerciseAttributes,
    FlexibilityExerciseAttributes,
    RoutineExerciseV2Create,
    WorkoutLogV2Create
)


def create_shoulder_press_example():
    """Example: Creating a shoulder press routine exercise"""
    
    # Define the exercise attributes based on equipment type
    shoulder_press_attributes = StrengthExerciseAttributes(
        equipment_type="dumbbell",
        weight_kg=25.0,  # 25kg per dumbbell
        sets=4,
        reps="8-12",  # Rep range
        rest_time_seconds=90,
        dumbbell_weight=25.0,  # Weight per dumbbell
        rpe=7,  # Rate of perceived exertion
        tempo="3-1-2-1"  # 3 seconds down, 1 second pause, 2 seconds up, 1 second pause
    )
    
    # Create routine exercise
    routine_exercise = RoutineExerciseV2Create(
        exercise_type_id="shoulder-press-id",  # Would be actual ID from database
        attributes=shoulder_press_attributes.dict(),
        order_index=1,
        rest_time_seconds=90,
        notes="Focus on controlled movement, don't arch back"
    )
    
    return routine_exercise


def create_barbell_shoulder_press_example():
    """Example: Creating a barbell shoulder press routine exercise"""
    
    # Different attributes for barbell version
    barbell_shoulder_press_attributes = StrengthExerciseAttributes(
        equipment_type="barbell",
        weight_kg=60.0,  # Total weight including barbell
        sets=5,
        reps=8,
        rest_time_seconds=120,
        barbell_weight=20.0,  # Standard Olympic barbell
        plate_weights=[20.0, 20.0],  # 20kg plates on each side
        rpe=8,
        tempo="2-0-2-0"  # Faster tempo for barbell
    )
    
    routine_exercise = RoutineExerciseV2Create(
        exercise_type_id="barbell-shoulder-press-id",
        attributes=barbell_shoulder_press_attributes.dict(),
        order_index=2,
        rest_time_seconds=120,
        notes="Use safety bars, spotter recommended"
    )
    
    return routine_exercise


def create_running_example():
    """Example: Creating a running routine exercise"""
    
    running_attributes = CardioExerciseAttributes(
        duration_minutes=30,
        distance_km=5.0,
        pace_per_km="6:00",  # 6 minutes per kilometer
        heart_rate_avg=150,
        heart_rate_max=170,
        calories_burned=300,
        elevation_gain=50.0,  # 50m elevation gain
        cadence=180  # Steps per minute
    )
    
    routine_exercise = RoutineExerciseV2Create(
        exercise_type_id="running-id",
        attributes=running_attributes.dict(),
        order_index=3,
        notes="Easy pace, focus on form"
    )
    
    return routine_exercise


def create_yoga_example():
    """Example: Creating a yoga routine exercise"""
    
    yoga_attributes = FlexibilityExerciseAttributes(
        duration_minutes=45,
        poses_held=[
            "Downward Dog",
            "Warrior I",
            "Warrior II", 
            "Triangle Pose",
            "Child's Pose"
        ],
        difficulty_level="intermediate",
        focus_areas=["hips", "hamstrings", "shoulders"],
        flexibility_rating=7,
        pain_level=2,
        relaxation_level=8
    )
    
    routine_exercise = RoutineExerciseV2Create(
        exercise_type_id="yoga-flow-id",
        attributes=yoga_attributes.dict(),
        order_index=4,
        notes="Focus on breath and alignment"
    )
    
    return routine_exercise


def log_workout_examples():
    """Example: Logging actual workouts with the flexible system"""
    
    # Log a shoulder press workout
    shoulder_press_log = WorkoutLogV2Create(
        exercise_type_id="shoulder-press-id",
        attributes={
            "equipment_type": "dumbbell",
            "weight_kg": 27.5,  # Increased weight from routine
            "sets": 4,
            "reps": "10, 10, 9, 8",  # Actual reps performed
            "rest_time_seconds": 90,
            "dumbbell_weight": 27.5,
            "rpe": 8,  # Felt harder than routine
            "tempo": "3-1-2-1"
        },
        workout_date=datetime.now(),
        duration_minutes=15,
        calories_burned=120,
        notes="Felt strong today, increased weight",
        routine_id="my-upper-body-routine"
    )
    
    # Log a running workout
    running_log = WorkoutLogV2Create(
        exercise_type_id="running-id",
        attributes={
            "duration_minutes": 35,
            "distance_km": 6.2,  # 10K run
            "pace_per_km": "5:38",  # Faster than routine
            "heart_rate_avg": 165,
            "heart_rate_max": 185,
            "calories_burned": 450,
            "elevation_gain": 75.0,
            "cadence": 185
        },
        workout_date=datetime.now(),
        duration_minutes=35,
        calories_burned=450,
        notes="Great run, felt strong throughout"
    )
    
    return [shoulder_press_log, running_log]


def demonstrate_equipment_flexibility():
    """Show how the same exercise can have different equipment requirements"""
    
    # Same exercise (shoulder press) with different equipment
    exercises = {
        "dumbbell_shoulder_press": {
            "equipment_type": "dumbbell",
            "weight_kg": 25.0,
            "dumbbell_weight": 25.0,
            "sets": 4,
            "reps": "8-12"
        },
        "barbell_shoulder_press": {
            "equipment_type": "barbell", 
            "weight_kg": 60.0,
            "barbell_weight": 20.0,
            "plate_weights": [20.0, 20.0],
            "sets": 5,
            "reps": 8
        },
        "machine_shoulder_press": {
            "equipment_type": "machine",
            "weight_kg": 45.0,
            "sets": 4,
            "reps": "10-15"
        },
        "bodyweight_shoulder_press": {
            "equipment_type": "bodyweight",
            "weight_kg": 0.0,
            "sets": 3,
            "reps": "15-20"
        }
    }
    
    return exercises


def demonstrate_progressive_overload():
    """Show how to track progressive overload over time"""
    
    # Week 1: Starting weights
    week_1 = {
        "equipment_type": "dumbbell",
        "weight_kg": 20.0,
        "sets": 3,
        "reps": "8-10",
        "rpe": 6
    }
    
    # Week 2: Increased reps
    week_2 = {
        "equipment_type": "dumbbell", 
        "weight_kg": 20.0,
        "sets": 3,
        "reps": "10-12",
        "rpe": 7
    }
    
    # Week 3: Increased weight
    week_3 = {
        "equipment_type": "dumbbell",
        "weight_kg": 22.5,
        "sets": 3,
        "reps": "8-10", 
        "rpe": 7
    }
    
    # Week 4: Increased sets
    week_4 = {
        "equipment_type": "dumbbell",
        "weight_kg": 22.5,
        "sets": 4,
        "reps": "8-10",
        "rpe": 8
    }
    
    return {
        "week_1": week_1,
        "week_2": week_2, 
        "week_3": week_3,
        "week_4": week_4
    }


if __name__ == "__main__":
    print("🏋️ Exercise Type Usage Examples")
    print("=" * 50)
    
    # Show different exercise types
    print("\n1. Shoulder Press (Dumbbell):")
    print(create_shoulder_press_example().dict())
    
    print("\n2. Shoulder Press (Barbell):")
    print(create_barbell_shoulder_press_example().dict())
    
    print("\n3. Running:")
    print(create_running_example().dict())
    
    print("\n4. Yoga:")
    print(create_yoga_example().dict())
    
    print("\n5. Equipment Flexibility:")
    print(demonstrate_equipment_flexibility())
    
    print("\n6. Progressive Overload:")
    print(demonstrate_progressive_overload())
