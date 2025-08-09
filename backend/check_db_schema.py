#!/usr/bin/env python3
"""
Database Schema Check Script

This script verifies the database schema and table structure.
"""
import sqlite3
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base_class import Base
from app.models.conversation import Conversation, Message
from app.models.user import User

def check_database_schema():
    """Check database schema and table structure."""
    print("=== Database Schema Check ===\n")
    
    # Create SQLAlchemy engine
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    inspector = inspect(engine)
    
    # List all tables
    print("Tables in database:")
    tables = inspector.get_table_names()
    for table in tables:
        print(f"\nTable: {table}")
        print("-" * (len(table) + 8))
        
        # Get columns for each table
        columns = inspector.get_columns(table)
        for column in columns:
            print(f"  {column['name']}: {column['type']}")
    
    # Verify models match database
    print("\n=== Model Verification ===\n")
    
    # Check User model
    print("User model:")
    print(f"  Table name: {User.__tablename__}")
    print("  Columns:")
    for col in User.__table__.columns:
        print(f"    {col.name}: {col.type}")
    
    # Check Conversation model
    print("\nConversation model:")
    print(f"  Table name: {Conversation.__tablename__}")
    print("  Columns:")
    for col in Conversation.__table__.columns:
        print(f"    {col.name}: {col.type}")
    
    # Check Message model
    print("\nMessage model:")
    print(f"  Table name: {Message.__tablename__}")
    print("  Columns:")
    for col in Message.__table__.columns:
        print(f"    {col.name}: {col.type}")

if __name__ == "__main__":
    check_database_schema()
