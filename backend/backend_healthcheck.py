#!/usr/bin/env python3
"""
Backend Health Check Script

This script verifies the health of the backend API endpoints by testing:
- Authentication
- Conversation management (create, list)
- Message management (create, list)
- Chat functionality with Together AI

Environment Variables:
- BASE_URL: Base URL of the backend API (default: http://localhost:8000)
- TOKEN: Authentication token (if not provided, will attempt to login with test credentials)
- TEST_USERNAME: Username for test account (default: test@example.com)
- TEST_PASSWORD: Password for test account (default: test)

Exit Codes:
- 0: All tests passed
- 1: One or more tests failed
"""

import os
import sys
import json
import requests
from typing import Dict, Any, Optional, Tuple
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class BackendHealthCheck:
    def __init__(self):
        self.base_url = os.getenv("BASE_URL", "http://localhost:8000").rstrip('/')
        self.token = os.getenv("TOKEN")
        self.test_username = os.getenv("TEST_USERNAME", "test@example.com")
        self.test_password = os.getenv("TEST_PASSWORD", "test")
        self.headers = {
            "Content-Type": "application/json",
            "accept": "application/json"
        }
        self.failed_tests = 0
        self.conversation_id = None
        self.message_id = None

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                     auth_required: bool = True) -> Tuple[bool, Dict]:
        """Helper method to make HTTP requests with error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=10)
            else:
                return False, {"error": f"Unsupported HTTP method: {method}"}
            
            response.raise_for_status()
            return True, response.json()
            
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_details = e.response.json()
                    error_msg = f"{e}: {error_details}"
                except:
                    error_msg = f"{e}: {e.response.text if e.response.text else 'No details'}"
            return False, {"error": error_msg}

    def _print_result(self, test_name: str, success: bool, details: str = ""):
        """Print test result with appropriate emoji"""
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if not success and details:
            print(f"   Error: {details}")
        if not success:
            self.failed_tests += 1

    def test_authentication(self) -> bool:
        """Test authentication and get token if not provided"""
        if self.token:
            self._print_result("Authentication (token provided)", True)
            return True
            
        # Get test credentials from environment variables
        test_username = os.getenv("TEST_USERNAME")
        test_password = os.getenv("TEST_PASSWORD")
        
        if not test_username or not test_password:
            self._print_result("Authentication", False, 
                             "TEST_USERNAME and TEST_PASSWORD environment variables must be set")
            return False
            
        try:
            form_data = {
                'username': test_username,
                'password': test_password,
                'grant_type': 'password',
                'scope': '',
                'client_id': '',
                'client_secret': ''
            }
            
            response = requests.post(
                f"{self.base_url}/api/v1/login/access-token",
                data=form_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10
            )
            
            # Print response details for debugging
            print(f"Login status: {response.status_code}")
            print(f"Response: {response.text}")
            
            response.raise_for_status()
            
            token_data = response.json()
            self.token = token_data.get("access_token")
            if self.token:
                self.headers["Authorization"] = f"Bearer {self.token}"
                self._print_result("Authentication", True)
                return True
            else:
                self._print_result("Authentication", False, "No access token in response")
                return False
                
        except Exception as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_details = e.response.json()
                    error_msg = f"{e}: {error_details}"
                except:
                    error_msg = f"{e}: {e.response.text if e.response.text else 'No details'}"
            self._print_result("Authentication", False, error_msg)
            return False

    def test_create_conversation(self) -> bool:
        """Test creating a new conversation"""
        success, result = self._make_request(
            "POST",
            "/api/v1/conversations",
            {"title": "Test Conversation"}
        )
        
        if success and "id" in result:
            self.conversation_id = result["id"]
            self._print_result("Create Conversation", True)
            return True
        else:
            self._print_result("Create Conversation", False, result.get("error", "Unknown error"))
            return False

    def test_list_conversations(self) -> bool:
        """Test listing conversations"""
        success, result = self._make_request("GET", "/api/v1/conversations")
        
        if success and isinstance(result, list):
            self._print_result("List Conversations", True)
            return True
        else:
            self._print_result("List Conversations", False, result.get("error", "Invalid response format"))
            return False

    def test_send_message(self) -> bool:
        """Test sending a message to a conversation"""
        if not self.conversation_id:
            self._print_result("Send Message", False, "No conversation ID available")
            return False
            
        success, result = self._make_request(
            "POST",
            f"/api/v1/conversations/{self.conversation_id}/messages",
            {"content": "Hello, this is a test message"}
        )
        
        if success and "id" in result:
            self.message_id = result["id"]
            self._print_result("Send Message", True)
            return True
        else:
            self._print_result("Send Message", False, result.get("error", "Unknown error"))
            return False

    def test_list_messages(self) -> bool:
        """Test listing messages in a conversation"""
        if not self.conversation_id:
            self._print_result("List Messages", False, "No conversation ID available")
            return False
            
        success, result = self._make_request(
            "GET",
            f"/api/v1/conversations/{self.conversation_id}/messages"
        )
        
        if success and isinstance(result, list):
            self._print_result("List Messages", True)
            return True
        else:
            self._print_result("List Messages", False, result.get("error", "Invalid response format"))
            return False

    def test_chat_endpoint(self) -> bool:
        """Test the chat endpoint with Together AI"""
        success, result = self._make_request(
            "POST",
            "/api/chat",
            {
                "messages": [
                    {"role": "user", "content": "Hello, this is a health check message"}
                ],
                "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                "stream": False
            }
        )
        
        if success and "response" in result and "content" in result["response"]:
            self._print_result("Chat Endpoint", True)
            return True
        else:
            self._print_result("Chat Endpoint", False, result.get("error", "Invalid response format"))
            return False

def main():
    print("🚀 Starting Backend Health Check\n")
    
    checker = BackendHealthCheck()
    
    # Run tests in order
    if not checker.test_authentication():
        print("\n❌ Authentication failed. Cannot proceed with other tests.")
        sys.exit(1)
    
    # Run conversation tests
    checker.test_create_conversation()
    checker.test_list_conversations()
    
    # Run message tests if we have a conversation
    if checker.conversation_id:
        checker.test_send_message()
        checker.test_list_messages()
    
    # Test chat endpoint
    checker.test_chat_endpoint()
    
    # Print summary
    print(f"\n{'='*50}")
    if checker.failed_tests == 0:
        print("✅ All tests passed!")
        sys.exit(0)
    else:
        print(f"❌ {checker.failed_tests} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
