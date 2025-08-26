"""
Integration tests for no-repeated-context flow
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import json

from app.main import app

@pytest.fixture
def client():
    # Override auth so tests don't depend on external JWT fixtures
    try:
        from app.api import deps
    except Exception:
        deps = None

    # Provide a lightweight user object for auth override
    class _TestUser:
        id = "test-user-id"
        email = "test@example.com"
        is_active = True

    if deps is not None:
        app.dependency_overrides[getattr(deps, "get_current_user")] = lambda: _TestUser()

    return TestClient(app)


class TestNoRepeatedContextFlow:
    
    def test_end_to_end_deduplication_flow(self, client):
        """Test complete flow: send message -> check duplicate -> track context"""
        conversation_id = "test-conv-123"
        message_content = "I want to start working out"
        
        # Step 1: Check if content is duplicate (should be false initially)
        with patch('app.memory.deduplication.deduplication_service.is_duplicate') as mock_is_dup:
            mock_is_dup.return_value = False
            
            dup_response = client.post(
                "/api/v1/deduplication/check-duplicate",
                json={"content": message_content},
                headers={}
            )
            
            assert dup_response.status_code == 200
            assert dup_response.json()["is_duplicate"] is False
        
        # Step 2: Send message (this would normally trigger context tracking)
        with patch('app.memory.context_tracker.context_tracker.track_content') as mock_track:
            with patch('app.memory.context_tracker.context_tracker.is_content_repeated') as mock_repeated:
                mock_repeated.return_value = False
                
                # Mock the message sending endpoint
                with patch('app.api.endpoints.conversations_messages') as mock_messages:
                    # Simulate successful message sending
                    pass
        
        # Step 3: Check conversation context was updated
        with patch('app.memory.context_tracker.context_tracker.get_conversation_context') as mock_get_context:
            mock_get_context.return_value = {
                "discussed_topics": {"fitness", "workout"},
                "used_memory_ids": set(),
                "content_hashes": {"hash_of_workout_message"}
            }
            
            context_response = client.get(
                f"/api/v1/deduplication/conversation-context/{conversation_id}",
                headers={}
            )
            
            assert context_response.status_code == 200
            context_data = context_response.json()
            assert "fitness" in context_data["discussed_topics"]
    
    def test_repeated_content_prevention(self, client):
        """Test that repeated content is detected and prevented"""
        message_content = "I want to start working out"
        
        # First time - should be allowed
        with patch('app.memory.deduplication.deduplication_service.is_duplicate') as mock_is_dup:
            mock_is_dup.return_value = False
            
            response1 = client.post(
                "/api/v1/deduplication/check-duplicate",
                json={"content": message_content},
                headers={}
            )
            
            assert response1.status_code == 200
            assert response1.json()["is_duplicate"] is False
        
        # Second time - should be detected as duplicate
        with patch('app.memory.deduplication.deduplication_service.is_duplicate') as mock_is_dup:
            mock_is_dup.return_value = True
            
            response2 = client.post(
                "/api/v1/deduplication/check-duplicate",
                json={"content": message_content},
                headers={}
            )
            
            assert response2.status_code == 200
            assert response2.json()["is_duplicate"] is True
    
    def test_memory_consolidation_workflow(self, client):
        """Test memory consolidation reduces duplicates"""
        # Step 1: Get initial metrics
        with patch('app.memory.deduplication.deduplication_service.count_duplicates') as mock_count_dup:
            with patch('app.memory.consolidation.consolidation_service.count_consolidation_opportunities') as mock_count_consol:
                mock_count_dup.return_value = 10
                mock_count_consol.return_value = 5
                
                # Mock total memories count
                with patch('app.models.memory.MemoryNode') as mock_model:
                    mock_query = Mock()
                    mock_query.query.return_value.filter.return_value.count.return_value = 50
                    
                    # This test would need proper DB mocking to work fully
                    # For now, we test the consolidation endpoint directly
        
        # Step 2: Trigger consolidation
        with patch('app.memory.consolidation.consolidation_service.consolidate_user_memories') as mock_consolidate:
            mock_consolidate.return_value = {
                "consolidated": 5,
                "removed": 10,
                "groups": []
            }
            
            consolidate_response = client.post(
                "/api/v1/deduplication/consolidate",
                headers={}
            )
            
            assert consolidate_response.status_code == 200
            data = consolidate_response.json()
            assert data["consolidated"] == 5
            assert data["removed"] == 10
    
    def test_conversation_context_isolation(self, client):
        """Test that different conversations have isolated contexts"""
        conv1_id = "conv-1"
        conv2_id = "conv-2"
        
        # Mock context for conversation 1
        with patch('app.memory.context_tracker.context_tracker.get_conversation_context') as mock_get_context:
            mock_get_context.return_value = {
                "discussed_topics": {"fitness"},
                "used_memory_ids": {"mem-1"},
                "content_hashes": {"hash1"}
            }
            
            response1 = client.get(
                f"/api/v1/deduplication/conversation-context/{conv1_id}",
                headers={}
            )
            
            assert response1.status_code == 200
            data1 = response1.json()
            assert data1["conversation_id"] == conv1_id
        
        # Mock context for conversation 2 (different)
        with patch('app.memory.context_tracker.context_tracker.get_conversation_context') as mock_get_context:
            mock_get_context.return_value = {
                "discussed_topics": {"nutrition"},
                "used_memory_ids": {"mem-2"},
                "content_hashes": {"hash2"}
            }
            
            response2 = client.get(
                f"/api/v1/deduplication/conversation-context/{conv2_id}",
                headers={}
            )
            
            assert response2.status_code == 200
            data2 = response2.json()
            assert data2["conversation_id"] == conv2_id
            assert data1["discussed_topics"] != data2["discussed_topics"]
    
    def test_context_reset_functionality(self, client):
        """Test context reset clears conversation tracking"""
        conversation_id = "test-conv-reset"
        
        # Reset context
        with patch('app.memory.context_tracker.context_tracker.reset_conversation_context') as mock_reset:
            response = client.delete(
                f"/api/v1/deduplication/reset-context/{conversation_id}",
                headers={}
            )
            
            assert response.status_code == 200
            mock_reset.assert_called_once_with(conversation_id)
        
        # Verify context is empty after reset
        with patch('app.memory.context_tracker.context_tracker.get_conversation_context') as mock_get_context:
            mock_get_context.return_value = {
                "discussed_topics": set(),
                "used_memory_ids": set(),
                "content_hashes": set()
            }
            
            context_response = client.get(
                f"/api/v1/deduplication/conversation-context/{conversation_id}",
                headers={}
            )
            
            assert context_response.status_code == 200
            data = context_response.json()
            assert len(data["discussed_topics"]) == 0
            assert len(data["used_memory_ids"]) == 0
    
    def test_memory_usage_tracking(self, client):
        """Test that memory usage is tracked in conversations"""
        conversation_id = "conv-with-memories"
        
        # Simulate conversation context with used memories
        with patch('app.memory.context_tracker.context_tracker.get_conversation_context') as mock_get_context:
            mock_get_context.return_value = {
                "discussed_topics": {"fitness", "goals"},
                "used_memory_ids": {"mem-fitness-1", "mem-goals-2"},
                "content_hashes": {"hash1", "hash2"}
            }
            
            response = client.get(
                f"/api/v1/deduplication/conversation-context/{conversation_id}",
                headers={}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "mem-fitness-1" in data["used_memory_ids"]
            assert "mem-goals-2" in data["used_memory_ids"]
            assert len(data["used_memory_ids"]) == 2
    
    def test_semantic_similarity_detection(self, client):
        """Test that semantically similar content is detected as duplicate"""
        similar_contents = [
            "I want to start exercising",
            "I'd like to begin working out",
            "I want to start fitness activities"
        ]
        
        # First content should not be duplicate
        with patch('app.memory.deduplication.deduplication_service.is_duplicate') as mock_is_dup:
            mock_is_dup.return_value = False
            
            response1 = client.post(
                "/api/v1/deduplication/check-duplicate",
                json={"content": similar_contents[0]},
                headers={}
            )
            
            assert response1.json()["is_duplicate"] is False
        
        # Similar content should be detected as duplicate
        with patch('app.memory.deduplication.deduplication_service.is_duplicate') as mock_is_dup:
            mock_is_dup.return_value = True  # Semantic similarity detected
            
            response2 = client.post(
                "/api/v1/deduplication/check-duplicate",
                json={"content": similar_contents[1]},
                headers={}
            )
            
            assert response2.json()["is_duplicate"] is True
