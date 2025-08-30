#!/usr/bin/env python3
"""
Test searching for newly created memories.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.memory.embeddings import get_embedding
from app.memory.vector_store.factory import get_vector_store

def test_new_memory_search():
    """Test searching for newly created memories."""
    print("🔍 TESTING NEW MEMORY SEARCH")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    # Test with the actual content from our test
    query = "Alex software engineer TechCorp"
    
    print(f"User ID: {user_id}")
    print(f"Query: {query}")
    
    # Step 1: Generate embedding
    print("\n1️⃣ Generating query embedding...")
    try:
        embedding = get_embedding(query)
        print(f"✅ Embedding generated: {len(embedding)} dimensions")
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        return
    
    # Step 2: Test FAISS search directly
    print("\n2️⃣ Testing FAISS search directly...")
    try:
        vector_store = get_vector_store()
        faiss_results = vector_store.search(user_id, embedding, 10)
        print(f"✅ FAISS search returned {len(faiss_results)} results")
        for i, (faiss_id, score) in enumerate(faiss_results):
            print(f"   {i+1}. ID: {faiss_id}, Score: {score:.3f}")
    except Exception as e:
        print(f"❌ FAISS search failed: {e}")
        return
    
    # Step 3: Test memory service search
    print("\n3️⃣ Testing memory service search...")
    try:
        db = SessionLocal()
        memory_service = MemoryService()
        results = memory_service.search_memories(
            db=db,
            query=query,
            user_id=user_id,
            limit=10
        )
        print(f"✅ Memory service search returned {len(results)} results")
        for i, result in enumerate(results):
            print(f"   {i+1}. Content: {result.content[:80]}...")
            print(f"      Score: {result.relevance_score:.3f}")
            print(f"      Type: {result.content_type}")
            print(f"      FAISS ID: {result.faiss_id}")
        db.close()
    except Exception as e:
        print(f"❌ Memory service search failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n✅ Search testing completed!")

if __name__ == "__main__":
    test_new_memory_search()
