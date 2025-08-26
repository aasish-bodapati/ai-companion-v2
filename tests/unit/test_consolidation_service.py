"""
Unit tests for memory consolidation service
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime

from app.memory.consolidation import MemoryConsolidationService


@pytest.fixture
def consolidation_service():
    return MemoryConsolidationService()


@pytest.fixture
def mock_db():
    return Mock()


@pytest.fixture
def sample_memories():
    """Sample memories for testing"""
    return [
        Mock(
            id="mem-1",
            content="I went for a run today, 5 miles",
            content_type="activity",
            importance_score=0.7,
            created_at=datetime.now()
        ),
        Mock(
            id="mem-2", 
            content="Had a great 5-mile run this morning",
            content_type="activity",
            importance_score=0.8,
            created_at=datetime.now()
        ),
        Mock(
            id="mem-3",
            content="Meeting with John about project X",
            content_type="event",
            importance_score=0.9,
            created_at=datetime.now()
        )
    ]


class TestMemoryConsolidationService:
    
    @pytest.mark.asyncio
    async def test_find_similar_memories(self, consolidation_service, mock_db, sample_memories):
        """Test finding similar memories"""
        mock_db.query.return_value.filter.return_value.all.return_value = sample_memories
        
        with patch.object(consolidation_service, '_get_embedding') as mock_embedding:
            mock_embedding.side_effect = [
                [0.1, 0.2, 0.3],  # run memory 1
                [0.1, 0.2, 0.29], # run memory 2 (similar)
                [0.8, 0.9, 1.0],  # meeting memory (different)
            ]
            
            similar_groups = await consolidation_service._find_similar_memories(
                sample_memories, similarity_threshold=0.8
            )
            
            assert len(similar_groups) >= 1
            # Should group the two running memories together
            running_group = next((g for g in similar_groups if len(g) == 2), None)
            assert running_group is not None
    
    @pytest.mark.asyncio
    async def test_consolidate_memory_group(self, consolidation_service, sample_memories):
        """Test consolidating a group of similar memories"""
        # Group the two running memories
        memory_group = sample_memories[:2]  # First two are running memories
        
        consolidated = await consolidation_service._consolidate_memory_group(memory_group)
        
        assert consolidated is not None
        assert "run" in consolidated["content"].lower()
        assert consolidated["importance_score"] >= max(m.importance_score for m in memory_group)
        assert consolidated["content_type"] == "activity"
        assert "consolidated_from" in consolidated["metadata"]
        assert len(consolidated["metadata"]["consolidated_from"]) == 2
    
    @pytest.mark.asyncio
    async def test_consolidate_user_memories(self, consolidation_service, mock_db, sample_memories):
        """Test full user memory consolidation"""
        user_id = "test-user"
        mock_db.query.return_value.filter.return_value.all.return_value = sample_memories
        
        with patch.object(consolidation_service, '_find_similar_memories') as mock_find:
            # Mock finding one group of similar memories
            mock_find.return_value = [sample_memories[:2]]  # Group first two memories
            
            with patch.object(consolidation_service, '_consolidate_memory_group') as mock_consolidate:
                mock_consolidate.return_value = {
                    "content": "Consolidated running activities",
                    "content_type": "activity",
                    "importance_score": 0.8,
                    "metadata": {"consolidated_from": ["mem-1", "mem-2"]}
                }
                
                result = await consolidation_service.consolidate_user_memories(user_id, mock_db)
                
                assert result["consolidated"] == 1
                assert result["removed"] == 2
                assert "groups" in result
    
    @pytest.mark.asyncio
    async def test_count_consolidation_opportunities(self, consolidation_service, mock_db, sample_memories):
        """Test counting consolidation opportunities"""
        user_id = "test-user"
        mock_db.query.return_value.filter.return_value.all.return_value = sample_memories
        
        with patch.object(consolidation_service, '_find_similar_memories') as mock_find:
            # Mock finding opportunities
            mock_find.return_value = [
                sample_memories[:2],  # One group of 2 similar memories
            ]
            
            count = await consolidation_service.count_consolidation_opportunities(user_id, mock_db)
            
            assert count == 1  # One consolidation opportunity
    
    def test_merge_content(self, consolidation_service):
        """Test content merging logic"""
        contents = [
            "I went for a run today",
            "Had a great run this morning", 
            "Running was fantastic"
        ]
        
        merged = consolidation_service._merge_content(contents)
        
        assert "run" in merged.lower()
        assert len(merged) > max(len(c) for c in contents)  # Should be longer than individual
        assert merged != contents[0]  # Should be different from original
    
    def test_calculate_consolidated_importance(self, consolidation_service, sample_memories):
        """Test importance score calculation for consolidated memories"""
        memory_group = sample_memories[:2]
        
        importance = consolidation_service._calculate_consolidated_importance(memory_group)
        
        # Should be at least as high as the highest individual score
        max_individual = max(m.importance_score for m in memory_group)
        assert importance >= max_individual
        assert importance <= 1.0  # Should not exceed maximum
    
    def test_determine_consolidated_type(self, consolidation_service, sample_memories):
        """Test content type determination for consolidated memories"""
        # All same type
        same_type_group = [sample_memories[0], sample_memories[1]]  # Both activity
        result_type = consolidation_service._determine_consolidated_type(same_type_group)
        assert result_type == "activity"
        
        # Mixed types - should pick most common or highest importance
        mixed_group = sample_memories  # activity, activity, event
        result_type = consolidation_service._determine_consolidated_type(mixed_group)
        assert result_type in ["activity", "event"]
    
    @pytest.mark.asyncio
    async def test_get_embedding_with_cache(self, consolidation_service):
        """Test embedding generation with caching"""
        content = "test content for embedding"
        
        with patch('app.memory.embeddings.get_embedding') as mock_get_embedding:
            mock_get_embedding.return_value = [0.1, 0.2, 0.3]
            
            # First call
            embedding1 = await consolidation_service._get_embedding(content)
            assert embedding1 == [0.1, 0.2, 0.3]
            assert mock_get_embedding.call_count == 1
            
            # Second call should use cache
            embedding2 = await consolidation_service._get_embedding(content)
            assert embedding2 == [0.1, 0.2, 0.3]
            assert mock_get_embedding.call_count == 1  # No additional calls
    
    def test_calculate_similarity(self, consolidation_service):
        """Test similarity calculation"""
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [0.0, 1.0, 0.0]
        vec3 = [1.0, 0.0, 0.0]
        
        # Orthogonal vectors
        similarity1 = consolidation_service._calculate_similarity(vec1, vec2)
        assert abs(similarity1) < 1e-10
        
        # Identical vectors
        similarity2 = consolidation_service._calculate_similarity(vec1, vec3)
        assert abs(similarity2 - 1.0) < 1e-10
    
    def test_empty_memory_list(self, consolidation_service, mock_db):
        """Test handling empty memory list"""
        user_id = "test-user"
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        async def test_empty():
            result = await consolidation_service.consolidate_user_memories(user_id, mock_db)
            assert result["consolidated"] == 0
            assert result["removed"] == 0
            assert len(result["groups"]) == 0
        
        import asyncio
        asyncio.run(test_empty())
    
    def test_single_memory(self, consolidation_service, mock_db):
        """Test handling single memory (no consolidation possible)"""
        user_id = "test-user"
        single_memory = [Mock(id="mem-1", content="Single memory", content_type="note")]
        mock_db.query.return_value.filter.return_value.all.return_value = single_memory
        
        async def test_single():
            with patch.object(consolidation_service, '_find_similar_memories') as mock_find:
                mock_find.return_value = []  # No similar groups found
                
                result = await consolidation_service.consolidate_user_memories(user_id, mock_db)
                assert result["consolidated"] == 0
                assert result["removed"] == 0
        
        import asyncio
        asyncio.run(test_single())
