#!/usr/bin/env python3
"""
Setup OpenFoodFacts MVP dataset - Download and import sample data
"""

import os
import sys
import subprocess
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_script(script_path: str, description: str) -> bool:
    """Run a Python script and return success status"""
    try:
        logger.info(f"Running {description}...")
        result = subprocess.run([sys.executable, script_path], 
                              capture_output=True, text=True, check=True)
        logger.info(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ {description} failed:")
        logger.error(f"Error: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"❌ {description} failed with exception: {e}")
        return False

def main():
    """Main setup function"""
    logger.info("🚀 Setting up OpenFoodFacts MVP dataset...")
    
    # Check if we're in the right directory
    if not Path("app").exists():
        logger.error("❌ Please run this script from the backend directory")
        return
    
    # Create data directory
    data_dir = Path("data/openfoodfacts")
    data_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"📁 Created data directory: {data_dir}")
    
    # Step 1: Download sample data
    download_script = "download_openfoodfacts_sample.py"
    if not Path(download_script).exists():
        logger.error(f"❌ Download script not found: {download_script}")
        return
    
    if not run_script(download_script, "Downloading sample data from OpenFoodFacts"):
        logger.error("❌ Failed to download data. Please check the download script.")
        return
    
    # Step 2: Import data into database
    import_script = "import_openfoodfacts_data.py"
    if not Path(import_script).exists():
        logger.error(f"❌ Import script not found: {import_script}")
        return
    
    if not run_script(import_script, "Importing data into local database"):
        logger.error("❌ Failed to import data. Please check the import script.")
        return
    
    # Step 3: Verify import
    logger.info("🔍 Verifying import...")
    try:
        # Add the app directory to Python path
        sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))
        
        from sqlalchemy.orm import Session
        from app.db.session import SessionLocal
        from app.models.health.food_database import Food
        
        db = SessionLocal()
        try:
            total_foods = db.query(Food).count()
            openfoodfacts_foods = db.query(Food).filter(Food.source == "openfoodfacts").count()
            
            logger.info(f"📊 Database statistics:")
            logger.info(f"   Total foods: {total_foods}")
            logger.info(f"   OpenFoodFacts foods: {openfoodfacts_foods}")
            
            if openfoodfacts_foods > 0:
                logger.info("✅ OpenFoodFacts data successfully imported!")
                
                # Show some sample foods
                sample_foods = db.query(Food).filter(Food.source == "openfoodfacts").limit(5).all()
                logger.info("🍎 Sample imported foods:")
                for food in sample_foods:
                    logger.info(f"   - {food.name} ({food.brand}) - {food.calories_per_100g} cal/100g")
            else:
                logger.warning("⚠️  No OpenFoodFacts foods found in database")
                
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Error verifying import: {e}")
    
    logger.info("🎉 MVP dataset setup complete!")
    logger.info("💡 You can now use the nutrition logging features with real food data!")

if __name__ == "__main__":
    main()
