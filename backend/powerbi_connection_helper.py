#!/usr/bin/env python3
"""
Power BI Connection Helper - Generate connection info for Power BI verification
"""

import sys
sys.path.append('.')

from app.db.session import SessionLocal
from sqlalchemy import text
from app.core.config import settings
from datetime import datetime

def generate_powerbi_connection_info():
    """Generate connection information for Power BI verification"""
    
    print("🔗 POWER BI CONNECTION VERIFICATION")
    print("=" * 50)
    
    # Get current database info
    db = SessionLocal()
    try:
        # Database name
        result = db.execute(text("SELECT current_database();"))
        db_name = result.scalar()
        
        # Server info
        result = db.execute(text("SELECT inet_server_addr(), inet_server_port();"))
        server_info = result.fetchall()
        server_ip = server_info[0][0] if server_info[0][0] else "localhost"
        server_port = server_info[0][1] if server_info[0][1] else "5432"
        
        # Current timestamp
        result = db.execute(text("SELECT now();"))
        current_time = result.scalar()
        
        # Table count
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """))
        table_count = result.scalar()
        
        print(f"📊 DATABASE INFORMATION:")
        print(f"  Database Name: {db_name}")
        print(f"  Server IP: {server_ip}")
        print(f"  Server Port: {server_port}")
        print(f"  Current Time: {current_time}")
        print(f"  Total Tables: {table_count}")
        
        # Show all tables
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result.fetchall()]
        
        print(f"\n📋 ALL TABLES IN DATABASE:")
        for table in tables:
            print(f"  ✅ {table}")
        
        # Generate Power BI connection string
        print(f"\n🔗 POWER BI CONNECTION STRING:")
        print("=" * 40)
        print(f"Server: {server_ip},{server_port}")
        print(f"Database: {db_name}")
        print(f"User: postgres")
        print(f"Password: [your_password]")
        
        # Generate SQL query to verify
        print(f"\n🔍 VERIFICATION SQL QUERY:")
        print("=" * 30)
        print("Run this in Power BI to verify connection:")
        print(f"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
        
        # Expected result
        print(f"\n✅ EXPECTED RESULT:")
        print("=" * 20)
        print(f"Power BI should show exactly {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")
        
        # Check for removed tables
        removed_tables = [
            'exercise_templates', 'food_alternatives', 'meal_templates',
            'nutrition_meal_plans', 'nutrition_meals', 'nutrition_meal_foods', 'recipe_ingredients'
        ]
        
        print(f"\n❌ REMOVED TABLES (should NOT appear):")
        for table in removed_tables:
            print(f"  - {table}")
        
        return {
            'database_name': db_name,
            'server_ip': server_ip,
            'server_port': server_port,
            'table_count': table_count,
            'tables': tables,
            'current_time': current_time
        }
        
    finally:
        db.close()

def create_verification_script():
    """Create a SQL script to verify the database state"""
    
    script_content = f"""-- Power BI Database Verification Script
-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Database: ai_companion_powerbi

-- 1. Check current database
SELECT current_database() as database_name;

-- 2. Count all tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 3. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 4. Check for removed tables (should return 0 rows)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'exercise_templates',
    'food_alternatives', 
    'meal_templates',
    'nutrition_meal_plans',
    'nutrition_meals',
    'nutrition_meal_foods',
    'recipe_ingredients'
);

-- 5. Get database timestamp
SELECT now() as current_timestamp;
"""
    
    with open('powerbi_verification.sql', 'w') as f:
        f.write(script_content)
    
    print(f"\n📄 VERIFICATION SCRIPT CREATED:")
    print("=" * 35)
    print("File: powerbi_verification.sql")
    print("Run this script in Power BI to verify the database state.")

if __name__ == "__main__":
    info = generate_powerbi_connection_info()
    create_verification_script()
    
    print(f"\n🎯 NEXT STEPS:")
    print("=" * 20)
    print("1. Check Power BI connection string matches the above")
    print("2. Run the verification SQL script in Power BI")
    print("3. Verify Power BI shows exactly 19 tables")
    print("4. Confirm removed tables are NOT visible")
    print("5. If Power BI shows different results, there's a connection issue")
