#!/usr/bin/env python3
"""
Simple script to create a test user for login testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

def create_test_user():
    db = SessionLocal()
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print("✅ Test user already exists: test@example.com")
            return
        
        # Create test user
        test_user = User(
            email="test@example.com",
            hashed_password=get_password_hash("testpassword123"),
            full_name="Test User",
            is_active=True
        )
        
        db.add(test_user)
        db.commit()
        print("✅ Created test user: test@example.com / testpassword123")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()



