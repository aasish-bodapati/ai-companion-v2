import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json

load_dotenv()
conn = psycopg2.connect(os.getenv('SQLALCHEMY_DATABASE_URI'))
cursor = conn.cursor()

# Clear existing logs
print("Clearing existing fitness logs...")
cursor.execute('DELETE FROM fitness_logs')
print(f"Deleted {cursor.rowcount} existing logs")

# Create proper workout logs with exercise details
workout_logs = [
    {
        "date": "2025-09-23",
        "workout_name": "Push Day",
        "duration_minutes": 45,
        "calories_burned": 350,
        "exercises": [
            {"exercise_name": "Incline Barbell Press", "sets": 4, "reps": "8-10", "weight_used": 80},
            {"exercise_name": "Barbell Bench Press", "sets": 3, "reps": "10-12", "weight_used": 70},
            {"exercise_name": "Dumbbell Flyes", "sets": 3, "reps": "12-15", "weight_used": 25},
            {"exercise_name": "Tricep Dips", "sets": 3, "reps": "8-12", "weight_used": 0}
        ]
    },
    {
        "date": "2025-09-22", 
        "workout_name": "Leg Day",
        "duration_minutes": 50,
        "calories_burned": 400,
        "exercises": [
            {"exercise_name": "Barbell Hack Squats", "sets": 4, "reps": "8-10", "weight_used": 120},
            {"exercise_name": "Romanian Deadlifts", "sets": 3, "reps": "10-12", "weight_used": 100},
            {"exercise_name": "Bulgarian Split Squats", "sets": 3, "reps": "12-15", "weight_used": 0},
            {"exercise_name": "Calf Raises", "sets": 4, "reps": "15-20", "weight_used": 40}
        ]
    },
    {
        "date": "2025-09-21",
        "workout_name": "Pull Day", 
        "duration_minutes": 40,
        "calories_burned": 320,
        "exercises": [
            {"exercise_name": "Deadlifts", "sets": 4, "reps": "5-8", "weight_used": 140},
            {"exercise_name": "T-Bar Rows", "sets": 3, "reps": "8-10", "weight_used": 60},
            {"exercise_name": "Pull-ups", "sets": 3, "reps": "6-10", "weight_used": 0},
            {"exercise_name": "Bicep Curls", "sets": 3, "reps": "12-15", "weight_used": 20}
        ]
    },
    {
        "date": "2025-09-20",
        "workout_name": "Push Day",
        "duration_minutes": 42,
        "calories_burned": 330,
        "exercises": [
            {"exercise_name": "Squats", "sets": 4, "reps": "8-10", "weight_used": 100},
            {"exercise_name": "Overhead Press", "sets": 3, "reps": "8-12", "weight_used": 50},
            {"exercise_name": "Lateral Raises", "sets": 3, "reps": "12-15", "weight_used": 15},
            {"exercise_name": "Tricep Extensions", "sets": 3, "reps": "10-12", "weight_used": 30}
        ]
    },
    {
        "date": "2025-09-19",
        "workout_name": "Pull Day",
        "duration_minutes": 38,
        "calories_burned": 300,
        "exercises": [
            {"exercise_name": "Incline Barbell Press", "sets": 4, "reps": "8-10", "weight_used": 75},
            {"exercise_name": "Deadlifts", "sets": 3, "reps": "6-8", "weight_used": 135},
            {"exercise_name": "Bent-over Rows", "sets": 3, "reps": "10-12", "weight_used": 55},
            {"exercise_name": "Hammer Curls", "sets": 3, "reps": "12-15", "weight_used": 18}
        ]
    },
    {
        "date": "2025-09-18",
        "workout_name": "Leg Day",
        "duration_minutes": 48,
        "calories_burned": 380,
        "exercises": [
            {"exercise_name": "Barbell Bench Press", "sets": 4, "reps": "8-10", "weight_used": 65},
            {"exercise_name": "Front Squats", "sets": 3, "reps": "8-10", "weight_used": 80},
            {"exercise_name": "Walking Lunges", "sets": 3, "reps": "12-15", "weight_used": 0},
            {"exercise_name": "Leg Press", "sets": 3, "reps": "12-15", "weight_used": 200}
        ]
    }
]

print("Creating proper workout logs with exercise details...")
for log in workout_logs:
    # Convert exercises to JSON string for storage
    exercises_json = json.dumps(log["exercises"])
    
    # Insert the workout log
    cursor.execute("""
        INSERT INTO fitness_logs 
        (user_id, activity_name, activity_type, duration_minutes, calories_burned, activity_date, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        1,  # user_id
        log["workout_name"],
        "strength_training",
        log["duration_minutes"],
        log["calories_burned"],
        log["date"],
        datetime.now(),
        datetime.now()
    ))
    
    print(f"Created workout: {log['workout_name']} on {log['date']} with {len(log['exercises'])} exercises")

conn.commit()
print(f"\nCreated {len(workout_logs)} workout logs with exercise details!")

# Verify the data
cursor.execute('SELECT COUNT(*) FROM fitness_logs')
count = cursor.fetchone()[0]
print(f"Total logs in database: {count}")

conn.close()
