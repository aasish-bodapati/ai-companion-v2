import requests
import json

print("=== Testing Chat Endpoint ===")

# Step 1: Login to get a valid token
print("\n1. Logging in...")
try:
    login_response = requests.post('http://localhost:8000/api/v1/login/access-token', 
                                 data={'username': 'test@example.com', 'password': 'testpassword123'})
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        access_token = token_data['access_token']
        print("✅ Login successful")
        
        # Step 2: Get user's conversations
        print("\n2. Getting conversations...")
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        conv_response = requests.get('http://localhost:8000/api/v1/conversations/', headers=headers)
        print(f"Conversations status: {conv_response.status_code}")
        
        if conv_response.status_code == 200:
            conversations = conv_response.json()
            print(f"Found {len(conversations)} conversations")
            
            if conversations:
                conversation_id = conversations[0]['id']
                print(f"Using conversation: {conversation_id}")
                
                # Step 3: Test streaming chat
                print("\n3. Testing streaming chat...")
                chat_data = {
                    "content": "what do you know about me",
                    "remember": True
                }
                
                stream_response = requests.post(
                    f'http://localhost:8000/api/v1/conversations/{conversation_id}/reply/stream',
                    headers=headers,
                    json=chat_data,
                    stream=True
                )
                
                print(f"Stream status: {stream_response.status_code}")
                if stream_response.status_code == 200:
                    print("✅ Stream started successfully")
                    print("Response chunks:")
                    for line in stream_response.iter_lines():
                        if line:
                            line_str = line.decode('utf-8')
                            if line_str.startswith('data: '):
                                chunk = line_str[6:]  # Remove 'data: ' prefix
                                print(f"  Chunk: {chunk}")
                else:
                    print(f"❌ Stream failed: {stream_response.text}")
            else:
                print("No conversations found")
        else:
            print(f"❌ Failed to get conversations: {conv_response.text}")
            
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

