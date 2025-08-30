#!/usr/bin/env python3
"""
Comprehensive debug of store_memory method.
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

def debug_store_memory():
    """Debug store_memory method step by step."""
    print("🔍 DEBUGGING STORE_MEMORY METHOD")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    content = "Debug test memory content"
    content_type = "debug"
    metadata = {"debug": True}
    
    print(f"User ID: {user_id}")
    print(f"Content: {content}")
    print(f"Type: {content_type}")
    print(f"Metadata: {metadata}")
    
    # Test with detailed logging
    db = SessionLocal()
    memory_service = MemoryService()
    
    try:
        print("\n🔧 Calling store_memory with detailed logging...")
        
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
        else:
            print(f"❌ store_memory returned None - method failed")
            
    except Exception as e:
        print(f"❌ store_memory failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_store_memory()
