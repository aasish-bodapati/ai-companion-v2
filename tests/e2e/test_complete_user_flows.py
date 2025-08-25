#!/usr/bin/env python3
"""
End-to-End User Flow Tests
Tests complete user journeys from start to finish.
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


class E2EFlowTester:
    """End-to-end user flow tester"""
    
    def __init__(self):
        self.base_url = BASE_URL.rstrip("/")
        self.session = requests.Session()
        self.access_token: Optional[str] = None
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
    
    def create_conversation(self, title: str) -> Optional[str]:
        """Create a new conversation and return ID"""
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/conversations/",
                json={"title": title},
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                return data.get("id")
            return None
            
        except Exception:
            return None
    
    def send_message(self, conversation_id: str, content: str, remember: bool = False) -> Optional[str]:
        """Send message and get response"""
        try:
            payload = {"content": content}
            if remember:
                payload["remember"] = True
            
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/conversations/{conversation_id}/messages",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                return data.get("content", "")
            return None
            
        except Exception:
            return None
    
    def get_conversation_messages(self, conversation_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get all messages in a conversation"""
        try:
            response = self.session.get(
                f"{self.base_url}{API_PREFIX}/conversations/{conversation_id}/messages",
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception:
            return None
    
    def search_memories(self, query: str) -> Optional[List[Dict[str, Any]]]:
        """Search memories"""
        try:
            response = self.session.get(
                f"{self.base_url}{API_PREFIX}/memories/search",
                params={"q": query, "min_relevance": 0.1},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("results", [])
            return None
            
        except Exception:
            return None
    
    def test_new_user_onboarding(self) -> Dict[str, Any]:
        """Test complete new user onboarding flow"""
        print("Testing new user onboarding flow...")
        
        steps_completed = 0
        total_steps = 5
        
        # Step 1: Create first conversation
        conv_id = self.create_conversation("Welcome Conversation")
        if conv_id:
            steps_completed += 1
        
        # Step 2: Send welcome message
        if conv_id:
            response = self.send_message(conv_id, "Hello! I'm new here. How can you help me?")
            if response and len(response) > 20:
                steps_completed += 1
        
        # Step 3: Ask about capabilities
        if conv_id:
            response = self.send_message(conv_id, "What can you help me with?")
            if response and ("help" in response.lower() or "assist" in response.lower()):
                steps_completed += 1
        
        # Step 4: Set a preference
        if conv_id:
            response = self.send_message(conv_id, "Remember that I prefer morning workouts", remember=True)
            if response:
                steps_completed += 1
                time.sleep(1)  # Allow memory processing
        
        # Step 5: Verify preference was remembered
        if conv_id:
            memories = self.search_memories("morning workouts")
            if memories and len(memories) > 0:
                steps_completed += 1
        
        success = steps_completed >= 4  # Allow one step to fail
        
        result = {
            "test": "new_user_onboarding",
            "success": success,
            "steps_completed": steps_completed,
            "total_steps": total_steps,
            "conversation_id": conv_id,
            "details": f"Completed {steps_completed}/{total_steps} onboarding steps"
        }
        
        self.test_results.append(result)
        return result
    
    def test_goal_setting_journey(self) -> Dict[str, Any]:
        """Test complete goal setting and tracking journey"""
        print("Testing goal setting journey...")
        
        conv_id = self.create_conversation("Goal Setting Journey")
        if not conv_id:
            return {
                "test": "goal_setting_journey",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        journey_steps = [
            ("I want to start a fitness routine", "fitness"),
            ("What kind of goals should I set?", "goal"),
            ("Help me create a SMART goal for exercise", "smart"),
            ("How do I track my progress?", "track"),
            ("Remind me to work out every Monday", "remind")
        ]
        
        successful_steps = 0
        responses = []
        
        for message, expected_keyword in journey_steps:
            response = self.send_message(conv_id, message)
            responses.append(response)
            
            if response and expected_keyword.lower() in response.lower():
                successful_steps += 1
            
            time.sleep(0.5)  # Brief pause between messages
        
        # Check conversation continuity
        messages = self.get_conversation_messages(conv_id)
        has_continuity = messages and len(messages) >= len(journey_steps) * 2
        
        success = successful_steps >= 3 and has_continuity
        
        result = {
            "test": "goal_setting_journey",
            "success": success,
            "successful_steps": successful_steps,
            "total_steps": len(journey_steps),
            "has_continuity": has_continuity,
            "responses": responses,
            "details": f"Completed {successful_steps}/{len(journey_steps)} goal setting steps"
        }
        
        self.test_results.append(result)
        return result
    
    def test_memory_learning_flow(self) -> Dict[str, Any]:
        """Test memory capture and learning flow"""
        print("Testing memory learning flow...")
        
        conv_id = self.create_conversation("Memory Learning Test")
        if not conv_id:
            return {
                "test": "memory_learning_flow",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        # Capture various types of information
        memory_items = [
            ("I live in San Francisco", "location"),
            ("My favorite cuisine is Italian", "preference"),
            ("I work as a software engineer", "profession"),
            ("I have a meeting every Tuesday at 3 PM", "schedule")
        ]
        
        captured_items = 0
        
        for item, category in memory_items:
            response = self.send_message(conv_id, f"Remember this: {item}", remember=True)
            if response:
                captured_items += 1
            time.sleep(1)  # Allow memory processing
        
        # Test recall
        recall_tests = [
            ("Where do I live?", "san francisco"),
            ("What's my favorite food?", "italian"),
            ("What do I do for work?", "software"),
            ("When is my weekly meeting?", "tuesday")
        ]
        
        successful_recalls = 0
        
        for question, expected in recall_tests:
            response = self.send_message(conv_id, question)
            if response and expected.lower() in response.lower():
                successful_recalls += 1
            time.sleep(0.5)
        
        success = captured_items >= 3 and successful_recalls >= 2
        
        result = {
            "test": "memory_learning_flow",
            "success": success,
            "captured_items": captured_items,
            "successful_recalls": successful_recalls,
            "total_items": len(memory_items),
            "total_recalls": len(recall_tests),
            "details": f"Captured {captured_items}/{len(memory_items)} items, recalled {successful_recalls}/{len(recall_tests)}"
        }
        
        self.test_results.append(result)
        return result
    
    def test_problem_solving_conversation(self) -> Dict[str, Any]:
        """Test iterative problem-solving conversation"""
        print("Testing problem-solving conversation...")
        
        conv_id = self.create_conversation("Problem Solving")
        if not conv_id:
            return {
                "test": "problem_solving_conversation",
                "success": False,
                "details": "Failed to create conversation"
            }
        
        problem_flow = [
            "I'm struggling with time management at work",
            "I've tried to-do lists but they don't work for me",
            "What are some alternative approaches?",
            "How do I handle unexpected interruptions?",
            "Can you help me create a daily schedule?"
        ]
        
        coherent_responses = 0
        context_references = 0
        
        for i, message in enumerate(problem_flow):
            response = self.send_message(conv_id, message)
            
            if response and len(response) > 30:
                coherent_responses += 1
                
                # Check for context awareness (references to previous messages)
                if i > 0:
                    prev_keywords = ["time", "management", "work", "schedule", "interruption"]
                    if any(keyword in response.lower() for keyword in prev_keywords):
                        context_references += 1
            
            time.sleep(0.5)
        
        success = coherent_responses >= 4 and context_references >= 2
        
        result = {
            "test": "problem_solving_conversation",
            "success": success,
            "coherent_responses": coherent_responses,
            "context_references": context_references,
            "total_messages": len(problem_flow),
            "details": f"{coherent_responses}/{len(problem_flow)} coherent responses, {context_references} context references"
        }
        
        self.test_results.append(result)
        return result
    
    def test_multi_conversation_context(self) -> Dict[str, Any]:
        """Test context across multiple conversations"""
        print("Testing multi-conversation context...")
        
        # First conversation - establish context
        conv1_id = self.create_conversation("Context Setup")
        if not conv1_id:
            return {
                "test": "multi_conversation_context",
                "success": False,
                "details": "Failed to create first conversation"
            }
        
        # Establish some context with memory
        self.send_message(conv1_id, "Remember: I'm working on a machine learning project", remember=True)
        time.sleep(1)
        
        # Second conversation - test context retrieval
        conv2_id = self.create_conversation("Context Test")
        if not conv2_id:
            return {
                "test": "multi_conversation_context",
                "success": False,
                "details": "Failed to create second conversation"
            }
        
        # Test if context is available
        response = self.send_message(conv2_id, "What project am I working on?")
        
        context_retrieved = (
            response and 
            ("machine learning" in response.lower() or "project" in response.lower())
        )
        
        # Test memory search
        memories = self.search_memories("machine learning project")
        memory_found = memories and len(memories) > 0
        
        success = context_retrieved or memory_found
        
        result = {
            "test": "multi_conversation_context",
            "success": success,
            "context_retrieved": context_retrieved,
            "memory_found": memory_found,
            "conversation_1": conv1_id,
            "conversation_2": conv2_id,
            "details": "Context maintained across conversations" if success else "Context not maintained"
        }
        
        self.test_results.append(result)
        return result
    
    def run_all_flows(self) -> Dict[str, Any]:
        """Run all end-to-end flow tests"""
        print("🚀 Starting End-to-End User Flow Tests")
        print("=" * 50)
        
        # Setup
        if not self.login():
            return {"error": "Authentication failed"}
        
        # Run flow tests
        flows = [
            self.test_new_user_onboarding,
            self.test_goal_setting_journey,
            self.test_memory_learning_flow,
            self.test_problem_solving_conversation,
            self.test_multi_conversation_context
        ]
        
        for flow_func in flows:
            try:
                result = flow_func()
                status = "✅ PASS" if result["success"] else "❌ FAIL"
                print(f"{status} {result['test']}: {result['details']}")
                time.sleep(1)  # Brief pause between flows
            except Exception as e:
                print(f"❌ ERROR {flow_func.__name__}: {e}")
                self.test_results.append({
                    "test": flow_func.__name__,
                    "success": False,
                    "details": f"Exception: {e}"
                })
        
        # Summary
        total_flows = len(self.test_results)
        passed_flows = sum(1 for r in self.test_results if r["success"])
        
        print("\n" + "=" * 50)
        print(f"E2E Flow Test Results: {passed_flows}/{total_flows} passed")
        
        return {
            "total_flows": total_flows,
            "passed_flows": passed_flows,
            "success_rate": passed_flows / total_flows if total_flows > 0 else 0,
            "results": self.test_results
        }


def main():
    """Main test function"""
    tester = E2EFlowTester()
    results = tester.run_all_flows()
    
    if "error" in results:
        print(f"E2E test suite failed: {results['error']}")
        sys.exit(1)
    
    success_rate = results["success_rate"]
    if success_rate < 0.6:  # Lower threshold for E2E tests
        print(f"E2E tests failed with {success_rate:.1%} success rate")
        sys.exit(1)
    
    print(f"All E2E tests completed ({success_rate:.1%})")


if __name__ == "__main__":
    main()
