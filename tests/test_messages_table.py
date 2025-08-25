import requests
import json

# Test the messages table directly
base_url = "http://localhost:8000/api/v1"

# Step 1: Login to get a real JWT token
print("=== Step 1: Login to get JWT token ===")
login_data = {
    "username": "test@example.com",
    "password": "testpassword123"
}

try:
    login_response = requests.post(f"{base_url}/login/access-token", data=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        access_token = token_data.get("access_token")
        print(f"Got access token: {access_token[:50]}...")
        
        # Step 2: Get conversations list to find a real ID
        headers = {"Authorization": f"Bearer {access_token}"}
        
        print("\n=== Step 2: Getting conversations list ===")
        try:
            response = requests.get(f"{base_url}/conversations/", headers=headers)
            if response.status_code == 200:
                conversations = response.json()
                if conversations:
                    real_conversation_id = conversations[0]["id"]
                    print(f"Using real conversation ID: {real_conversation_id}")
                    
                    # Step 3: Test GET /conversations/{id}/messages with real ID
                    print(f"\n=== Step 3: Testing GET /conversations/{real_conversation_id}/messages ===")
                    try:
                        response = requests.get(f"{base_url}/conversations/{real_conversation_id}/messages", headers=headers)
                        print(f"Status: {response.status_code}")
                        print(f"Response: {response.text}")
                        
                        if response.status_code == 200:
                            messages = response.json()
                            print(f"Number of messages: {len(messages)}")
                            if messages:
                                print(f"First message: {messages[0]}")
                        elif response.status_code == 500:
                            print("500 error - checking backend logs for details")
                            
                    except Exception as e:
                        print(f"Error: {e}")
                else:
                    print("No conversations found")
            else:
                print(f"Failed to get conversations: {response.status_code}")
        except Exception as e:
            print(f"Error getting conversations: {e}")
    else:
        print("Failed to get access token")
        
except Exception as e:
    print(f"Login Error: {e}")
