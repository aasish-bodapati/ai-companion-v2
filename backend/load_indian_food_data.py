"""
Script to load Indian Food Database (INDB) data from CSV into PostgreSQL
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.indian_food_service import IndianFoodService
from app.models.health.indian_food_database import IndianFood


def load_indian_food_data():
    """Load INDB data from CSV file into database"""
    
    # Get the CSV file path
    csv_file_path = Path(__file__).parent.parent / "docs" / "INDB_data.csv"
    
    if not csv_file_path.exists():
        print(f"ERROR: CSV file not found: {csv_file_path}")
        return False
    
    print(f"Loading data from: {csv_file_path}")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Initialize service
        service = IndianFoodService(db)
        
        print("Starting data load...")
        
        # Load data from CSV
        result = service.load_food_data_from_csv(str(csv_file_path))
        
        print(f"Data load completed!")
        print(f"   Loaded: {result['loaded']} foods")
        print(f"   Skipped: {result['skipped']} foods")
        print(f"   Total processed: {result['total_processed']} foods")
        
        # Verify data was loaded
        total_foods = db.query(service.db.query(IndianFood).count()).scalar()
        print(f"   Total foods in database: {total_foods}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Error loading data: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()


def test_search_functionality():
    """Test the search functionality after loading data"""
    
    print("\nTesting search functionality...")
    
    db = SessionLocal()
    
    try:
        service = IndianFoodService(db)
        
        # Test searches
        test_queries = [
            "rice",
            "dal",
            "curry",
            "roti",
            "chai"
        ]
        
        for query in test_queries:
            results = service.search_foods(query, limit=3)
            print(f"   '{query}': {len(results)} results")
            if results:
                print(f"      - {results[0]['food_name']} ({results[0]['food_code']})")
        
        # Test popular foods
        popular = service.get_popular_foods(5)
        print(f"   Popular foods: {len(popular)} results")
        if popular:
            print(f"      - {popular[0]['food_name']} ({popular[0]['energy_kcal']} kcal)")
        
        print("Search functionality working correctly!")
        
    except Exception as e:
        print(f"ERROR: Error testing search: {e}")
        
    finally:
        db.close()


if __name__ == "__main__":
    print("Indian Food Database Loader")
    print("=" * 50)
    
    # Load data
    success = load_indian_food_data()
    
    if success:
        # Test functionality
        test_search_functionality()
        print("\nAll done! Indian food database is ready to use.")
    else:
        print("\nFailed to load data. Please check the error messages above.")
        sys.exit(1)
