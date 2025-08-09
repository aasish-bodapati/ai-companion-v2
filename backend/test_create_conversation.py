import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = "http://localhost:8000/api/v1"

# Get test user credentials from environment variables
TEST_USERNAME = os.getenv("TEST_USERNAME")
TEST_PASSWORD = os.getenv("TEST_PASSWORD")

def get_auth_token():
    """Get authentication token for the test user."""
    login_url = f"{BASE_URL}/login/access-token"
    login_data = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }
    response = requests.post(login_url, data=login_data)
    if response.status_code != 200:
        print(f"Failed to get auth token. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return None
    return response.json()["access_token"]

def create_conversation(token, title=None):
    """Create a new conversation."""
    url = f"{BASE_URL}/conversations/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {}
    if title:
        data["title"] = title
    
    response = requests.post(url, headers=headers, json=data)
    print(f"\nCreating conversation with title: {title}")
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        print("Response:", response.json())
    else:
        print(f"Error: {response.text}")
    return response

def main():
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("Failed to authenticate. Please check your credentials.")
        return
    
    print("Authentication successful!")
    
    # Test creating a conversation with a title
    create_conversation(token, title="Test Conversation 1")
    
    # Test creating another conversation with a different title
    create_conversation(token, title="Another Test Conversation")

if __name__ == "__main__":
    main()
