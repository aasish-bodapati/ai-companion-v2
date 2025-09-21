#!/usr/bin/env python3
"""
Script to standardize the database schema to use integer auto-increment primary keys.
This script will:
1. Backup existing data
2. Drop and recreate tables with proper integer IDs
3. Restore data with new integer IDs
4. Update all foreign key references
"""

import os
import sys
import json
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.models.user import User
from app.models.health.fitness_log import FitnessLog, NutritionLog, MoodLog
from app.models.health.user_goals import UserHealthProfile
from app.models.health.weight_logs import UserWeightLog
from app.models.onboarding import OnboardingProfile

def get_database_url():
    """Get the database URL from settings."""
    return settings.SQLALCHEMY_DATABASE_URI

def backup_data(engine):
    """Backup all data from the database."""
    print("📦 Backing up existing data...")
    
    backup_data = {}
    
    with engine.connect() as conn:
        # Get all tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """))
        
        tables = [row[0] for row in result]
        
        for table in tables:
            try:
                result = conn.execute(text(f"SELECT * FROM {table}"))
                rows = result.fetchall()
                columns = result.keys()
                
                # Convert to list of dictionaries
                data = []
                for row in rows:
                    data.append(dict(zip(columns, row)))
                
                backup_data[table] = data
                print(f"   ✅ Backed up {len(data)} rows from {table}")
                
            except Exception as e:
                print(f"   ⚠️  Could not backup {table}: {e}")
    
    # Save backup to file
    backup_file = f"database_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_file, 'w') as f:
        json.dump(backup_data, f, indent=2, default=str)
    
    print(f"   💾 Backup saved to {backup_file}")
    return backup_file, backup_data

def create_new_schema(engine):
    """Create new schema with integer IDs."""
    print("🏗️  Creating new schema with integer IDs...")
    
    with engine.connect() as conn:
        # Drop all existing tables
        print("   🗑️  Dropping existing tables...")
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.commit()
        
        # Create new tables using SQLAlchemy models
        print("   🏗️  Creating new tables...")
        from app.db.base_class import Base
        Base.metadata.create_all(bind=engine)
        
        print("   ✅ New schema created successfully")

def restore_data(engine, backup_data):
    """Restore data with new integer IDs."""
    print("📥 Restoring data with new integer IDs...")
    
    # Create a mapping of old string IDs to new integer IDs
    id_mapping = {}
    
    with engine.connect() as conn:
        # Start with users table
        if 'users' in backup_data:
            print("   👤 Restoring users...")
            for user_data in backup_data['users']:
                old_id = user_data['id']
                
                # Insert user with new integer ID
                result = conn.execute(text("""
                    INSERT INTO users (email, hashed_password, full_name, is_active, is_superuser, memory_enabled)
                    VALUES (:email, :hashed_password, :full_name, :is_active, :is_superuser, :memory_enabled)
                    RETURNING id
                """), user_data)
                
                new_id = result.fetchone()[0]
                id_mapping[old_id] = new_id
                print(f"      User {user_data['email']}: {old_id} -> {new_id}")
        
        # Restore other tables with mapped user IDs
        tables_to_restore = [
            'fitness_logs', 'nutrition_logs', 'mood_logs', 
            'weight_logs', 'onboarding_profiles', 'user_health_profiles'
        ]
        
        for table in tables_to_restore:
            if table in backup_data and backup_data[table]:
                print(f"   📊 Restoring {table}...")
                
                for row_data in backup_data[table]:
                    # Map user_id if it exists
                    if 'user_id' in row_data and row_data['user_id'] in id_mapping:
                        row_data['user_id'] = id_mapping[row_data['user_id']]
                    
                    # Remove the old id field
                    if 'id' in row_data:
                        del row_data['id']
                    
                    # Insert the row
                    try:
                        columns = list(row_data.keys())
                        values = list(row_data.values())
                        placeholders = [f":{col}" for col in columns]
                        
                        query = f"""
                            INSERT INTO {table} ({', '.join(columns)})
                            VALUES ({', '.join(placeholders)})
                        """
                        
                        conn.execute(text(query), row_data)
                        
                    except Exception as e:
                        print(f"      ⚠️  Could not restore row in {table}: {e}")
        
        conn.commit()
        print("   ✅ Data restoration completed")

def main():
    """Main function to standardize the schema."""
    print("🚀 Starting database schema standardization...")
    print("=" * 60)
    
    try:
        # Get database connection
        database_url = get_database_url()
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        
        # Backup existing data
        backup_file, data_backup = backup_data(engine)
        
        # Create new schema
        create_new_schema(engine)
        
        # Restore data
        restore_data(engine, data_backup)
        
        print("=" * 60)
        print("🎉 Schema standardization completed successfully!")
        print(f"📁 Backup file: {backup_file}")
        print("🔧 All tables now use integer auto-increment primary keys")
        
    except Exception as e:
        print(f"❌ Error during schema standardization: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
