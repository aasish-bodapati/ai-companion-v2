#!/usr/bin/env python3
"""
Script to categorize all exercises in the PostgreSQL database into 4 categories:
1. bodyweight - Bodyweight exercises and repetition-only exercises
2. weighted - Weighted exercises with external weights
3. cardio_duration - Cardio exercises and static holds
4. distance_based - Distance-based exercises
"""

import psycopg2
import re
from typing import Dict, List, Tuple

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'database': 'healthlog_db',
    'user': 'postgres',
    'password': 'postgres'  # You may need to update this
}

def get_exercises(conn) -> List[Tuple[int, str]]:
    """Get all exercises from the database"""
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM exercises ORDER BY name")
        return cur.fetchall()

def categorize_exercise(name: str) -> str:
    """
    Categorize an exercise based on its name
    Returns one of: bodyweight, weighted, cardio_duration, distance_based
    """
    name_lower = name.lower()
    
    # Distance-based exercises
    distance_keywords = [
        'run', 'running', 'jog', 'jogging', 'walk', 'walking', 'sprint', 'marathon',
        'race', 'track', 'trail', 'road', 'cross country', 'ultra', 'relay',
        'bike', 'cycling', 'ride', 'riding', 'spin', 'spinning', 'stationary bike',
        'swim', 'swimming', 'pool', 'open water', 'triathlon', 'aqua',
        'row', 'rowing', 'erg', 'ergometer', 'indoor rowing',
        'ski', 'skiing', 'cross country ski', 'alpine', 'downhill',
        'hike', 'hiking', 'trek', 'trekking', 'climb', 'climbing', 'mountaineering',
        'skate', 'skating', 'roller', 'inline', 'speed skating',
        'elliptical', 'treadmill', 'stair', 'stairs', 'step', 'stepper'
    ]
    
    if any(keyword in name_lower for keyword in distance_keywords):
        return 'distance_based'
    
    # Cardio and static hold exercises
    cardio_keywords = [
        'cardio', 'aerobic', 'anaerobic', 'hiit', 'tabata', 'circuit', 'interval',
        'burpee', 'burpees', 'jumping jack', 'jumping jacks', 'mountain climber',
        'high knee', 'high knees', 'butt kick', 'butt kicks', 'jump rope', 'skipping',
        'plank', 'planks', 'wall sit', 'wall sits', 'lunge hold', 'squat hold',
        'bridge', 'bridges', 'superman', 'dead bug', 'bird dog', 'side plank',
        'yoga', 'stretch', 'stretching', 'flexibility', 'mobility', 'balance',
        'meditation', 'breathing', 'relaxation', 'recovery', 'cool down',
        'warm up', 'warmup', 'dynamic', 'static', 'isometric', 'hold',
        'dance', 'dancing', 'zumba', 'aerobics', 'step aerobics',
        'kickboxing', 'boxing', 'martial arts', 'karate', 'taekwondo',
        'spinning', 'indoor cycling', 'stationary bike', 'exercise bike'
    ]
    
    if any(keyword in name_lower for keyword in cardio_keywords):
        return 'cardio_duration'
    
    # Weighted exercises (exercises that clearly require external weights)
    weighted_keywords = [
        'dumbbell', 'dumbbells', 'barbell', 'barbells', 'kettlebell', 'kettlebells',
        'weight', 'weights', 'loaded', 'heavy', 'resistance', 'cable', 'machine',
        'bench press', 'squat', 'squats', 'deadlift', 'deadlifts', 'overhead press',
        'shoulder press', 'lateral raise', 'front raise', 'rear delt', 'bicep curl',
        'tricep', 'triceps', 'chest press', 'incline', 'decline', 'fly', 'flies',
        'row', 'rows', 'pull', 'pulls', 'lat', 'lats', 'trap', 'traps',
        'leg press', 'leg extension', 'leg curl', 'calf raise', 'calf raises',
        'hip thrust', 'glute bridge', 'romanian deadlift', 'stiff leg',
        'good morning', 'rack pull', 'sumo', 'conventional', 'hex bar',
        'smith', 'smith machine', 'hack squat', 'bulgarian', 'goblet',
        'farmer', 'farmers', 'suitcase', 'waiter', 'waiters', 'zercher',
        'sandbag', 'sandbags', 'medicine ball', 'medicine balls', 'slamball',
        'battle rope', 'battle ropes', 'sledgehammer', 'sledgehammers',
        'tire', 'tires', 'sled', 'sleds', 'prowler', 'prowlers',
        'weighted', 'loaded', 'heavy', 'resistance band', 'resistance bands',
        'cable', 'cables', 'machine', 'machines', 'rack', 'racks',
        'barbell', 'dumbbell', 'kettlebell', 'plate', 'plates'
    ]
    
    if any(keyword in name_lower for keyword in weighted_keywords):
        return 'weighted'
    
    # Bodyweight exercises (everything else, including push-ups, pull-ups, etc.)
    bodyweight_keywords = [
        'push', 'pushup', 'push-up', 'pushups', 'push-ups', 'clap', 'diamond',
        'incline', 'decline', 'pike', 'handstand', 'wall', 'knee', 'knees',
        'pull', 'pullup', 'pull-up', 'pullups', 'pull-ups', 'chin', 'chinup',
        'chin-up', 'chinups', 'chin-ups', 'muscle up', 'muscle-up', 'muscleups',
        'dip', 'dips', 'tricep dip', 'tricep dips', 'chest dip', 'chest dips',
        'squat', 'squats', 'air squat', 'air squats', 'jump squat', 'jump squats',
        'pistol', 'pistols', 'single leg', 'single-leg', 'assisted', 'unassisted',
        'lunge', 'lunges', 'reverse', 'forward', 'side', 'lateral', 'walking',
        'step', 'steps', 'step up', 'step-up', 'stepups', 'box', 'box jump',
        'jump', 'jumps', 'jumping', 'leap', 'leaps', 'leaping', 'hop', 'hops',
        'hop', 'hops', 'hopping', 'skip', 'skips', 'skipping', 'bound', 'bounds',
        'crawl', 'crawls', 'crawling', 'bear', 'crab', 'spider', 'lizard',
        'monkey', 'ape', 'gorilla', 'frog', 'toad', 'duck', 'duck walk',
        'crouch', 'crouches', 'crouching', 'squat', 'squats', 'squatting',
        'sit', 'sits', 'sitting', 'sit up', 'sit-up', 'situps', 'sit-ups',
        'crunch', 'crunches', 'crunching', 'ab', 'abs', 'abdominal', 'core',
        'plank', 'planks', 'planking', 'side plank', 'side planks',
        'mountain climber', 'mountain climbers', 'climber', 'climbers',
        'burpee', 'burpees', 'thruster', 'thrusters', 'thrusting',
        'clean', 'cleans', 'cleaning', 'snatch', 'snatches', 'snatching',
        'jerk', 'jerks', 'jerking', 'press', 'presses', 'pressing',
        'raise', 'raises', 'raising', 'lift', 'lifts', 'lifting',
        'curl', 'curls', 'curling', 'extension', 'extensions', 'extending',
        'flexion', 'flexions', 'flexing', 'rotation', 'rotations', 'rotating',
        'circumduction', 'circumductions', 'abduction', 'abductions', 'abducting',
        'adduction', 'adductions', 'adducting', 'elevation', 'elevations',
        'depression', 'depressions', 'protraction', 'protractions',
        'retraction', 'retractions', 'supination', 'supinations',
        'pronation', 'pronations', 'inversion', 'inversions',
        'eversion', 'eversions', 'dorsiflexion', 'dorsiflexions',
        'plantarflexion', 'plantarflexions', 'flexion', 'flexions',
        'extension', 'extensions', 'hyperextension', 'hyperextensions',
        'flexion', 'flexions', 'lateral flexion', 'lateral flexions',
        'rotation', 'rotations', 'lateral rotation', 'lateral rotations',
        'medial rotation', 'medial rotations', 'circumduction', 'circumductions'
    ]
    
    # If it contains bodyweight keywords, it's bodyweight
    if any(keyword in name_lower for keyword in bodyweight_keywords):
        return 'bodyweight'
    
    # Default to bodyweight for anything that doesn't clearly fit other categories
    return 'bodyweight'

