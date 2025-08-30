#!/usr/bin/env python3
"""
Fix FAISS caching issue by forcing fresh index load and testing search.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.memory.vector_store.factory import get_vector_store

def fix_faiss_caching():
    """Fix FAISS caching issue and test search."""
    print("🔧 FIXING FAISS CACHING ISSUE")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    print(f"User ID: {user_id}")
    
    # Step 1: Clear the FAISS singleton cache
    print("\n🔧 Step 1: Clearing FAISS singleton cache...")
    import app.memory.vector_store.factory as factory
    factory._singleton = None
    print("✅ FAISS singleton cache cleared")
    
    # Step 2: Test search with fresh vector store
    print("\n🔧 Step 2: Testing search with fresh vector store...")
    
    db = SessionLocal()
    memory_service = MemoryService()
    
    # Test queries
    test_queries = [
        ("Deep debug test memory", "Exact content match"),
        ("debug", "Partial content match"),
        ("memory", "Generic term"),
        ("Deep", "Single word from content"),
        ("test", "Another word from content"),
    ]
    
    for query, description in test_queries:
        print(f"\n{'='*40}")
        print(f"Testing: {description}")
        print(f"Query: '{query}'")
        
        try:
            results = memory_service.search_memories(
                db=db,
                query=query,
                user_id=user_id,
                limit=10
            )
            
            print(f"✅ Search returned {len(results)} results")
            
            if results:
                print("Results:")
                for j, result in enumerate(results, 1):
                    print(f"  {j}. Content: {result.content}")
                    print(f"     Type: {result.content_type}")
                    print(f"     Score: {result.relevance_score:.3f}")
                    print(f"     FAISS ID: {result.faiss_id}")
            else:
                print("❌ No results found")
                
        except Exception as e:
            print(f"❌ Search failed: {e}")
    
    db.close()
    
    # Step 3: Test FAISS search directly
    print(f"\n🔧 Step 3: Testing FAISS search directly...")
    try:
        from app.memory.embeddings import get_embedding
        vector_store = get_vector_store()
        
        # Test with a simple query
        query = "debug"
        embedding = get_embedding(query)
        faiss_results = vector_store.search(user_id, embedding, 5)
        
        print(f"✅ FAISS search returned {len(faiss_results)} results")
        for i, (faiss_id, score) in enumerate(faiss_results, 1):
            print(f"  {i}. ID: {faiss_id}, Score: {score:.3f}")
            
    except Exception as e:
        print(f"❌ FAISS search failed: {e}")
    
    print(f"\n✅ FAISS caching fix completed!")

if __name__ == "__main__":
    fix_faiss_caching()
