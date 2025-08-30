#!/usr/bin/env python3
"""
Simple test script to run memory evaluation framework
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_evaluation_framework():
    """Test the evaluation framework with mock data."""
    try:
        from tests.memory_evaluation_framework import MemoryEvaluationFramework
        from unittest.mock import Mock
        
        # Create mock database session
        mock_db = Mock()
        
        # Create framework instance
        framework = MemoryEvaluationFramework(mock_db)
        
        print("✅ Memory Evaluation Framework loaded successfully")
        print(f"📊 Test cases loaded: {len(framework.test_cases)}")
        
        # Test basic functionality
        print("\n🧪 Testing basic evaluation methods...")
        
        # Mock the services using patch
        from unittest.mock import patch
        
        # Create a proper mock for MemorySearchResult
        from app.schemas.memory import MemorySearchResult
        mock_result = Mock(spec=MemorySearchResult)
        mock_result.content = "User loves Italian food"
        mock_result.relevance_score = 0.9
        
        with patch('tests.memory_evaluation_framework.memory_service') as mock_service, \
             patch('tests.memory_evaluation_framework.efficient_storage') as mock_storage, \
             patch('tests.memory_evaluation_framework.contextual_retriever') as mock_retriever:
            
            # Setup mocks
            mock_service._extract_memory_candidates_with_llm.return_value = ["User loves Italian food"]
            mock_service.grade_importance.return_value = 70
            mock_service.store_memory.return_value = "memory_123"
            mock_service.search_memories.return_value = [mock_result]
            mock_service.get_conversation_context.return_value = [mock_result]
            mock_storage.store_memory.return_value = "memory_123"
            mock_storage.retrieve_memory.return_value = {"content": "test"}
            mock_storage.get_storage_stats.return_value = {
                "compression_ratio": 0.4,
                "storage_efficiency": 0.6,
                "cache_hit_rate": 0.8
            }
            
            mock_retriever.search_memories.return_value = [mock_result]
            mock_retriever.get_contextual_memories.return_value = [mock_result]
            
            results = framework.run_comprehensive_evaluation("test_user")
            
            print("✅ Comprehensive evaluation completed")
            print(f"📈 Capture accuracy: {results.get('capture_evaluation', {}).get('overall_accuracy', 0):.1%}")
            print(f"💾 Storage efficiency: {results.get('storage_evaluation', {}).get('storage_efficiency', 0):.1%}")
            print(f"🔍 Retrieval precision: {results.get('retrieval_evaluation', {}).get('avg_precision', 0):.1%}")
            
            # Generate report
            report = framework.generate_evaluation_report(results)
            print(f"📄 Report generated: {len(report)} characters")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing evaluation framework: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_monitoring_system():
    """Test the monitoring system."""
    try:
        from app.monitoring.memory_metrics import memory_monitor
        
        print("\n📊 Testing monitoring system...")
        
        # Test basic metrics collection
        memory_monitor.track_memory_capture("test_user", "test content", True, 50.0, 0.8)
        memory_monitor.track_memory_storage("test_user", "memory_123", 25.0, 0.6, True)
        memory_monitor.track_memory_retrieval("test_user", "test query", 5, 15.0, 0.85)
        
        # Get health status
        health = memory_monitor.get_system_health()
        print(f"✅ System health: {health.get('status', 'unknown')}")
        
        # Get dashboard
        dashboard = memory_monitor.get_performance_dashboard()
        print(f"📈 Dashboard generated with {len(dashboard.get('sections', {}))} sections")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing monitoring system: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Testing Memory Evaluation Framework")
    print("=" * 50)
    
    success = True
    success &= test_evaluation_framework()
    success &= test_monitoring_system()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Memory evaluation framework is ready.")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
