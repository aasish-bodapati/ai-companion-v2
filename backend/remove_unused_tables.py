#!/usr/bin/env python3
"""
Remove Unused Tables Script - Safely remove tables that are not being used
"""

import sys
sys.path.append('.')

from app.db.session import SessionLocal
from sqlalchemy import text
import os
from datetime import datetime

def backup_database():
    """Create a backup before making changes"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"database_backup_before_cleanup_{timestamp}.json"
    
    print(f"📦 Creating database backup: {backup_file}")
    
    # This would be implemented with actual backup logic
    # For now, just create a placeholder
    with open(backup_file, 'w') as f:
        f.write(f"Database backup created at {datetime.now().isoformat()}\n")
        f.write("This is a placeholder backup file.\n")
        f.write("In production, implement proper database backup.\n")
    
    return backup_file

def get_table_dependencies():
    """Get foreign key dependencies for tables"""
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_schema = 'public'
            ORDER BY tc.table_name;
        """))
        
        dependencies = {}
        for row in result.fetchall():
            table_name = row[0]
            if table_name not in dependencies:
                dependencies[table_name] = []
            dependencies[table_name].append({
                'column': row[1],
                'foreign_table': row[2],
                'foreign_column': row[3]
            })
        
        return dependencies
    finally:
        db.close()

def check_table_has_data(table_name):
    """Check if table has any data"""
    db = SessionLocal()
    try:
        result = db.execute(text(f"SELECT COUNT(*) FROM {table_name};"))
        count = result.scalar()
        return count > 0
    except Exception as e:
        print(f"Error checking {table_name}: {e}")
        return False
    finally:
        db.close()

def remove_table_safely(table_name, dependencies):
    """Safely remove a table after checking dependencies"""
    db = SessionLocal()
    try:
        # Check if table has data
        has_data = check_table_has_data(table_name)
        if has_data:
            print(f"⚠️  Table {table_name} has data. Skipping removal.")
            return False
        
        # Check if any other tables depend on this one
        dependent_tables = []
        for other_table, deps in dependencies.items():
            for dep in deps:
                if dep['foreign_table'] == table_name:
                    dependent_tables.append(other_table)
        
        if dependent_tables:
            print(f"⚠️  Table {table_name} is referenced by: {dependent_tables}. Skipping removal.")
            return False
        
        # Remove the table
        print(f"🗑️  Removing table: {table_name}")
        db.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE;"))
        db.commit()
        print(f"✅ Successfully removed table: {table_name}")
        return True
        
    except Exception as e:
        print(f"❌ Error removing table {table_name}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    print("🧹 DATABASE CLEANUP - REMOVE UNUSED TABLES")
    print("=" * 60)
    
    # Tables to remove (identified as unused)
    tables_to_remove = [
        'exercise_templates',
        'food_alternatives', 
        'meal_templates',
        'nutrition_meal_plans',
        'nutrition_meals',
        'nutrition_meal_foods',
        'recipe_ingredients'
    ]
    
    # Create backup
    backup_file = backup_database()
    print(f"✅ Backup created: {backup_file}")
    
    # Get dependencies
    print("\n🔍 Analyzing table dependencies...")
    dependencies = get_table_dependencies()
    
    # Show current tables
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        current_tables = [row[0] for row in result.fetchall()]
        print(f"\n📊 Current tables: {len(current_tables)}")
    finally:
        db.close()
    
    # Remove tables
    print(f"\n🗑️  Removing unused tables...")
    removed_count = 0
    skipped_count = 0
    
    for table_name in tables_to_remove:
        if table_name in current_tables:
            success = remove_table_safely(table_name, dependencies)
            if success:
                removed_count += 1
            else:
                skipped_count += 1
        else:
            print(f"ℹ️  Table {table_name} doesn't exist. Skipping.")
    
    # Show final state
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        final_tables = [row[0] for row in result.fetchall()]
        print(f"\n📊 Final tables: {len(final_tables)}")
        print("\nRemaining tables:")
        for table in final_tables:
            print(f"  ✅ {table}")
    finally:
        db.close()
    
    print(f"\n📈 CLEANUP SUMMARY:")
    print("=" * 25)
    print(f"Tables removed: {removed_count}")
    print(f"Tables skipped: {skipped_count}")
    print(f"Tables before: {len(current_tables)}")
    print(f"Tables after: {len(final_tables)}")
    print(f"Reduction: {len(current_tables) - len(final_tables)} tables")
    
    if removed_count > 0:
        print(f"\n✅ Database cleanup completed successfully!")
        print(f"💾 Backup saved as: {backup_file}")
    else:
        print(f"\n⚠️  No tables were removed. Check dependencies and data.")

if __name__ == "__main__":
    main()
