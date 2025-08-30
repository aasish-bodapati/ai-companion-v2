"""
Automated tests for memory evaluation framework.
"""

import pytest
import json
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from tests.memory_evaluation_framework import (
    MemoryEvaluationFramework,
    MemoryEvaluationMetrics,
    EvaluationTestCase,
    run_memory_evaluation
)


@pytest.fixture
def mock_db():
    """Mock database session."""
    return Mock(spec=Session)


@pytest.fixture
def evaluation_framework(mock_db):
    """Create evaluation framework instance."""
    return MemoryEvaluationFramework(mock_db)


def test_evaluation_metrics_initialization():
    """Test metrics initialization."""
    metrics = MemoryEvaluationMetrics()
    assert metrics.capture_accuracy == 0.0
    assert metrics.storage_efficiency == 0.0
    assert metrics.retrieval_precision == 0.0


def test_test_case_creation():
    """Test evaluation test case creation."""
    test_case = EvaluationTestCase(
        test_id="test_1",
        description="Test case",
        input_text="I love pizza",
        expected_memories=["User loves pizza"],
        expected_importance=0.7,
        context={"theme": "food"}
    )
    
    assert test_case.test_id == "test_1"
    assert test_case.emotional_state == "neutral"
    assert test_case.content_type == "message"


def test_fuzzy_matching(evaluation_framework):
    """Test fuzzy matching algorithm."""
    # Exact match
    assert evaluation_framework._fuzzy_match("hello world", "hello world")
    
    # Partial match above threshold - "loves pizza" should match
    assert evaluation_framework._fuzzy_match("user loves pizza", "loves pizza")
    
    # No match below threshold
    assert not evaluation_framework._fuzzy_match("completely different", "nothing similar")


def test_extraction_accuracy_calculation(evaluation_framework):
    """Test extraction accuracy calculation."""
    # Perfect match
    extracted = ["User loves Italian food", "Prefers pasta"]
    expected = ["User loves Italian food", "Prefers pasta"]
    accuracy = evaluation_framework._evaluate_extraction_accuracy(extracted, expected)
    assert accuracy == 1.0
    
    # Partial match
    extracted = ["User loves Italian food"]
    expected = ["User loves Italian food", "Prefers pasta"]
    accuracy = evaluation_framework._evaluate_extraction_accuracy(extracted, expected)
    assert accuracy == 0.5
    
    # No match
    extracted = ["Something else"]
    expected = ["User loves Italian food"]
    accuracy = evaluation_framework._evaluate_extraction_accuracy(extracted, expected)
    assert accuracy == 0.0


def test_precision_calculation(evaluation_framework):
    """Test precision calculation for retrieval results."""
    # Mock search results
    mock_results = [
        Mock(content="User loves Italian food"),
        Mock(content="User works at Google"),
        Mock(content="Random unrelated content")
    ]
    
    expected = ["Italian food", "Google"]
    precision = evaluation_framework._calculate_precision(mock_results, expected)
    assert precision == 2/3  # 2 relevant out of 3 results


def test_recall_calculation(evaluation_framework):
    """Test recall calculation for retrieval results."""
    # Mock search results
    mock_results = [
        Mock(content="User loves Italian food"),
        Mock(content="Random content")
    ]
    
    expected = ["Italian food", "Google", "Pizza"]
    recall = evaluation_framework._calculate_recall(mock_results, expected)
    assert recall == 1/3  # Found 1 out of 3 expected items


@patch('tests.memory_evaluation_framework.memory_service')
def test_memory_capture_evaluation(mock_memory_service, evaluation_framework):
    """Test memory capture evaluation."""
    # Mock LLM extraction
    mock_memory_service._extract_memory_candidates_with_llm.return_value = [
        "User loves Italian food"
    ]
    
    # Mock importance scoring
    mock_memory_service.grade_importance.return_value = 70  # 0.7 on 0-1 scale
    
    user_id = "test_user"
    results = evaluation_framework.evaluate_memory_capture(user_id)
    
    assert "overall_accuracy" in results
    assert "importance_accuracy" in results
    assert "test_results" in results
    assert len(results["test_results"]) == len(evaluation_framework.test_cases)


@patch('tests.memory_evaluation_framework.efficient_storage')
def test_storage_evaluation(mock_storage, evaluation_framework):
    """Test storage system evaluation."""
    # Mock storage operations
    mock_storage.store_memory.return_value = "memory_123"
    mock_storage.retrieve_memory.return_value = {"content": "test"}
    mock_storage.get_storage_stats.return_value = {
        "compression_ratio": 0.4,
        "storage_efficiency": 0.6,
        "cache_hit_rate": 0.8
    }
    
    user_id = "test_user"
    results = evaluation_framework.evaluate_storage_system(user_id)
    
    assert "avg_storage_time_ms" in results
    assert "compression_ratio" in results
    assert "storage_efficiency" in results
    assert "cache_hit_rate" in results


@patch('tests.memory_evaluation_framework.memory_service')
@patch('tests.memory_evaluation_framework.contextual_retriever')
def test_retrieval_evaluation(mock_contextual, mock_memory_service, evaluation_framework):
    """Test retrieval system evaluation."""
    # Mock search results
    mock_memory_service.search_memories.return_value = [
        Mock(content="User loves Italian food", relevance_score=0.9),
        Mock(content="User works at Google", relevance_score=0.8)
    ]
    
    mock_contextual.get_contextual_memories.return_value = [
        Mock(content="Contextual memory", relevance_score=0.7)
    ]
    
    # Mock store_memory to avoid actual storage
    mock_memory_service.store_memory.return_value = None
    
    user_id = "test_user"
    results = evaluation_framework.evaluate_retrieval_system(user_id)
    
    assert "avg_precision" in results
    assert "avg_recall" in results
    assert "avg_latency_ms" in results
    assert "test_results" in results


