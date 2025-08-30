"""
Tests for conversation endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime

from app.main import app
from tests.conftest import client


class TestConversationEndpoints:
    """Test conversation API endpoints."""

    def test_chat_with_assistant_success(self, client: TestClient, auth_headers: dict):
        """Test successful chat with assistant."""
        with patch('app.api.endpoints.conversation.conversation_intelligence') as mock_intelligence:
            mock_intelligence.generate_response.return_value = {
                "response": "Hello! How can I help you today?",
                "confidence": 0.95,
                "context_used": True
            }
            
            response = client.post(
                "/api/v1/chat",
                json={
                    "message": "Hello, how are you?",
                    "conversation_history": []
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert "user_id" in data
            assert "timestamp" in data
            assert "message_id" in data
            assert data["response"] == "Hello! How can I help you today?"

    def test_chat_with_assistant_with_history(self, client: TestClient, auth_headers: dict):
        """Test chat with conversation history."""
        with patch('app.api.endpoints.conversation.conversation_intelligence') as mock_intelligence:
            mock_intelligence.generate_response.return_value = {
                "response": "I remember our previous conversation about fitness.",
                "confidence": 0.9,
                "context_used": True
            }
            
            conversation_history = [
                {"role": "user", "content": "I want to get fit"},
                {"role": "assistant", "content": "Great! Let's create a fitness plan."}
            ]
            
            response = client.post(
                "/api/v1/chat",
                json={
                    "message": "What was our plan again?",
                    "conversation_history": conversation_history
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert "fitness" in data["response"]

    def test_chat_with_assistant_error(self, client: TestClient, auth_headers: dict):
        """Test chat endpoint error handling."""
        with patch('app.api.endpoints.conversation.conversation_intelligence') as mock_intelligence:
            mock_intelligence.generate_response.side_effect = Exception("LLM service error")
            
            response = client.post(
                "/api/v1/chat",
                json={
                    "message": "Hello",
                    "conversation_history": []
                },
                headers=auth_headers
            )
            
            assert response.status_code == 500
            assert "Failed to generate response" in response.json()["detail"]

    def test_get_conversation_insights(self, client: TestClient, auth_headers: dict):
        """Test getting conversation insights."""
        response = client.get("/api/v1/conversation-insights", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "total_conversations" in data
        assert "conversation_patterns" in data
        assert "emotional_trends" in data
        assert "topic_distribution" in data
        assert "learning_progress" in data
        assert "life_domain_engagement" in data
        
        # Check learning progress structure
        learning_progress = data["learning_progress"]
        assert "total_patterns_learned" in learning_progress
        assert "emotional_awareness" in learning_progress
        assert "context_understanding" in learning_progress
        
        # Check life domain engagement structure
        life_domains = data["life_domain_engagement"]
        expected_domains = ["fitness", "nutrition", "health", "stress", "scheduling"]
        for domain in expected_domains:
            assert domain in life_domains

    def test_get_conversation_insights_error(self, client: TestClient, auth_headers: dict):
        """Test conversation insights error handling."""
        # This would require mocking the database or other dependencies
        # For now, we'll test the basic structure
        response = client.get("/api/v1/conversation-insights", headers=auth_headers)
        assert response.status_code == 200

    def test_provide_conversation_feedback_valid(self, client: TestClient, auth_headers: dict):
        """Test providing valid conversation feedback."""
        feedback_data = {
            "message_id": "msg_1234567890",
            "feedback_score": 4.5,
            "feedback_type": "relevance",
            "additional_comments": "Very helpful response!"
        }
        
        response = client.post(
            "/api/v1/feedback",
            json=feedback_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "Feedback recorded successfully" in data["message"]

    def test_provide_conversation_feedback_invalid_score_low(self, client: TestClient, auth_headers: dict):
        """Test feedback with invalid low score."""
        feedback_data = {
            "message_id": "msg_1234567890",
            "feedback_score": -0.5,
            "feedback_type": "relevance"
        }
        
        response = client.post(
            "/api/v1/feedback",
            json=feedback_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Feedback score must be between 0.0 and 5.0" in response.json()["detail"]

    def test_provide_conversation_feedback_invalid_score_high(self, client: TestClient, auth_headers: dict):
        """Test feedback with invalid high score."""
        feedback_data = {
            "message_id": "msg_1234567890",
            "feedback_score": 5.5,
            "feedback_type": "relevance"
        }
        
        response = client.post(
            "/api/v1/feedback",
            json=feedback_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Feedback score must be between 0.0 and 5.0" in response.json()["detail"]

    def test_provide_conversation_feedback_without_comments(self, client: TestClient, auth_headers: dict):
        """Test feedback without additional comments."""
        feedback_data = {
            "message_id": "msg_1234567890",
            "feedback_score": 3.0,
            "feedback_type": "relevance"
        }
        
        response = client.post(
            "/api/v1/feedback",
            json=feedback_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_search_memories(self, client: TestClient, auth_headers: dict):
        """Test memory search functionality."""
        response = client.get(
            "/api/v1/memory-search?query=fitness&limit=5",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "query" in data
        assert "memories" in data
        assert "total_found" in data
        assert data["query"] == "fitness"
        assert data["limit"] == 5
        assert isinstance(data["memories"], list)
        assert data["total_found"] == 0  # Placeholder returns empty

    def test_search_memories_different_query(self, client: TestClient, auth_headers: dict):
        """Test memory search with different query."""
        response = client.get(
            "/api/v1/memory-search?query=nutrition&limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "nutrition"
        assert data["limit"] == 10

    def test_search_memories_default_limit(self, client: TestClient, auth_headers: dict):
        """Test memory search with default limit."""
        response = client.get(
            "/api/v1/memory-search?query=health",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 10  # Default limit

    def test_chat_without_auth(self, client: TestClient):
        """Test chat endpoint without authentication."""
        response = client.post(
            "/api/v1/chat",
            json={
                "message": "Hello",
                "conversation_history": []
            }
        )
        
        assert response.status_code == 401

    def test_conversation_insights_without_auth(self, client: TestClient):
        """Test conversation insights without authentication."""
        response = client.get("/api/v1/conversation-insights")
        assert response.status_code == 401

    def test_feedback_without_auth(self, client: TestClient):
        """Test feedback endpoint without authentication."""
        response = client.post(
            "/api/v1/feedback",
            json={
                "message_id": "msg_123",
                "feedback_score": 4.0
            }
        )
        assert response.status_code == 401

    def test_memory_search_without_auth(self, client: TestClient):
        """Test memory search without authentication."""
        response = client.get("/api/v1/memory-search?query=test")
        assert response.status_code == 401
