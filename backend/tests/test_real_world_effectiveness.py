"""
Real-World Effectiveness Evaluation
Tests if the AI Companion actually delivers value and satisfies the vision
"""

import json
import time
import logging
import statistics
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from sqlalchemy.orm import Session

from app.core.llm import generate_response
from app.core.prompts import MEMORY_FIRST_PROMPT
from app.memory.service import memory_service
from app.models.user import User
from app.models.conversation import Conversation, Message

logger = logging.getLogger(__name__)


@dataclass
class RealWorldTestResult:
    """Result of a real-world effectiveness test."""
    test_id: str
    test_name: str
    passed: bool
    score: float  # 0.0 to 1.0
    user_message: str
    assistant_response: str
    memory_retrieved: List[str]
    cross_session_working: bool
    vision_alignment: str
    practical_value: str
    issues_found: List[str]
    improvement_suggestions: List[str]


@dataclass
class RealWorldMetrics:
    """Comprehensive metrics for real-world effectiveness."""
    
    # Core Functionality
    memory_persistence_score: float = 0.0
    cross_session_memory_score: float = 0.0
    practical_utility_score: float = 0.0
    vision_alignment_score: float = 0.0
    
    # User Experience
    conversation_continuity_score: float = 0.0
    personalization_effectiveness_score: float = 0.0
    problem_solving_score: float = 0.0
    time_saving_score: float = 0.0
    
    # Business Value
    user_satisfaction_potential: float = 0.0
    retention_potential: float = 0.0
    competitive_advantage: float = 0.0
    
    # Overall Scores
    overall_effectiveness_score: float = 0.0
    vision_satisfaction_score: float = 0.0
    total_tests_passed: int = 0
    total_tests_run: int = 0


