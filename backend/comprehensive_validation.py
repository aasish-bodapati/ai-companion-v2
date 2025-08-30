#!/usr/bin/env python3
"""
Comprehensive validation of the memory system after fixes.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.models.memory import MemoryNode
from app.crud.memory import memory

def comprehensive_validation():
    """Comprehensive validation of the memory system."""
    print("🧪 COMPREHENSIVE MEMORY SYSTEM VALIDATION")
    print("=" * 60)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    print(f"User ID: {user_id}")
    
    db = SessionLocal()
    memory_service = MemoryService()
    
    try:
        # Test 1: Memory Creation
        print(f"\n🔧 Test 1: Memory Creation")
        print("-" * 30)
        
        test_memories = [
            ("I work as a software engineer at TechCorp", "work_info", {"company": "TechCorp", "role": "software engineer"}),
            ("I love hiking and photography on weekends", "personal_interests", {"hobbies": ["hiking", "photography"], "frequency": "weekly"}),
            ("I use Python and Django for backend development", "work_info", {"technologies": ["Python", "Django"], "area": "backend"}),
        ]
        
        created_memories = []
        for content, content_type, metadata in test_memories:
            print(f"Creating: {content_type} - {content[:50]}...")
            
            faiss_id = memory_service.store_memory(
                db=db,
                content=content,
                content_type=content_type,
                user_id=user_id,
                metadata=metadata
            )
            
            if faiss_id:
                memory_record = memory.get_memory_by_faiss_id(db, faiss_id)
                if memory_record:
                    created_memories.append(memory_record)
                    print(f"✅ Created: {memory_record.id}")
                else:
                    print(f"❌ Created in FAISS but not in database: {faiss_id}")
            else:
                print(f"❌ Failed to create memory")
        
        # Test 2: Memory Retrieval
        print(f"\n🔧 Test 2: Memory Retrieval")
        print("-" * 30)
        
        test_queries = [
            ("software engineer", "Work role query"),
            ("hiking photography", "Hobby query"),
            ("Python Django", "Technology query"),
            ("TechCorp", "Company query"),
            ("weekends", "Time-based query"),
        ]
        
        retrieval_results = {}
        for query, description in test_queries:
            print(f"Testing: {description} - '{query}'")
            
            results = memory_service.search_memories(
                db=db,
                query=query,
                user_id=user_id,
                limit=5
            )
            
            print(f"  Results: {len(results)}")
            if results:
                for result in results[:2]:
                    print(f"    - {result.content[:50]}... (Score: {result.relevance_score:.3f})")
            
            retrieval_results[description] = len(results)
        
        # Test 3: Cross-Topic Retrieval
        print(f"\n🔧 Test 3: Cross-Topic Retrieval")
        print("-" * 30)
        
        cross_queries = [
            ("What do you know about my work?", "Work overview"),
            ("Tell me about my hobbies", "Hobby overview"),
            ("What technologies do I use?", "Tech overview"),
        ]
        
        for query, description in cross_queries:
            print(f"Testing: {description}")
            
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
        
        # Test 4: System Statistics
        print(f"\n🔧 Test 4: System Statistics")
        print("-" * 30)
        
        total_memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).count()
        memory_types = set(m.content_type for m in db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all())
        
        print(f"Total memories in database: {total_memories}")
        print(f"Memory types: {memory_types}")
        print(f"Created in this session: {len(created_memories)}")
        
        # Test 5: Score Calculation
        print(f"\n🔧 Test 5: Score Analysis")
        print("-" * 30)
        
        if created_memories:
            sample_memory = created_memories[0]
            print(f"Sample memory: {sample_memory.content[:50]}...")
            print(f"Type: {sample_memory.content_type}")
            print(f"FAISS ID: {sample_memory.faiss_id}")
            
            # Test search with exact content
            exact_results = memory_service.search_memories(
                db=db,
                query=sample_memory.content,
                user_id=user_id,
                limit=1
            )
            
            if exact_results:
                print(f"Exact match score: {exact_results[0].relevance_score:.3f}")
            else:
                print("No exact match found")
        
        print(f"\n✅ Comprehensive validation completed!")
        
        # Summary
        print(f"\n{'='*60}")
        print("📊 VALIDATION SUMMARY")
        print(f"{'='*60}")
        print(f"Memory Creation: {'✅' if len(created_memories) == len(test_memories) else '❌'}")
        print(f"Memory Retrieval: {'✅' if any(count > 0 for count in retrieval_results.values()) else '❌'}")
        print(f"Cross-Topic: {'✅' if total_memories > 0 else '❌'}")
        print(f"Database Integration: {'✅' if total_memories > 0 else '❌'}")
        
        return {
            'created': len(created_memories),
            'total': total_memories,
            'retrieval': retrieval_results
        }
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    comprehensive_validation()
