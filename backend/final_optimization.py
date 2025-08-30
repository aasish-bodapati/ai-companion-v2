#!/usr/bin/env python3
"""
Final optimization to reach 9.5+/10 score.
Fix FAISS warnings and improve retrieval.
"""

import sys
import os
import json

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.memory.vector_store.factory import get_vector_store
from app.memory.faiss_store import _load_index, _save_index
from app.models.memory import MemoryNode

def final_optimization():
    """Final optimization to reach 9.5+/10 score."""
    print("🚀 FINAL OPTIMIZATION TO REACH 9.5+/10")
    print("=" * 60)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    print(f"User ID: {user_id}")
    
    # Step 1: Fix FAISS index by removing old IDs
    print(f"\n🔧 Step 1: Fixing FAISS index...")
    
    try:
        # Load current FAISS index
        index, existing_ids = _load_index(user_id)
        if index is not None:
            print(f"Current FAISS index has {len(existing_ids)} IDs")
            
            # Get current database memories
            db = SessionLocal()
            db_memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all()
            db_faiss_ids = {m.faiss_id for m in db_memories}
            
            print(f"Database has {len(db_faiss_ids)} memories")
            
            # Filter FAISS IDs to only include those in database
            valid_ids = [faiss_id for faiss_id in existing_ids if faiss_id in db_faiss_ids]
            removed_count = len(existing_ids) - len(valid_ids)
            
            print(f"Removing {removed_count} invalid FAISS IDs")
            print(f"Keeping {len(valid_ids)} valid IDs")
            
            # Save cleaned index
            _save_index(user_id, index, valid_ids)
            print("✅ FAISS index cleaned successfully")
            
            # Clear singleton cache
            import app.memory.vector_store.factory as factory
            factory._singleton = None
            print("✅ FAISS singleton cache cleared")
            
        else:
            print("❌ Could not load FAISS index")
            
    except Exception as e:
        print(f"❌ FAISS optimization failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Step 2: Test improved search
    print(f"\n🔧 Step 2: Testing improved search...")
    
    try:
        memory_service = MemoryService()
        
        # Test queries that should now work better
        test_queries = [
            ("work situation", "Work overview"),
            ("hiking photography", "Personal interests"),
            ("Python Django", "Technologies"),
            ("Alex as a person", "Personal overview"),
        ]
        
        for query, description in test_queries:
            print(f"\nTesting: {description} - '{query}'")
            
            results = memory_service.search_memories(
                db=db,
                query=query,
                user_id=user_id,
                limit=10
            )
            
            print(f"  Results: {len(results)}")
            if results:
                for result in results[:2]:
                    print(f"    - {result.content[:50]}... (Score: {result.relevance_score:.3f})")
            else:
                print("    ❌ No results found")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Search testing failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Step 3: Run final validation
    print(f"\n🔧 Step 3: Running final validation...")
    
    try:
        # Test cross-topic retrieval
        memory_service = MemoryService()
        db = SessionLocal()
        
        cross_queries = [
            ("What do you know about my work?", "Work overview"),
            ("Tell me about my hobbies", "Hobby overview"),
            ("What technologies do I use?", "Tech overview"),
        ]
        
        for query, description in cross_queries:
            print(f"\nTesting: {description}")
            
            results = memory_service.search_memories(
                db=db,
                query=query,
                user_id=user_id,
                limit=10
            )
            
            print(f"  Results: {len(results)}")
            if results:
                for result in results[:2]:
                    print(f"    - {result.content[:50]}... (Score: {result.relevance_score:.3f})")
            else:
                print("    ❌ No results found")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Final validation failed: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\n✅ Final optimization completed!")
    print(f"🎯 Ready to run final conversation test!")

if __name__ == "__main__":
    final_optimization()
