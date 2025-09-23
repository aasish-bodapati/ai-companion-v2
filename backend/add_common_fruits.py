#!/usr/bin/env python3
"""
Add common fresh fruits to the database for better search results
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.session import SessionLocal
from app.models.health.food_database import Food

def add_common_fruits():
    """Add common fresh fruits to the database"""
    
    # Common fruits with nutrition data per 100g
    common_fruits = [
        {
            "name": "Banana",
            "brand": "",
            "category": "Fruits",
            "description": "Fresh banana",
            "calories_per_100g": 89,
            "protein_per_100g": 1.1,
            "carbs_per_100g": 22.8,
            "fat_per_100g": 0.3,
            "fiber_per_100g": 2.6,
            "sugar_per_100g": 12.2,
            "sodium_per_100g": 0.001,
            "is_verified": True,
            "source": "common_fruits"
        },
        {
            "name": "Apple",
            "brand": "",
            "category": "Fruits", 
            "description": "Fresh apple",
            "calories_per_100g": 52,
            "protein_per_100g": 0.3,
            "carbs_per_100g": 13.8,
            "fat_per_100g": 0.2,
            "fiber_per_100g": 2.4,
            "sugar_per_100g": 10.4,
            "sodium_per_100g": 0.001,
            "is_verified": True,
            "source": "common_fruits"
        },
        {
            "name": "Orange",
            "brand": "",
            "category": "Fruits",
            "description": "Fresh orange",
            "calories_per_100g": 47,
            "protein_per_100g": 0.9,
            "carbs_per_100g": 11.8,
            "fat_per_100g": 0.1,
            "fiber_per_100g": 2.4,
            "sugar_per_100g": 9.4,
            "sodium_per_100g": 0.001,
            "is_verified": True,
            "source": "common_fruits"
        },
        {
            "name": "Strawberry",
            "brand": "",
            "category": "Fruits",
            "description": "Fresh strawberry",
            "calories_per_100g": 32,
            "protein_per_100g": 0.7,
            "carbs_per_100g": 7.7,
            "fat_per_100g": 0.3,
            "fiber_per_100g": 2.0,
            "sugar_per_100g": 4.9,
            "sodium_per_100g": 0.001,
            "is_verified": True,
            "source": "common_fruits"
        },
        {
            "name": "Grape",
            "brand": "",
            "category": "Fruits",
            "description": "Fresh grapes",
            "calories_per_100g": 62,
            "protein_per_100g": 0.6,
            "carbs_per_100g": 16.0,
            "fat_per_100g": 0.2,
            "fiber_per_100g": 0.9,
            "sugar_per_100g": 16.0,
            "sodium_per_100g": 0.002,
            "is_verified": True,
            "source": "common_fruits"
        },
        {
            "name": "Chicken Breast",
            "brand": "",
            "category": "Meat",
            "description": "Raw chicken breast",
            "calories_per_100g": 165,
            "protein_per_100g": 31.0,
            "carbs_per_100g": 0.0,
            "fat_per_100g": 3.6,
            "fiber_per_100g": 0.0,
            "sugar_per_100g": 0.0,
            "sodium_per_100g": 0.074,
            "is_verified": True,
            "source": "common_foods"
        },
        {
            "name": "Brown Rice",
            "brand": "",
            "category": "Grains",
            "description": "Cooked brown rice",
            "calories_per_100g": 111,
            "protein_per_100g": 2.6,
            "carbs_per_100g": 23.0,
            "fat_per_100g": 0.9,
            "fiber_per_100g": 1.8,
            "sugar_per_100g": 0.4,
            "sodium_per_100g": 0.005,
            "is_verified": True,
            "source": "common_foods"
        }
    ]
    
    db = SessionLocal()
    try:
        added_count = 0
        for fruit_data in common_fruits:
            # Check if already exists
            existing = db.query(Food).filter(
                Food.name == fruit_data["name"],
                Food.brand == fruit_data["brand"]
            ).first()
            
            if not existing:
                food = Food(
                    id=f"common_{fruit_data['name'].lower().replace(' ', '_')}",
                    **fruit_data
                )
                db.add(food)
                added_count += 1
                print(f"✅ Added: {fruit_data['name']}")
            else:
                print(f"⏭️  Already exists: {fruit_data['name']}")
        
        db.commit()
        print(f"\n🎉 Successfully added {added_count} common foods!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error adding foods: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_common_fruits()
