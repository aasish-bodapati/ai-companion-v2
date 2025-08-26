"""
Unit tests for deduplication service
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio

from app.memory.deduplication import DeduplicationService


@pytest.fixture
def deduplication_service():
    return DeduplicationService()


@pytest.fixture
def mock_db():
    return Mock()


class TestDeduplicationService:
    
    def test_generate_content_hash(self, deduplication_service):
        """Test content hash generation"""
        content = "This is a test message"
        hash1 = deduplication_service._generate_content_hash(content)
        hash2 = deduplication_service._generate_content_hash(content)
        
        assert hash1 == hash2
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA-256 hex length
    
    def test_normalize_content(self, deduplication_service):
        """Test content normalization"""
        content = "  This IS a TEST!  "
        normalized = deduplication_service._normalize_content(content)
        
        assert normalized == "this is a test"
        assert normalized.islower()
        assert not normalized.startswith(" ")
        assert not normalized.endswith(" ")
    
    @pytest.mark.asyncio
    async def test_get_embedding_with_cache(self, deduplication_service):
        """Test embedding generation with caching"""
        content = "test content"
        
        with patch('app.memory.embeddings.get_embedding') as mock_get_embedding:
            mock_get_embedding.return_value = [0.1, 0.2, 0.3]
            
            # First call should hit the embedding service
            embedding1 = await deduplication_service._get_embedding(content)
            assert embedding1 == [0.1, 0.2, 0.3]
            assert mock_get_embedding.call_count == 1
            
            # Second call should use cache
            embedding2 = await deduplication_service._get_embedding(content)
            assert embedding2 == [0.1, 0.2, 0.3]
            assert mock_get_embedding.call_count == 1  # No additional calls
    
    def test_calculate_similarity(self, deduplication_service):
        """Test cosine similarity calculation"""
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [0.0, 1.0, 0.0]
        vec3 = [1.0, 0.0, 0.0]
        
        # Orthogonal vectors should have 0 similarity
        similarity1 = deduplication_service._calculate_similarity(vec1, vec2)
        assert abs(similarity1) < 1e-10
        
        # Identical vectors should have 1.0 similarity
        similarity2 = deduplication_service._calculate_similarity(vec1, vec3)
        assert abs(similarity2 - 1.0) < 1e-10
    
    @pytest.mark.asyncio
    async def test_is_duplicate_true(self, deduplication_service, mock_db):
        """Test duplicate detection when content is duplicate"""
        content = "This is duplicate content"
        user_id = "test-user"
        
        # Mock database query to return similar content
        mock_memory = Mock()
        mock_memory.content = "This is duplicate content"
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_memory]
        
        with patch.object(deduplication_service, '_get_embedding') as mock_embedding:
            mock_embedding.return_value = [0.1, 0.2, 0.3]
            
            with patch.object(deduplication_service, '_calculate_similarity') as mock_similarity:
                mock_similarity.return_value = 0.95  # High similarity
                
                is_dup = await deduplication_service.is_duplicate(content, user_id, mock_db)
                assert is_dup is True
    
    @pytest.mark.asyncio
    async def test_is_duplicate_false(self, deduplication_service, mock_db):
        """Test duplicate detection when content is not duplicate"""
        content = "This is unique content"
        user_id = "test-user"
        
        # Mock database query to return different content
        mock_memory = Mock()
        mock_memory.content = "This is completely different content"
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_memory]
        
        with patch.object(deduplication_service, '_get_embedding') as mock_embedding:
            mock_embedding.return_value = [0.1, 0.2, 0.3]
            
            with patch.object(deduplication_service, '_calculate_similarity') as mock_similarity:
                mock_similarity.return_value = 0.3  # Low similarity
                
                is_dup = await deduplication_service.is_duplicate(content, user_id, mock_db)
                assert is_dup is False
    
    @pytest.mark.asyncio
    async def test_count_duplicates(self, deduplication_service, mock_db):
        """Test counting duplicates for a user"""
        user_id = "test-user"
        
        # Mock memories with some duplicates
        memories = [
            Mock(content="Content A", id="1"),
            Mock(content="Content A duplicate", id="2"),  # Similar to first
            Mock(content="Unique content B", id="3"),
            Mock(content="Another unique content", id="4"),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = memories
        
        with patch.object(deduplication_service, '_get_embedding') as mock_embedding:
            mock_embedding.side_effect = [
                [0.1, 0.2, 0.3],  # Content A
                [0.1, 0.2, 0.29], # Content A duplicate (similar)
                [0.5, 0.6, 0.7],  # Unique B
                [0.8, 0.9, 1.0],  # Another unique
            ]
            
            with patch.object(deduplication_service, '_calculate_similarity') as mock_similarity:
                # Mock similarity calculations
                mock_similarity.side_effect = [
                    0.95,  # A vs A duplicate - high similarity
                    0.2,   # A vs B - low similarity  
                    0.1,   # A vs Another - low similarity
                    0.3,   # A duplicate vs B - low similarity
                    0.15,  # A duplicate vs Another - low similarity
                    0.25,  # B vs Another - low similarity
                ]
                
                count = await deduplication_service.count_duplicates(user_id, mock_db)
                assert count == 1  # One duplicate pair found
    
    def test_cache_cleanup(self, deduplication_service):
        """Test cache cleanup functionality"""
        # Add some items to cache
        deduplication_service._embedding_cache["key1"] = {
            "embedding": [0.1, 0.2],
            "timestamp": 0  # Old timestamp
        }
        deduplication_service._embedding_cache["key2"] = {
            "embedding": [0.3, 0.4],
            "timestamp": 9999999999  # Future timestamp
        }
        
        deduplication_service._cleanup_cache()
        
        # Old item should be removed, recent item should remain
        assert "key1" not in deduplication_service._embedding_cache
        assert "key2" in deduplication_service._embedding_cache
