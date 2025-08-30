#!/usr/bin/env python3
"""
Query Optimization - Test different query formulations and understand retrieval patterns.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.memory.embeddings import get_embedding
from app.memory.vector_store.factory import get_vector_store

def test_query_formulations():
    """Test different query formulations to understand retrieval patterns."""
    print("🔍 QUERY OPTIMIZATION TESTING")
    print("=" * 60)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    # Test queries for different memory types
    test_queries = [
        # Work-related queries
        ("work situation", "Work-focused query"),
        ("software engineer TechCorp", "Specific work query"),
        ("Python Django backend", "Technical work query"),
        
        # Personal queries
        ("personal information", "Generic personal query"),
        ("hiking photography", "Specific hobby query"),
        ("interests hobbies", "Broad personal query"),
        ("Alex as a person", "Person-focused query"),
        
        # Mixed queries
        ("Alex work and hobbies", "Mixed topic query"),
        ("software engineer who loves hiking", "Cross-domain query"),
        ("TechCorp employee with photography", "Work + hobby query"),
        
        # Edge cases
        ("", "Empty query"),
        ("xyz123", "Nonsense query"),
        ("a", "Single character"),
    ]
    
    db = SessionLocal()
    memory_service = MemoryService()
    
    print(f"Testing queries for user: {user_id}")
    print(f"Total test queries: {len(test_queries)}")
    
    results_summary = {}
    
    for i, (query, description) in enumerate(test_queries, 1):
        print(f"\n{'='*50}")
        print(f"QUERY {i}: {description}")
        print(f"Query text: '{query}'")
        print(f"{'='*50}")
        
        try:
            # Test memory service search
            results = memory_service.search_memories(
                db=db,
                query=query,
                user_id=user_id,
                limit=10
            )
            
            print(f"✅ Memory service returned {len(results)} results")
            
            if results:
                print("Top results:")
                for j, result in enumerate(results[:3], 1):
                    print(f"  {j}. Content: {result.content[:80]}...")
                    print(f"     Type: {result.content_type}")
                    print(f"     Score: {result.relevance_score:.3f}")
                    print(f"     FAISS ID: {result.faiss_id}")
            else:
                print("❌ No results found")
            
            # Store results for analysis
            results_summary[description] = {
                'query': query,
                'count': len(results),
                'results': results
            }
            
        except Exception as e:
            print(f"❌ Query failed: {e}")
            results_summary[description] = {
                'query': query,
                'count': 0,
                'error': str(e)
            }
    
    # Analyze results
    print(f"\n{'='*60}")
    print("📊 QUERY ANALYSIS SUMMARY")
    print(f"{'='*60}")
    
    successful_queries = [k for k, v in results_summary.items() if v.get('count', 0) > 0]
    failed_queries = [k for k, v in results_summary.items() if v.get('count', 0) == 0]
    
    print(f"✅ Successful queries ({len(successful_queries)}):")
    for query_type in successful_queries:
        count = results_summary[query_type]['count']
        print(f"  • {query_type}: {count} results")
    
    print(f"\n❌ Failed queries ({len(failed_queries)}):")
    for query_type in failed_queries:
        print(f"  • {query_type}")
    
    # Test FAISS search directly for failed queries
    print(f"\n🔍 Testing FAISS search directly for failed queries...")
    for query_type in failed_queries[:3]:  # Test first 3 failed queries
        query_text = results_summary[query_type]['query']
        if query_text.strip():
            try:
                embedding = get_embedding(query_text)
                vector_store = get_vector_store()
                faiss_results = vector_store.search(user_id, embedding, 5)
                print(f"  • {query_type}: FAISS found {len(faiss_results)} results")
                if faiss_results:
                    for faiss_id, score in faiss_results[:2]:
                        print(f"    - ID: {faiss_id}, Score: {score:.3f}")
            except Exception as e:
                print(f"  • {query_type}: FAISS search failed - {e}")
    
    db.close()
    return results_summary

if __name__ == "__main__":
    test_query_formulations()
