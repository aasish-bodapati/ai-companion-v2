#!/usr/bin/env python3
"""
Conversation Flow Integration Tests
Tests end-to-end conversation functionality including context and continuity.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

# Add backend to path for imports
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

BASE_URL = os.environ.get("CHAT_API_BASE", "http://localhost:8000")
API_PREFIX = "/api/v1"


class ConversationFlowTester:
    """Integration tester for conversation flows"""
    
    def __init__(self):
        self.base_url = BASE_URL.rstrip("/")
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.conversation_id: Optional[str] = None
        self.conversation_history: List[Dict[str, str]] = []
        self.test_results: List[Dict[str, Any]] = []
    
    def login(self) -> bool:
        """Authenticate and get access token"""
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/login/access-token",
                data={
                    "username": "test@example.com",
                    "password": "testpassword123"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.access_token}"})
                return True
            return False
            
        except Exception:
            return False
    
    def create_conversation(self, title: str = "Flow Test") -> bool:
        """Create a new conversation"""
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/conversations/",
                json={"title": title},
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                self.conversation_id = data.get("id")
                self.conversation_history = []
                return True
            return False
            
        except Exception:
            return False
    
    def send_message(self, content: str, include_history: bool = True) -> Optional[str]:
        """Send message and get response"""
        try:
            payload = {"content": content}
            if include_history:
                payload["conversation_history"] = self.conversation_history
            
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/conversations/{self.conversation_id}/messages",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                reply = data.get("content", "")
                
                # Update conversation history
                self.conversation_history.extend([
                    {"role": "user", "content": content},
                    {"role": "assistant", "content": reply}
                ])
                
                return reply
            return None
            
        except Exception:
            return None
    
    def test_basic_conversation(self) -> Dict[str, Any]:
        """Test basic conversation functionality"""
        print("Testing basic conversation...")
        
        if not self.create_conversation("Basic Test"):
            return {
                "test": "basic_conversation",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        test_message = "Hello, can you help me with productivity tips?"
        response = self.send_message(test_message)
        
        success = response is not None and len(response) > 10
        
        result = {
            "test": "basic_conversation",
            "success": success,
            "message": test_message,
            "response": response,
            "details": "Basic conversation successful" if success else "No valid response"
        }
        
        self.test_results.append(result)
        return result
    
    def test_context_continuity(self) -> Dict[str, Any]:
        """Test context continuity across turns"""
        print("Testing context continuity...")
        
        if not self.create_conversation("Context Test"):
            return {
                "test": "context_continuity",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        # First message - establish context
        msg1 = "I'm working on a project about sustainable energy"
        resp1 = self.send_message(msg1)
        
        # Second message - reference context
        msg2 = "What are the main challenges in this field?"
        resp2 = self.send_message(msg2)
        
        # Check if second response references the context
        context_aware = (
            resp2 is not None and 
            ("energy" in resp2.lower() or "sustainable" in resp2.lower() or "project" in resp2.lower())
        )
        
        result = {
            "test": "context_continuity",
            "success": context_aware,
            "messages": [msg1, msg2],
            "responses": [resp1, resp2],
            "details": "Context continuity maintained" if context_aware else "Context not maintained"
        }
        
        self.test_results.append(result)
        return result
    
    def test_multi_turn_coherence(self) -> Dict[str, Any]:
        """Test coherence across multiple turns"""
        print("Testing multi-turn coherence...")
        
        if not self.create_conversation("Coherence Test"):
            return {
                "test": "multi_turn_coherence",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        conversation_flow = [
            "I want to improve my time management",
            "What's the first step I should take?",
            "How do I handle interruptions?",
            "Can you create a daily schedule template for me?"
        ]
        
        responses = []
        for message in conversation_flow:
            response = self.send_message(message)
            responses.append(response)
            if not response:
                break
        
        # Check coherence
        all_responses_valid = all(r and len(r) > 10 for r in responses)
        topic_consistency = all(
            "time" in r.lower() or "schedule" in r.lower() or "manage" in r.lower()
            for r in responses if r
        )
        
        success = all_responses_valid and topic_consistency
        
        result = {
            "test": "multi_turn_coherence",
            "success": success,
            "conversation": list(zip(conversation_flow, responses)),
            "details": "Multi-turn coherence maintained" if success else "Coherence issues detected"
        }
        
        self.test_results.append(result)
        return result
    
    def test_conversation_history_usage(self) -> Dict[str, Any]:
        """Test usage of conversation history"""
        print("Testing conversation history usage...")
        
        if not self.create_conversation("History Test"):
            return {
                "test": "conversation_history_usage",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        # Build up some history
        setup_messages = [
            "My name is Alex and I work in marketing",
            "I'm particularly interested in digital marketing strategies",
            "I have 5 years of experience in this field"
        ]
        
        for msg in setup_messages:
            self.send_message(msg)
        
        # Test if assistant can reference history
        test_message = "Based on what I've told you, what should I focus on next?"
        response = self.send_message(test_message)
        
        # Check if response references the history
        history_aware = (
            response is not None and (
                "alex" in response.lower() or
                "marketing" in response.lower() or
                "experience" in response.lower() or
                "digital" in response.lower()
            )
        )
        
        result = {
            "test": "conversation_history_usage",
            "success": history_aware,
            "setup_messages": setup_messages,
            "test_message": test_message,
            "response": response,
            "details": "History referenced correctly" if history_aware else "History not utilized"
        }
        
        self.test_results.append(result)
        return result
    
    def test_error_handling(self) -> Dict[str, Any]:
        """Test error handling in conversations"""
        print("Testing error handling...")
        
        if not self.create_conversation("Error Test"):
            return {
                "test": "error_handling",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        # Test with empty message
        empty_response = self.send_message("")
        
        # Test with very long message
        long_message = "A" * 5000
        long_response = self.send_message(long_message)
        
        # Test with special characters
        special_message = "Test with special chars: @#$%^&*()[]{}|\\:;\"'<>?,./"
        special_response = self.send_message(special_message)
        
        # All should handle gracefully (return some response, not crash)
        handles_empty = empty_response is not None
        handles_long = long_response is not None
        handles_special = special_response is not None
        
        success = handles_empty and handles_long and handles_special
        
        result = {
            "test": "error_handling",
            "success": success,
            "empty_handled": handles_empty,
            "long_handled": handles_long,
            "special_handled": handles_special,
            "details": "Error handling robust" if success else "Error handling issues"
        }
        
        self.test_results.append(result)
        return result
    
    def test_conversation_metadata(self) -> Dict[str, Any]:
        """Test conversation metadata handling"""
        print("Testing conversation metadata...")
        
        # Test conversation creation with title
        title = "Metadata Test Conversation"
        if not self.create_conversation(title):
            return {
                "test": "conversation_metadata",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        # Get conversation details
        try:
            response = self.session.get(
                f"{self.base_url}{API_PREFIX}/conversations/{self.conversation_id}",
                timeout=30
            )
            
            if response.status_code == 200:
                conv_data = response.json()
                has_title = conv_data.get("title") == title
                has_id = conv_data.get("id") == self.conversation_id
                has_timestamp = "created_at" in conv_data or "timestamp" in conv_data
                
                success = has_title and has_id
                
                result = {
                    "test": "conversation_metadata",
                    "success": success,
                    "conversation_data": conv_data,
                    "details": "Metadata handled correctly" if success else "Metadata issues"
                }
            else:
                result = {
                    "test": "conversation_metadata",
                    "success": False,
                    "details": f"Failed to retrieve conversation: {response.status_code}"
                }
        
        except Exception as e:
            result = {
                "test": "conversation_metadata",
                "success": False,
                "details": f"Exception: {e}"
            }
        
        self.test_results.append(result)
        return result
    
    def run_full_test_suite(self) -> Dict[str, Any]:
        """Run complete conversation flow test suite"""
        print("💬 Starting Conversation Flow Integration Tests")
        print("=" * 60)
        
        # Setup
        if not self.login():
            return {"error": "Authentication failed"}
        
        # Run tests
        tests = [
            self.test_basic_conversation,
            self.test_context_continuity,
            self.test_multi_turn_coherence,
            self.test_conversation_history_usage,
            self.test_error_handling,
            self.test_conversation_metadata
        ]
        
        for test_func in tests:
            try:
                result = test_func()
                status = "✅ PASS" if result["success"] else "❌ FAIL"
                print(f"{status} {result['test']}: {result['details']}")
                time.sleep(0.5)  # Brief pause between tests
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
        
        print("\n" + "=" * 60)
        print(f"Conversation Flow Test Results: {passed_tests}/{total_tests} passed")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
            "results": self.test_results
        }


def main():
    """Main test function"""
    tester = ConversationFlowTester()
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
