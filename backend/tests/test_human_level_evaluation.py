"""
Test suite for Human-Level Personal Assistant Evaluation Framework

Comprehensive tests for memory, conversational intelligence, task execution,
and integrated human-level capabilities.
"""

import pytest
import json
from unittest.mock import Mock, patch
from datetime import datetime, timezone

from tests.human_level_evaluation_framework import (
    HumanLevelEvaluationFramework,
    run_human_level_evaluation,
    generate_human_level_report,
    HumanLevelMetrics,
    HumanLevelTestCase
)
from tests.memory_evaluation_framework import MemoryEvaluationFramework
from tests.conversational_intelligence_framework import ConversationalIntelligenceFramework
from tests.task_execution_framework import TaskExecutionFramework


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return Mock()


@pytest.fixture
def human_level_framework(mock_db):
    """Create a human-level evaluation framework instance."""
    return HumanLevelEvaluationFramework(mock_db)


@pytest.fixture
def sample_evaluation_results():
    """Sample evaluation results for testing."""
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": "test_user",
        "memory_evaluation": {
            "capture_evaluation": {"overall_accuracy": 0.85},
            "retrieval_evaluation": {"avg_precision": 0.78},
            "storage_evaluation": {"storage_efficiency": 0.65}
        },
        "conversational_evaluation": {
            "conversation_evaluation": {"multi_turn_coherence": 0.72, "context_retention_rate": 0.68},
            "context_evaluation": {"reference_resolution": 0.75},
            "emotional_evaluation": {"emotional_awareness": 0.80},
            "proactive_evaluation": {"proactive_suggestions": 0.65}
        },
        "task_execution_evaluation": {
            "task_understanding_evaluation": {"task_analysis_accuracy": 0.80},
            "planning_evaluation": {"planning_quality": 0.70},
            "execution_evaluation": {"execution_efficiency": 0.75},
            "problem_solving_evaluation": {"solution_quality": 0.73}
        },
        "integrated_evaluation": {
            "conversational_task_integration": 0.75,
            "memory_conversation_integration": 0.80,
            "proactive_task_anticipation": 0.70
        },
        "overall_human_level_score": 0.74,
        "human_level_assessment": {
            "level": "HUMAN_LEVEL_GOOD",
            "description": "Demonstrates good human-level capabilities with some areas for improvement",
            "recommendation": "Nearly ready for production, focus on identified improvement areas"
        }
    }


class TestHumanLevelEvaluationFramework:
    """Test the human-level evaluation framework."""
    
    def test_framework_initialization(self, human_level_framework):
        """Test framework initialization."""
        assert human_level_framework.db is not None
        assert len(human_level_framework.test_cases) > 0
        assert isinstance(human_level_framework.metrics, HumanLevelMetrics)
    
    def test_test_cases_loading(self, human_level_framework):
        """Test that test cases are loaded correctly."""
        test_cases = human_level_framework.test_cases
        
        # Check that we have the expected test cases
        test_ids = [tc.test_id for tc in test_cases]
        assert "executive_assistant" in test_ids
        assert "personal_life_manager" in test_ids
        assert "crisis_management" in test_ids
        
        # Check test case structure
        for test_case in test_cases:
            assert isinstance(test_case, HumanLevelTestCase)
            assert test_case.test_id
            assert test_case.description
            assert test_case.scenario
            assert len(test_case.conversation_flow) > 0
            assert len(test_case.expected_memory_captures) > 0
            assert len(test_case.expected_task_execution) > 0
    
    def test_integrated_capabilities_evaluation(self, human_level_framework):
        """Test integrated capabilities evaluation."""
        results = human_level_framework.evaluate_integrated_capabilities("test_user")
        
        assert "conversational_task_integration" in results
        assert "memory_conversation_integration" in results
        assert "proactive_task_anticipation" in results
        assert "test_results" in results
        
        # Check that scores are within expected range
        assert 0 <= results["conversational_task_integration"] <= 1
        assert 0 <= results["memory_conversation_integration"] <= 1
        assert 0 <= results["proactive_task_anticipation"] <= 1
    
    def test_human_level_score_calculation(self, human_level_framework):
        """Test human-level score calculation."""
        memory_results = {
            "capture_evaluation": {"overall_accuracy": 0.85},
            "retrieval_evaluation": {"avg_precision": 0.78},
            "storage_evaluation": {"storage_efficiency": 0.65}
        }
        
        conversation_results = {
            "conversation_evaluation": {"multi_turn_coherence": 0.72, "context_retention_rate": 0.68},
            "context_evaluation": {"reference_resolution": 0.75},
            "emotional_evaluation": {"emotional_awareness": 0.80},
            "proactive_evaluation": {"proactive_suggestions": 0.65}
        }
        
        task_results = {
            "task_understanding_evaluation": {"task_analysis_accuracy": 0.80},
            "planning_evaluation": {"planning_quality": 0.70},
            "execution_evaluation": {"execution_efficiency": 0.75},
            "problem_solving_evaluation": {"solution_quality": 0.73}
        }
        
        integrated_results = {
            "conversational_task_integration": 0.75,
            "memory_conversation_integration": 0.80,
            "proactive_task_anticipation": 0.70
        }
        
        score = human_level_framework._calculate_human_level_score(
            memory_results, conversation_results, task_results, integrated_results
        )
        
        assert 0 <= score <= 1
        assert score > 0.5  # Should be reasonable given the input scores
    
    def test_human_level_assessment(self, human_level_framework):
        """Test human-level capability assessment."""
        # Test excellent level
        assessment = human_level_framework._assess_human_level_capabilities(0.90)
        assert assessment["level"] == "HUMAN_LEVEL_EXCELLENT"
        assert "excellent" in assessment["description"].lower()
        
        # Test good level
        assessment = human_level_framework._assess_human_level_capabilities(0.80)
        assert assessment["level"] == "HUMAN_LEVEL_GOOD"
        assert "good" in assessment["description"].lower()
        
        # Test adequate level
        assessment = human_level_framework._assess_human_level_capabilities(0.70)
        assert assessment["level"] == "HUMAN_LEVEL_ADEQUATE"
        assert "adequate" in assessment["description"].lower()
        
        # Test basic level
        assessment = human_level_framework._assess_human_level_capabilities(0.55)
        assert assessment["level"] == "BASIC_LEVEL"
        assert "basic" in assessment["description"].lower()
        
        # Test foundation level
        assessment = human_level_framework._assess_human_level_capabilities(0.30)
        assert assessment["level"] == "FOUNDATION_LEVEL"
        assert "foundation" in assessment["description"].lower()
    
    def test_next_steps_generation(self, human_level_framework):
        """Test next steps generation based on score."""
        # Test excellent level next steps
        steps = human_level_framework._get_next_steps(0.90)
        assert len(steps) > 0
        assert any("production" in step.lower() for step in steps)
        
        # Test good level next steps
        steps = human_level_framework._get_next_steps(0.80)
        assert len(steps) > 0
        assert any("improvement" in step.lower() for step in steps)
        
        # Test foundation level next steps
        steps = human_level_framework._get_next_steps(0.30)
        assert len(steps) > 0
        assert any("framework" in step.lower() for step in steps)


