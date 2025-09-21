#!/usr/bin/env python3
"""
Remove Remaining Unused Tables - Handle tables with foreign key dependencies
"""

import sys
sys.path.append('.')

from app.db.session import SessionLocal
from sqlalchemy import text

def remove_remaining_unused_tables():
    """Remove the remaining unused tables in the correct order"""
    
    # Tables to remove in dependency order (child tables first)
    tables_to_remove = [
        'nutrition_meals',        # Child of nutrition_meal_plans
        'nutrition_meal_plans',   # Child of nutrition_routines  
        'meal_templates'          # Standalone table
    ]
    
    db = SessionLocal()
    try:
        print("🧹 REMOVING REMAINING UNUSED TABLES")
        print("=" * 50)
        
        for table_name in tables_to_remove:
            try:
                # Check if table exists
                result = db.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '{table_name}'
                    );
                """))
                table_exists = result.scalar()
                
                if not table_exists:
                    print(f"ℹ️  Table {table_name} doesn't exist. Skipping.")
                    continue
                
                # Check if table has data
                result = db.execute(text(f"SELECT COUNT(*) FROM {table_name};"))
                count = result.scalar()
                
                if count > 0:
                    print(f"⚠️  Table {table_name} has {count} rows. Removing data first...")
                    db.execute(text(f"DELETE FROM {table_name};"))
                
                # Drop the table
                print(f"🗑️  Removing table: {table_name}")
                db.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE;"))
                db.commit()
                print(f"✅ Successfully removed table: {table_name}")
                
            except Exception as e:
                print(f"❌ Error removing table {table_name}: {e}")
                db.rollback()
        
        # Show final state
        print(f"\n📊 FINAL DATABASE STATE:")
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        final_tables = [row[0] for row in result.fetchall()]
        
        print(f"Total tables: {len(final_tables)}")
        print("\nRemaining tables:")
        for table in final_tables:
            print(f"  ✅ {table}")
            
    finally:
        db.close()

if __name__ == "__main__":
    remove_remaining_unused_tables()
