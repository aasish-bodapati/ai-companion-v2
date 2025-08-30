#!/usr/bin/env python3
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.memory import MemoryNode

def check_database():
    """Check what memories exist in the database."""
    print("🔍 CHECKING DATABASE MEMORIES")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        total = db.query(MemoryNode).count()
        print(f"Total memories in database: {total}")
        
        if total > 0:
            print("\nSample memories:")
            samples = db.query(MemoryNode).limit(5).all()
            for i, mem in enumerate(samples, 1):
                print(f"{i}. ID: {mem.id}")
                print(f"   User ID: {mem.user_id}")
                print(f"   FAISS ID: {mem.faiss_id}")
                print(f"   Content: {mem.content[:80]}...")
                print(f"   Type: {mem.content_type}")
                print()
        else:
            print("No memories found in database!")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_database()
