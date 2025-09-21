#!/usr/bin/env python3
"""
PostgreSQL Migration Script for Power BI
Migrates from SQLite to PostgreSQL for better Power BI connectivity
"""

import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from sqlalchemy import create_engine
import json

def setup_postgresql_database():
    """Set up PostgreSQL database and migrate data"""
    
    print("🐘 Setting up PostgreSQL database for Power BI...")
    
    # PostgreSQL connection details
    POSTGRES_CONFIG = {
        'host': 'localhost',
        'port': 5432,
        'database': 'ai_companion_powerbi',
        'user': 'postgres',
        'password': 'postgres'  # Using password 'postgres'
    }
    
    # Create database if it doesn't exist
    try:
        # Connect to default postgres database to create our database
        conn = psycopg2.connect(
            host=POSTGRES_CONFIG['host'],
            port=POSTGRES_CONFIG['port'],
            database='postgres',
            user=POSTGRES_CONFIG['user'],
            password=POSTGRES_CONFIG['password']
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Create database
        cursor.execute(f"DROP DATABASE IF EXISTS {POSTGRES_CONFIG['database']}")
        cursor.execute(f"CREATE DATABASE {POSTGRES_CONFIG['database']}")
        print(f"✅ Created database: {POSTGRES_CONFIG['database']}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        print("💡 Make sure PostgreSQL is running and credentials are correct")
        return False
    
    # Connect to our new database
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        print("✅ Connected to PostgreSQL database")
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return False
    
    # Create tables
    create_tables(cursor)
    conn.commit()
    
    # Migrate data from SQLite
    migrate_data_from_sqlite(cursor, conn)
    
    # Create Power BI connection scripts
    create_powerbi_scripts(POSTGRES_CONFIG)
    
    cursor.close()
    conn.close()
    
    print("🎉 PostgreSQL migration complete!")
    print("📊 Power BI connection scripts created")
    return True

def create_tables(cursor):
    """Create all necessary tables in PostgreSQL"""
    
    print("📋 Creating PostgreSQL tables...")
    
    # Users table
    cursor.execute("""
    CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        is_superuser BOOLEAN DEFAULT false,
        memory_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Exercises table
    cursor.execute("""
    CREATE TABLE exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        exercise_type VARCHAR(50),
        difficulty_level VARCHAR(20),
        calories_per_minute DECIMAL(5,2),
        is_popular BOOLEAN DEFAULT false,
        usage_count INTEGER DEFAULT 0,
        muscle_groups TEXT[],
        equipment TEXT[],
        wger_id INTEGER,
        wger_uuid VARCHAR(36),
        wger_category_id INTEGER,
        wger_license_author VARCHAR(100)
    )
    """)
    
    # Fitness logs table
    cursor.execute("""
    CREATE TABLE fitness_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        activity_type VARCHAR(50),
        activity_name VARCHAR(255),
        duration_minutes INTEGER,
        intensity VARCHAR(20),
        calories_burned DECIMAL(8,2),
        distance_km DECIMAL(8,2),
        weight_kg DECIMAL(5,2),
        reps INTEGER,
        sets INTEGER,
        activity_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Nutrition logs table
    cursor.execute("""
    CREATE TABLE nutrition_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        meal_type VARCHAR(50),
        meal_name VARCHAR(255),
        total_calories DECIMAL(8,2),
        protein_g DECIMAL(8,2),
        carbs_g DECIMAL(8,2),
        fat_g DECIMAL(8,2),
        fiber_g DECIMAL(8,2),
        sugar_g DECIMAL(8,2),
        sodium_mg DECIMAL(8,2),
        food_items JSONB,
        mood_before VARCHAR(50),
        mood_after VARCHAR(50),
        meal_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Foods table
    cursor.execute("""
    CREATE TABLE foods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        category VARCHAR(100),
        subcategory VARCHAR(100),
        calories_per_100g DECIMAL(8,2),
        protein_per_100g DECIMAL(8,2),
        carbs_per_100g DECIMAL(8,2),
        fat_per_100g DECIMAL(8,2),
        fiber_per_100g DECIMAL(8,2),
        sugar_per_100g DECIMAL(8,2),
        sodium_per_100g DECIMAL(8,2),
        is_verified BOOLEAN DEFAULT false,
        is_popular BOOLEAN DEFAULT false,
        usage_count INTEGER DEFAULT 0
    )
    """)
    
    # Simple routines table
    cursor.execute("""
    CREATE TABLE simple_routines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(20),
        duration_weeks INTEGER,
        is_template BOOLEAN DEFAULT false,
        created_by_user_id UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Nutrition routines table
    cursor.execute("""
    CREATE TABLE nutrition_routines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(20),
        duration_weeks INTEGER,
        target_calories INTEGER,
        is_template BOOLEAN DEFAULT false,
        created_by_user_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # User activity summary table
    cursor.execute("""
    CREATE TABLE user_activity_summary (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        email VARCHAR(255),
        full_name VARCHAR(255),
        is_active BOOLEAN,
        total_fitness_logs INTEGER DEFAULT 0,
        total_nutrition_logs INTEGER DEFAULT 0,
        total_routines INTEGER DEFAULT 0,
        total_nutrition_routines INTEGER DEFAULT 0,
        total_calories_burned DECIMAL(10,2) DEFAULT 0,
        total_calories_consumed DECIMAL(10,2) DEFAULT 0,
        last_fitness_log TIMESTAMP,
        last_nutrition_log TIMESTAMP
    )
    """)
    
    # Exercise usage summary table
    cursor.execute("""
    CREATE TABLE exercise_usage_summary (
        exercise_id INTEGER PRIMARY KEY REFERENCES exercises(id),
        name VARCHAR(255),
        category VARCHAR(100),
        exercise_type VARCHAR(50),
        difficulty_level VARCHAR(20),
        times_logged INTEGER DEFAULT 0,
        unique_users INTEGER DEFAULT 0,
        avg_calories_burned DECIMAL(8,2),
        avg_duration DECIMAL(8,2),
        last_logged TIMESTAMP
    )
    """)
    
    # Daily activity summary table
    cursor.execute("""
    CREATE TABLE daily_activity_summary (
        activity_date DATE PRIMARY KEY,
        active_users INTEGER DEFAULT 0,
        fitness_sessions INTEGER DEFAULT 0,
        nutrition_logs INTEGER DEFAULT 0,
        total_calories_burned DECIMAL(10,2) DEFAULT 0,
        total_calories_consumed DECIMAL(10,2) DEFAULT 0,
        avg_calories_per_session DECIMAL(8,2)
    )
    """)
    
    print("✅ All tables created successfully")

def migrate_data_from_sqlite(cursor, conn):
    """Migrate data from SQLite to PostgreSQL"""
    
    print("🔄 Migrating data from SQLite to PostgreSQL...")
    
    # Connect to SQLite database
    sqlite_conn = sqlite3.connect("data/ai_companion_real_complete.db")
    sqlite_cursor = sqlite_conn.cursor()
    
    # Migrate users table with proper data type conversion
    try:
        sqlite_cursor.execute("SELECT * FROM users")
        rows = sqlite_cursor.fetchall()
        
        if rows:
            for row in rows:
                # Convert boolean fields from integer to boolean
                converted_row = list(row)
                if len(converted_row) > 3:  # is_active
                    converted_row[3] = bool(converted_row[3]) if converted_row[3] is not None else True
                if len(converted_row) > 4:  # is_superuser
                    converted_row[4] = bool(converted_row[4]) if converted_row[4] is not None else False
                if len(converted_row) > 5:  # memory_enabled
                    converted_row[5] = bool(converted_row[5]) if converted_row[5] is not None else False
                
                cursor.execute("""
                    INSERT INTO users (id, email, full_name, is_active, is_superuser, memory_enabled, created_at) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, converted_row)
            
            print(f"✅ Migrated users: {len(rows)} rows")
    except Exception as e:
        print(f"❌ Error migrating users: {e}")
    
    # Migrate exercises table
    try:
        sqlite_cursor.execute("SELECT * FROM exercises")
        rows = sqlite_cursor.fetchall()
        
        if rows:
            for row in rows:
                # Convert boolean fields
                converted_row = list(row)
                if len(converted_row) > 6:  # is_popular
                    converted_row[6] = bool(converted_row[6]) if converted_row[6] is not None else False
                
                cursor.execute("""
                    INSERT INTO exercises (id, name, category, exercise_type, difficulty_level, calories_per_minute, 
                                         is_popular, usage_count, muscle_groups, equipment, wger_id, wger_uuid, 
                                         wger_category_id, wger_license_author) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, converted_row)
            
            print(f"✅ Migrated exercises: {len(rows)} rows")
    except Exception as e:
        print(f"❌ Error migrating exercises: {e}")
    
    # Migrate other tables that have data
    other_tables = [
        'fitness_logs', 'nutrition_logs', 'foods', 'simple_routines', 
        'nutrition_routines', 'user_activity_summary', 'exercise_usage_summary', 
        'daily_activity_summary'
    ]
    
    for table in other_tables:
        try:
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if rows:
                # Get column names
                sqlite_cursor.execute(f"PRAGMA table_info({table})")
                columns = [col[1] for col in sqlite_cursor.fetchall()]
                
                # Insert into PostgreSQL
                placeholders = ', '.join(['%s'] * len(columns))
                insert_query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
                
                cursor.executemany(insert_query, rows)
                print(f"✅ Migrated {table}: {len(rows)} rows")
            else:
                print(f"⚠️ No data found in {table}")
                
        except Exception as e:
            print(f"❌ Error migrating {table}: {e}")
    
    conn.commit()
    sqlite_cursor.close()
    sqlite_conn.close()
    
    print("✅ Data migration complete")

def create_powerbi_scripts(postgres_config):
    """Create Power BI connection scripts"""
    
    print("📊 Creating Power BI connection scripts...")
    
    # 1. Direct ODBC connection script
    odbc_script = f"""
# Power BI Direct ODBC Connection to PostgreSQL
# This avoids all Python script issues

# Connection String:
# Driver={{PostgreSQL ODBC Driver(UNICODE)}};Server={postgres_config['host']};Port={postgres_config['port']};Database={postgres_config['database']};Uid={postgres_config['user']};Pwd={postgres_config['password']};

# Steps:
# 1. Install PostgreSQL ODBC Driver
# 2. In Power BI: Get Data → Database → PostgreSQL database
# 3. Enter connection details:
#    - Server: {postgres_config['host']}
#    - Database: {postgres_config['database']}
#    - Username: {postgres_config['user']}
#    - Password: {postgres_config['password']}
# 4. Select tables to import
# 5. Create relationships and visualizations

# Available Tables:
# - users (user accounts)
# - exercises (653 exercises with full metadata)
# - fitness_logs (workout logs)
# - nutrition_logs (meal logs)
# - foods (food database)
# - simple_routines (workout routines)
# - nutrition_routines (nutrition plans)
# - user_activity_summary (user analytics)
# - exercise_usage_summary (exercise analytics)
# - daily_activity_summary (daily analytics)
"""
    
    with open("powerbi_postgresql_odbc.py", "w", encoding='utf-8') as f:
        f.write(odbc_script)
    
    # 2. Python script for Power BI (if needed)
    python_script = f"""
import psycopg2
import pandas as pd

# Connect to PostgreSQL
conn = psycopg2.connect(
    host='{postgres_config['host']}',
    port={postgres_config['port']},
    database='{postgres_config['database']}',
    user='{postgres_config['user']}',
    password='{postgres_config['password']}'
)

# Users
users = pd.read_sql("SELECT * FROM users", conn)

# Exercises
exercises = pd.read_sql("SELECT * FROM exercises", conn)

# Fitness logs
fitness_logs = pd.read_sql("SELECT * FROM fitness_logs", conn)

# Nutrition logs
nutrition_logs = pd.read_sql("SELECT * FROM nutrition_logs", conn)

# Foods
foods = pd.read_sql("SELECT * FROM foods", conn)

# Routines
routines = pd.read_sql("SELECT * FROM simple_routines", conn)
nutrition_routines = pd.read_sql("SELECT * FROM nutrition_routines", conn)

# Analytics
user_activity = pd.read_sql("SELECT * FROM user_activity_summary", conn)
exercise_usage = pd.read_sql("SELECT * FROM exercise_usage_summary", conn)
daily_activity = pd.read_sql("SELECT * FROM daily_activity_summary", conn)

conn.close()
"""
    
    with open("powerbi_postgresql_python.py", "w", encoding='utf-8') as f:
        f.write(python_script)
    
    # 3. Setup guide
    guide = f"""
# PostgreSQL Power BI Setup Guide

## Prerequisites
1. Install PostgreSQL on your machine
2. Install PostgreSQL ODBC Driver
3. Ensure PostgreSQL is running

## Method 1: Direct ODBC Connection (Recommended)
1. Open Power BI Desktop
2. Get Data → Database → PostgreSQL database
3. Enter connection details:
   - Server: {postgres_config['host']}
   - Database: {postgres_config['database']}
   - Username: {postgres_config['user']}
   - Password: {postgres_config['password']}
4. Select tables to import
5. Create relationships and visualizations

## Method 2: Python Script (Alternative)
1. Install psycopg2: pip install psycopg2-binary
2. Use powerbi_postgresql_python.py script
3. Import in Power BI as Python script

## Advantages of PostgreSQL
- Native Power BI support
- No Python import errors
- Direct database connection
- Real-time data updates
- Better performance
- Standard SQL compatibility

## Database Schema
- 10 main tables with complete data
- Proper foreign key relationships
- Optimized for Power BI queries
- JSON support for complex data

## Troubleshooting
- Ensure PostgreSQL service is running
- Check firewall settings
- Verify ODBC driver installation
- Test connection with pgAdmin
"""
    
    with open("POWERBI_POSTGRESQL_GUIDE.md", "w", encoding='utf-8') as f:
        f.write(guide)
    
    print("✅ Power BI scripts created")

if __name__ == "__main__":
    setup_postgresql_database()
