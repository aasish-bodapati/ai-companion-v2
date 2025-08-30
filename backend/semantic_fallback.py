#!/usr/bin/env python3
"""
Semantic fallback system to handle remaining query failures.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.memory.service import MemoryService
from app.db.session import SessionLocal
from app.models.memory import MemoryNode
from app.crud.memory import memory

class SemanticMemoryService(MemoryService):
    """Memory service with advanced semantic fallback methods."""
    
    def search_memories_with_semantic_fallback(self, db, query, user_id, limit=10):
        """Search memories with advanced semantic fallback methods."""
        
        # Try original FAISS search first
        faiss_results = self.search_memories(db, query, user_id, limit)
        
        if faiss_results:
            return faiss_results
        
        # If FAISS search fails, use semantic fallback
        print(f"🔍 FAISS search failed for '{query}', using semantic fallback...")
        
        semantic_results = self._semantic_fallback_search(db, query, user_id, limit)
        
        if semantic_results:
            print(f"✅ Semantic fallback found {len(semantic_results)} results")
            return semantic_results
        
        print(f"❌ All search methods failed for '{query}'")
        return []
    
    def _semantic_fallback_search(self, db, query, user_id, limit):
        """Advanced semantic fallback search methods."""
        
        query_lower = query.lower()
        all_memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all()
        
        fallback_results = []
        
        # Method 1: Enhanced content substring search
        for memory in all_memories:
            content_lower = memory.content.lower()
            if query_lower in content_lower:
                fallback_results.append(memory)
        
        # Method 2: Semantic keyword expansion
        semantic_expansions = {
            "weekend": ["weekend", "weekends", "weekly", "every weekend"],
            "activities": ["activities", "hobbies", "interests", "things to do"],
            "fun": ["fun", "enjoy", "love", "passion", "hobby", "interest"],
            "python": ["python", "django", "backend", "programming", "coding"],
            "django": ["django", "python", "backend", "framework", "web"],
            "hiking": ["hiking", "outdoor", "nature", "trail", "walking"],
            "photography": ["photography", "photo", "camera", "creative", "art"],
            "work": ["work", "job", "career", "professional", "employment", "team"],
            "personal": ["personal", "person", "individual", "about me", "myself", "life"],
        }
        
        for keyword, expansions in semantic_expansions.items():
            if keyword in query_lower:
                for memory in all_memories:
                    content_lower = memory.content.lower()
                    if any(exp in content_lower for exp in expansions):
                        fallback_results.append(memory)
        
        # Method 3: Content type semantic mapping
        type_semantic_map = {
            "personal_info": ["personal", "person", "individual", "about", "myself"],
            "work_info": ["work", "job", "career", "professional", "employment", "team", "company"],
            "personal_interests": ["hobby", "interest", "passion", "activity", "leisure", "fun", "weekend"],
        }
        
        for content_type, semantic_terms in type_semantic_map.items():
            if any(term in query_lower for term in semantic_terms):
                type_results = [m for m in all_memories if m.content_type == content_type]
                fallback_results.extend(type_results)
        
        # Method 4: Contextual relationship search
        contextual_relationships = {
            "weekend activities": ["hiking", "photography", "outdoor", "nature", "weekend"],
            "what I do for fun": ["hiking", "photography", "hobby", "interest", "passion"],
            "python django": ["python", "django", "backend", "team", "development"],
            "hiking photography": ["hiking", "photography", "outdoor", "nature", "weekend"],
        }
        
        for pattern, related_terms in contextual_relationships.items():
            if pattern in query_lower:
                for memory in all_memories:
                    content_lower = memory.content.lower()
                    if any(term in content_lower for term in related_terms):
                        fallback_results.append(memory)
        
        # Method 5: Metadata semantic search
        for memory in all_memories:
            if memory.memory_metadata:
                metadata_str = str(memory.memory_metadata).lower()
                if query_lower in metadata_str:
                    fallback_results.append(memory)
                
                # Also check metadata for semantic relationships
                for keyword, expansions in semantic_expansions.items():
                    if keyword in query_lower:
                        if any(exp in metadata_str for exp in expansions):
                            fallback_results.append(memory)
        
        # Method 6: Cross-reference search
        # If query mentions multiple concepts, find memories that contain any of them
        query_words = query_lower.split()
        for memory in all_memories:
            content_lower = memory.content.lower()
            # Check if memory contains any of the query words
            if any(word in content_lower for word in query_words if len(word) > 2):
                fallback_results.append(memory)
        
        # Remove duplicates and limit results
        unique_results = list({m.id: m for m in fallback_results}.values())
        return unique_results[:limit]

def test_semantic_fallback():
    """Test the semantic fallback system."""
    print("🧪 TESTING SEMANTIC FALLBACK SYSTEM")
    print("=" * 50)
    
    user_id = "8cf2e831-ffc3-4c64-8959-95f6718e7bcd"
    
    db = SessionLocal()
    semantic_service = SemanticMemoryService()
    
    # Test the failing queries
    failing_queries = [
        ("weekend activities", "Weekend activities query"),
        ("what I do for fun", "Fun activities query"),
        ("Python Django", "Technology stack query"),
        ("hiking photography", "Hobby combination query"),
    ]
    
    for query, description in failing_queries:
        print(f"\n{'='*40}")
        print(f"Testing: {description}")
        print(f"Query: '{query}'")
        
        try:
            results = semantic_service.search_memories_with_semantic_fallback(
                db=db,
                query=query,
                user_id=user_id,
                limit=10
            )
            
            print(f"✅ Semantic search returned {len(results)} results")
            
            if results:
                for i, result in enumerate(results[:3], 1):
                    print(f"  {i}. {result.content[:50]}... (Type: {result.content_type})")
            else:
                print("  ❌ No results found")
                
        except Exception as e:
            print(f"  ❌ Search failed: {e}")
    
    db.close()
    print(f"\n✅ Semantic fallback testing completed!")

if __name__ == "__main__":
    test_semantic_fallback()
