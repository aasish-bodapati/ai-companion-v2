#!/usr/bin/env python3
"""
Test if there's a transaction issue with memory creation.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.models.memory import MemoryNode

def test_transaction():
    """Test memory creation with explicit transaction management."""
    print("🧪 TESTING TRANSACTION MANAGEMENT")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    content = "Transaction test memory"
    content_type = "test"
    metadata = {"test": True, "transaction": True}
    
    print(f"User ID: {user_id}")
    print(f"Content: {content}")
    
    # Test with explicit transaction management
    db = SessionLocal()
    memory_service = MemoryService()
    
    try:
        print("\n🔧 Creating memory with explicit transaction...")
        
        # Start transaction
        faiss_id = memory_service.store_memory(
            db=db,
            content=content,
            content_type=content_type,
            user_id=user_id,
            metadata=metadata
        )
        
        print(f"✅ store_memory returned: {faiss_id}")
        
        if faiss_id:
            # Check if memory exists in database BEFORE commit
            print("\n🔍 Checking database BEFORE commit...")
            memory_record = db.query(MemoryNode).filter(MemoryNode.faiss_id == faiss_id).first()
            if memory_record:
                print(f"✅ Memory found in database BEFORE commit:")
                print(f"   ID: {memory_record.id}")
                print(f"   Content: {memory_record.content}")
            else:
                print(f"❌ Memory NOT found in database BEFORE commit")
            
            # Now commit the transaction
            print("\n💾 Committing transaction...")
            db.commit()
            
            # Check if memory exists AFTER commit
            print("\n🔍 Checking database AFTER commit...")
            memory_record = db.query(MemoryNode).filter(MemoryNode.faiss_id == faiss_id).first()
            if memory_record:
                print(f"✅ Memory found in database AFTER commit:")
                print(f"   ID: {memory_record.id}")
                print(f"   Content: {memory_record.content}")
            else:
                print(f"❌ Memory still NOT found in database AFTER commit")
                
        else:
            print(f"❌ store_memory returned None")
            
    except Exception as e:
        print(f"❌ Error during memory creation: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_transaction()