class TestHumanLevelEvaluationIntegration:
    """Test integration of all evaluation components."""
    
    @patch('tests.human_level_evaluation_framework.run_memory_evaluation')
    @patch('tests.human_level_evaluation_framework.run_conversational_evaluation')
    @patch('tests.human_level_evaluation_framework.run_task_execution_evaluation')
    def test_full_evaluation_integration(self, mock_task, mock_conversation, mock_memory, mock_db):
        """Test full evaluation integration with mocked components."""
        # Setup mocks
        mock_memory.return_value = {
            "capture_evaluation": {"overall_accuracy": 0.85},
            "retrieval_evaluation": {"avg_precision": 0.78},
            "storage_evaluation": {"storage_efficiency": 0.65}
        }
        
        mock_conversation.return_value = {
            "conversation_evaluation": {"multi_turn_coherence": 0.72, "context_retention_rate": 0.68},
            "context_evaluation": {"reference_resolution": 0.75},
            "emotional_evaluation": {"emotional_awareness": 0.80},
            "proactive_evaluation": {"proactive_suggestions": 0.65}
        }
        
        mock_task.return_value = {
            "task_understanding_evaluation": {"task_analysis_accuracy": 0.80},
            "planning_evaluation": {"planning_quality": 0.70},
            "execution_evaluation": {"execution_efficiency": 0.75},
            "problem_solving_evaluation": {"solution_quality": 0.73}
        }
        
        # Run evaluation
        results = run_human_level_evaluation(mock_db, "test_user")
        
        # Verify structure
        assert "timestamp" in results
        assert "user_id" in results
        assert "memory_evaluation" in results
        assert "conversational_evaluation" in results
        assert "task_execution_evaluation" in results
        assert "integrated_evaluation" in results
        assert "overall_human_level_score" in results
        assert "human_level_assessment" in results
        
        # Verify mock calls
        mock_memory.assert_called_once_with(mock_db, "test_user")
        mock_conversation.assert_called_once_with(mock_db, "test_user")
        mock_task.assert_called_once_with(mock_db, "test_user")
    
    def test_evaluation_framework_components(self, mock_db):
        """Test that all evaluation framework components can be instantiated."""
        # Test memory framework
        memory_framework = MemoryEvaluationFramework(mock_db)
        assert memory_framework is not None
        
        # Test conversational framework
        conversation_framework = ConversationalIntelligenceFramework(mock_db)
        assert conversation_framework is not None
        
        # Test task execution framework
        task_framework = TaskExecutionFramework(mock_db)
        assert task_framework is not None
        
        # Test human-level framework
        human_framework = HumanLevelEvaluationFramework(mock_db)
        assert human_framework is not None


