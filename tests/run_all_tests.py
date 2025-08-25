#!/usr/bin/env python3
"""
Comprehensive Test Runner
Runs all test suites in the reorganized test structure.
"""
from __future__ import annotations

import sys
import time
from pathlib import Path
from typing import Dict, Any, List

# Add test directories to path
test_dir = Path(__file__).parent
sys.path.insert(0, str(test_dir / "unit"))
sys.path.insert(0, str(test_dir / "integration"))
sys.path.insert(0, str(test_dir / "evaluation"))
sys.path.insert(0, str(test_dir / "e2e"))

# Import test modules
try:
    from test_api_endpoints import APIEndpointTester
    from test_auth_validation import AuthValidationTester
    from test_memory_integration import MemoryIntegrationTester
    from test_conversation_flow import ConversationFlowTester
    from test_chat_evaluation import ChatEvaluator, install_llm_stubs
    from test_flow_simulation import FlowSimulator
    from test_complete_user_flows import E2EFlowTester
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)


class TestSuiteRunner:
    """Runs all test suites and aggregates results"""
    
    def __init__(self):
        self.results: Dict[str, Any] = {}
    
    def run_unit_tests(self) -> Dict[str, Any]:
        """Run unit test suites"""
        print("🔧 Running Unit Tests")
        print("=" * 30)
        
        # API Endpoint Tests
        api_tester = APIEndpointTester()
        api_results = api_tester.run_all_tests()
        
        # Auth Validation Tests
        auth_tester = AuthValidationTester()
        auth_results = auth_tester.run_all_tests()
        
        return {
            "api_endpoints": api_results,
            "auth_validation": auth_results
        }
    
    def run_integration_tests(self) -> Dict[str, Any]:
        """Run integration test suites"""
        print("\n🔗 Running Integration Tests")
        print("=" * 35)
        
        # Memory Integration Tests
        memory_tester = MemoryIntegrationTester()
        memory_results = memory_tester.run_full_test_suite()
        
        # Conversation Flow Tests
        flow_tester = ConversationFlowTester()
        flow_results = flow_tester.run_full_test_suite()
        
        return {
            "memory_integration": memory_results,
            "conversation_flow": flow_results
        }
    
    def run_evaluation_tests(self) -> Dict[str, Any]:
        """Run evaluation test suites"""
        print("\n📊 Running Evaluation Tests")
        print("=" * 35)
        
        # Install LLM stubs for consistent evaluation
        install_llm_stubs()
        
        # Chat Evaluation
        evaluator = ChatEvaluator()
        evaluator.load_scenarios()
        eval_report = evaluator.run_evaluation()
        evaluator.save_report(eval_report)
        
        # Flow Simulation
        simulator = FlowSimulator()
        sim_results = simulator.run_all_scenarios()
        simulator.save_results(sim_results)
        
        return {
            "chat_evaluation": {
                "overall": eval_report.overall,
                "per_dimension": eval_report.per_dimension,
                "total_scenarios": len(eval_report.results)
            },
            "flow_simulation": sim_results
        }
    
    def run_e2e_tests(self) -> Dict[str, Any]:
        """Run end-to-end test suites"""
        print("\n🚀 Running End-to-End Tests")
        print("=" * 35)
        
        # Complete User Flows
        e2e_tester = E2EFlowTester()
        e2e_results = e2e_tester.run_all_flows()
        
        return {
            "complete_user_flows": e2e_results
        }
    
    def calculate_overall_results(self, all_results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall test results"""
        total_tests = 0
        passed_tests = 0
        
        for category, category_results in all_results.items():
            if category == "evaluation":
                # Special handling for evaluation results
                eval_data = category_results.get("chat_evaluation", {})
                if "overall" in eval_data:
                    # Convert evaluation score to pass/fail (threshold: 80)
                    total_tests += 1
                    if eval_data["overall"] >= 80:
                        passed_tests += 1
                
                sim_data = category_results.get("flow_simulation", {})
                if "overall_score" in sim_data:
                    total_tests += 1
                    if sim_data["overall_score"] >= 80:
                        passed_tests += 1
            else:
                # Standard test results
                for suite_name, suite_results in category_results.items():
                    if isinstance(suite_results, dict) and "total_tests" in suite_results:
                        total_tests += suite_results["total_tests"]
                        passed_tests += suite_results["passed_tests"]
        
        success_rate = passed_tests / total_tests if total_tests > 0 else 0
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": success_rate,
            "status": "PASS" if success_rate >= 0.8 else "FAIL"
        }
    
    def run_all_tests(self, skip_e2e: bool = False) -> Dict[str, Any]:
        """Run all test suites"""
        print("🧪 AI Companion Test Suite Runner")
        print("=" * 50)
        
        start_time = time.time()
        
        all_results = {}
        
        try:
            # Unit Tests
            all_results["unit"] = self.run_unit_tests()
            
            # Integration Tests
            all_results["integration"] = self.run_integration_tests()
            
            # Evaluation Tests
            all_results["evaluation"] = self.run_evaluation_tests()
            
            # E2E Tests (optional, can be slow)
            if not skip_e2e:
                all_results["e2e"] = self.run_e2e_tests()
            
        except KeyboardInterrupt:
            print("\n⚠️ Test run interrupted by user")
            return {"error": "Interrupted", "partial_results": all_results}
        except Exception as e:
            print(f"\n❌ Test run failed with error: {e}")
            return {"error": str(e), "partial_results": all_results}
        
        # Calculate overall results
        overall = self.calculate_overall_results(all_results)
        
        # Print summary
        elapsed = time.time() - start_time
        print(f"\n{'=' * 50}")
        print(f"🏁 Test Suite Complete")
        print(f"Total Tests: {overall['total_tests']}")
        print(f"Passed: {overall['passed_tests']}")
        print(f"Success Rate: {overall['success_rate']:.1%}")
        print(f"Status: {overall['status']}")
        print(f"Duration: {elapsed:.1f}s")
        print(f"{'=' * 50}")
        
        return {
            "overall": overall,
            "results": all_results,
            "duration": elapsed
        }


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Run AI Companion test suites")
    parser.add_argument("--skip-e2e", action="store_true", help="Skip E2E tests (faster)")
    parser.add_argument("--unit-only", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration-only", action="store_true", help="Run only integration tests")
    parser.add_argument("--evaluation-only", action="store_true", help="Run only evaluation tests")
    parser.add_argument("--e2e-only", action="store_true", help="Run only E2E tests")
    
    args = parser.parse_args()
    
    runner = TestSuiteRunner()
    
    if args.unit_only:
        results = {"unit": runner.run_unit_tests()}
    elif args.integration_only:
        results = {"integration": runner.run_integration_tests()}
    elif args.evaluation_only:
        results = {"evaluation": runner.run_evaluation_tests()}
    elif args.e2e_only:
        results = {"e2e": runner.run_e2e_tests()}
    else:
        results = runner.run_all_tests(skip_e2e=args.skip_e2e)
    
    if "error" in results:
        sys.exit(1)
    
    overall = results.get("overall", {})
    if overall.get("status") == "FAIL":
        sys.exit(1)


if __name__ == "__main__":
    main()
