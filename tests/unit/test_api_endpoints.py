#!/usr/bin/env python3
"""
API Endpoints Unit Tests
Tests individual API endpoints for correct responses and error handling.
"""
import pytest
import requests
from typing import Dict, Any, Optional


class APIEndpointTester:
    """Unit tester for API endpoints"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip("/")
        self.api_prefix = "/api/v1"
        self.session = requests.Session()
        self.access_token: Optional[str] = None
    
    def login(self) -> bool:
        """Get access token for authenticated requests"""
        try:
            response = self.session.post(
                f"{self.base_url}{self.api_prefix}/login/access-token",
                data={
                    "username": "test@example.com",
                    "password": "testpassword123"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.access_token}"})
                return True
            return False
            
        except Exception:
            return False
    
    def test_health_endpoint(self) -> Dict[str, Any]:
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return {
                "endpoint": "/health",
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response_time": response.elapsed.total_seconds()
            }
        except Exception as e:
            return {
                "endpoint": "/health",
                "success": False,
                "error": str(e)
            }
    
    def test_login_endpoint(self) -> Dict[str, Any]:
        """Test login endpoint"""
        try:
            response = requests.post(
                f"{self.base_url}{self.api_prefix}/login/access-token",
                data={
                    "username": "test@example.com",
                    "password": "testpassword123"
                },
                timeout=10
            )
            
            success = response.status_code == 200
            data = response.json() if success else None
            has_token = data and "access_token" in data if success else False
            
            return {
                "endpoint": "/login/access-token",
                "status_code": response.status_code,
                "success": success,
                "has_access_token": has_token,
                "response_time": response.elapsed.total_seconds()
            }
        except Exception as e:
            return {
                "endpoint": "/login/access-token",
                "success": False,
                "error": str(e)
            }
    
    def test_conversations_list(self) -> Dict[str, Any]:
        """Test conversations list endpoint"""
        if not self.access_token:
            return {"endpoint": "/conversations/", "success": False, "error": "No access token"}
        
        try:
            response = self.session.get(
                f"{self.base_url}{self.api_prefix}/conversations/",
                timeout=10
            )
            
            success = response.status_code == 200
            data = response.json() if success else None
            is_list = isinstance(data, list) if success else False
            
            return {
                "endpoint": "/conversations/",
                "status_code": response.status_code,
                "success": success,
                "is_list": is_list,
                "count": len(data) if is_list else 0,
                "response_time": response.elapsed.total_seconds()
            }
        except Exception as e:
            return {
                "endpoint": "/conversations/",
                "success": False,
                "error": str(e)
            }
    
    def test_conversation_creation(self) -> Dict[str, Any]:
        """Test conversation creation endpoint"""
        if not self.access_token:
            return {"endpoint": "POST /conversations/", "success": False, "error": "No access token"}
        
        try:
            response = self.session.post(
                f"{self.base_url}{self.api_prefix}/conversations/",
                json={"title": "Test Conversation"},
                timeout=10
            )
            
            success = response.status_code == 201
            data = response.json() if success else None
            has_id = data and "id" in data if success else False
            
            return {
                "endpoint": "POST /conversations/",
                "status_code": response.status_code,
                "success": success,
                "has_id": has_id,
                "conversation_id": data.get("id") if has_id else None,
                "response_time": response.elapsed.total_seconds()
            }
        except Exception as e:
            return {
                "endpoint": "POST /conversations/",
                "success": False,
                "error": str(e)
            }
    
    def test_message_sending(self, conversation_id: str) -> Dict[str, Any]:
        """Test message sending endpoint"""
        if not self.access_token:
            return {"endpoint": "POST /messages", "success": False, "error": "No access token"}
        
        try:
            response = self.session.post(
                f"{self.base_url}{self.api_prefix}/conversations/{conversation_id}/messages",
                json={"content": "Hello, this is a test message"},
                timeout=15
            )
            
            success = response.status_code == 201
            data = response.json() if success else None
            has_content = data and "content" in data if success else False
            
            return {
                "endpoint": "POST /messages",
                "status_code": response.status_code,
                "success": success,
                "has_content": has_content,
                "response_length": len(data.get("content", "")) if has_content else 0,
                "response_time": response.elapsed.total_seconds()
            }
        except Exception as e:
            return {
                "endpoint": "POST /messages",
                "success": False,
                "error": str(e)
            }
    
    def test_memory_search(self) -> Dict[str, Any]:
        """Test memory search endpoint"""
        if not self.access_token:
            return {"endpoint": "/memories/search", "success": False, "error": "No access token"}
        
        try:
            response = self.session.get(
                f"{self.base_url}{self.api_prefix}/memories/search",
                params={"q": "test", "min_relevance": 0.1},
                timeout=10
            )
            
            success = response.status_code == 200
            data = response.json() if success else None
            has_results = data and "results" in data if success else False
            
            return {
                "endpoint": "/memories/search",
                "status_code": response.status_code,
                "success": success,
                "has_results": has_results,
                "result_count": len(data.get("results", [])) if has_results else 0,
                "response_time": response.elapsed.total_seconds()
            }
        except Exception as e:
            return {
                "endpoint": "/memories/search",
                "success": False,
                "error": str(e)
            }
    
    def test_error_handling(self) -> Dict[str, Any]:
        """Test error handling with invalid requests"""
        tests = []
        
        # Test invalid conversation ID
        try:
            response = self.session.get(
                f"{self.base_url}{self.api_prefix}/conversations/invalid-id",
                timeout=5
            )
            tests.append({
                "test": "invalid_conversation_id",
                "status_code": response.status_code,
                "handles_error": response.status_code in [404, 400, 422]
            })
        except Exception:
            tests.append({
                "test": "invalid_conversation_id",
                "handles_error": False,
                "error": "Request failed"
            })
        
        # Test unauthorized request
        try:
            session_no_auth = requests.Session()
            response = session_no_auth.get(
                f"{self.base_url}{self.api_prefix}/conversations/",
                timeout=5
            )
            tests.append({
                "test": "unauthorized_request",
                "status_code": response.status_code,
                "handles_error": response.status_code == 401
            })
        except Exception:
            tests.append({
                "test": "unauthorized_request",
                "handles_error": False,
                "error": "Request failed"
            })
        
        # Test malformed JSON
        try:
            response = self.session.post(
                f"{self.base_url}{self.api_prefix}/conversations/",
                data="invalid json",
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            tests.append({
                "test": "malformed_json",
                "status_code": response.status_code,
                "handles_error": response.status_code in [400, 422]
            })
        except Exception:
            tests.append({
                "test": "malformed_json",
                "handles_error": False,
                "error": "Request failed"
            })
        
        success = all(test.get("handles_error", False) for test in tests)
        
        return {
            "endpoint": "error_handling",
            "success": success,
            "tests": tests
        }
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API endpoint tests"""
        print("🔧 Running API Endpoint Unit Tests")
        print("=" * 40)
        
        results = []
        
        # Test health endpoint (no auth required)
        health_result = self.test_health_endpoint()
        results.append(health_result)
        print(f"{'✅' if health_result['success'] else '❌'} Health endpoint")
        
        # Test login
        login_result = self.test_login_endpoint()
        results.append(login_result)
        print(f"{'✅' if login_result['success'] else '❌'} Login endpoint")
        
        # Login for authenticated tests
        if not self.login():
            print("❌ Failed to authenticate - skipping authenticated tests")
            return {
                "total_tests": len(results),
                "passed_tests": sum(1 for r in results if r["success"]),
                "results": results
            }
        
        # Test authenticated endpoints
        conv_list_result = self.test_conversations_list()
        results.append(conv_list_result)
        print(f"{'✅' if conv_list_result['success'] else '❌'} Conversations list")
        
        conv_create_result = self.test_conversation_creation()
        results.append(conv_create_result)
        print(f"{'✅' if conv_create_result['success'] else '❌'} Conversation creation")
        
        # Test message sending if conversation was created
        if conv_create_result["success"] and conv_create_result.get("conversation_id"):
            message_result = self.test_message_sending(conv_create_result["conversation_id"])
            results.append(message_result)
            print(f"{'✅' if message_result['success'] else '❌'} Message sending")
        
        memory_result = self.test_memory_search()
        results.append(memory_result)
        print(f"{'✅' if memory_result['success'] else '❌'} Memory search")
        
        error_result = self.test_error_handling()
        results.append(error_result)
        print(f"{'✅' if error_result['success'] else '❌'} Error handling")
        
        # Summary
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r["success"])
        
        print(f"\nAPI Tests: {passed_tests}/{total_tests} passed")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
            "results": results
        }


def main():
    """Main test function"""
    tester = APIEndpointTester()
    results = tester.run_all_tests()
    
    success_rate = results["success_rate"]
    if success_rate < 0.8:
        print(f"API tests failed with {success_rate:.1%} success rate")
        exit(1)
    
    print(f"All API tests completed successfully ({success_rate:.1%})")


if __name__ == "__main__":
    main()
