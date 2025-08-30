#!/usr/bin/env python3
"""
Test the store_memory method directly to debug the issue.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.models.memory import MemoryNode

def test_store_memory():
    """Test store_memory method directly."""
    print("🧪 TESTING STORE_MEMORY METHOD")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    content = "Test memory for debugging"
    content_type = "test"
    metadata = {"test": True, "debug": True}
    
    print(f"User ID: {user_id}")
    print(f"Content: {content}")
    print(f"Type: {content_type}")
    print(f"Metadata: {metadata}")
    
    # Test store_memory
    db = SessionLocal()
    memory_service = MemoryService()
    
    try:
        print("\n🔧 Calling store_memory...")
        faiss_id = memory_service.store_memory(
            db=db,
            content=content,
            content_type=content_type,
            user_id=user_id,
            metadata=metadata
        )
        
        print(f"✅ store_memory returned: {faiss_id}")
        
        if faiss_id:
            # Check if memory exists in database
            memory_record = db.query(MemoryNode).filter(MemoryNode.faiss_id == faiss_id).first()
            if memory_record:
                print(f"✅ Memory found in database:")
                print(f"   ID: {memory_record.id}")
                print(f"   Content: {memory_record.content}")
                print(f"   Type: {memory_record.content_type}")
                print(f"   User ID: {memory_record.user_id}")
            else:
                print(f"❌ Memory NOT found in database for FAISS ID: {faiss_id}")
                
                # Check what memories exist for this user
                user_memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all()
                print(f"   User has {len(user_memories)} memories in database")
                
                # Check if FAISS ID exists in FAISS
                print(f"   Checking FAISS...")
                try:
                    from app.memory.vector_store.factory import get_vector_store
                    vector_store = get_vector_store()
                    # This will show if the ID exists in FAISS
                    print(f"   Vector store available: {vector_store is not None}")
                except Exception as e:
                    print(f"   Error checking vector store: {e}")
        else:
            print(f"❌ store_memory returned None")
            
    except Exception as e:
        print(f"❌ store_memory failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_store_memory()
