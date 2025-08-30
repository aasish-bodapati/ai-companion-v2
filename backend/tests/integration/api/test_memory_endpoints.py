"""
Integration tests for memory API endpoints.

These tests test API endpoints with real database interactions but mocked external services.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock


class TestMemoryEndpoints:
    """Test memory-related API endpoints."""
    
    def test_create_memory_success(self, client, test_user):
        """Test successful memory creation via API."""
        memory_data = {
            "content": "I really enjoy drinking coffee in the morning",
            "memory_type": "preference",
            "importance": 0.8,
            "context": {"source": "conversation"}
        }
        
        with patch('app.services.memory_service.MemoryService.store_memory') as mock_store:
            mock_store.return_value = {
                "id": "test_memory_id",
                "content": memory_data["content"],
                "memory_type": memory_data["memory_type"],
                "importance": memory_data["importance"],
                "user_id": str(test_user.id)
            }
            
            response = client.post("/api/memories/", json=memory_data)
            
            assert response.status_code == 201
            data = response.json()
            assert data["content"] == memory_data["content"]
            assert data["memory_type"] == memory_data["memory_type"]
            assert data["importance"] == memory_data["importance"]
            assert data["user_id"] == str(test_user.id)
    
    def test_create_memory_validation_error(self, client):
        """Test memory creation with invalid data."""
        invalid_memory_data = {
            "content": "",  # Empty content
            "memory_type": "invalid_type",
            "importance": 1.5  # Invalid importance
        }
        
        response = client.post("/api/memories/", json=invalid_memory_data)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data
    
    def test_get_memory_by_id(self, client, test_user):
        """Test retrieving memory by ID via API."""
        memory_id = "test_memory_id"
        
        with patch('app.services.memory_service.MemoryService.get_memory') as mock_get:
            mock_get.return_value = {
                "id": memory_id,
                "content": "Test memory content",
                "memory_type": "preference",
                "importance": 0.8,
                "user_id": str(test_user.id)
            }
            
            response = client.get(f"/api/memories/{memory_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == memory_id
            assert data["content"] == "Test memory content"
    
    def test_get_memory_not_found(self, client):
        """Test retrieving non-existent memory via API."""
        memory_id = "non_existent_id"
        
        with patch('app.services.memory_service.MemoryService.get_memory') as mock_get:
            mock_get.return_value = None
            
            response = client.get(f"/api/memories/{memory_id}")
            
            assert response.status_code == 404
            data = response.json()
            assert "detail" in data
    
    def test_search_memories(self, client, test_user):
        """Test memory search via API."""
        query = "coffee preference"
        
        with patch('app.services.memory_service.MemoryService.search_memories') as mock_search:
            mock_search.return_value = [
                {
                    "id": "1",
                    "content": "I like coffee",
                    "memory_type": "preference",
                    "importance": 0.8,
                    "user_id": str(test_user.id)
                },
                {
                    "id": "2",
                    "content": "Coffee helps me focus",
                    "memory_type": "experience",
                    "importance": 0.9,
                    "user_id": str(test_user.id)
                }
            ]
            
            response = client.get(f"/api/memories/search?q={query}")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert all("coffee" in memory["content"].lower() for memory in data)
    
    def test_search_memories_empty_query(self, client):
        """Test memory search with empty query."""
        response = client.get("/api/memories/search?q=")
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_update_memory(self, client, test_user):
        """Test memory update via API."""
        memory_id = "test_memory_id"
        update_data = {
            "content": "Updated memory content",
            "importance": 0.9
        }
        
        with patch('app.services.memory_service.MemoryService.update_memory') as mock_update:
            mock_update.return_value = {
                "id": memory_id,
                "content": update_data["content"],
                "importance": update_data["importance"],
                "memory_type": "preference",
                "user_id": str(test_user.id)
            }
            
            response = client.put(f"/api/memories/{memory_id}", json=update_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["content"] == update_data["content"]
            assert data["importance"] == update_data["importance"]
    
    def test_delete_memory(self, client):
        """Test memory deletion via API."""
        memory_id = "test_memory_id"
        
        with patch('app.services.memory_service.MemoryService.delete_memory') as mock_delete:
            mock_delete.return_value = True
            
            response = client.delete(f"/api/memories/{memory_id}")
            
            assert response.status_code == 204
            mock_delete.assert_called_once_with(memory_id)
    
    def test_get_user_memories(self, client, test_user):
        """Test retrieving all memories for a user."""
        with patch('app.services.memory_service.MemoryService.get_user_memories') as mock_get_user:
            mock_get_user.return_value = [
                {
                    "id": "1",
                    "content": "First memory",
                    "memory_type": "preference",
                    "importance": 0.8,
                    "user_id": str(test_user.id)
                },
                {
                    "id": "2",
                    "content": "Second memory",
                    "memory_type": "experience",
                    "importance": 0.9,
                    "user_id": str(test_user.id)
                }
            ]
            
            response = client.get("/api/memories/user/")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert all(memory["user_id"] == str(test_user.id) for memory in data)


class TestMemoryEndpointsAuthentication:
    """Test memory endpoints with authentication."""
    
    def test_create_memory_unauthorized(self, unauth_client):
        """Test memory creation without authentication."""
        memory_data = {
            "content": "Test memory",
            "memory_type": "preference",
            "importance": 0.8
        }
        
        response = unauth_client.post("/api/memories/", json=memory_data)
        
        assert response.status_code == 401
    
    def test_get_memory_unauthorized(self, unauth_client):
        """Test memory retrieval without authentication."""
        response = unauth_client.get("/api/memories/test_id")
        
        assert response.status_code == 401
    
    def test_search_memories_unauthorized(self, unauth_client):
        """Test memory search without authentication."""
        response = unauth_client.get("/api/memories/search?q=test")
        
        assert response.status_code == 401


class TestMemoryEndpointsErrorHandling:
    """Test memory endpoints error handling."""
    
    def test_create_memory_service_error(self, client, test_user):
        """Test memory creation when service fails."""
        memory_data = {
            "content": "Test memory",
            "memory_type": "preference",
            "importance": 0.8
        }
        
        with patch('app.services.memory_service.MemoryService.store_memory') as mock_store:
            mock_store.side_effect = Exception("Service error")
            
            response = client.post("/api/memories/", json=memory_data)
            
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
    
    def test_get_memory_service_error(self, client):
        """Test memory retrieval when service fails."""
        memory_id = "test_id"
        
        with patch('app.services.memory_service.MemoryService.get_memory') as mock_get:
            mock_get.side_effect = Exception("Service error")
            
            response = client.get(f"/api/memories/{memory_id}")
            
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