class TestHumanLevelReportGeneration:
    """Test human-level report generation."""
    
    def test_report_generation(self, sample_evaluation_results):
        """Test report generation with sample results."""
        report = generate_human_level_report(sample_evaluation_results)
        
        # Check report structure
        assert "Human-Level Personal Assistant Evaluation Report" in report
        assert "Executive Summary" in report
        assert "Component Scores" in report
        assert "Recommendations" in report
        assert "Conclusion" in report
        
        # Check that scores are included
        assert "74.0%" in report  # Overall score
        assert "85.0%" in report  # Memory capture accuracy
        assert "72.0%" in report  # Multi-turn coherence
        
        # Check assessment level
        assert "HUMAN_LEVEL_GOOD" in report
    
    def test_report_with_different_scores(self):
        """Test report generation with different score levels."""
        # Test excellent level
        excellent_results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": "test_user",
            "overall_human_level_score": 0.90,
            "memory_evaluation": {"capture_evaluation": {"overall_accuracy": 0.95}},
            "conversational_evaluation": {"conversation_evaluation": {"multi_turn_coherence": 0.90}},
            "task_execution_evaluation": {"task_understanding_evaluation": {"task_analysis_accuracy": 0.90}},
            "integrated_evaluation": {"conversational_task_integration": 0.90},
            "human_level_assessment": {
                "level": "HUMAN_LEVEL_EXCELLENT",
                "description": "Excellent capabilities",
                "recommendation": "Ready for production"
            }
        }
        
        report = generate_human_level_report(excellent_results)
        assert "HUMAN_LEVEL_EXCELLENT" in report
        assert "90.0%" in report
        
        # Test foundation level
        foundation_results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": "test_user",
            "overall_human_level_score": 0.30,
            "memory_evaluation": {"capture_evaluation": {"overall_accuracy": 0.40}},
            "conversational_evaluation": {"conversation_evaluation": {"multi_turn_coherence": 0.25}},
            "task_execution_evaluation": {"task_understanding_evaluation": {"task_analysis_accuracy": 0.35}},
            "integrated_evaluation": {"conversational_task_integration": 0.20},
            "human_level_assessment": {
                "level": "FOUNDATION_LEVEL",
                "description": "Foundation level",
                "recommendation": "Continue development"
            }
        }
        
        report = generate_human_level_report(foundation_results)
        assert "FOUNDATION_LEVEL" in report
        assert "30.0%" in report


class TestHumanLevelMetrics:
    """Test human-level metrics data structure."""
    
    def test_metrics_initialization(self):
        """Test metrics initialization."""
        metrics = HumanLevelMetrics()
        
        # Check all metrics are initialized to 0.0
        assert metrics.memory_capture_accuracy == 0.0
        assert metrics.memory_retrieval_precision == 0.0
        assert metrics.memory_storage_efficiency == 0.0
        assert metrics.multi_turn_coherence == 0.0
        assert metrics.context_retention_rate == 0.0
        assert metrics.emotional_intelligence == 0.0
        assert metrics.proactive_behavior == 0.0
        assert metrics.task_understanding == 0.0
        assert metrics.planning_ability == 0.0
        assert metrics.execution_efficiency == 0.0
        assert metrics.problem_solving == 0.0
        assert metrics.conversational_task_integration == 0.0
        assert metrics.memory_conversation_integration == 0.0
        assert metrics.proactive_task_anticipation == 0.0
        assert metrics.overall_human_level_score == 0.0
    
    def test_metrics_conversion_to_dict(self):
        """Test metrics conversion to dictionary."""
        metrics = HumanLevelMetrics()
        metrics.memory_capture_accuracy = 0.85
        metrics.overall_human_level_score = 0.75
        
        metrics_dict = metrics.__dict__
        
        assert metrics_dict["memory_capture_accuracy"] == 0.85
        assert metrics_dict["overall_human_level_score"] == 0.75


class TestHumanLevelTestCase:
    """Test human-level test case data structure."""
    
    def test_test_case_creation(self):
        """Test test case creation."""
        test_case = HumanLevelTestCase(
            test_id="test_case_1",
            description="Test description",
            scenario="Test scenario",
            conversation_flow=[{"user": "Hello", "expected_response": "Hi"}],
            expected_memory_captures=["Memory 1"],
            expected_task_execution=[{"task": "Task 1", "actions": ["Action 1"]}],
            complexity_level="intermediate",
            human_level_requirements=["Requirement 1"]
        )
        
        assert test_case.test_id == "test_case_1"
        assert test_case.description == "Test description"
        assert test_case.scenario == "Test scenario"
        assert len(test_case.conversation_flow) == 1
        assert len(test_case.expected_memory_captures) == 1
        assert len(test_case.expected_task_execution) == 1
        assert test_case.complexity_level == "intermediate"
        assert len(test_case.human_level_requirements) == 1


if __name__ == "__main__":
    pytest.main([__file__])

