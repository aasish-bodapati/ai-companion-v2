#!/usr/bin/env python3
"""
Basic Backend Connectivity Test
Quick check if the backend API is responding
"""

import requests
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_backend_health():
    """Test if backend is responding"""
    print("🔍 Testing backend connectivity...")
    
    try:
        # Test basic health endpoint (if it exists)
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health endpoint responding")
            return True
    except:
        pass
    
    # Test if we can reach the base URL
    try:
        response = requests.get(BASE_URL, timeout=5)
        print(f"✅ Backend responding at {BASE_URL}")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend - is it running?")
        print("   Make sure you have 'uvicorn main:app --reload' running")
        return False
    except Exception as e:
        print(f"❌ Backend connection error: {e}")
        return False

def test_api_endpoints():
    """Test if API endpoints are accessible"""
    print("\n🔍 Testing API endpoints...")
    
    # Test conversations endpoint
    try:
        response = requests.get(f"{API_BASE}/conversations", timeout=5)
        if response.status_code in [200, 401, 403]:  # 401/403 means endpoint exists but needs auth
            print("✅ Conversations endpoint accessible")
        else:
            print(f"⚠️  Conversations endpoint returned {response.status_code}")
    except Exception as e:
        print(f"❌ Conversations endpoint error: {e}")
        return False
    
    # Test if we can create a conversation (this should work without auth)
    try:
        response = requests.post(
            f"{API_BASE}/conversations",
            json={"title": "Test Conversation"},
            timeout=10
        )
        
        if response.status_code == 200:
            conversation_id = response.json().get("id")
            print(f"✅ Can create conversations (ID: {conversation_id})")
            
            # Test if we can send a message
            msg_response = requests.post(
                f"{API_BASE}/conversations/{conversation_id}/messages",
                json={"content": "Hello", "role": "user"},
                timeout=10
            )
            
            if msg_response.status_code == 200:
                print("✅ Can send messages")
                
                # Test streaming endpoint
                stream_response = requests.post(
                    f"{API_BASE}/conversations/{conversation_id}/reply/stream",
                    timeout=5
                )
                
                if stream_response.status_code in [200, 401, 403]:
                    print("✅ Streaming endpoint accessible")
                    return True
                else:
                    print(f"⚠️  Streaming endpoint returned {stream_response.status_code}")
                    return False
            else:
                print(f"⚠️  Message endpoint returned {msg_response.status_code}")
                return False
                
        elif response.status_code == 401:
            print("⚠️  Conversations endpoint requires authentication")
            return True  # Endpoint exists, just needs auth
        else:
            print(f"❌ Cannot create conversations: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False

def main():
    """Run basic backend tests"""
    print("🚀 Basic Backend Connectivity Test")
    print("=" * 50)
    
    # Test 1: Basic connectivity
    if not test_backend_health():
        print("\n❌ Backend is not responding. Please check:")
        print("   1. Is the backend server running?")
        print("   2. Is it running on port 8000?")
        print("   3. Run: uvicorn main:app --reload")
        sys.exit(1)
    
    # Test 2: API endpoints
    if not test_api_endpoints():
        print("\n❌ API endpoints are not working properly")
        sys.exit(1)
    
    print("\n✅ Basic backend tests PASSED!")
    print("   Ready for comprehensive streaming test")
    print("\nNext: Run 'python test_backend_streaming.py'")

if __name__ == "__main__":
    main()
