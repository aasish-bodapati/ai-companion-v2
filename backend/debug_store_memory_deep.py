#!/usr/bin/env python3
"""
Deep debug of store_memory method - trace exactly where database creation fails.
"""

import sys
import os
import logging

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.models.memory import MemoryNode
from app.crud.memory import memory

def debug_store_memory_deep():
    """Deep debug of store_memory method."""
    print("🔍 DEEP DEBUG OF STORE_MEMORY METHOD")
    print("=" * 60)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    content = "Deep debug test memory"
    content_type = "debug_deep"
    metadata = {"debug": True, "deep": True}
    
    print(f"User ID: {user_id}")
    print(f"Content: {content}")
    print(f"Type: {content_type}")
    print(f"Metadata: {metadata}")
    
    # Test with detailed logging
    db = SessionLocal()
    memory_service = MemoryService()
    
    try:
        print("\n🔧 Step 1: Check database state BEFORE calling store_memory...")
        before_count = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).count()
        print(f"   Memories in database before: {before_count}")
        
        print("\n🔧 Step 2: Call store_memory with detailed logging...")
        
        # Enable debug logging for the memory service
        logging.getLogger('app.memory').setLevel(logging.DEBUG)
        
        faiss_id = memory_service.store_memory(
            db=db,
            content=content,
            content_type=content_type,
            user_id=user_id,
            metadata=metadata
        )
        
        print(f"\n✅ store_memory returned: {faiss_id}")
        
        if faiss_id:
            print("\n🔧 Step 3: Check database state AFTER calling store_memory...")
            after_count = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).count()
            print(f"   Memories in database after: {after_count}")
            
            print(f"\n🔧 Step 4: Try to find the memory by FAISS ID...")
            memory_record = db.query(MemoryNode).filter(MemoryNode.faiss_id == faiss_id).first()
            if memory_record:
                print(f"✅ Memory found in database:")
                print(f"   ID: {memory_record.id}")
                print(f"   Content: {memory_record.content}")
                print(f"   Type: {memory_record.content_type}")
                print(f"   User ID: {memory_record.user_id}")
            else:
                print(f"❌ Memory NOT found in database for FAISS ID: {faiss_id}")
                
                print(f"\n🔧 Step 5: Check if memory exists by content...")
                content_memory = db.query(MemoryNode).filter(MemoryNode.content == content).first()
                if content_memory:
                    print(f"✅ Memory found by content:")
                    print(f"   ID: {content_memory.id}")
                    print(f"   FAISS ID: {content_memory.faiss_id}")
                    print(f"   User ID: {content_memory.user_id}")
                else:
                    print(f"❌ Memory NOT found by content either")
                
                print(f"\n🔧 Step 6: Check all memories for this user...")
                user_memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all()
                print(f"   User has {len(user_memories)} memories in database")
                if user_memories:
                    for i, mem in enumerate(user_memories, 1):
                        print(f"   {i}. ID: {mem.id}, FAISS: {mem.faiss_id}, Content: {mem.content[:50]}...")
                
                print(f"\n🔧 Step 7: Check if there's a transaction issue...")
                # Try to commit the current transaction
                try:
                    db.commit()
                    print(f"   ✅ Transaction committed successfully")
                    
                    # Check again after commit
                    memory_record = db.query(MemoryNode).filter(MemoryNode.faiss_id == faiss_id).first()
                    if memory_record:
                        print(f"   ✅ Memory found after commit!")
                    else:
                        print(f"   ❌ Memory still not found after commit")
                        
                except Exception as commit_error:
                    print(f"   ❌ Transaction commit failed: {commit_error}")
                    db.rollback()
        else:
            print(f"❌ store_memory returned None - method failed")
            
    except Exception as e:
        print(f"❌ store_memory failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_store_memory_deep()
