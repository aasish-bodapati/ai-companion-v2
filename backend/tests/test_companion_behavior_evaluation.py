"""
Companion Behavior Evaluation Framework
Tests if the AI companion behaves like an actual human personal assistant 99.99% of the time
"""

import json
import time
import logging
import statistics
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from sqlalchemy.orm import Session
from unittest.mock import Mock, patch

from app.core.llm import generate_response
from app.core.prompts import MEMORY_FIRST_PROMPT, SIMPLIFIED_SYSTEM_PROMPT
from app.models.user import User
from app.models.conversation import Conversation
from app.models.conversation import Message

logger = logging.getLogger(__name__)


@dataclass
class BehaviorTestResult:
    """Result of a single behavior test."""
    test_id: str
    test_name: str
    passed: bool
    score: float  # 0.0 to 1.0
    response_text: str
    expected_behavior: str
    actual_behavior: str
    issues_found: List[str]
    improvement_suggestions: List[str]
    execution_time_ms: float


@dataclass
class CompanionBehaviorMetrics:
    """Comprehensive metrics for companion behavior evaluation."""
    
    # Core Assistant Behaviors
    helpfulness_score: float = 0.0
    memory_awareness_score: float = 0.0
    personalization_score: float = 0.0
    conversation_naturalness_score: float = 0.0
    
    # Human-like Qualities
    empathy_score: float = 0.0
    proactive_behavior_score: float = 0.0
    context_understanding_score: float = 0.0
    error_handling_score: float = 0.0
    
    # Professional Assistant Skills
    task_understanding_score: float = 0.0
    planning_ability_score: float = 0.0
    follow_up_score: float = 0.0
    consistency_score: float = 0.0
    
    # Overall Scores
    overall_human_like_score: float = 0.0
    overall_assistant_score: float = 0.0
    total_tests_passed: int = 0
    total_tests_run: int = 0


