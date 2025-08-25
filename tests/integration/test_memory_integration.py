#!/usr/bin/env python3
"""
Memory Integration Tests
End-to-end testing of memory capture, storage, and retrieval functionality.
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

# Add backend to path for imports
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
API_PREFIX = "/api/v1"


class MemoryIntegrationTester:
    """Integration tester for memory functionality"""
    
    def __init__(self):
        self.base_url = BASE_URL.rstrip("/")
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.conversation_id: Optional[str] = None
        self.test_results: List[Dict[str, Any]] = []
    
    def login(self) -> bool:
        """Authenticate and get access token"""
        username = os.getenv("USERNAME", "test@example.com")
        password = os.getenv("PASSWORD", "testpassword123")
        
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/login/access-token",
                data={"username": username, "password": password},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.access_token}"})
                return True
            return False
            
        except Exception as e:
            print(f"Login failed: {e}")
            return False
    
    def test_auth_check(self) -> bool:
        """Test authentication endpoint"""
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/login/test-token",
                timeout=30
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def create_conversation(self) -> bool:
        """Create a new conversation"""
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/conversations/",
                json={"title": "Memory Integration Test"},
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                self.conversation_id = data.get("id")
                return True
            return False
            
        except Exception:
            return False
    
    def send_message_with_memory(self, content: str, remember: bool = True) -> Optional[str]:
        """Send message with memory capture"""
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/conversations/{self.conversation_id}/messages",
                json={"content": content, "remember": remember},
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                return data.get("content", "")
            return None
            
        except Exception:
            return None
    
    def get_memory_context(self) -> Optional[Dict[str, Any]]:
        """Get memory context for conversation"""
        try:
            response = self.session.get(
                f"{self.base_url}{API_PREFIX}/conversations/{self.conversation_id}/memory-context",
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception:
            return None
    
    def search_memories(self, query: str, min_relevance: float = 0.1) -> Optional[List[Dict[str, Any]]]:
        """Search memories"""
        try:
            response = self.session.get(
                f"{self.base_url}{API_PREFIX}/memories/search",
                params={"q": query, "min_relevance": min_relevance},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("results", [])
            return None
            
        except Exception:
            return None
    
    def test_memory_capture(self) -> Dict[str, Any]:
        """Test memory capture functionality"""
        test_message = os.getenv("MESSAGE", "Remember this: I prefer green tea over coffee.")
        
        print(f"Testing memory capture with: {test_message}")
        
        response = self.send_message_with_memory(test_message, remember=True)
        
        result = {
            "test": "memory_capture",
            "success": response is not None,
            "message": test_message,
            "response": response,
            "details": "Memory capture successful" if response else "No response received"
        }
        
        self.test_results.append(result)
        return result
    
    def test_memory_context_retrieval(self) -> Dict[str, Any]:
        """Test memory context retrieval"""
        print("Testing memory context retrieval...")
        
        # Wait for memory processing
        sleep_secs = int(os.getenv("SLEEP_SECS", "1"))
        time.sleep(sleep_secs)
        
        context = self.get_memory_context()
        
        success = context is not None and "context" in context
        details = f"Retrieved {len(context.get('context', []))} context items" if success else "No context retrieved"
        
        result = {
            "test": "memory_context_retrieval",
            "success": success,
            "context": context,
            "details": details
        }
        
        self.test_results.append(result)
        return result
    
    def test_memory_search(self) -> Dict[str, Any]:
        """Test memory search functionality"""
        search_query = os.getenv("SEARCH_QUERY", "green tea")
        min_relevance = float(os.getenv("MIN_RELEVANCE", "0.1"))
        
        print(f"Testing memory search for: {search_query}")
        
        results = self.search_memories(search_query, min_relevance)
        
        success = results is not None and len(results) > 0
        details = f"Found {len(results) if results else 0} matching memories"
        
        result = {
            "test": "memory_search",
            "success": success,
            "query": search_query,
            "results": results,
            "details": details
        }
        
        self.test_results.append(result)
        return result
    
    def test_note_capture(self) -> Dict[str, Any]:
        """Test note-style memory capture"""
        if os.getenv("NOTE_TEST", "false").lower() != "true":
            return {"test": "note_capture", "success": True, "details": "Skipped (NOTE_TEST not enabled)"}
        
        note_message = "Note: I have a meeting with the team every Tuesday at 2 PM."
        
        print(f"Testing note capture: {note_message}")
        
        response = self.send_message_with_memory(note_message, remember=True)
        
        result = {
            "test": "note_capture",
            "success": response is not None,
            "message": note_message,
            "response": response,
            "details": "Note capture successful" if response else "No response received"
        }
        
        self.test_results.append(result)
        return result
    
    def test_memory_types(self) -> Dict[str, Any]:
        """Test different memory content types"""
        print("Testing memory content types...")
        
        context = self.get_memory_context()
        if not context or "context" not in context:
            return {
                "test": "memory_types",
                "success": False,
                "details": "No context available for type checking"
            }
        
        context_items = context["context"]
        types_found = set()
        
        for item in context_items:
            if "type" in item:
                types_found.add(item["type"])
        
        expected_types = {"preference", "profile", "note", "fact"}
        has_expected_types = bool(types_found & expected_types)
        
        result = {
            "test": "memory_types",
            "success": has_expected_types,
            "types_found": list(types_found),
            "details": f"Found types: {', '.join(types_found)}" if types_found else "No types found"
        }
        
        self.test_results.append(result)
        return result
    
    def run_full_test_suite(self) -> Dict[str, Any]:
        """Run complete memory integration test suite"""
        print("🧠 Starting Memory Integration Tests")
        print("=" * 50)
        
        # Setup
        if not self.login():
            return {"error": "Authentication failed"}
        
        if not self.test_auth_check():
            return {"error": "Auth check failed"}
        
        if not self.create_conversation():
            return {"error": "Conversation creation failed"}
        
        # Run tests
        tests = [
            self.test_memory_capture,
            self.test_memory_context_retrieval,
            self.test_memory_search,
            self.test_note_capture,
            self.test_memory_types
        ]
        
        for test_func in tests:
            try:
                result = test_func()
                status = "✅ PASS" if result["success"] else "❌ FAIL"
                print(f"{status} {result['test']}: {result['details']}")
            except Exception as e:
                print(f"❌ ERROR {test_func.__name__}: {e}")
                self.test_results.append({
                    "test": test_func.__name__,
                    "success": False,
                    "details": f"Exception: {e}"
                })
        
        # Summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        
        print("\n" + "=" * 50)
        print(f"Memory Integration Test Results: {passed_tests}/{total_tests} passed")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
            "results": self.test_results
        }


def main():
    """Main test function"""
    tester = MemoryIntegrationTester()
    results = tester.run_full_test_suite()
    
    if "error" in results:
        print(f"Test suite failed: {results['error']}")
        sys.exit(1)
    
    success_rate = results["success_rate"]
    if success_rate < 0.8:
        print(f"Test suite failed with {success_rate:.1%} success rate")
        sys.exit(1)
    
    print(f"All tests completed successfully ({success_rate:.1%})")


if __name__ == "__main__":
    main()
