"""
Setup script for high-ROI features.
Populates exercise database, food database, and creates database tables.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.health.exercise_database import Exercise, ExerciseTemplate, UserExerciseHistory
from app.models.health.food_database import Food, MealTemplate, UserFoodHistory, FoodAlternative
from app.core.config import settings
from populate_exercises import populate_exercises
import json


def populate_food_database():
    """Populate the database with comprehensive food data."""
    
    db = SessionLocal()
    
    try:
        print("🍎 Populating Food Database...")
        
        # Check if foods already exist
        existing_count = db.query(Food).count()
        if existing_count > 0:
            print(f"⚠️  Database already contains {existing_count} foods. Skipping population.")
            return
        
        # Comprehensive food data
        foods_data = [
            # FRUITS
            {
                "name": "Apple",
                "category": "fruits",
                "subcategory": "pome_fruits",
                "calories_per_100g": 52,
                "protein_per_100g": 0.3,
                "carbs_per_100g": 14,
                "fat_per_100g": 0.2,
                "fiber_per_100g": 2.4,
                "sugar_per_100g": 10.4,
                "sodium_per_100g": 1,
                "common_serving_sizes": [
                    {"name": "1 medium apple", "grams": 182},
                    {"name": "1 cup sliced", "grams": 125}
                ],
                "description": "Fresh apple, raw",
                "dietary_tags": ["vegan", "gluten_free", "low_calorie"],
                "is_popular": True
            },
            {
                "name": "Banana",
                "category": "fruits",
                "subcategory": "tropical",
                "calories_per_100g": 89,
                "protein_per_100g": 1.1,
                "carbs_per_100g": 23,
                "fat_per_100g": 0.3,
                "fiber_per_100g": 2.6,
                "sugar_per_100g": 12,
                "sodium_per_100g": 1,
                "common_serving_sizes": [
                    {"name": "1 medium banana", "grams": 118},
                    {"name": "1 cup sliced", "grams": 150}
                ],
                "description": "Fresh banana, raw",
                "dietary_tags": ["vegan", "gluten_free"],
                "is_popular": True
            },
            
            # PROTEINS
            {
                "name": "Chicken Breast",
                "category": "proteins",
                "subcategory": "poultry",
                "calories_per_100g": 165,
                "protein_per_100g": 31,
                "carbs_per_100g": 0,
                "fat_per_100g": 3.6,
                "fiber_per_100g": 0,
                "sugar_per_100g": 0,
                "sodium_per_100g": 74,
                "common_serving_sizes": [
                    {"name": "1 breast (4 oz)", "grams": 113},
                    {"name": "100g serving", "grams": 100}
                ],
                "description": "Skinless, boneless chicken breast, cooked",
                "dietary_tags": ["high_protein", "low_carb"],
                "is_popular": True
            },
            {
                "name": "Salmon Fillet",
                "category": "proteins",
                "subcategory": "fish",
                "calories_per_100g": 208,
                "protein_per_100g": 25,
                "carbs_per_100g": 0,
                "fat_per_100g": 12,
                "fiber_per_100g": 0,
                "sugar_per_100g": 0,
                "sodium_per_100g": 59,
                "common_serving_sizes": [
                    {"name": "1 fillet (6 oz)", "grams": 170},
                    {"name": "100g serving", "grams": 100}
                ],
                "description": "Atlantic salmon, cooked",
                "dietary_tags": ["high_protein", "omega3", "low_carb"],
                "is_popular": True
            },
            {
                "name": "Greek Yogurt",
                "category": "dairy",
                "subcategory": "yogurt",
                "calories_per_100g": 59,
                "protein_per_100g": 10,
                "carbs_per_100g": 3.6,
                "fat_per_100g": 0.4,
                "fiber_per_100g": 0,
                "sugar_per_100g": 3.6,
                "sodium_per_100g": 36,
                "common_serving_sizes": [
                    {"name": "1 cup", "grams": 245},
                    {"name": "1 container (6 oz)", "grams": 170}
                ],
                "description": "Plain Greek yogurt, non-fat",
                "dietary_tags": ["high_protein", "probiotic"],
                "is_popular": True
            },
            
            # GRAINS
            {
                "name": "Brown Rice",
                "category": "grains",
                "subcategory": "whole_grains",
                "calories_per_100g": 111,
                "protein_per_100g": 2.6,
                "carbs_per_100g": 23,
                "fat_per_100g": 0.9,
                "fiber_per_100g": 1.8,
                "sugar_per_100g": 0.4,
                "sodium_per_100g": 5,
                "common_serving_sizes": [
                    {"name": "1 cup cooked", "grams": 195},
                    {"name": "1/2 cup cooked", "grams": 98}
                ],
                "description": "Brown rice, long-grain, cooked",
                "dietary_tags": ["whole_grain", "gluten_free", "vegan"],
                "is_popular": True
            },
            {
                "name": "Oatmeal",
                "category": "grains",
                "subcategory": "breakfast_cereals",
                "calories_per_100g": 68,
                "protein_per_100g": 2.4,
                "carbs_per_100g": 12,
                "fat_per_100g": 1.4,
                "fiber_per_100g": 1.7,
                "sugar_per_100g": 0.3,
                "sodium_per_100g": 4,
                "common_serving_sizes": [
                    {"name": "1 cup cooked", "grams": 234},
                    {"name": "1/2 cup dry", "grams": 40}
                ],
                "description": "Oatmeal, cooked with water",
                "dietary_tags": ["whole_grain", "high_fiber", "vegan"],
                "is_popular": True
            },
            
            # VEGETABLES
            {
                "name": "Broccoli",
                "category": "vegetables",
                "subcategory": "cruciferous",
                "calories_per_100g": 25,
                "protein_per_100g": 3,
                "carbs_per_100g": 5,
                "fat_per_100g": 0.4,
                "fiber_per_100g": 2.6,
                "sugar_per_100g": 1.5,
                "sodium_per_100g": 33,
                "common_serving_sizes": [
                    {"name": "1 cup chopped", "grams": 91},
                    {"name": "1 medium stalk", "grams": 148}
                ],
                "description": "Fresh broccoli, raw",
                "dietary_tags": ["low_calorie", "high_fiber", "vegan", "superfood"],
                "is_popular": True
            },
            {
                "name": "Spinach",
                "category": "vegetables",
                "subcategory": "leafy_greens",
                "calories_per_100g": 23,
                "protein_per_100g": 2.9,
                "carbs_per_100g": 3.6,
                "fat_per_100g": 0.4,
                "fiber_per_100g": 2.2,
                "sugar_per_100g": 0.4,
                "sodium_per_100g": 79,
                "common_serving_sizes": [
                    {"name": "1 cup fresh", "grams": 30},
                    {"name": "1 cup cooked", "grams": 180}
                ],
                "description": "Fresh spinach leaves, raw",
                "dietary_tags": ["low_calorie", "iron_rich", "vegan", "superfood"],
                "is_popular": True
            },
            
            # NUTS & SEEDS
            {
                "name": "Almonds",
                "category": "nuts_seeds",
                "subcategory": "tree_nuts",
                "calories_per_100g": 579,
                "protein_per_100g": 21,
                "carbs_per_100g": 22,
                "fat_per_100g": 50,
                "fiber_per_100g": 12,
                "sugar_per_100g": 4.4,
                "sodium_per_100g": 1,
                "common_serving_sizes": [
                    {"name": "1 oz (23 almonds)", "grams": 28},
                    {"name": "1/4 cup", "grams": 35}
                ],
                "description": "Raw almonds",
                "dietary_tags": ["high_protein", "healthy_fats", "vegan"],
                "is_popular": True
            }
        ]
        
        # Add foods to database
        foods_added = 0
        for food_data in foods_data:
            food = Food(**food_data)
            db.add(food)
            foods_added += 1
        
        # Add meal templates
        templates_data = [
            {
                "name": "High Protein Breakfast",
                "description": "Perfect morning meal with plenty of protein",
                "meal_type": "breakfast",
                "cuisine_type": "healthy",
                "total_calories": 350,
                "total_protein_g": 25,
                "total_carbs_g": 30,
                "total_fat_g": 12,
                "total_fiber_g": 8,
                "foods": [
                    {"food_name": "Greek Yogurt", "serving_grams": 170},
                    {"food_name": "Oatmeal", "serving_grams": 40},
                    {"food_name": "Banana", "serving_grams": 118}
                ],
                "dietary_tags": ["high_protein", "balanced"],
                "prep_time_minutes": 5,
                "is_popular": True
            },
            {
                "name": "Lean Lunch Bowl",
                "description": "Balanced lunch with lean protein and vegetables",
                "meal_type": "lunch",
                "cuisine_type": "healthy",
                "total_calories": 450,
                "total_protein_g": 35,
                "total_carbs_g": 45,
                "total_fat_g": 15,
                "total_fiber_g": 6,
                "foods": [
                    {"food_name": "Chicken Breast", "serving_grams": 113},
                    {"food_name": "Brown Rice", "serving_grams": 98},
                    {"food_name": "Broccoli", "serving_grams": 91}
                ],
                "dietary_tags": ["high_protein", "balanced", "low_fat"],
                "prep_time_minutes": 20,
                "is_popular": True
            }
        ]
        
        templates_added = 0
        for template_data in templates_data:
            template = MealTemplate(**template_data)
            db.add(template)
            templates_added += 1
        
        # Commit all changes
        db.commit()
        
        print(f"✅ Successfully added {foods_added} foods and {templates_added} meal templates to the database!")
        print("🎯 Food database is ready for use!")
        
    except Exception as e:
        print(f"❌ Error populating foods: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def create_database_tables():
    """Create all new database tables."""
    
    try:
        print("📊 Creating database tables...")
        
        from app.db.base_class import Base
        from app.db.session import engine
        
        # Import all models to ensure they're registered
        from app.models.health import exercise_database, food_database
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database tables created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        raise


def main():
    """Main setup function."""
    
    print("🚀 Setting up High-ROI Features...")
    print("=" * 50)
    
    try:
        # Step 1: Create database tables
        create_database_tables()
        
        # Step 2: Populate exercise database
        populate_exercises()
        
        # Step 3: Populate food database
        populate_food_database()
        
        print("=" * 50)
        print("🎉 High-ROI Features Setup Complete!")
        print()
        print("✅ Features Available:")
        print("   • Unified Dashboard API (/api/v1/health/dashboard/)")
        print("   • Exercise Database with Smart Suggestions (/api/v1/health/exercises/)")
        print("   • Food Database with Search (/api/v1/health/foods/)")
        print("   • Contextual Logging (/api/v1/health/contextual-logging/)")
        print("   • Instant Feedback & Insights (/api/v1/health/insights/)")
        print("   • Multi-level Caching System")
        print("   • Progressive Forms (Frontend Components)")
        print()
        print("🎯 Ready for production use!")
        
    except Exception as e:
        print(f"❌ Setup failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