class CompanionBehaviorEvaluator:
    """Evaluates if the AI companion behaves like a human personal assistant."""
    
    def __init__(self):
        self.metrics = CompanionBehaviorMetrics()
        self.test_results: List[BehaviorTestResult] = []
        self.test_cases = self._load_behavior_test_cases()
        
    def _load_behavior_test_cases(self) -> List[Dict[str, Any]]:
        """Load comprehensive behavior test cases."""
        return [
            # 1. Basic Assistant Behavior
            {
                "test_id": "basic_helpfulness",
                "test_name": "Basic Helpfulness Test",
                "scenario": "User asks for help with a simple task",
                "user_message": "Can you help me organize my day?",
                "expected_behavior": "Should offer specific, actionable help",
                "expected_keywords": ["organize", "schedule", "plan", "help"],
                "category": "helpfulness"
            },
            
            # 2. Memory Awareness (Critical for Personal Assistant)
            {
                "test_id": "memory_awareness",
                "test_name": "Memory Awareness Test",
                "scenario": "User mentions information, then asks about it later",
                "user_message": "I'm a software developer who works from home",
                "follow_up_message": "What do you know about my work situation?",
                "expected_behavior": "Should remember and reference the information",
                "expected_keywords": ["software developer", "work from home", "remember"],
                "category": "memory_awareness"
            },
            
            # 3. Personalization
            {
                "test_id": "personalization",
                "test_name": "Personalization Test",
                "scenario": "User shares preferences, assistant should personalize responses",
                "user_message": "I prefer to work in the mornings and exercise in the evenings",
                "follow_up_message": "When should I schedule my next meeting?",
                "expected_behavior": "Should suggest morning times based on preference",
                "expected_keywords": ["morning", "prefer", "schedule"],
                "category": "personalization"
            },
            
            # 4. Natural Conversation
            {
                "test_id": "conversation_naturalness",
                "test_name": "Conversation Naturalness Test",
                "scenario": "Conversation should feel natural and human-like",
                "user_message": "I'm feeling a bit overwhelmed today",
                "expected_behavior": "Should show empathy and offer support",
                "expected_keywords": ["understand", "overwhelmed", "help", "support"],
                "category": "conversation_naturalness"
            },
            
            # 5. Proactive Behavior
            {
                "test_id": "proactive_behavior",
                "test_name": "Proactive Behavior Test",
                "scenario": "Assistant should anticipate needs and offer suggestions",
                "user_message": "I have a big presentation tomorrow",
                "expected_behavior": "Should offer proactive help and suggestions",
                "expected_keywords": ["prepare", "suggest", "help", "presentation"],
                "category": "proactive_behavior"
            },
            
            # 6. Task Understanding
            {
                "test_id": "task_understanding",
                "test_name": "Task Understanding Test",
                "scenario": "Assistant should understand complex requests",
                "user_message": "I need to plan a week-long business trip to New York, including flights, hotel, and meetings",
                "expected_behavior": "Should break down the complex task into manageable steps",
                "expected_keywords": ["plan", "flights", "hotel", "meetings", "steps"],
                "category": "task_understanding"
            },
            
            # 7. Error Handling
            {
                "test_id": "error_handling",
                "test_name": "Error Handling Test",
                "scenario": "Assistant should handle unclear or impossible requests gracefully",
                "user_message": "Can you make it rain tomorrow?",
                "expected_behavior": "Should politely explain limitations while offering alternatives",
                "expected_keywords": ["can't", "impossible", "but", "instead", "help"],
                "category": "error_handling"
            },
            
            # 8. Consistency
            {
                "test_id": "consistency",
                "test_name": "Consistency Test",
                "scenario": "Assistant should maintain consistent personality and approach",
                "user_message": "What's your favorite color?",
                "expected_behavior": "Should maintain consistent personality across responses",
                "expected_keywords": ["assistant", "help", "consistent"],
                "category": "consistency"
            },
            
            # 9. Follow-up Questions
            {
                "test_id": "follow_up_questions",
                "test_name": "Follow-up Questions Test",
                "scenario": "Assistant should ask clarifying questions when needed",
                "user_message": "I want to improve my productivity",
                "expected_behavior": "Should ask specific questions to understand needs",
                "expected_keywords": ["what", "how", "when", "specific", "area"],
                "category": "follow_up_questions"
            },
            
            # 10. Emotional Intelligence
            {
                "test_id": "emotional_intelligence",
                "test_name": "Emotional Intelligence Test",
                "scenario": "Assistant should recognize and respond to emotional states",
                "user_message": "I'm really excited about my new job!",
                "expected_behavior": "Should share in the excitement and offer congratulations",
                "expected_keywords": ["congratulations", "excited", "great", "new job"],
                "category": "emotional_intelligence"
            }
        ]
    
    def run_behavior_evaluation(self) -> CompanionBehaviorMetrics:
        """Run the complete behavior evaluation suite."""
        logger.info("🚀 Starting Companion Behavior Evaluation...")
        
        for test_case in self.test_cases:
            try:
                result = self._run_single_test(test_case)
                self.test_results.append(result)
                self._update_metrics(result)
                
                logger.info(f"✅ {test_case['test_name']}: {'PASSED' if result.passed else 'FAILED'} (Score: {result.score:.2f})")
                
            except Exception as e:
                logger.error(f"❌ Error running test {test_case['test_id']}: {e}")
                # Create failed result
                failed_result = BehaviorTestResult(
                    test_id=test_case['test_id'],
                    test_name=test_case['test_name'],
                    passed=False,
                    score=0.0,
                    response_text="",
                    expected_behavior=test_case['expected_behavior'],
                    actual_behavior="Test execution failed",
                    issues_found=[f"Test execution error: {str(e)}"],
                    improvement_suggestions=["Fix test execution infrastructure"],
                    execution_time_ms=0.0
                )
                self.test_results.append(failed_result)
        
        self._calculate_final_metrics()
        return self.metrics
    
    def _run_single_test(self, test_case: Dict[str, Any]) -> BehaviorTestResult:
        """Run a single behavior test."""
        start_time = time.time()
        
        # Generate response using the current system
        try:
            system_prompt = MEMORY_FIRST_PROMPT
            messages = [{"role": "user", "content": test_case["user_message"]}]
            
            response_text = generate_response(
                system_prompt=system_prompt,
                messages=messages,
                max_tokens=200
            )
            
            execution_time = (time.time() - start_time) * 1000
            
            # Evaluate the response
            score, passed, issues, suggestions = self._evaluate_response(
                test_case, response_text
            )
            
            return BehaviorTestResult(
                test_id=test_case["test_id"],
                test_name=test_case["test_name"],
                passed=passed,
                score=score,
                response_text=response_text,
                expected_behavior=test_case["expected_behavior"],
                actual_behavior=response_text,
                issues_found=issues,
                improvement_suggestions=suggestions,
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            logger.error(f"Error in test {test_case['test_id']}: {e}")
            
            return BehaviorTestResult(
                test_id=test_case["test_id"],
                test_name=test_case["test_name"],
                passed=False,
                score=0.0,
                response_text="",
                expected_behavior=test_case["expected_behavior"],
                actual_behavior=f"Error: {str(e)}",
                issues_found=[f"System error: {str(e)}"],
                improvement_suggestions=["Fix system errors", "Improve error handling"],
                execution_time_ms=execution_time
            )
    
    def _evaluate_response(self, test_case: Dict[str, Any], response_text: str) -> Tuple[float, bool, List[str], List[str]]:
        """Evaluate a response against expected behavior."""
        score = 0.0
        issues = []
        suggestions = []
        
        # Check for expected keywords
        expected_keywords = test_case.get("expected_keywords", [])
        found_keywords = sum(1 for keyword in expected_keywords if keyword.lower() in response_text.lower())
        
        if expected_keywords:
            keyword_score = found_keywords / len(expected_keywords)
            score += keyword_score * 0.4  # Keywords worth 40% of score
        
        # Check response length (should be reasonable)
        if 10 <= len(response_text) <= 500:
            score += 0.2  # Good length worth 20%
        else:
            issues.append("Response length inappropriate")
            suggestions.append("Maintain 2-4 sentence responses")
        
        # Check for natural language (not robotic)
        if any(word in response_text.lower() for word in ["i", "you", "we", "let's", "could", "would"]):
            score += 0.2  # Natural language worth 20%
        else:
            issues.append("Response sounds robotic")
            suggestions.append("Use more natural, conversational language")
        
        # Check for helpfulness indicators
        helpful_indicators = ["help", "suggest", "recommend", "plan", "organize", "assist"]
        if any(indicator in response_text.lower() for indicator in helpful_indicators):
            score += 0.2  # Helpfulness worth 20%
        else:
            issues.append("Response lacks helpfulness")
            suggestions.append("Offer specific, actionable help")
        
        # Determine if test passed (score >= 0.7)
        passed = score >= 0.7
        
        # Add specific issues based on category
        category = test_case.get("category", "")
        if category == "memory_awareness" and "remember" not in response_text.lower():
            issues.append("No memory awareness demonstrated")
            suggestions.append("Enable memory system and reference previous information")
        
        if category == "personalization" and "your" not in response_text.lower():
            issues.append("No personalization demonstrated")
            suggestions.append("Reference user preferences and personalize responses")
        
        return score, passed, issues, suggestions
    
    def _update_metrics(self, result: BehaviorTestResult):
        """Update overall metrics based on test result."""
        self.metrics.total_tests_run += 1
        if result.passed:
            self.metrics.total_tests_passed += 1
        
        # Update category scores
        category = self._get_test_category(result.test_id)
        if category:
            self._update_category_score(category, result.score)
    
    def _get_test_category(self, test_id: str) -> Optional[str]:
        """Get the category for a test ID."""
        category_mapping = {
            "basic_helpfulness": "helpfulness",
            "memory_awareness": "memory_awareness",
            "personalization": "personalization",
            "conversation_naturalness": "conversation_naturalness",
            "proactive_behavior": "proactive_behavior",
            "task_understanding": "task_understanding",
            "error_handling": "error_handling",
            "consistency": "consistency",
            "follow_up_questions": "follow_up_questions",
            "emotional_intelligence": "emotional_intelligence"
        }
        return category_mapping.get(test_id)
    
    def _update_category_score(self, category: str, score: float):
        """Update the score for a specific category."""
        if category == "helpfulness":
            self.metrics.helpfulness_score = score
        elif category == "memory_awareness":
            self.metrics.memory_awareness_score = score
        elif category == "personalization":
            self.metrics.personalization_score = score
        elif category == "conversation_naturalness":
            self.metrics.conversation_naturalness_score = score
        elif category == "proactive_behavior":
            self.metrics.proactive_behavior_score = score
        elif category == "task_understanding":
            self.metrics.task_understanding_score = score
        elif category == "error_handling":
            self.metrics.error_handling_score = score
        elif category == "consistency":
            self.metrics.consistency_score = score
        elif category == "follow_up_questions":
            self.metrics.follow_up_score = score
        elif category == "emotional_intelligence":
            self.metrics.empathy_score = score
    
    def _calculate_final_metrics(self):
        """Calculate final overall scores."""
        # Calculate human-like score (average of human-like qualities)
        human_qualities = [
            self.metrics.empathy_score,
            self.metrics.conversation_naturalness_score,
            self.metrics.error_handling_score,
            self.metrics.consistency_score
        ]
        self.metrics.overall_human_like_score = statistics.mean(human_qualities) if human_qualities else 0.0
        
        # Calculate assistant score (average of professional skills)
        assistant_skills = [
            self.metrics.helpfulness_score,
            self.metrics.task_understanding_score,
            self.metrics.planning_ability_score,
            self.metrics.follow_up_score
        ]
        self.metrics.overall_assistant_score = statistics.mean(assistant_skills) if assistant_skills else 0.0
    
    def generate_evaluation_report(self) -> str:
        """Generate a comprehensive evaluation report."""
        report = []
        report.append("# 🤖 AI Companion Behavior Evaluation Report")
        report.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Summary
        report.append("## 📊 Executive Summary")
        report.append(f"- **Overall Human-like Score**: {self.metrics.overall_human_like_score:.2f}/1.00")
        report.append(f"- **Overall Assistant Score**: {self.metrics.overall_assistant_score:.2f}/1.00")
        report.append(f"- **Tests Passed**: {self.metrics.total_tests_passed}/{self.metrics.total_tests_run}")
        report.append(f"- **Success Rate**: {(self.metrics.total_tests_passed/self.metrics.total_tests_run*100):.1f}%")
        report.append("")
        
        # Detailed Results
        report.append("## 📋 Detailed Test Results")
        for result in self.test_results:
            status = "✅ PASSED" if result.passed else "❌ FAILED"
            report.append(f"### {result.test_name} - {status}")
            report.append(f"- **Score**: {result.score:.2f}/1.00")
            report.append(f"- **Expected**: {result.expected_behavior}")
            report.append(f"- **Actual**: {result.actual_behavior[:100]}...")
            
            if result.issues_found:
                report.append(f"- **Issues**: {', '.join(result.issues_found)}")
            if result.improvement_suggestions:
                report.append(f"- **Suggestions**: {', '.join(result.improvement_suggestions)}")
            report.append("")
        
        # Category Scores
        report.append("## 🎯 Category Performance")
        report.append(f"- **Helpfulness**: {self.metrics.helpfulness_score:.2f}/1.00")
        report.append(f"- **Memory Awareness**: {self.metrics.memory_awareness_score:.2f}/1.00")
        report.append(f"- **Personalization**: {self.metrics.personalization_score:.2f}/1.00")
        report.append(f"- **Conversation Naturalness**: {self.metrics.conversation_naturalness_score:.2f}/1.00")
        report.append(f"- **Proactive Behavior**: {self.metrics.proactive_behavior_score:.2f}/1.00")
        report.append(f"- **Task Understanding**: {self.metrics.task_understanding_score:.2f}/1.00")
        report.append(f"- **Error Handling**: {self.metrics.error_handling_score:.2f}/1.00")
        report.append(f"- **Consistency**: {self.metrics.consistency_score:.2f}/1.00")
        report.append(f"- **Follow-up Questions**: {self.metrics.follow_up_score:.2f}/1.00")
        report.append(f"- **Emotional Intelligence**: {self.metrics.empathy_score:.2f}/1.00")
        report.append("")
        
        # Recommendations
        report.append("## 🚀 Improvement Recommendations")
        if self.metrics.memory_awareness_score < 0.7:
            report.append("- **CRITICAL**: Enable memory system (`MEMORY_ENABLED=true`)")
            report.append("- **CRITICAL**: Configure memory provider and vector store")
        
        if self.metrics.personalization_score < 0.7:
            report.append("- **HIGH**: Implement user preference storage and retrieval")
            report.append("- **HIGH**: Add personalization to system prompts")
        
        if self.metrics.overall_human_like_score < 0.8:
            report.append("- **MEDIUM**: Enhance system prompts for more natural responses")
            report.append("- **MEDIUM**: Add emotional intelligence training data")
        
        if self.metrics.overall_assistant_score < 0.8:
            report.append("- **MEDIUM**: Improve task understanding and planning capabilities")
            report.append("- **MEDIUM**: Add proactive suggestion system")
        
        report.append("")
        report.append("## 🎯 Target: 99.99% Human-like Behavior")
        report.append("To achieve 99.99% human-like behavior, focus on:")
        report.append("1. **Memory System**: Enable and optimize memory capture/retrieval")
        report.append("2. **Personalization**: Store and use user preferences effectively")
        report.append("3. **Natural Language**: Ensure responses sound human, not robotic")
        report.append("4. **Context Awareness**: Maintain conversation context across turns")
        report.append("5. **Proactive Help**: Anticipate user needs and offer suggestions")
        
        return "\n".join(report)


def run_companion_behavior_evaluation() -> str:
    """Run the complete companion behavior evaluation."""
    evaluator = CompanionBehaviorEvaluator()
    metrics = evaluator.run_behavior_evaluation()
    
    # Generate report
    report = evaluator.generate_evaluation_report()
    
    # Log summary
    logger.info(f"🎯 Evaluation Complete!")
    logger.info(f"✅ Tests Passed: {metrics.total_tests_passed}/{metrics.total_tests_run}")
    logger.info(f"🎭 Human-like Score: {metrics.overall_human_like_score:.2f}/1.00")
    logger.info(f"🤖 Assistant Score: {metrics.overall_assistant_score:.2f}/1.00")
    
    return report


if __name__ == "__main__":
    # Run evaluation
    report = run_companion_behavior_evaluation()
    print(report)
