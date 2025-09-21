#!/usr/bin/env python3
"""
Verify Database Connection - Check which database we're actually connected to
"""

import sys
sys.path.append('.')

from app.db.session import SessionLocal
from sqlalchemy import text
from app.core.config import settings

def verify_database_connection():
    """Verify which database we're connected to and its state"""
    
    print("🔍 DATABASE CONNECTION VERIFICATION")
    print("=" * 50)
    
    # Show connection string (without password)
    db_uri = settings.SQLALCHEMY_DATABASE_URI
    if db_uri:
        # Mask password for security
        masked_uri = db_uri.replace('postgres:postgres@', 'postgres:***@')
        print(f"Connection String: {masked_uri}")
    else:
        print("❌ No database connection string found!")
        return
    
    db = SessionLocal()
    try:
        # Get current database name
        result = db.execute(text("SELECT current_database();"))
        current_db = result.scalar()
        print(f"Connected to database: {current_db}")
        
        # Get database version
        result = db.execute(text("SELECT version();"))
        version = result.scalar()
        print(f"PostgreSQL version: {version.split(',')[0]}")
        
        # Get all tables
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result.fetchall()]
        
        print(f"\n📊 DATABASE STATE:")
        print(f"Total tables: {len(tables)}")
        
        # Check for the tables we supposedly removed
        removed_tables = [
            'exercise_templates',
            'food_alternatives', 
            'meal_templates',
            'nutrition_meal_plans',
            'nutrition_meals',
            'nutrition_meal_foods',
            'recipe_ingredients'
        ]
        
        print(f"\n🚨 CHECKING FOR REMOVED TABLES:")
        still_present = []
        for table in removed_tables:
            if table in tables:
                still_present.append(table)
                print(f"  ❌ {table} - STILL PRESENT!")
            else:
                print(f"  ✅ {table} - Successfully removed")
        
        if still_present:
            print(f"\n⚠️  PROBLEM: {len(still_present)} tables were NOT removed!")
            print("This means our cleanup didn't work on this database.")
        else:
            print(f"\n✅ SUCCESS: All 7 tables were successfully removed!")
            print("The database is properly optimized.")
        
        # Show all current tables
        print(f"\n📋 ALL CURRENT TABLES:")
        for table in tables:
            print(f"  ✅ {table}")
            
        return current_db, tables, still_present
        
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return None, [], []
    finally:
        db.close()

def check_other_databases():
    """Check if there are other databases that might be causing confusion"""
    print(f"\n🔍 CHECKING FOR OTHER DATABASES:")
    print("=" * 40)
    
    db = SessionLocal()
    try:
        # List all databases
        result = db.execute(text("""
            SELECT datname 
            FROM pg_database 
            WHERE datistemplate = false
            ORDER BY datname;
        """))
        databases = [row[0] for row in result.fetchall()]
        
        print(f"Available databases:")
        for db_name in databases:
            if 'ai_companion' in db_name.lower() or 'powerbi' in db_name.lower():
                print(f"  🎯 {db_name} - (Related to our project)")
            else:
                print(f"  📊 {db_name}")
                
        return databases
        
    except Exception as e:
        print(f"❌ Error listing databases: {e}")
        return []
    finally:
        db.close()

if __name__ == "__main__":
    current_db, tables, still_present = verify_database_connection()
    other_dbs = check_other_databases()
    
    print(f"\n📈 SUMMARY:")
    print("=" * 20)
    print(f"Current database: {current_db}")
    print(f"Total tables: {len(tables)}")
    print(f"Removed tables still present: {len(still_present)}")
    print(f"Other databases found: {len(other_dbs)}")
    
    if still_present:
        print(f"\n🚨 ACTION NEEDED:")
        print("The cleanup didn't work on this database.")
        print("We need to run the cleanup on the correct database.")
    else:
        print(f"\n✅ DATABASE IS OPTIMIZED:")
        print("All unused tables have been removed.")
        print("Power BI should refresh to show the correct schema.")
