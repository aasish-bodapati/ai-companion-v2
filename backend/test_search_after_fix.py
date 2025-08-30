#!/usr/bin/env python3
"""
Test memory search after fixing the store_memory issue.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal

def test_search_after_fix():
    """Test if memory search is working after fixing store_memory."""
    print("🔍 TESTING MEMORY SEARCH AFTER FIX")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    # Test queries that should now work
    test_queries = [
        ("Deep debug test memory", "Exact content match"),
        ("debug", "Partial content match"),
        ("memory", "Generic term"),
        ("Deep", "Single word from content"),
    ]
    
    db = SessionLocal()
    memory_service = MemoryService()
    
    print(f"Testing search for user: {user_id}")
    print(f"Total test queries: {len(test_queries)}")
    
    for i, (query, description) in enumerate(test_queries, 1):
        print(f"\n{'='*40}")
        print(f"QUERY {i}: {description}")
        print(f"Query text: '{query}'")
        print(f"{'='*40}")
        
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
            import traceback
            traceback.print_exc()
    
    db.close()
    print(f"\n✅ Search testing completed!")

if __name__ == "__main__":
    test_search_after_fix()
