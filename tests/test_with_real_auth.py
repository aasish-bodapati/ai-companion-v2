import requests
import json

# Test the conversation endpoints with real authentication
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
    print(f"Login Response: {login_response.text}")
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        access_token = token_data.get("access_token")
        print(f"Got access token: {access_token[:50]}...")
        
        # Step 2: Test conversation endpoints with real token
        headers = {"Authorization": f"Bearer {access_token}"}
        
        print("\n=== Step 2: Testing GET /conversations/ with real token ===")
        try:
            response = requests.get(f"{base_url}/conversations/", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")
        
        print("\n=== Step 3: Testing GET /conversations/{id} with real token ===")
        try:
            response = requests.get(f"{base_url}/conversations/test-id", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")
        
        print("\n=== Step 4: Testing GET /conversations/{id}/messages with real token ===")
        try:
            response = requests.get(f"{base_url}/conversations/test-id/messages", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")
        
        print("\n=== Step 5: Testing POST /conversations/{id}/messages with real token ===")
        try:
            data = {"content": "test message", "role": "user"}
            response = requests.post(f"{base_url}/conversations/test-id/messages", 
                                   headers={**headers, "Content-Type": "application/json"},
                                   json=data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("Failed to get access token")
        
except Exception as e:
    print(f"Login Error: {e}")