@patch('tests.memory_evaluation_framework.memory_service')
def test_performance_evaluation(mock_memory_service, evaluation_framework):
    """Test performance evaluation under load."""
    # Mock all memory service operations
    mock_memory_service.store_memory.return_value = None
    mock_memory_service.search_memories.return_value = []
    mock_memory_service.get_conversation_context.return_value = "context"
    
    user_id = "test_user"
    results = evaluation_framework.evaluate_performance(user_id)
    
    assert "throughput_ops_per_sec" in results
    assert "avg_operation_time_ms" in results
    assert "error_rate" in results
    assert "total_operations" in results


@patch('tests.memory_evaluation_framework.memory_service')
def test_end_to_end_evaluation(mock_memory_service, evaluation_framework):
    """Test end-to-end flow evaluation."""
    # Mock memory service operations
    mock_memory_service._extract_memory_candidates_with_llm.return_value = [
        "Extracted memory"
    ]
    mock_memory_service.store_memory.return_value = None
    mock_memory_service.get_conversation_context.return_value = "conversation context"
    
    user_id = "test_user"
    results = evaluation_framework.evaluate_end_to_end_flow(user_id)
    
    assert "conversation_flow" in results
    assert "total_messages" in results
    assert "avg_processing_time_ms" in results
    assert len(results["conversation_flow"]) == 5  # Number of test messages


def test_comprehensive_evaluation_structure(mock_db):
    """Test comprehensive evaluation returns proper structure."""
    with patch.multiple(
        'tests.memory_evaluation_framework.MemoryEvaluationFramework',
        evaluate_memory_capture=Mock(return_value={"overall_accuracy": 0.8}),
        evaluate_storage_system=Mock(return_value={"storage_efficiency": 0.6}),
        evaluate_retrieval_system=Mock(return_value={"avg_precision": 0.7}),
        evaluate_performance=Mock(return_value={"throughput_ops_per_sec": 100}),
        evaluate_end_to_end_flow=Mock(return_value={"total_messages": 5})
    ):
        framework = MemoryEvaluationFramework(mock_db)
        results = framework.run_comprehensive_evaluation("test_user")
        
        assert "timestamp" in results
        assert "user_id" in results
        assert "capture_evaluation" in results
        assert "storage_evaluation" in results
        assert "retrieval_evaluation" in results
        assert "performance_evaluation" in results
        assert "integration_evaluation" in results
        assert "overall_metrics" in results


def test_evaluation_report_generation(mock_db):
    """Test evaluation report generation."""
    # Mock evaluation results
    mock_results = {
        "timestamp": "2024-01-01T00:00:00Z",
        "user_id": "test_user",
        "capture_evaluation": {"overall_accuracy": 0.85, "importance_accuracy": 0.80},
        "storage_evaluation": {
            "storage_efficiency": 0.65,
            "compression_ratio": 0.40,
            "cache_hit_rate": 0.75,
            "avg_storage_time_ms": 5.2
        },
        "retrieval_evaluation": {
            "avg_precision": 0.78,
            "avg_recall": 0.72,
            "avg_latency_ms": 12.5
        },
        "performance_evaluation": {
            "throughput_ops_per_sec": 150.5,
            "error_rate": 0.02
        }
    }
    
    framework = MemoryEvaluationFramework(mock_db)
    report = framework.generate_evaluation_report(mock_results)
    
    assert "Memory System Evaluation Report" in report
    assert "Executive Summary" in report
    assert "Detailed Results" in report
    assert "Recommendations" in report
    assert "85.00%" in report  # Capture accuracy
    assert "65.00%" in report  # Storage efficiency


@patch('tests.memory_evaluation_framework.MemoryEvaluationFramework')
def test_run_memory_evaluation_function(mock_framework_class, mock_db):
    """Test the utility function for running evaluations."""
    # Mock framework instance
    mock_framework = Mock()
    mock_framework.run_comprehensive_evaluation.return_value = {"test": "results"}
    mock_framework_class.return_value = mock_framework
    
    results = run_memory_evaluation(mock_db, "test_user")
    
    mock_framework_class.assert_called_once_with(mock_db)
    mock_framework.run_comprehensive_evaluation.assert_called_once_with("test_user")
    assert results == {"test": "results"}


def test_metrics_update_during_evaluation(evaluation_framework):
    """Test that metrics are properly updated during evaluation."""
    # Initially all metrics should be 0
    assert evaluation_framework.metrics.capture_accuracy == 0.0
    assert evaluation_framework.metrics.storage_efficiency == 0.0
    
    # Mock some evaluation methods to update metrics
    with patch.object(evaluation_framework, '_evaluate_extraction_accuracy', return_value=0.8):
        with patch('tests.memory_evaluation_framework.memory_service') as mock_service:
            mock_service._extract_memory_candidates_with_llm.return_value = ["test"]
            mock_service.grade_importance.return_value = 80
            
            evaluation_framework.evaluate_memory_capture("test_user")
            
            # Metrics should be updated
            assert evaluation_framework.metrics.capture_accuracy > 0.0


if __name__ == "__main__":
    pytest.main([__file__])
