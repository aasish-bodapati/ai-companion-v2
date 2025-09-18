#!/usr/bin/env python3
"""
Initialize database with test user
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings

def init_db():
    """Initialize database with test user"""
    db = SessionLocal()
    try:
        # Check if test user exists
        test_user = db.query(User).filter(User.email == settings.TEST_USER_EMAIL).first()
        
        if not test_user:
            print(f"Creating test user: {settings.TEST_USER_EMAIL}")
            test_user = User(
                email=settings.TEST_USER_EMAIL,
                hashed_password=get_password_hash(settings.TEST_USER_PASSWORD),
                full_name="Test User",
                is_active=True,
                is_superuser=False
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"Test user created with ID: {test_user.id}")
        else:
            print(f"Test user already exists: {test_user.email}")
            
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER).first()
        
        if not admin_user:
            print(f"Creating admin user: {settings.FIRST_SUPERUSER}")
            admin_user = User(
                email=settings.FIRST_SUPERUSER,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name="Admin User",
                is_active=True,
                is_superuser=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"Admin user created with ID: {admin_user.id}")
        else:
            print(f"Admin user already exists: {admin_user.email}")
            
        print("Database initialization complete!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