def update_exercise_categories(conn, updates: List[Tuple[str, int]]):
    """Update exercise categories in the database"""
    with conn.cursor() as cur:
        for category, exercise_id in updates:
            cur.execute(
                "UPDATE exercises SET logging_category = %s WHERE id = %s",
                (category, exercise_id)
            )
        conn.commit()

def main():
    """Main function to categorize all exercises"""
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        print("Connected to database successfully!")
        
        # Get all exercises
        exercises = get_exercises(conn)
        print(f"Found {len(exercises)} exercises to categorize")
        
        # Categorize each exercise
        updates = []
        category_counts = {'bodyweight': 0, 'weighted': 0, 'cardio_duration': 0, 'distance_based': 0}
        
        for exercise_id, name in exercises:
            category = categorize_exercise(name)
            updates.append((category, exercise_id))
            category_counts[category] += 1
            print(f"{name} -> {category}")
        
        # Show summary
        print("\n" + "="*50)
        print("CATEGORIZATION SUMMARY")
        print("="*50)
        for category, count in category_counts.items():
            print(f"{category}: {count} exercises")
        
        # Ask for confirmation
        response = input(f"\nUpdate {len(updates)} exercises in the database? (y/N): ")
        if response.lower() == 'y':
            update_exercise_categories(conn, updates)
            print("✅ Database updated successfully!")
        else:
            print("❌ Update cancelled")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