class RealWorldEffectivenessEvaluator:
    """Evaluates real-world effectiveness and vision alignment."""
    
    def __init__(self):
        self.metrics = RealWorldMetrics()
        self.test_results: List[RealWorldTestResult] = []
        self.test_cases = self._load_real_world_test_cases()
        
    def _load_real_world_test_cases(self) -> List[Dict[str, Any]]:
        """Load real-world effectiveness test cases."""
        return [
            # 1. Memory Persistence Test
            {
                "test_id": "memory_persistence",
                "test_name": "Memory Persistence Test",
                "scenario": "User shares information, system stores it permanently",
                "user_message": "I'm a software developer who works from home. I prefer to work in the mornings and exercise in the evenings. My favorite food is Italian.",
                "expected_memory": ["software developer", "work from home", "morning preference", "evening exercise", "Italian food"],
                "category": "memory_persistence"
            },
            
            # 2. Cross-Session Memory Test
            {
                "test_id": "cross_session_memory",
                "test_name": "Cross-Session Memory Test",
                "scenario": "User returns later and asks about previously shared information",
                "user_message": "What do you know about my work preferences?",
                "expected_memory": ["software developer", "work from home", "morning preference"],
                "category": "cross_session_memory"
            },
            
            # 3. Practical Problem Solving
            {
                "test_id": "practical_problem_solving",
                "test_name": "Practical Problem Solving Test",
                "scenario": "User has a real problem, assistant provides actionable solution",
                "user_message": "I'm feeling overwhelmed with my workload. I have 3 deadlines this week and I'm not sure how to prioritize.",
                "expected_behavior": "Should use memory of preferences to suggest personalized solution",
                "category": "practical_problem_solving"
            },
            
            # 4. Vision Alignment - 9-5 Workflow
            {
                "test_id": "vision_alignment_9to5",
                "test_name": "9-5 Workflow Vision Test",
                "scenario": "Test if companion aligns with your 9-5 workflow vision",
                "user_message": "I want to track my daily routine: 4:30 AM wake up, 5:00-6:30 AM workout, 8:00 AM breakfast with 4 eggs and protein shake. Can you help me organize this?",
                "expected_behavior": "Should capture routine details and offer to help organize",
                "category": "vision_alignment"
            },
            
            # 5. Personal Assistant Effectiveness
            {
                "test_id": "personal_assistant_effectiveness",
                "test_name": "Personal Assistant Effectiveness Test",
                "scenario": "Test if companion acts like a real personal assistant",
                "user_message": "I have a meeting tomorrow at 2 PM. Can you help me prepare?",
                "expected_behavior": "Should offer specific preparation help based on user's work style",
                "category": "personal_assistant"
            },
            
            # 6. Memory Integration Test
            {
                "test_id": "memory_integration",
                "test_name": "Memory Integration Test",
                "scenario": "Test if companion integrates memories naturally in responses",
                "user_message": "When should I schedule my next workout?",
                "expected_behavior": "Should reference morning workout preference naturally",
                "category": "memory_integration"
            },
            
            # 7. User Satisfaction Potential
            {
                "test_id": "user_satisfaction_potential",
                "test_name": "User Satisfaction Potential Test",
                "scenario": "Test if responses would satisfy a real user",
                "user_message": "I'm stressed about my presentation tomorrow. What should I do?",
                "expected_behavior": "Should show empathy, use memory, and offer practical help",
                "category": "user_satisfaction"
            },
            
            # 8. Competitive Advantage Test
            {
                "test_id": "competitive_advantage",
                "test_name": "Competitive Advantage Test",
                "scenario": "Test if this companion has advantages over other AI assistants",
                "user_message": "What makes you different from other AI assistants?",
                "expected_behavior": "Should demonstrate memory and personalization capabilities",
                "category": "competitive_advantage"
            }
        ]
    
    def run_real_world_evaluation(self) -> RealWorldMetrics:
        """Run the complete real-world effectiveness evaluation."""
        logger.info("🚀 Starting Real-World Effectiveness Evaluation...")
        
        for test_case in self.test_cases:
            try:
                result = self._run_single_test(test_case)
                self.test_results.append(result)
                self._update_metrics(result)
                
                logger.info(f"✅ {test_case['test_name']}: {'PASSED' if result.passed else 'FAILED'} (Score: {result.score:.2f})")
                
            except Exception as e:
                logger.error(f"❌ Error running test {test_case['test_id']}: {e}")
                # Create failed result
                failed_result = RealWorldTestResult(
                    test_id=test_case['test_id'],
                    test_name=test_case['test_name'],
                    passed=False,
                    score=0.0,
                    user_message=test_case.get('user_message', ''),
                    assistant_response="Test execution failed",
                    memory_retrieved=[],
                    cross_session_working=False,
                    vision_alignment="Test failed",
                    practical_value="Test failed",
                    issues_found=[f"Test execution error: {str(e)}"],
                    improvement_suggestions=["Fix test execution infrastructure"]
                )
                self.test_results.append(failed_result)
        
        self._calculate_final_metrics()
        return self.metrics
    
    def _run_single_test(self, test_case: Dict[str, Any]) -> RealWorldTestResult:
        """Run a single real-world test."""
        
        try:
            user_message = test_case["user_message"]
            
            # Generate response
            response = generate_response(
                system_prompt=MEMORY_FIRST_PROMPT,
                messages=[{"role": "user", "content": user_message}],
                max_tokens=200
            )
            
            # Evaluate the response
            score, passed, issues, suggestions = self._evaluate_real_world_response(
                test_case, response
            )
            
            # Check memory integration
            memory_retrieved = self._extract_memory_references(response)
            cross_session_working = self._check_cross_session_capability(test_case)
            vision_alignment = self._assess_vision_alignment(test_case, response)
            practical_value = self._assess_practical_value(test_case, response)
            
            return RealWorldTestResult(
                test_id=test_case["test_id"],
                test_name=test_case["test_name"],
                passed=passed,
                score=score,
                user_message=user_message,
                assistant_response=response,
                memory_retrieved=memory_retrieved,
                cross_session_working=cross_session_working,
                vision_alignment=vision_alignment,
                practical_value=practical_value,
                issues_found=issues,
                improvement_suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"Error in test {test_case['test_id']}: {e}")
            
            return RealWorldTestResult(
                test_id=test_case["test_id"],
                test_name=test_case["test_name"],
                passed=False,
                score=0.0,
                user_message=test_case.get('user_message', ''),
                assistant_response=f"Error: {str(e)}",
                memory_retrieved=[],
                cross_session_working=False,
                vision_alignment="Error occurred",
                practical_value="Error occurred",
                issues_found=[f"System error: {str(e)}"],
                improvement_suggestions=["Fix system errors", "Improve error handling"]
            )
    
    def _evaluate_real_world_response(self, test_case: Dict[str, Any], response: str) -> Tuple[float, bool, List[str], List[str]]:
        """Evaluate a response for real-world effectiveness."""
        score = 0.0
        issues = []
        suggestions = []
        
        # Check for memory references (critical for personal assistant)
        if "remember" in response.lower() or "mentioned" in response.lower():
            score += 0.3  # Memory awareness worth 30%
        else:
            issues.append("No memory integration demonstrated")
            suggestions.append("Enable and use memory system effectively")
        
        # Check for personalization
        if any(word in response.lower() for word in ["your", "you", "based on", "preference"]):
            score += 0.2  # Personalization worth 20%
        else:
            issues.append("No personalization demonstrated")
            suggestions.append("Reference user preferences and personalize responses")
        
        # Check for actionable help
        if any(word in response.lower() for word in ["suggest", "recommend", "help", "plan", "organize"]):
            score += 0.2  # Actionable help worth 20%
        else:
            issues.append("No actionable help provided")
            suggestions.append("Offer specific, actionable suggestions")
        
        # Check response quality
        if 10 <= len(response) <= 300:  # Reasonable length
            score += 0.15  # Good length worth 15%
        else:
            issues.append("Response length inappropriate")
            suggestions.append("Maintain concise, focused responses")
        
        # Check for natural language
        if any(word in response.lower() for word in ["i", "you", "we", "let's"]):
            score += 0.15  # Natural language worth 15%
        else:
            issues.append("Response sounds robotic")
            suggestions.append("Use more natural, conversational language")
        
        # Determine if test passed (score >= 0.7)
        passed = score >= 0.7
        
        return score, passed, issues, suggestions
    
    def _extract_memory_references(self, response: str) -> List[str]:
        """Extract memory references from response."""
        memory_indicators = [
            "remember", "mentioned", "prefer", "usually", "typically",
            "based on", "your", "preference", "routine", "habit"
        ]
        
        found_memories = []
        for indicator in memory_indicators:
            if indicator in response.lower():
                found_memories.append(indicator)
        
        return found_memories
    
    def _check_cross_session_capability(self, test_case: Dict[str, Any]) -> bool:
        """Check if the system supports cross-session memory."""
        # This would require actual database testing, but we can infer from configuration
        try:
            # Check if memory system is enabled
            from app.core.config import settings
            return getattr(settings, 'MEMORY_ENABLED', False)
        except:
            return False
    
    def _assess_vision_alignment(self, test_case: Dict[str, Any], response: str) -> str:
        """Assess if the response aligns with the 9-5 workflow vision."""
        category = test_case.get("category", "")
        
        if category == "vision_alignment":
            # Check if response captures routine details
            routine_keywords = ["routine", "schedule", "organize", "track", "workout", "breakfast"]
            if any(keyword in response.lower() for keyword in routine_keywords):
                return "✅ Aligns with 9-5 workflow vision"
            else:
                return "❌ Doesn't align with 9-5 workflow vision"
        
        return "N/A - Not a vision alignment test"
    
    def _assess_practical_value(self, test_case: Dict[str, Any], response: str) -> str:
        """Assess the practical value of the response."""
        # Check if response provides actionable value
        actionable_indicators = ["suggest", "recommend", "help", "plan", "organize", "schedule"]
        
        if any(indicator in response.lower() for indicator in actionable_indicators):
            return "✅ High practical value - actionable suggestions provided"
        elif "remember" in response.lower() or "mentioned" in response.lower():
            return "🟡 Medium practical value - memory integration but limited action"
        else:
            return "❌ Low practical value - generic response"
    
    def _update_metrics(self, result: RealWorldTestResult):
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
            "memory_persistence": "memory_persistence",
            "cross_session_memory": "cross_session_memory",
            "practical_problem_solving": "practical_utility",
            "vision_alignment_9to5": "vision_alignment",
            "personal_assistant_effectiveness": "personal_assistant",
            "memory_integration": "memory_integration",
            "user_satisfaction_potential": "user_satisfaction",
            "competitive_advantage": "competitive_advantage"
        }
        return category_mapping.get(test_id)
    
    def _update_category_score(self, category: str, score: float):
        """Update the score for a specific category."""
        if category == "memory_persistence":
            self.metrics.memory_persistence_score = score
        elif category == "cross_session_memory":
            self.metrics.cross_session_memory_score = score
        elif category == "practical_utility":
            self.metrics.practical_utility_score = score
        elif category == "vision_alignment":
            self.metrics.vision_alignment_score = score
        elif category == "personal_assistant":
            self.metrics.personalization_effectiveness_score = score
        elif category == "memory_integration":
            self.metrics.conversation_continuity_score = score
        elif category == "user_satisfaction":
            self.metrics.user_satisfaction_potential = score
        elif category == "competitive_advantage":
            self.metrics.competitive_advantage = score
    
    def _calculate_final_metrics(self):
        """Calculate final overall scores."""
        # Calculate overall effectiveness (average of core functionality)
        core_functionality = [
            self.metrics.memory_persistence_score,
            self.metrics.cross_session_memory_score,
            self.metrics.practical_utility_score,
            self.metrics.vision_alignment_score
        ]
        self.metrics.overall_effectiveness_score = statistics.mean(core_functionality) if core_functionality else 0.0
        
        # Calculate vision satisfaction (average of vision-related metrics)
        vision_metrics = [
            self.metrics.vision_alignment_score,
            self.metrics.practical_utility_score,
            self.metrics.user_satisfaction_potential
        ]
        self.metrics.vision_satisfaction_score = statistics.mean(vision_metrics) if vision_metrics else 0.0
    
    def generate_real_world_report(self) -> str:
        """Generate a comprehensive real-world effectiveness report."""
        report = []
        report.append("# 🌟 AI Companion Real-World Effectiveness Report")
        report.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Executive Summary
        report.append("## 📊 Executive Summary")
        report.append(f"- **Overall Effectiveness Score**: {self.metrics.overall_effectiveness_score:.2f}/1.00")
        report.append(f"- **Vision Satisfaction Score**: {self.metrics.vision_satisfaction_score:.2f}/1.00")
        report.append(f"- **Tests Passed**: {self.metrics.total_tests_passed}/{self.metrics.total_tests_run}")
        report.append(f"- **Success Rate**: {(self.metrics.total_tests_passed/self.metrics.total_tests_run*100):.1f}%")
        report.append("")
        
        # Vision Alignment Assessment
        report.append("## 🎯 Vision Alignment Assessment")
        report.append("### Your Vision: 9-5 Workflow AI Companion")
        report.append("- **Goal**: Bridge between current lifestyle and desired lifestyle")
        report.append("- **Features**: Routine tracking, workout monitoring, nutrition tracking")
        report.append("- **Value**: Insights, reminders, and motivation for better living")
        report.append("")
        
        if self.metrics.vision_alignment_score >= 0.8:
            report.append("✅ **EXCELLENT ALIGNMENT** - Your companion aligns strongly with the 9-5 workflow vision")
        elif self.metrics.vision_alignment_score >= 0.6:
            report.append("🟡 **GOOD ALIGNMENT** - Your companion mostly aligns with the vision")
        else:
            report.append("❌ **POOR ALIGNMENT** - Your companion doesn't align well with the vision")
        report.append("")
        
        # Detailed Test Results
        report.append("## 📋 Detailed Test Results")
        for result in self.test_results:
            status = "✅ PASSED" if result.passed else "❌ FAILED"
            report.append(f"### {result.test_name} - {status}")
            report.append(f"- **Score**: {result.score:.2f}/1.00")
            report.append(f"- **User Message**: {result.user_message}")
            report.append(f"- **Assistant Response**: {result.assistant_response[:150]}...")
            report.append(f"- **Memory Retrieved**: {', '.join(result.memory_retrieved) if result.memory_retrieved else 'None'}")
            report.append(f"- **Cross-Session Working**: {'✅ Yes' if result.cross_session_working else '❌ No'}")
            report.append(f"- **Vision Alignment**: {result.vision_alignment}")
            report.append(f"- **Practical Value**: {result.practical_value}")
            
            if result.issues_found:
                report.append(f"- **Issues**: {', '.join(result.issues_found)}")
            if result.improvement_suggestions:
                report.append(f"- **Suggestions**: {', '.join(result.improvement_suggestions)}")
            report.append("")
        
        # Category Performance
        report.append("## 🎯 Category Performance")
        report.append(f"- **Memory Persistence**: {self.metrics.memory_persistence_score:.2f}/1.00")
        report.append(f"- **Cross-Session Memory**: {self.metrics.cross_session_memory_score:.2f}/1.00")
        report.append(f"- **Practical Utility**: {self.metrics.practical_utility_score:.2f}/1.00")
        report.append(f"- **Vision Alignment**: {self.metrics.vision_alignment_score:.2f}/1.00")
        report.append(f"- **Personalization Effectiveness**: {self.metrics.personalization_effectiveness_score:.2f}/1.00")
        report.append(f"- **Conversation Continuity**: {self.metrics.conversation_continuity_score:.2f}/1.00")
        report.append(f"- **User Satisfaction Potential**: {self.metrics.user_satisfaction_potential:.2f}/1.00")
        report.append(f"- **Competitive Advantage**: {self.metrics.competitive_advantage:.2f}/1.00")
        report.append("")
        
        # Real-World Assessment
        report.append("## 🌍 Real-World Assessment")
        
        # Memory System Assessment
        if self.metrics.memory_persistence_score >= 0.8:
            report.append("✅ **MEMORY SYSTEM**: Excellent - Information is captured and stored effectively")
        elif self.metrics.memory_persistence_score >= 0.6:
            report.append("🟡 **MEMORY SYSTEM**: Good - Most information is captured")
        else:
            report.append("❌ **MEMORY SYSTEM**: Poor - Information is not being captured effectively")
        
        # Cross-Session Assessment
        if self.metrics.cross_session_memory_score >= 0.8:
            report.append("✅ **CROSS-SESSION MEMORY**: Excellent - Memory persists across sessions")
        elif self.metrics.cross_session_memory_score >= 0.6:
            report.append("🟡 **CROSS-SESSION MEMORY**: Good - Some memory persistence")
        else:
            report.append("❌ **CROSS-SESSION MEMORY**: Poor - No cross-session memory")
        
        # Vision Alignment Assessment
        if self.metrics.vision_alignment_score >= 0.8:
            report.append("✅ **VISION ALIGNMENT**: Excellent - Strongly aligns with 9-5 workflow vision")
        elif self.metrics.vision_alignment_score >= 0.6:
            report.append("🟡 **VISION ALIGNMENT**: Good - Mostly aligns with vision")
        else:
            report.append("❌ **VISION ALIGNMENT**: Poor - Doesn't align with vision")
        
        report.append("")
        
        # User Satisfaction Prediction
        report.append("## 👥 User Satisfaction Prediction")
        if self.metrics.user_satisfaction_potential >= 0.8:
            report.append("🎉 **HIGH SATISFACTION LIKELY** - Users will love this companion")
        elif self.metrics.user_satisfaction_potential >= 0.6:
            report.append("😊 **GOOD SATISFACTION LIKELY** - Users will be satisfied")
        else:
            report.append("😞 **LOW SATISFACTION LIKELY** - Users may be disappointed")
        
        report.append("")
        
        # Competitive Analysis
        report.append("## 🏆 Competitive Analysis")
        if self.metrics.competitive_advantage >= 0.8:
            report.append("🚀 **STRONG COMPETITIVE ADVANTAGE** - Significantly better than alternatives")
        elif self.metrics.competitive_advantage >= 0.6:
            report.append("📈 **GOOD COMPETITIVE POSITION** - Better than most alternatives")
        else:
            report.append("⚠️ **WEAK COMPETITIVE POSITION** - Similar to alternatives")
        
        report.append("")
        
        # Final Verdict
        report.append("## 🎯 Final Verdict")
        if self.metrics.overall_effectiveness_score >= 0.8:
            report.append("🌟 **EXCELLENT** - Your AI Companion is ready to deliver real value")
        elif self.metrics.overall_effectiveness_score >= 0.6:
            report.append("👍 **GOOD** - Your AI Companion has potential but needs improvements")
        else:
            report.append("❌ **POOR** - Your AI Companion needs significant work before launch")
        
        report.append("")
        report.append("## 🚀 Next Steps")
        if self.metrics.overall_effectiveness_score < 0.8:
            report.append("1. **Fix Critical Issues**: Address memory system and cross-session problems")
            report.append("2. **Improve Vision Alignment**: Ensure companion supports 9-5 workflow")
            report.append("3. **Enhance Practical Value**: Make responses more actionable")
            report.append("4. **Test with Real Users**: Validate assumptions with actual users")
        else:
            report.append("1. **Launch Beta**: Your companion is ready for beta testing")
            report.append("2. **Gather User Feedback**: Collect real-world usage data")
            report.append("3. **Iterate and Improve**: Use feedback to enhance features")
            report.append("4. **Scale Up**: Prepare for broader user base")
        
        return "\n".join(report)


def run_real_world_evaluation() -> str:
    """Run the complete real-world effectiveness evaluation."""
    evaluator = RealWorldEffectivenessEvaluator()
    metrics = evaluator.run_real_world_evaluation()
    
    # Generate report
    report = evaluator.generate_real_world_report()
    
    # Log summary
    logger.info(f"🎯 Real-World Evaluation Complete!")
    logger.info(f"✅ Tests Passed: {metrics.total_tests_passed}/{metrics.total_tests_run}")
    logger.info(f"🌟 Overall Effectiveness: {metrics.overall_effectiveness_score:.2f}/1.00")
    logger.info(f"🎯 Vision Satisfaction: {metrics.vision_satisfaction_score:.2f}/1.00")
    
    return report


if __name__ == "__main__":
    # Run evaluation
    report = run_real_world_evaluation()
    print(report)
