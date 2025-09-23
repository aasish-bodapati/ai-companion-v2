#!/usr/bin/env python3
"""
Create foods table directly for MVP development
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings

def create_foods_table():
    """Create the foods table directly"""
    
    # Create engine
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    # Create foods table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS foods (
        id VARCHAR PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        brand VARCHAR(100),
        category VARCHAR(50) NOT NULL,
        subcategory VARCHAR(50),
        barcode VARCHAR(50) UNIQUE,
        usda_fdc_id VARCHAR(50) UNIQUE,
        calories_per_100g FLOAT NOT NULL,
        protein_per_100g FLOAT DEFAULT 0 NOT NULL,
        carbs_per_100g FLOAT DEFAULT 0 NOT NULL,
        fat_per_100g FLOAT DEFAULT 0 NOT NULL,
        fiber_per_100g FLOAT,
        sugar_per_100g FLOAT,
        sodium_per_100g FLOAT,
        calcium_per_100g FLOAT,
        iron_per_100g FLOAT,
        vitamin_c_per_100g FLOAT,
        vitamin_d_per_100g FLOAT,
        common_serving_sizes JSON,
        default_serving_grams FLOAT DEFAULT 100,
        description TEXT,
        ingredients JSON,
        allergens JSON,
        dietary_tags JSON,
        is_popular BOOLEAN DEFAULT FALSE NOT NULL,
        usage_count INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE NOT NULL,
        external_id VARCHAR(100),
        source VARCHAR(50)
    );
    """
    
    # Create indexes
    create_indexes_sql = [
        "CREATE INDEX IF NOT EXISTS ix_foods_name ON foods (name);",
        "CREATE INDEX IF NOT EXISTS ix_foods_brand ON foods (brand);",
        "CREATE INDEX IF NOT EXISTS ix_foods_category ON foods (category);",
        "CREATE INDEX IF NOT EXISTS ix_foods_barcode ON foods (barcode);",
        "CREATE INDEX IF NOT EXISTS ix_foods_usda_fdc_id ON foods (usda_fdc_id);",
        "CREATE INDEX IF NOT EXISTS ix_foods_is_popular ON foods (is_popular);",
        "CREATE INDEX IF NOT EXISTS ix_foods_is_verified ON foods (is_verified);",
        "CREATE INDEX IF NOT EXISTS ix_foods_source ON foods (source);",
        "CREATE INDEX IF NOT EXISTS ix_foods_external_id ON foods (external_id);"
    ]
    
    try:
        with engine.connect() as conn:
            # Create table
            print("Creating foods table...")
            conn.execute(text(create_table_sql))
            conn.commit()
            
            # Create indexes
            print("Creating indexes...")
            for index_sql in create_indexes_sql:
                conn.execute(text(index_sql))
            conn.commit()
            
            print("✅ Foods table created successfully!")
            
            # Verify table exists
            result = conn.execute(text("SELECT COUNT(*) FROM foods;"))
            count = result.scalar()
            print(f"📊 Foods table has {count} records")
            
    except Exception as e:
        print(f"❌ Error creating foods table: {e}")
        raise

if __name__ == "__main__":
    create_foods_table()
