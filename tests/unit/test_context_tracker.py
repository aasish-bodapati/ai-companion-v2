"""
Unit tests for context tracker
"""

import pytest
from unittest.mock import Mock
import time

from app.memory.context_tracker import ConversationContextTracker


@pytest.fixture
def context_tracker():
    return ConversationContextTracker()


class TestConversationContextTracker:
    
    def test_track_content_basic(self, context_tracker):
        """Test basic content tracking"""
        conversation_id = "conv-123"
        content = "Hello world"
        
        context_tracker.track_content(conversation_id, content)
        
        context = context_tracker.get_conversation_context(conversation_id)
        assert len(context["content_hashes"]) == 1
        assert len(context["discussed_topics"]) >= 1
    
    def test_track_content_with_memory_ids(self, context_tracker):
        """Test content tracking with memory IDs"""
        conversation_id = "conv-123"
        content = "Test message"
        memory_ids = ["mem-1", "mem-2"]
        
        context_tracker.track_content(conversation_id, content, memory_ids)
        
        context = context_tracker.get_conversation_context(conversation_id)
        assert "mem-1" in context["used_memory_ids"]
        assert "mem-2" in context["used_memory_ids"]
    
    def test_is_content_repeated_true(self, context_tracker):
        """Test repeated content detection"""
        conversation_id = "conv-123"
        content = "This is a test message"
        
        # Track content first time
        context_tracker.track_content(conversation_id, content)
        
        # Check if same content is repeated
        is_repeated = context_tracker.is_content_repeated(conversation_id, content)
        assert is_repeated is True
    
    def test_is_content_repeated_false(self, context_tracker):
        """Test non-repeated content detection"""
        conversation_id = "conv-123"
        content1 = "First message"
        content2 = "Second message"
        
        # Track first content
        context_tracker.track_content(conversation_id, content1)
        
        # Check if different content is repeated
        is_repeated = context_tracker.is_content_repeated(conversation_id, content2)
        assert is_repeated is False
    
    def test_is_memory_used_true(self, context_tracker):
        """Test memory usage detection"""
        conversation_id = "conv-123"
        memory_id = "mem-123"
        
        # Track content with memory ID
        context_tracker.track_content(conversation_id, "test", [memory_id])
        
        # Check if memory was used
        is_used = context_tracker.is_memory_used(conversation_id, memory_id)
        assert is_used is True
    
    def test_is_memory_used_false(self, context_tracker):
        """Test memory not used detection"""
        conversation_id = "conv-123"
        memory_id = "mem-123"
        unused_memory_id = "mem-456"
        
        # Track content with one memory ID
        context_tracker.track_content(conversation_id, "test", [memory_id])
        
        # Check if different memory was used
        is_used = context_tracker.is_memory_used(conversation_id, unused_memory_id)
        assert is_used is False
    
    def test_get_used_memory_ids(self, context_tracker):
        """Test getting used memory IDs"""
        conversation_id = "conv-123"
        memory_ids = ["mem-1", "mem-2", "mem-3"]
        
        context_tracker.track_content(conversation_id, "test", memory_ids)
        
        used_ids = context_tracker.get_used_memory_ids(conversation_id)
        assert used_ids == set(memory_ids)
    
    def test_reset_conversation_context(self, context_tracker):
        """Test resetting conversation context"""
        conversation_id = "conv-123"
        
        # Add some context
        context_tracker.track_content(conversation_id, "test content", ["mem-1"])
        
        # Verify context exists
        context = context_tracker.get_conversation_context(conversation_id)
        assert len(context["content_hashes"]) > 0
        assert len(context["used_memory_ids"]) > 0
        
        # Reset context
        context_tracker.reset_conversation_context(conversation_id)
        
        # Verify context is cleared
        context = context_tracker.get_conversation_context(conversation_id)
        assert len(context["content_hashes"]) == 0
        assert len(context["used_memory_ids"]) == 0
        assert len(context["discussed_topics"]) == 0
    
    def test_cache_cleanup(self, context_tracker):
        """Test cache cleanup with TTL"""
        conversation_id = "conv-123"
        
        # Track content
        context_tracker.track_content(conversation_id, "test")
        
        # Manually set old timestamp
        context_tracker._context_cache[conversation_id]["last_updated"] = time.time() - 7200  # 2 hours ago
        
        # Cleanup should remove old entries
        context_tracker._cleanup_cache()
        
        # Context should be removed
        assert conversation_id not in context_tracker._context_cache
    
    def test_extract_topics(self, context_tracker):
        """Test topic extraction from content"""
        content = "I want to discuss fitness and workout routines"
        topics = context_tracker._extract_topics(content)
        
        assert "fitness" in topics
        assert "workout" in topics
        assert len(topics) >= 2
    
    def test_generate_content_hash_consistency(self, context_tracker):
        """Test content hash generation consistency"""
        content = "Test message for hashing"
        
        hash1 = context_tracker._generate_content_hash(content)
        hash2 = context_tracker._generate_content_hash(content)
        
        assert hash1 == hash2
        assert isinstance(hash1, str)
        assert len(hash1) > 0
    
    def test_multiple_conversations(self, context_tracker):
        """Test handling multiple conversations"""
        conv1 = "conv-1"
        conv2 = "conv-2"
        
        context_tracker.track_content(conv1, "Message in conversation 1")
        context_tracker.track_content(conv2, "Message in conversation 2")
        
        context1 = context_tracker.get_conversation_context(conv1)
        context2 = context_tracker.get_conversation_context(conv2)
        
        # Contexts should be separate
        assert context1["content_hashes"] != context2["content_hashes"]
        assert len(context1["content_hashes"]) == 1
        assert len(context2["content_hashes"]) == 1
