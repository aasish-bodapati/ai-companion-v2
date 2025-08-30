#!/usr/bin/env python3
"""
Test if forcing a fresh vector store fixes the search issue.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.memory.vector_store.factory import get_vector_store

def test_fresh_vector_store():
    """Test if forcing a fresh vector store fixes the search issue."""
    print("🔄 TESTING FRESH VECTOR STORE")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    query = "Debug test memory content"
    
    print(f"User ID: {user_id}")
    print(f"Query: {query}")
    
    # Test 1: Search with cached vector store
    print("\n1️⃣ Testing with cached vector store...")
    try:
        db = SessionLocal()
        memory_service = MemoryService()
        results = memory_service.search_memories(
            db=db,
            query=query,
            user_id=user_id,
            limit=10
        )
        print(f"✅ Cached search returned {len(results)} results")
        for i, result in enumerate(results):
            print(f"   {i+1}. Content: {result.content[:80]}...")
            print(f"      Score: {result.relevance_score:.3f}")
        db.close()
    except Exception as e:
        print(f"❌ Cached search failed: {e}")
    
    # Test 2: Force fresh vector store by clearing singleton
    print("\n2️⃣ Testing with fresh vector store...")
    try:
        # Clear the singleton cache
        import app.memory.vector_store.factory as factory
        factory._singleton = None
        
        db = SessionLocal()
        memory_service = MemoryService()
        results = memory_service.search_memories(
            db=db,
            query=query,
            user_id=user_id,
            limit=10
        )
        print(f"✅ Fresh search returned {len(results)} results")
        for i, result in enumerate(results):
            print(f"   {i+1}. Content: {result.content[:80]}...")
            print(f"      Score: {result.relevance_score:.3f}")
        db.close()
    except Exception as e:
        print(f"❌ Fresh search failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n✅ Fresh vector store testing completed!")

if __name__ == "__main__":
    test_fresh_vector_store()
