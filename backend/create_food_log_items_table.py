"""
Create food_log_items table manually.
"""

import psycopg2
from app.core.config import settings

def create_food_log_items_table():
    """Create the food_log_items table manually."""
    try:
        # Connect to database
        conn = psycopg2.connect(settings.SQLALCHEMY_DATABASE_URI)
        cursor = conn.cursor()
        
        # Create the table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS food_log_items (
                id SERIAL PRIMARY KEY,
                nutrition_log_id INTEGER NOT NULL,
                food_id INTEGER,
                food_name VARCHAR(300) NOT NULL,
                quantity_grams NUMERIC NOT NULL,
                calories NUMERIC,
                protein_g NUMERIC,
                carbs_g NUMERIC,
                fat_g NUMERIC,
                fiber_g NUMERIC,
                sugar_g NUMERIC,
                sodium_mg NUMERIC,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT fk_food_log_items_nutrition_log 
                    FOREIGN KEY (nutrition_log_id) 
                    REFERENCES nutrition_logs(id) ON DELETE CASCADE,
                CONSTRAINT fk_food_log_items_food 
                    FOREIGN KEY (food_id) 
                    REFERENCES foods(id) ON DELETE CASCADE,
                CONSTRAINT ck_food_log_items_quantity_positive 
                    CHECK (quantity_grams > 0),
                CONSTRAINT ck_food_log_items_calories_positive 
                    CHECK (calories >= 0)
            );
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_food_log_items_nutrition_log_id ON food_log_items (nutrition_log_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_food_log_items_food_id ON food_log_items (food_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_food_log_items_created_at ON food_log_items (created_at);")
        
        # Commit changes
        conn.commit()
        print("✅ food_log_items table created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_food_log_items_table()
