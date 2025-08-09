import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.conversation import Conversation

def test_available_endpoints(client: TestClient, token: str, test_user):
    """Test available endpoints from the root."""
    headers = {
        "Authorization": f"Bearer {token}",    
        "Content-Type": "application/json"     
    }

    # Test root endpoint (should be public)
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

    # Test health check endpoint (should be public)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    # Test authenticated user info endpoint
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200, f"Failed to get user info: {response.text}"
    user_data = response.json()
    assert "email" in user_data
    assert user_data["email"] == test_user.email

def test_chat_endpoint(client: TestClient, token: str, db: Session, test_user):
    """Test the chat completion endpoint."""
    # Set up authentication headers
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    # Create a test conversation associated with the test user
    conversation = Conversation(
        title="Test Conversation",
        user_id=test_user.id
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    # Test chat completion with proper messages format
    chat_data = {
        "role": "user",
        "content": "Hello, can you help me with something?"
    }
    # Use the correct endpoint path with version
    response = client.post(
        f"/api/v1/conversations/{conversation.id}/messages",
        json=chat_data,
        headers=headers,
        timeout=30
    )
    
    assert response.status_code == 201, f"Response: {response.text}"
    msg = response.json()
    # Validate Message schema fields
    assert msg["role"] == "user"
    assert msg["content"] == chat_data["content"]
    assert msg["conversation_id"] == str(conversation.id)
    assert "id" in msg

if __name__ == "__main__":
    main()
