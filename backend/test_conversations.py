import requests
import json
from typing import Dict, Any, Optional
import uuid

class ConversationAPIClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.token: Optional[str] = None
        self.headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "accept": "application/json"
        }

    def login(self, username: str, password: str) -> bool:
        """Authenticate and get access token using OAuth2 form data"""
        try:
            # Using OAuth2PasswordRequestForm format
            form_data = {
                'username': username,
                'password': password,
                'grant_type': 'password',
                'scope': '',
                'client_id': '',
                'client_secret': ''
            }
            
            # Print debug info
            login_url = f"{self.base_url}/token"
            print(f"Attempting login to: {login_url}")
            
            response = requests.post(
                login_url,
                data=form_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10
            )
            
            # Print response details for debugging
            print(f"Status code: {response.status_code}")
            try:
                print(f"Response: {response.text}")
            except:
                print("Could not decode response text")
                
            response.raise_for_status()
            
            token_data = response.json()
            self.token = token_data.get("access_token")
            if not self.token:
                print("❌ No access token in response")
                print(f"Response content: {response.content}")
                return False
                
            self.headers["Authorization"] = f"Bearer {self.token}"
            print("✅ Successfully logged in")
            return True
            
        except Exception as e:
            print(f"❌ Login failed: {str(e)}")
            return False

    def chat(self, message: str) -> Optional[Dict[str, Any]]:
        """Send a chat message"""
        try:
            url = f"{self.base_url}/api/chat"
            print(f"Sending chat message to: {url}")
            
            # Prepare the request data with the expected format
            request_data = {
                "messages": [
                    {
                        "role": "user",
                        "content": message
                    }
                ],
                "stream": False,
                "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
            }
            
            print(f"Request data: {request_data}")
            
            response = requests.post(
                url,
                json=request_data,
                headers=self.headers,
                timeout=30
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response content: {response.text}")
            
            response.raise_for_status()
            print("✅ Chat response received")
            
            # Parse the response
            response_data = response.json()
            
            # Check if we got a valid response from the model
            if 'response' in response_data and 'content' in response_data['response']:
                print("✅ Successfully parsed response from model")
                print(f"Assistant: {response_data['response']['content']}")
                return response_data['response']['content']
            elif 'choices' in response_data and len(response_data['choices']) > 0:
                # Fallback for different response format
                content = response_data['choices'][0]['message']['content']
                print(f"✅ Successfully parsed response from model (fallback format)")
                print(f"Assistant: {content}")
                return content
            else:
                print("❌ No valid response from the model")
                print(f"Response data: {response_data}")
                return None
                
        except requests.exceptions.HTTPError as http_err:
            print(f"❌ HTTP error occurred: {http_err}")
            if hasattr(http_err, 'response') and http_err.response is not None:
                try:
                    error_detail = http_err.response.json()
                    print(f"Error details: {error_detail}")
                except:
                    print(f"Response text: {http_err.response.text}")
            return None
            
        except Exception as e:
            print(f"❌ An error occurred: {str(e)}")
            return None

    def list_conversations(self) -> list:
        """List all conversations"""
        try:
            response = requests.get(
                f"{self.api_prefix}/conversations/",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Failed to list conversations: {str(e)}")
            return []

    def add_message(self, conversation_id: str, content: str, role: str = "user") -> Optional[Dict[str, Any]]:
        """Add a message to a conversation"""
        try:
            response = requests.post(
                f"{self.api_prefix}/conversations/{conversation_id}/messages",
                json={"content": content, "role": role},
                headers=self.headers
            )
            response.raise_for_status()
            print(f"✅ Added message to conversation {conversation_id}")
            return response.json()
        except Exception as e:
            print(f"❌ Failed to add message: {str(e)}")
            return None

    def list_messages(self, conversation_id: str) -> list:
        """List all messages in a conversation"""
        try:
            response = requests.get(
                f"{self.api_prefix}/conversations/{conversation_id}/messages",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Failed to list messages: {str(e)}")
            return []

def run_tests():
    print("🚀 Starting API Test Script\n")
    
    # Initialize client
    client = ConversationAPIClient()
    
    # Use test credentials from environment variables
    username = os.getenv("TEST_USERNAME", "test@example.com")
    password = os.getenv("TEST_PASSWORD", "testpassword123")
    print(f"Using test account: {username}")
    
    if not username or not password:
        print("❌ Error: TEST_USERNAME and TEST_PASSWORD environment variables must be set")
        return
    
    # Login
    if not client.login(username, password):
        print("Exiting due to login failure")
        return
    
    # Test chat endpoint
    response = client.chat("Hello, this is a test message")
    if not response:
        print("Exiting due to chat failure")
        return
    
    print("\n💬 Chat response:")
    print(response)
    
    print("\n✅ All tests completed successfully!")

if __name__ == "__main__":
    run_tests()
