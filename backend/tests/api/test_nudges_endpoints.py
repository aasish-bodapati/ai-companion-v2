import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from tests.conftest import client


class TestNudgesEndpoints:
    def test_list_my_nudges_success(self, client: TestClient):
        """Test successful retrieval of user nudges."""
        with patch('app.api.endpoints.nudges.deps.get_current_active_user') as mock_user, \
             patch('app.api.endpoints.nudges.deps.get_db') as mock_db:
            
            # Mock user
            mock_user.return_value = MagicMock(id=1, email="test@example.com")
            mock_db.return_value = MagicMock()
            
            response = client.get("/api/v1/users/me/nudges")
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            
            nudge = data[0]
            assert nudge["id"] == "weekly-1"
            assert nudge["nudge_type"] == "weekly"
            assert nudge["title"] == "Weekly recap is ready"
            assert nudge["message"] == "Want to create a recap of your week?"
            assert nudge["scheduled_for"] is None
            assert nudge["seen"] is False

    def test_list_my_nudges_requires_auth(self, client: TestClient):
        """Test that nudges endpoint requires authentication."""
        response = client.get("/api/v1/users/me/nudges")
        assert response.status_code == 401

    def test_list_my_nudges_db_error(self, client: TestClient):
        """Test handling of database errors."""
        with patch('app.api.endpoints.nudges.deps.get_current_active_user') as mock_user, \
             patch('app.api.endpoints.nudges.deps.get_db') as mock_db:
            
            # Mock user
            mock_user.return_value = MagicMock(id=1, email="test@example.com")
            # Mock DB error
            mock_db.side_effect = Exception("Database connection failed")
            
            response = client.get("/api/v1/users/me/nudges")
            assert response.status_code == 500

    def test_run_nudges_success(self, client: TestClient):
        """Test successful execution of nudges."""
        with patch('app.api.endpoints.nudges.deps.get_current_active_user') as mock_user, \
             patch('app.api.endpoints.nudges.deps.get_db') as mock_db:
            
            # Mock user
            mock_user.return_value = MagicMock(id=1, email="test@example.com")
            mock_db.return_value = MagicMock()
            
            response = client.post("/api/v1/nudges/run")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"

    def test_run_nudges_requires_auth(self, client: TestClient):
        """Test that run nudges endpoint requires authentication."""
        response = client.post("/api/v1/nudges/run")
        assert response.status_code == 401

    def test_run_nudges_db_error(self, client: TestClient):
        """Test handling of database errors in run nudges."""
        with patch('app.api.endpoints.nudges.deps.get_current_active_user') as mock_user, \
             patch('app.api.endpoints.nudges.deps.get_db') as mock_db:
            
            # Mock user
            mock_user.return_value = MagicMock(id=1, email="test@example.com")
            # Mock DB error
            mock_db.side_effect = Exception("Database connection failed")
            
            response = client.post("/api/v1/nudges/run")
            assert response.status_code == 500

    def test_nudge_item_structure(self, client: TestClient):
        """Test that nudge items have the correct structure."""
        with patch('app.api.endpoints.nudges.deps.get_current_active_user') as mock_user, \
             patch('app.api.endpoints.nudges.deps.get_db') as mock_db:
            
            # Mock user
            mock_user.return_value = MagicMock(id=1, email="test@example.com")
            mock_db.return_value = MagicMock()
            
            response = client.get("/api/v1/users/me/nudges")
            assert response.status_code == 200
            
            data = response.json()
            nudge = data[0]
            
            # Verify all required fields are present
            required_fields = ["id", "nudge_type", "title", "message", "scheduled_for", "seen"]
            for field in required_fields:
                assert field in nudge
            
            # Verify nudge_type is one of the allowed values
            allowed_types = ["morning", "evening", "weekly", "opportunity", "checkin"]
            assert nudge["nudge_type"] in allowed_types
            
            # Verify data types
            assert isinstance(nudge["id"], str)
            assert isinstance(nudge["nudge_type"], str)
            assert isinstance(nudge["title"], str)
            assert isinstance(nudge["message"], str)
            assert nudge["scheduled_for"] is None or isinstance(nudge["scheduled_for"], str)
            assert isinstance(nudge["seen"], bool)

    def test_nudges_endpoint_integration(self, client: TestClient):
        """Test integration between list and run nudges endpoints."""
        with patch('app.api.endpoints.nudges.deps.get_current_active_user') as mock_user, \
             patch('app.api.endpoints.nudges.deps.get_db') as mock_db:
            
            # Mock user
            mock_user.return_value = MagicMock(id=1, email="test@example.com")
            mock_db.return_value = MagicMock()
            
            # First, get nudges
            list_response = client.get("/api/v1/users/me/nudges")
            assert list_response.status_code == 200
            
            # Then, run nudges
            run_response = client.post("/api/v1/nudges/run")
            assert run_response.status_code == 200
            
            # Verify both endpoints work with the same user session
            assert list_response.json()[0]["id"] == "weekly-1"
            assert run_response.json()["status"] == "ok"
