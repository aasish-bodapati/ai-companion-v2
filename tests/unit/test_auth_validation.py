#!/usr/bin/env python3
"""
Authentication and Authorization Unit Tests
Tests authentication mechanisms and access control.
"""
import pytest
import requests
from typing import Dict, Any, Optional


class AuthValidationTester:
    """Unit tester for authentication and authorization"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip("/")
        self.api_prefix = "/api/v1"
    
    def test_valid_login(self) -> Dict[str, Any]:
        """Test valid login credentials"""
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
            token_type = data.get("token_type") if data else None
            
            return {
                "test": "valid_login",
                "success": success and has_token,
                "status_code": response.status_code,
                "has_access_token": has_token,
                "token_type": token_type,
                "token_length": len(data.get("access_token", "")) if has_token else 0
            }
        except Exception as e:
            return {
                "test": "valid_login",
                "success": False,
                "error": str(e)
            }
    
    def test_invalid_credentials(self) -> Dict[str, Any]:
        """Test invalid login credentials"""
        try:
            response = requests.post(
                f"{self.base_url}{self.api_prefix}/login/access-token",
                data={
                    "username": "invalid@example.com",
                    "password": "wrongpassword"
                },
                timeout=10
            )
            
            # Should return 401 or 400 for invalid credentials
            success = response.status_code in [400, 401, 422]
            
            return {
                "test": "invalid_credentials",
                "success": success,
                "status_code": response.status_code,
                "rejects_invalid": success
            }
        except Exception as e:
            return {
                "test": "invalid_credentials",
                "success": False,
                "error": str(e)
            }
    
    def test_missing_credentials(self) -> Dict[str, Any]:
        """Test missing credentials"""
        try:
            response = requests.post(
                f"{self.base_url}{self.api_prefix}/login/access-token",
                data={},
                timeout=10
            )
            
            # Should return 400 or 422 for missing credentials
            success = response.status_code in [400, 422]
            
            return {
                "test": "missing_credentials",
                "success": success,
                "status_code": response.status_code,
                "rejects_missing": success
            }
        except Exception as e:
            return {
                "test": "missing_credentials",
                "success": False,
                "error": str(e)
            }
    
    def test_token_validation(self) -> Dict[str, Any]:
        """Test access token validation"""
        # First get a valid token
        try:
            login_response = requests.post(
                f"{self.base_url}{self.api_prefix}/login/access-token",
                data={
                    "username": "test@example.com",
                    "password": "testpassword123"
                },
                timeout=10
            )
            
            if login_response.status_code != 200:
                return {
                    "test": "token_validation",
                    "success": False,
                    "error": "Could not obtain valid token"
                }
            
            token = login_response.json().get("access_token")
            
            # Test token validation endpoint
            response = requests.post(
                f"{self.base_url}{self.api_prefix}/login/test-token",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            return {
                "test": "token_validation",
                "success": success,
                "status_code": response.status_code,
                "validates_token": success
            }
        except Exception as e:
            return {
                "test": "token_validation",
                "success": False,
                "error": str(e)
            }
    
    def test_invalid_token(self) -> Dict[str, Any]:
        """Test invalid token rejection"""
        try:
            response = requests.post(
                f"{self.base_url}{self.api_prefix}/login/test-token",
                headers={"Authorization": "Bearer invalid_token_here"},
                timeout=10
            )
            
            # Should return 401 for invalid token
            success = response.status_code == 401
            
            return {
                "test": "invalid_token",
                "success": success,
                "status_code": response.status_code,
                "rejects_invalid_token": success
            }
        except Exception as e:
            return {
                "test": "invalid_token",
                "success": False,
                "error": str(e)
            }
    
    def test_protected_endpoint_access(self) -> Dict[str, Any]:
        """Test access to protected endpoints"""
        # Get valid token
        try:
            login_response = requests.post(
                f"{self.base_url}{self.api_prefix}/login/access-token",
                data={
                    "username": "test@example.com",
                    "password": "testpassword123"
                },
                timeout=10
            )
            
            if login_response.status_code != 200:
                return {
                    "test": "protected_endpoint_access",
                    "success": False,
                    "error": "Could not obtain valid token"
                }
            
            token = login_response.json().get("access_token")
            
            # Test protected endpoint with valid token
            response = requests.get(
                f"{self.base_url}{self.api_prefix}/conversations/",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            return {
                "test": "protected_endpoint_access",
                "success": success,
                "status_code": response.status_code,
                "allows_valid_token": success
            }
        except Exception as e:
            return {
                "test": "protected_endpoint_access",
                "success": False,
                "error": str(e)
            }
    
    def test_unauthorized_access(self) -> Dict[str, Any]:
        """Test unauthorized access to protected endpoints"""
        try:
            response = requests.get(
                f"{self.base_url}{self.api_prefix}/conversations/",
                timeout=10
            )
            
            # Should return 401 for unauthorized access
            success = response.status_code == 401
            
            return {
                "test": "unauthorized_access",
                "success": success,
                "status_code": response.status_code,
                "blocks_unauthorized": success
            }
        except Exception as e:
            return {
                "test": "unauthorized_access",
                "success": False,
                "error": str(e)
            }
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all authentication tests"""
        print("🔐 Running Authentication Unit Tests")
        print("=" * 40)
        
        tests = [
            self.test_valid_login,
            self.test_invalid_credentials,
            self.test_missing_credentials,
            self.test_token_validation,
            self.test_invalid_token,
            self.test_protected_endpoint_access,
            self.test_unauthorized_access
        ]
        
        results = []
        
        for test_func in tests:
            try:
                result = test_func()
                results.append(result)
                status = "✅" if result["success"] else "❌"
                print(f"{status} {result['test']}")
            except Exception as e:
                result = {
                    "test": test_func.__name__,
                    "success": False,
                    "error": str(e)
                }
                results.append(result)
                print(f"❌ {test_func.__name__}: {e}")
        
        # Summary
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r["success"])
        
        print(f"\nAuth Tests: {passed_tests}/{total_tests} passed")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
            "results": results
        }


def main():
    """Main test function"""
    tester = AuthValidationTester()
    results = tester.run_all_tests()
    
    success_rate = results["success_rate"]
    if success_rate < 0.8:
        print(f"Auth tests failed with {success_rate:.1%} success rate")
        exit(1)
    
    print(f"All auth tests completed successfully ({success_rate:.1%})")


if __name__ == "__main__":
    main()
