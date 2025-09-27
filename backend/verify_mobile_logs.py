#!/usr/bin/env python3
"""Verify the seeded fitness logs for mobile@example.com"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json

def verify_logs():
    conn = psycopg2.connect(
        dbname='healthlog_db',
        user='postgres',
        password='postgres',
        host='localhost',
        port='5432'
    )
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get some sample logs
        cursor.execute('''
            SELECT activity_name, duration_minutes, calories_burned, activity_date, exercises
            FROM fitness_logs 
            WHERE user_id = 13 
            ORDER BY activity_date DESC 
            LIMIT 5
        ''')
        
        logs = cursor.fetchall()
        print('Recent workout logs for mobile@example.com:')
        print('=' * 60)
        
        for log in logs:
            print(f'Date: {log["activity_date"].strftime("%Y-%m-%d")}')
            print(f'Workout: {log["activity_name"]}')
            print(f'Duration: {log["duration_minutes"]} minutes')
            print(f'Calories: {log["calories_burned"]}')
            
            # Parse exercises
            try:
                exercises = json.loads(log['exercises']) if isinstance(log['exercises'], str) else log['exercises']
                print('Exercises:')
                for exercise in exercises[:3]:  # Show first 3 exercises
                    print(f'  - {exercise["exercise_name"]}: {exercise["sets"]}x{exercise["reps"]} @ {exercise["weight_used"]}kg')
                if len(exercises) > 3:
                    print(f'  ... and {len(exercises) - 3} more exercises')
            except Exception as e:
                print(f'  Error parsing exercises: {e}')
            print()
        
        # Get summary stats
        cursor.execute('''
            SELECT 
                COUNT(*) as total_workouts,
                AVG(duration_minutes) as avg_duration,
                AVG(calories_burned) as avg_calories,
                MIN(activity_date) as first_workout,
                MAX(activity_date) as last_workout
            FROM fitness_logs 
            WHERE user_id = 13
        ''')
        
        stats = cursor.fetchone()
        print('Summary Statistics:')
        print('=' * 30)
        print(f'Total workouts: {stats["total_workouts"]}')
        print(f'Average duration: {stats["avg_duration"]:.1f} minutes')
        print(f'Average calories: {stats["avg_calories"]:.0f}')
        print(f'First workout: {stats["first_workout"].strftime("%Y-%m-%d")}')
        print(f'Last workout: {stats["last_workout"].strftime("%Y-%m-%d")}')
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    verify_logs()
