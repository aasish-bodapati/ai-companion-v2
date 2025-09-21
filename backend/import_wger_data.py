#!/usr/bin/env python3
"""
Import wger.de exercise data into our database
This script fetches all exercises, categories, muscles, and equipment from wger.de
and populates our local database with the data.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.wger_api import WgerApiClient, map_wger_category_to_attributes
from app.db.session import SessionLocal
from app.models.health.exercise_database import Exercise
from app.models.health.exercise_logging_categories import ExerciseLoggingCategoryEnum
from sqlalchemy.orm import Session
import json

def map_wger_category_to_logging_enum(category_id: int) -> ExerciseLoggingCategoryEnum:
    """Map wger.de category ID to our ExerciseLoggingCategoryEnum"""
    # Map wger categories to our logging categories
    if category_id in [8, 11, 12, 9, 13, 10]:  # Arms, Chest, Back, Legs, Shoulders, Abs
        return ExerciseLoggingCategoryEnum.weighted  # Most strength exercises use weights
    elif category_id == 15:  # Cardio
        return ExerciseLoggingCategoryEnum.cardio_duration
    elif category_id == 14:  # Calves
        return ExerciseLoggingCategoryEnum.hold_static
    else:
        return ExerciseLoggingCategoryEnum.bodyweight  # Default fallback

def import_wger_data():
    """Import all wger.de data into our database"""
    print("🚀 Starting wger.de data import...")
    
    # Initialize API client
    wger_client = WgerApiClient()
    
    # Test API connection
    print("🔍 Testing wger.de API connection...")
    test_categories = wger_client.get_exercise_categories()
    if not test_categories:
        print("❌ Failed to connect to wger.de API. Check your API key.")
        return False
    
    print(f"✅ Connected to wger.de API. Found {len(test_categories)} categories.")
    
    # Get all data from wger.de
    print("📥 Fetching data from wger.de...")
    
    # Get reference data
    categories = wger_client.get_exercise_categories()
    muscles = wger_client.get_muscles()
    equipment = wger_client.get_equipment()
    
    # Create lookup dictionaries
    category_lookup = {cat["id"]: cat["name"] for cat in categories}
    muscle_lookup = {muscle["id"]: muscle["name_en"] or muscle["name"] for muscle in muscles}
    equipment_lookup = {eq["id"]: eq["name"] for eq in equipment}
    
    print(f"📊 Reference data: {len(categories)} categories, {len(muscles)} muscles, {len(equipment)} equipment")
    
    # Get all exercises
    print("🏋️ Fetching all exercises...")
    exercises = wger_client.get_all_exercises()
    print(f"📥 Fetched {len(exercises)} exercises from wger.de")
    
    if not exercises:
        print("❌ No exercises found. Check your API key and connection.")
        return False
    
    # Import into database
    db = SessionLocal()
    try:
        # Clear existing exercises
        print("🗑️ Clearing existing exercise data...")
        db.query(Exercise).delete()
        
        imported_count = 0
        skipped_count = 0
        
        for exercise_data in exercises:
            try:
                # Get exercise translations for English name
                translations = wger_client.get_exercise_translations(exercise_data["id"])
                english_name = None
                
                for translation in translations:
                    if translation.get("language") == 2:  # English
                        english_name = translation.get("name")
                        break
                
                if not english_name:
                    # Skip exercises without English translation
                    skipped_count += 1
                    continue
                
                # Map category
                category_id = exercise_data.get("category")
                category_name = category_lookup.get(category_id, "Other")
                
                # Map muscles
                primary_muscles = [muscle_lookup.get(mid, f"Muscle_{mid}") for mid in exercise_data.get("muscles", [])]
                secondary_muscles = [muscle_lookup.get(mid, f"Muscle_{mid}") for mid in exercise_data.get("muscles_secondary", [])]
                all_muscles = primary_muscles + secondary_muscles
                
                # Map equipment
                equipment_list = [equipment_lookup.get(eid, f"Equipment_{eid}") for eid in exercise_data.get("equipment", [])]
                if not equipment_list:
                    equipment_list = ["none"]
                
                # Map wger category to our logging category enum
                logging_category = map_wger_category_to_logging_enum(category_id)
                
                # Create exercise record with only valid fields
                exercise = Exercise(
                    name=english_name,
                    logging_category=logging_category,
                    difficulty_level="beginner",  # Default, could be determined from wger data
                    calories_per_minute=5.0,  # Default value
                    description=f"Exercise from wger.de database",
                    # Legacy fields for backward compatibility
                    category=category_name.lower(),
                    muscle_groups=all_muscles,
                    equipment_needed=equipment_list
                )
                
                db.add(exercise)
                imported_count += 1
                
                if imported_count % 50 == 0:
                    print(f"📥 Imported {imported_count} exercises...")
                    db.commit()  # Commit in batches
                    
            except Exception as e:
                print(f"⚠️ Error importing exercise {exercise_data.get('id', 'unknown')}: {e}")
                skipped_count += 1
                continue
        
        # Final commit
        db.commit()
        
        print(f"✅ Successfully imported {imported_count} exercises")
        print(f"⚠️ Skipped {skipped_count} exercises (no English translation or errors)")
        
        # Print summary by category
        print("\n📊 Import Summary by Category:")
        from sqlalchemy import func
        category_stats = db.query(Exercise.category, func.count(Exercise.id)).group_by(Exercise.category).all()
        for category, count in category_stats:
            print(f"  {category}: {count} exercises")
        
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def test_import():
    """Test the import with a small sample"""
    print("🧪 Testing wger.de import with sample data...")
    
    wger_client = WgerApiClient()
    
    # Get a small sample
    sample_exercises = wger_client.get_exercises(limit=5)
    print(f"📥 Sample exercises: {len(sample_exercises)}")
    
    for exercise in sample_exercises:
        print(f"  - ID: {exercise['id']}, Category: {exercise['category']}")
        
        # Get translations
        translations = wger_client.get_exercise_translations(exercise["id"])
        for translation in translations:
            if translation.get("language") == 2:  # English
                print(f"    Name: {translation.get('name')}")
                break

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Import wger.de exercise data")
    parser.add_argument("--test", action="store_true", help="Test import with sample data")
    parser.add_argument("--full", action="store_true", help="Import all data from wger.de")
    
    args = parser.parse_args()
    
    if args.test:
        test_import()
    elif args.full:
        success = import_wger_data()
        if success:
            print("🎉 wger.de data import completed successfully!")
        else:
            print("❌ wger.de data import failed!")
            sys.exit(1)
    else:
        print("Usage: python import_wger_data.py --test or --full")
        sys.exit(1)
