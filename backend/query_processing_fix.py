#!/usr/bin/env python3
"""
Fix query processing by implementing query expansion and fallback retrieval.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.models.memory import MemoryNode
from app.crud.memory import memory

def fix_query_processing():
    """Fix query processing with expansion and fallback methods."""
    print("🔧 FIXING QUERY PROCESSING")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    print(f"User ID: {user_id}")
    
    db = SessionLocal()
    memory_service = MemoryService()
    
    # Get all memories for this user
    all_memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all()
    print(f"Total memories available: {len(all_memories)}")
    
    # Test different query strategies
    test_queries = [
        # Original failing queries
        ("personal information", "Generic personal query"),
        ("work situation", "Generic work query"),
        ("Alex as a person", "Person overview"),
        
        # Query expansion attempts
        ("personal", "Simplified personal"),
        ("work", "Simplified work"),
        ("Alex", "Name only"),
        
        # Fallback: direct content search
        ("hiking", "Direct hobby term"),
        ("Python", "Direct tech term"),
        ("TechCorp", "Direct company term"),
    ]
    
    print(f"\n🔍 Testing query strategies...")
    
    for query, description in test_queries:
        print(f"\n{'='*40}")
        print(f"Testing: {description}")
        print(f"Query: '{query}'")
        
        try:
            # Strategy 1: Original search
            results = memory_service.search_memories(
                db=db,
                query=query,
                user_id=user_id,
                limit=10
            )
            
            print(f"  Original search: {len(results)} results")
            
            # Strategy 2: If no results, try fallback
            if not results:
                print(f"  Trying fallback strategies...")
                
                # Fallback 1: Search by content substring
                fallback_results = []
                query_lower = query.lower()
                
                for memory in all_memories:
                    if query_lower in memory.content.lower():
                        fallback_results.append(memory)
                
                print(f"    Content substring search: {len(fallback_results)} results")
                
                # Fallback 2: Search by content type
                if "personal" in query_lower:
                    type_results = [m for m in all_memories if "personal" in m.content_type.lower()]
                    print(f"    Content type search (personal): {len(type_results)} results")
                    fallback_results.extend(type_results)
                elif "work" in query_lower:
                    type_results = [m for m in all_memories if "work" in m.content_type.lower()]
                    print(f"    Content type search (work): {len(type_results)} results")
                    fallback_results.extend(type_results)
                
                # Fallback 3: Search by metadata
                metadata_results = []
                for memory in all_memories:
                    if memory.memory_metadata:
                        metadata_str = str(memory.memory_metadata).lower()
                        if query_lower in metadata_str:
                            metadata_results.append(memory)
                
                print(f"    Metadata search: {len(metadata_results)} results")
                fallback_results.extend(metadata_results)
                
                # Remove duplicates
                unique_fallback = list({m.id: m for m in fallback_results}.values())
                print(f"    Total fallback results: {len(unique_fallback)}")
                
                if unique_fallback:
                    print(f"    Fallback results:")
                    for result in unique_fallback[:3]:
                        print(f"      - {result.content[:50]}... (Type: {result.content_type})")
                else:
                    print(f"    ❌ No fallback results found")
            
            # Strategy 3: Show what SHOULD be found
            print(f"  Expected matches (manual analysis):")
            for memory in all_memories:
                if query.lower() in memory.content.lower():
                    print(f"    ✅ Direct match: {memory.content[:50]}...")
                elif query.lower() in memory.content_type.lower():
                    print(f"    ✅ Type match: {memory.content[:50]}... (Type: {memory.content_type})")
                elif memory.memory_metadata and query.lower() in str(memory.memory_metadata).lower():
                    print(f"    ✅ Metadata match: {memory.content[:50]}...")
            
        except Exception as e:
            print(f"  ❌ Query failed: {e}")
    
    db.close()
    print(f"\n✅ Query processing analysis completed!")

if __name__ == "__main__":
    fix_query_processing()
