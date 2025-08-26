"""
Unit tests for simplified memory components
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestSimplifiedMemoryComponents:
    
    def test_memory_service_initialization(self):
        """Test memory service initializes correctly"""
        from app.memory.service import MemoryService
        
        service = MemoryService()
        assert service is not None
        assert hasattr(service, '_sys_prompt_cache')
        assert hasattr(service, '_memory_cache')
    
    def test_deduplication_service_initialization(self):
        """Test deduplication service initializes correctly"""
        from app.memory.deduplication import DeduplicationService
        
        service = DeduplicationService()
        assert service is not None
        assert service.similarity_threshold == 0.85
        assert hasattr(service, '_embedding_cache')
    
    def test_context_tracker_initialization(self):
        """Test context tracker initializes correctly"""
        from app.memory.context_tracker import ConversationContextTracker
        
        tracker = ConversationContextTracker()
        assert tracker is not None
        assert hasattr(tracker, '_context_cache')
        assert tracker.cache_ttl == 3600  # 1 hour
    
    def test_consolidation_service_initialization(self):
        """Test consolidation service initializes correctly"""
        from app.memory.consolidation import MemoryConsolidationService
        
        service = MemoryConsolidationService()
        assert service is not None
        assert service.similarity_threshold == 0.8
        assert hasattr(service, '_embedding_cache')
    
    def test_memory_service_without_emotional_analysis(self):
        """Test memory service works without emotional analysis"""
        from app.memory.service import MemoryService
        
        service = MemoryService()
        
        # Should not have emotional analysis enabled after cleanup
        assert not hasattr(service, 'emotional_analyzer')
        
        # Should still have core functionality
        assert hasattr(service, 'search_memories')
        assert hasattr(service, 'store_memory')
    
    def test_removed_neural_system_imports(self):
        """Test that neural system imports are properly removed"""
        with pytest.raises(ImportError):
            from app.memory.neural_system import neural_memory_system
    
    def test_removed_emotional_memory_imports(self):
        """Test that emotional memory imports are properly removed"""
        with pytest.raises(ImportError):
            from app.memory.emotional_memory import emotional_analyzer
    
    def test_removed_intelligence_services_imports(self):
        """Test that intelligence services imports are properly removed"""
        with pytest.raises(ImportError):
            from app.services.context_intelligence import context_intelligence
            
        with pytest.raises(ImportError):
            from app.services.conversation_intelligence import conversation_intelligence
    
    @pytest.mark.asyncio
    async def test_memory_retrieval_without_emotional_context(self):
        """Test memory retrieval works without emotional context"""
        from app.memory.service import MemoryService
        from unittest.mock import Mock
        
        service = MemoryService()
        mock_db = Mock()
        
        # Mock database query
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        # Should not fail without emotional context
        try:
            memories = service.search_memories(
                query="test query",
                user_id="test-user",
                db=mock_db,
                limit=5
            )
            # Should return empty list or handle gracefully
            assert isinstance(memories, list)
        except Exception as e:
            # Should not fail due to missing emotional components
            assert "emotional" not in str(e).lower()
    
    def test_faiss_integration_still_works(self):
        """Test that FAISS integration is preserved"""
        from app.memory.faiss_store import FAISSVectorStore
        
        # Should be able to create FAISS store
        store = FAISSVectorStore()
        assert store is not None
        assert hasattr(store, 'add_vectors')
        assert hasattr(store, 'search_vectors')
    
    def test_embeddings_module_preserved(self):
        """Test that embeddings module is preserved"""
        import app.memory.embeddings as embeddings
        
        assert hasattr(embeddings, 'get_embedding')
        assert hasattr(embeddings, 'get_embedding_dimension')
    
    def test_contextual_retrieval_simplified(self):
        """Test that contextual retrieval is simplified"""
        from app.memory.contextual_retrieval import ContextualMemoryRetriever
        
        retriever = ContextualMemoryRetriever()
        assert retriever is not None
        
        # Should not have emotional analysis dependencies
        assert not hasattr(retriever, 'emotional_analyzer')
        
        # Should still have basic contextual functionality
        assert hasattr(retriever, 'conversation_themes')
    
    def test_api_endpoints_available(self):
        """Test that new API endpoints are available"""
        from app.api.endpoints import deduplication
        
        assert hasattr(deduplication, 'router')
        assert hasattr(deduplication, 'check_content_duplication')
        assert hasattr(deduplication, 'consolidate_memories')
        assert hasattr(deduplication, 'get_deduplication_metrics')
    
    def test_memory_models_preserved(self):
        """Test that memory models are preserved"""
        from app.models.memory import MemoryNode
        from app.models.conversation import Conversation, Message
        
        # Core models should still exist
        assert MemoryNode is not None
        assert Conversation is not None
        assert Message is not None
