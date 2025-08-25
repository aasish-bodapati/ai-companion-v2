#!/usr/bin/env python3
"""
Multi-turn Chat Flow Simulation
Tests conversation coherence and continuity across multiple turns.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import requests

BASE_URL = os.environ.get("CHAT_API_BASE", "http://localhost:8000")
API_PREFIX = "/api/v1"
REPORTS_DIR = Path(__file__).parent.parent.parent / "reports"


@dataclass
class Turn:
    """Single conversation turn"""
    role: str
    content: str


@dataclass
class FlowMetric:
    """Flow evaluation metric"""
    name: str
    score: int
    max_score: int = 100
    details: str = ""


@dataclass
class FlowScenario:
    """Complete flow scenario"""
    name: str
    description: str
    turns: List[Turn] = field(default_factory=list)
    expected_outcomes: List[str] = field(default_factory=list)
    metrics: List[FlowMetric] = field(default_factory=list)


class FlowSimulator:
    """Multi-turn conversation flow simulator"""
    
    def __init__(self):
        self.base_url = BASE_URL.rstrip("/")
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.conversation_id: Optional[str] = None
        self.conversation_history: List[Dict[str, str]] = []
    
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
    
    def create_conversation(self) -> bool:
        """Create a new conversation"""
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/conversations/",
                json={"title": f"Flow Test {datetime.now().isoformat()}"},
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                self.conversation_id = data.get("id")
                return True
            return False
            
        except Exception:
            return False
    
    def send_message(self, content: str) -> Optional[str]:
        """Send message and get response"""
        try:
            payload = {
                "content": content,
                "conversation_history": self.conversation_history
            }
            
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
    
    def evaluate_coherence(self, turns: List[Turn]) -> FlowMetric:
        """Evaluate conversation coherence"""
        score = 100
        details = []
        
        # Check for context awareness
        user_turns = [t.content for t in turns if t.role == "user"]
        assistant_turns = [t.content for t in turns if t.role == "assistant"]
        
        if len(assistant_turns) < 2:
            return FlowMetric("coherence", score, details="Insufficient turns for coherence evaluation")
        
        # Check for repetitive responses
        unique_responses = len(set(assistant_turns))
        if unique_responses < len(assistant_turns) * 0.8:
            score -= 20
            details.append("Repetitive responses detected")
        
        # Check for context references
        context_refs = 0
        for i, turn in enumerate(assistant_turns[1:], 1):
            prev_context = " ".join(user_turns[:i])
            if any(word in turn.lower() for word in prev_context.lower().split()[-10:]):
                context_refs += 1
        
        if context_refs < len(assistant_turns) * 0.3:
            score -= 15
            details.append("Limited context awareness")
        
        return FlowMetric("coherence", score, details="; ".join(details))
    
    def evaluate_continuity(self, turns: List[Turn]) -> FlowMetric:
        """Evaluate conversation continuity"""
        score = 100
        details = []
        
        assistant_turns = [t.content for t in turns if t.role == "assistant"]
        
        # Check for abrupt topic changes
        topic_consistency = 0
        for i in range(1, len(assistant_turns)):
            prev_words = set(assistant_turns[i-1].lower().split())
            curr_words = set(assistant_turns[i].lower().split())
            overlap = len(prev_words & curr_words)
            if overlap > 2:  # Some word overlap indicates continuity
                topic_consistency += 1
        
        if len(assistant_turns) > 1:
            continuity_ratio = topic_consistency / (len(assistant_turns) - 1)
            if continuity_ratio < 0.3:
                score -= 25
                details.append("Poor topic continuity")
        
        return FlowMetric("continuity", score, details="; ".join(details))
    
    def evaluate_memory_usage(self, turns: List[Turn]) -> FlowMetric:
        """Evaluate memory usage in conversation"""
        score = 100
        details = []
        
        user_turns = [t.content for t in turns if t.role == "user"]
        assistant_turns = [t.content for t in turns if t.role == "assistant"]
        
        # Look for memory references
        memory_indicators = ["remember", "recall", "mentioned", "said earlier", "previously"]
        memory_refs = 0
        
        for turn in assistant_turns:
            if any(indicator in turn.lower() for indicator in memory_indicators):
                memory_refs += 1
        
        # Check if assistant references earlier user statements
        early_user_content = " ".join(user_turns[:2]).lower()
        later_assistant_content = " ".join(assistant_turns[2:]).lower() if len(assistant_turns) > 2 else ""
        
        if early_user_content and later_assistant_content:
            key_words = [word for word in early_user_content.split() if len(word) > 4]
            references = sum(1 for word in key_words if word in later_assistant_content)
            if references == 0:
                score -= 20
                details.append("No reference to earlier context")
        
        return FlowMetric("memory_usage", score, details="; ".join(details))
    
    def run_scenario(self, scenario: FlowScenario) -> FlowScenario:
        """Run a complete flow scenario"""
        self.conversation_history = []
        
        if not self.create_conversation():
            scenario.metrics.append(FlowMetric("setup", 0, details="Failed to create conversation"))
            return scenario
        
        # Execute turns
        actual_turns = []
        for turn in scenario.turns:
            if turn.role == "user":
                response = self.send_message(turn.content)
                actual_turns.append(turn)
                if response:
                    actual_turns.append(Turn("assistant", response))
                else:
                    scenario.metrics.append(FlowMetric("communication", 0, details="No response received"))
                    return scenario
        
        # Evaluate metrics
        scenario.metrics = [
            self.evaluate_coherence(actual_turns),
            self.evaluate_continuity(actual_turns),
            self.evaluate_memory_usage(actual_turns)
        ]
        
        return scenario
    
    def get_test_scenarios(self) -> List[FlowScenario]:
        """Get predefined test scenarios"""
        return [
            FlowScenario(
                name="Goal Setting Flow",
                description="Multi-turn conversation about setting and tracking goals",
                turns=[
                    Turn("user", "I want to start exercising regularly"),
                    Turn("user", "What kind of schedule would work for a beginner?"),
                    Turn("user", "How do I stay motivated when I don't see results?"),
                    Turn("user", "Can you help me track my progress?")
                ],
                expected_outcomes=[
                    "Exercise recommendations",
                    "Beginner-friendly schedule",
                    "Motivation strategies",
                    "Progress tracking suggestions"
                ]
            ),
            FlowScenario(
                name="Problem Solving Flow",
                description="Iterative problem-solving conversation",
                turns=[
                    Turn("user", "I'm having trouble managing my time at work"),
                    Turn("user", "I tried time blocking but it's not working"),
                    Turn("user", "What are some alternatives to time blocking?"),
                    Turn("user", "How do I handle unexpected interruptions?")
                ],
                expected_outcomes=[
                    "Time management advice",
                    "Alternative strategies",
                    "Interruption handling"
                ]
            ),
            FlowScenario(
                name="Learning Flow",
                description="Educational conversation with follow-up questions",
                turns=[
                    Turn("user", "Explain the concept of compound interest"),
                    Turn("user", "Can you give me a practical example?"),
                    Turn("user", "How does this apply to investing?"),
                    Turn("user", "What's the best way to start investing?")
                ],
                expected_outcomes=[
                    "Compound interest explanation",
                    "Practical examples",
                    "Investment applications",
                    "Getting started advice"
                ]
            )
        ]
    
    def run_all_scenarios(self) -> Dict[str, Any]:
        """Run all test scenarios and return results"""
        if not self.login():
            return {"error": "Authentication failed"}
        
        scenarios = self.get_test_scenarios()
        results = []
        
        for scenario in scenarios:
            print(f"Running scenario: {scenario.name}")
            completed_scenario = self.run_scenario(scenario)
            
            scenario_result = {
                "name": completed_scenario.name,
                "description": completed_scenario.description,
                "metrics": [
                    {
                        "name": metric.name,
                        "score": metric.score,
                        "max_score": metric.max_score,
                        "details": metric.details
                    }
                    for metric in completed_scenario.metrics
                ]
            }
            results.append(scenario_result)
            
            # Brief pause between scenarios
            time.sleep(1)
        
        # Calculate overall scores
        all_scores = []
        dimension_scores = {}
        
        for result in results:
            for metric in result["metrics"]:
                all_scores.append(metric["score"])
                dim = metric["name"]
                if dim not in dimension_scores:
                    dimension_scores[dim] = []
                dimension_scores[dim].append(metric["score"])
        
        overall_score = sum(all_scores) / len(all_scores) if all_scores else 0
        avg_dimension_scores = {
            dim: sum(scores) / len(scores)
            for dim, scores in dimension_scores.items()
        }
        
        return {
            "overall_score": overall_score,
            "dimension_scores": avg_dimension_scores,
            "scenarios": results,
            "timestamp": datetime.now().isoformat()
        }
    
    def save_results(self, results: Dict[str, Any]) -> None:
        """Save results to file"""
        REPORTS_DIR.mkdir(exist_ok=True)
        
        with open(REPORTS_DIR / "chat_simulation_scores.json", 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)


def main():
    """Main function"""
    simulator = FlowSimulator()
    results = simulator.run_all_scenarios()
    simulator.save_results(results)
    
    if "error" in results:
        print(f"Error: {results['error']}")
        return
    
    print(f"\nFlow Simulation Results:")
    print(f"Overall Score: {results['overall_score']:.1f}")
    print(f"Dimension Scores:")
    for dim, score in results['dimension_scores'].items():
        print(f"  {dim}: {score:.1f}")


if __name__ == "__main__":
    main()
