"""
E2E tests for memory workflows.

These tests simulate complete user scenarios with real database and service interactions.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import time


class TestMemoryCreationWorkflow:
    """Test complete memory creation workflow."""
    
    def test_complete_memory_workflow(self, client, test_user):
        """Test complete memory creation, retrieval, and management workflow."""
        # Step 1: Create a memory
        memory_data = {
            "content": "I learned that I work best in the morning hours",
            "memory_type": "experience",
            "importance": 0.9,
            "context": {"source": "conversation", "topic": "productivity"}
        }
        
        response = client.post("/api/memories/", json=memory_data)
        assert response.status_code == 201
        
        created_memory = response.json()
        memory_id = created_memory["id"]
        
        # Verify memory was created correctly
        assert created_memory["content"] == memory_data["content"]
        assert created_memory["memory_type"] == memory_data["memory_type"]
        assert created_memory["importance"] == memory_data["importance"]
        assert created_memory["user_id"] == str(test_user.id)
        
        # Step 2: Retrieve the created memory
        response = client.get(f"/api/memories/{memory_id}")
        assert response.status_code == 200
        
        retrieved_memory = response.json()
        assert retrieved_memory["id"] == memory_id
        assert retrieved_memory["content"] == memory_data["content"]
        
        # Step 3: Search for the memory
        search_query = "morning hours"
        response = client.get(f"/api/memories/search?q={search_query}")
        assert response.status_code == 200
        
        search_results = response.json()
        assert len(search_results) >= 1
        assert any(memory["id"] == memory_id for memory in search_results)
        
        # Step 4: Update the memory
        update_data = {
            "content": "I learned that I work best in the morning hours, especially before 11 AM",
            "importance": 0.95
        }
        
        response = client.put(f"/api/memories/{memory_id}", json=update_data)
        assert response.status_code == 200
        
        updated_memory = response.json()
        assert updated_memory["content"] == update_data["content"]
        assert updated_memory["importance"] == update_data["importance"]
        
        # Step 5: Verify the update persisted
        response = client.get(f"/api/memories/{memory_id}")
        assert response.status_code == 200
        
        final_memory = response.json()
        assert final_memory["content"] == update_data["content"]
        assert final_memory["importance"] == update_data["importance"]
        
        # Step 6: Clean up - delete the memory
        response = client.delete(f"/api/memories/{memory_id}")
        assert response.status_code == 204
        
        # Step 7: Verify deletion
        response = client.get(f"/api/memories/{memory_id}")
        assert response.status_code == 404


class TestMemorySearchWorkflow:
    """Test memory search and discovery workflow."""
    
    def test_memory_search_and_discovery(self, client, test_user):
        """Test searching for and discovering related memories."""
        # Create multiple related memories
        memories_data = [
            {
                "content": "I prefer working in quiet environments",
                "memory_type": "preference",
                "importance": 0.8
            },
            {
                "content": "Coffee helps me focus during work",
                "memory_type": "experience",
                "importance": 0.7
            },
            {
                "content": "I'm most productive between 9 AM and 2 PM",
                "memory_type": "fact",
                "importance": 0.9
            }
        ]
        
        created_memories = []
        
        # Create all memories
        for memory_data in memories_data:
            response = client.post("/api/memories/", json=memory_data)
            assert response.status_code == 201
            created_memories.append(response.json())
        
        try:
            # Test different search queries
            search_queries = [
                "work environment",
                "coffee focus",
                "productivity time",
                "quiet coffee"
            ]
            
            for query in search_queries:
                response = client.get(f"/api/memories/search?q={query}")
                assert response.status_code == 200
                
                results = response.json()
                # Should find at least one relevant memory
                assert len(results) >= 1
                
                # Verify results are relevant to the query
                relevant_found = any(
                    any(keyword in memory["content"].lower() 
                        for keyword in query.lower().split())
                    for memory in results
                )
                assert relevant_found, f"Query '{query}' should find relevant results"
            
            # Test getting all user memories
            response = client.get("/api/memories/user/")
            assert response.status_code == 200
            
            user_memories = response.json()
            assert len(user_memories) >= len(memories_data)
            
            # Verify all created memories are in user's memory list
            created_ids = {memory["id"] for memory in created_memories}
            user_memory_ids = {memory["id"] for memory in user_memories}
            assert created_ids.issubset(user_memory_ids)
            
        finally:
            # Clean up all created memories
            for memory in created_memories:
                client.delete(f"/api/memories/{memory['id']}")


class TestMemoryErrorHandlingWorkflow:
    """Test memory workflow error handling."""
    
    def test_memory_workflow_with_invalid_data(self, client, test_user):
        """Test how the system handles invalid data throughout the workflow."""
        # Test creating memory with invalid data
        invalid_memories = [
            {
                "content": "",  # Empty content
                "memory_type": "preference",
                "importance": 0.8
            },
            {
                "content": "Valid content",
                "memory_type": "invalid_type",  # Invalid type
                "importance": 0.8
            },
            {
                "content": "Valid content",
                "memory_type": "preference",
                "importance": 1.5  # Invalid importance
            },
            {
                "content": "Valid content",
                "memory_type": "preference"
                # Missing importance
            }
        ]
        
        for invalid_memory in invalid_memories:
            response = client.post("/api/memories/", json=invalid_memory)
            assert response.status_code in [400, 422]  # Bad request or validation error
            
            # Verify no memory was created
            response = client.get("/api/memories/user/")
            assert response.status_code == 200
            user_memories = response.json()
            
            # Should not contain the invalid memory content
            memory_contents = [memory["content"] for memory in user_memories]
            if "content" in invalid_memory and invalid_memory["content"]:
                assert invalid_memory["content"] not in memory_contents
    
    def test_memory_workflow_with_nonexistent_resources(self, client):
        """Test accessing non-existent memories."""
        # Try to get non-existent memory
        response = client.get("/api/memories/non_existent_id")
        assert response.status_code == 404
        
        # Try to update non-existent memory
        update_data = {"content": "Updated content"}
        response = client.put("/api/memories/non_existent_id", json=update_data)
        assert response.status_code == 404
        
        # Try to delete non-existent memory
        response = client.delete("/api/memories/non_existent_id")
        assert response.status_code == 404


class TestMemoryPerformanceWorkflow:
    """Test memory workflow performance characteristics."""
    
    @pytest.mark.slow
    def test_memory_bulk_operations(self, client, test_user):
        """Test performance of bulk memory operations."""
        # Create many memories
        num_memories = 50
        memories_data = [
            {
                "content": f"Test memory {i} for performance testing",
                "memory_type": "test",
                "importance": 0.5 + (i % 5) * 0.1
            }
            for i in range(num_memories)
        ]
        
        start_time = time.time()
        
        created_memories = []
        for memory_data in memories_data:
            response = client.post("/api/memories/", json=memory_data)
            assert response.status_code == 201
            created_memories.append(response.json())
        
        creation_time = time.time() - start_time
        
        # Verify all memories were created
        assert len(created_memories) == num_memories
        
        # Test search performance
        search_start = time.time()
        response = client.get("/api/memories/search?q=performance testing")
        search_time = time.time() - search_start
        
        assert response.status_code == 200
        results = response.json()
        assert len(results) >= num_memories
        
        # Performance assertions (adjust thresholds as needed)
        assert creation_time < 10.0, f"Memory creation took too long: {creation_time:.2f}s"
        assert search_time < 2.0, f"Memory search took too long: {search_time:.2f}s"
        
        # Clean up
        for memory in created_memories:
            client.delete(f"/api/memories/{memory['id']}")
