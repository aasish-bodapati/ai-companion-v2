#!/usr/bin/env python3
"""
Verify OpenFoodFacts import
"""

import sys
import os
from sqlalchemy import create_engine, text

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings

def verify_import():
    """Verify the import was successful"""
    
    # Create engine
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    try:
        with engine.connect() as conn:
            # Get total count
            result = conn.execute(text('SELECT COUNT(*) FROM foods'))
            total = result.scalar()
            
            # Get OpenFoodFacts count
            result = conn.execute(text("SELECT COUNT(*) FROM foods WHERE source = 'openfoodfacts'"))
            openfoodfacts = result.scalar()
            
            # Get sample foods
            result = conn.execute(text("""
                SELECT name, brand, calories_per_100g, category 
                FROM foods 
                WHERE source = 'openfoodfacts' 
                ORDER BY calories_per_100g DESC 
                LIMIT 10
            """))
            samples = result.fetchall()
            
            print(f"📊 Database Statistics:")
            print(f"   Total foods: {total}")
            print(f"   OpenFoodFacts foods: {openfoodfacts}")
            print()
            print("🍎 Sample imported foods (highest calories):")
            for row in samples:
                brand = row[1] if row[1] else "No brand"
                print(f"   - {row[0]} ({brand}) - {row[2]:.1f} cal/100g [{row[3]}]")
            
            # Get category breakdown
            result = conn.execute(text("""
                SELECT category, COUNT(*) as count 
                FROM foods 
                WHERE source = 'openfoodfacts' 
                GROUP BY category 
                ORDER BY count DESC
            """))
            categories = result.fetchall()
            
            print()
            print("📂 Category breakdown:")
            for row in categories:
                print(f"   - {row[0]}: {row[1]} foods")
                
    except Exception as e:
        print(f"❌ Error verifying import: {e}")
        raise

if __name__ == "__main__":
    verify_import()
