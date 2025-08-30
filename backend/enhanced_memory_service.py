#!/usr/bin/env python3
"""
Enhanced Memory Service with fallback retrieval methods.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.models.memory import MemoryNode
from app.crud.memory import memory

class EnhancedMemoryService(MemoryService):
    """Enhanced memory service with fallback retrieval methods."""
    
    def search_memories_with_fallback(self, db, query, user_id, limit=10):
        """Search memories with fallback methods if FAISS search fails."""
        
        # Try original FAISS search first
        faiss_results = self.search_memories(db, query, user_id, limit)
        
        if faiss_results:
            return faiss_results
        
        # If FAISS search fails, use fallback methods
        print(f"🔍 FAISS search failed for '{query}', using fallback methods...")
        
        fallback_results = self._fallback_search(db, query, user_id, limit)
        
        if fallback_results:
            print(f"✅ Fallback search found {len(fallback_results)} results")
            return fallback_results
        
        print(f"❌ Both FAISS and fallback search failed for '{query}'")
        return []
    
    def _fallback_search(self, db, query, user_id, limit):
        """Fallback search methods when FAISS fails."""
        
        query_lower = query.lower()
        all_memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all()
        
        fallback_results = []
        
        # Method 1: Content substring search
        for memory in all_memories:
            if query_lower in memory.content.lower():
                fallback_results.append(memory)
        
        # Method 2: Content type search
        if "personal" in query_lower:
            type_results = [m for m in all_memories if "personal" in m.content_type.lower()]
            fallback_results.extend(type_results)
        elif "work" in query_lower:
            type_results = [m for m in all_memories if "work" in m.content_type.lower()]
            fallback_results.extend(type_results)
        elif "hobby" in query_lower or "interest" in query_lower:
            type_results = [m for m in all_memories if "interest" in m.content_type.lower()]
            fallback_results.extend(type_results)
        
        # Method 3: Metadata search
        for memory in all_memories:
            if memory.memory_metadata:
                metadata_str = str(memory.memory_metadata).lower()
                if query_lower in metadata_str:
                    fallback_results.append(memory)
        
        # Method 4: Semantic keyword matching
        semantic_keywords = {
            "personal": ["personal", "person", "individual", "about me", "myself"],
            "work": ["work", "job", "career", "professional", "employment"],
            "hobby": ["hobby", "interest", "passion", "activity", "leisure"],
            "technology": ["tech", "technology", "programming", "software", "code"],
        }
        
        for category, keywords in semantic_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                if category == "personal":
                    type_results = [m for m in all_memories if "personal" in m.content_type.lower()]
                elif category == "work":
                    type_results = [m for m in all_memories if "work" in m.content_type.lower()]
                elif category == "hobby":
                    type_results = [m for m in all_memories if "interest" in m.content_type.lower()]
                elif category == "technology":
                    type_results = [m for m in all_memories if any(tech in m.content.lower() for tech in ["python", "django", "api", "backend"])]
                
                fallback_results.extend(type_results)
        
        # Remove duplicates and limit results
        unique_results = list({m.id: m for m in fallback_results}.values())
        return unique_results[:limit]

def test_enhanced_service():
    """Test the enhanced memory service."""
    print("🧪 TESTING ENHANCED MEMORY SERVICE")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    db = SessionLocal()
    enhanced_service = EnhancedMemoryService()
    
    # Test queries that were failing
    test_queries = [
        ("personal information", "Generic personal query"),
        ("work situation", "Generic work query"),
        ("Alex as a person", "Person overview"),
        ("What do you know about me?", "General overview"),
        ("Tell me about my work and hobbies", "Cross-domain"),
        ("hobbies interests", "Hobby retrieval"),
        ("weekend activities", "Activity retrieval"),
    ]
    
    for query, description in test_queries:
        print(f"\n{'='*40}")
        print(f"Testing: {description}")
        print(f"Query: '{query}'")
        
        try:
            results = enhanced_service.search_memories_with_fallback(
                db=db,
                query=query,
                user_id=user_id,
                limit=10
            )
            
            print(f"✅ Enhanced search returned {len(results)} results")
            
            if results:
                for i, result in enumerate(results[:3], 1):
                    print(f"  {i}. {result.content[:50]}... (Type: {result.content_type})")
            else:
                print("  ❌ No results found")
                
        except Exception as e:
            print(f"  ❌ Search failed: {e}")
    
    db.close()
    print(f"\n✅ Enhanced service testing completed!")

if __name__ == "__main__":
    test_enhanced_service()
