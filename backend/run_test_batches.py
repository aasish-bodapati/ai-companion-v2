#!/usr/bin/env python3
"""
Comprehensive test batch runner for AI Companion Backend tests.
Runs tests in organized batches with proper error handling and reporting.
"""

import sys
import subprocess
import os
import time
import json
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass


@dataclass
class TestBatch:
    name: str
    description: str
    command: List[str]
    timeout: int = 300
    expected_coverage: float = 0.0


class TestBatchRunner:
    def __init__(self):
        self.backend_dir = Path(__file__).parent
        self.results = []
        self.start_time = time.time()
        
    def log(self, message: str, level: str = "INFO"):
        timestamp = time.strftime("%H:%M:%S")
        prefix = {
            "INFO": "ℹ️",
            "SUCCESS": "✅", 
            "ERROR": "❌",
            "WARNING": "⚠️"
        }.get(level, "ℹ️")
        print(f"{prefix} [{timestamp}] {message}")
    
    def run_batch(self, batch: TestBatch) -> Dict[str, Any]:
        """Run a single test batch and return results."""
        self.log(f"Starting {batch.name}...")
        
        batch_start = time.time()
        result = {
            "batch": batch.name,
            "description": batch.description,
            "status": "unknown",
            "duration": 0,
            "exit_code": 0,
            "output": "",
            "error": "",
            "coverage": 0.0
        }
        
        try:
            # Change to backend directory
            os.chdir(self.backend_dir)
            
            # Run the command
            process = subprocess.run(
                batch.command,
                capture_output=True,
                text=True,
                timeout=batch.timeout
            )
            
            batch_duration = time.time() - batch_start
            result.update({
                "status": "passed" if process.returncode == 0 else "failed",
                "duration": batch_duration,
                "exit_code": process.returncode,
                "output": process.stdout,
                "error": process.stderr
            })
            
            # Extract coverage from output if available
            if "TOTAL" in process.stdout:
                for line in process.stdout.split('\n'):
                    if "TOTAL" in line and "%" in line:
                        try:
                            coverage_str = line.split()[-1].replace('%', '')
                            result["coverage"] = float(coverage_str)
                        except (ValueError, IndexError):
                            pass
                        break
            
            if process.returncode == 0:
                self.log(f"✅ {batch.name} completed successfully in {batch_duration:.1f}s", "SUCCESS")
            else:
                self.log(f"❌ {batch.name} failed after {batch_duration:.1f}s", "ERROR")
                self.log(f"Error: {process.stderr[:200]}...", "ERROR")
                
        except subprocess.TimeoutExpired:
            result.update({
                "status": "timeout",
                "duration": batch.timeout,
                "error": f"Test batch timed out after {batch.timeout} seconds"
            })
            self.log(f"⏰ {batch.name} timed out after {batch.timeout}s", "WARNING")
            
        except Exception as e:
            result.update({
                "status": "error",
                "duration": time.time() - batch_start,
                "error": str(e)
            })
            self.log(f"❌ {batch.name} failed with exception: {e}", "ERROR")
        
        self.results.append(result)
        return result
    
    def run_all_batches(self) -> List[Dict[str, Any]]:
        """Run all test batches in sequence."""
        
        # Define test batches
        batches = [
                         TestBatch(
                 name="unit_tests",
                 description="Unit tests for core functionality",
                 command=["python", "-m", "pytest", "tests/", "-v", "--tb=short", "-m", "not integration", "--disable-warnings"],
                 expected_coverage=0.0
             ),
            TestBatch(
                name="memory_tests", 
                description="Memory system correctness tests",
                command=["python", "-m", "pytest", "tests/test_memory_correctness.py", "-v", "--tb=short", "--disable-warnings"],
                expected_coverage=70.0
            ),
            TestBatch(
                name="crud_tests",
                description="Database CRUD operation tests", 
                command=["python", "-m", "pytest", "tests/test_memory_crud.py", "-v", "--tb=short", "--disable-warnings"],
                expected_coverage=80.0
            ),
            TestBatch(
                name="service_tests",
                description="Memory service layer tests",
                command=["python", "-m", "pytest", "tests/test_memory_service.py", "-v", "--tb=short", "--disable-warnings"],
                expected_coverage=75.0
            ),
            TestBatch(
                name="integration_tests",
                description="API endpoint integration tests",
                command=["python", "-m", "pytest", "tests/test_api_endpoints.py", "-v", "--tb=short", "-m", "integration", "--disable-warnings"],
                expected_coverage=50.0
            ),
            TestBatch(
                name="health_tests",
                description="Health check and monitoring tests",
                command=["python", "-m", "pytest", "tests/test_health_endpoints.py", "-v", "--tb=short", "--disable-warnings"],
                expected_coverage=85.0
            ),
            TestBatch(
                name="onboarding_tests",
                description="Onboarding processing tests",
                command=["python", "-m", "pytest", "tests/test_onboarding_processing.py", "-v", "--tb=short", "--disable-warnings"],
                expected_coverage=90.0
            ),
            TestBatch(
                name="context_tests",
                description="Context manager tests",
                command=["python", "-m", "pytest", "tests/test_context_manager.py", "-v", "--tb=short", "--disable-warnings"],
                expected_coverage=85.0
            ),
                         TestBatch(
                 name="batcher_tests",
                 description="Memory batcher tests",
                 command=["python", "-m", "pytest", "tests/test_memory_batcher.py", "-v", "--tb=short", "--disable-warnings"],
                 expected_coverage=0.0
             ),
            TestBatch(
                name="filter_tests",
                description="Smart memory filter tests",
                command=["python", "-m", "pytest", "tests/test_smart_memory_filter.py", "-v", "--tb=short", "--disable-warnings"],
                expected_coverage=95.0
            )
        ]
        
        self.log(f"Running {len(batches)} test batches...")
        
        for batch in batches:
            self.run_batch(batch)
            time.sleep(1)  # Brief pause between batches
        
        return self.results
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate a comprehensive test report."""
        total_duration = time.time() - self.start_time
        
        # Calculate summary statistics
        total_batches = len(self.results)
        passed_batches = len([r for r in self.results if r["status"] == "passed"])
        failed_batches = len([r for r in self.results if r["status"] in ["failed", "error", "timeout"]])
        
        # Calculate average coverage
        coverage_values = [r["coverage"] for r in self.results if r["coverage"] > 0]
        avg_coverage = sum(coverage_values) / len(coverage_values) if coverage_values else 0.0
        
        report = {
            "summary": {
                "total_batches": total_batches,
                "passed": passed_batches,
                "failed": failed_batches,
                "total_duration": total_duration,
                "average_coverage": avg_coverage,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "results": self.results
        }
        
        # Save report to file
        report_file = self.backend_dir / "test_batch_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Print summary
        self.log("\n" + "="*60, "INFO")
        self.log("📊 TEST BATCH SUMMARY", "INFO")
        self.log("="*60, "INFO")
        self.log(f"Total Batches: {total_batches}", "INFO")
        self.log(f"Passed: {passed_batches}", "SUCCESS" if passed_batches == total_batches else "INFO")
        self.log(f"Failed: {failed_batches}", "ERROR" if failed_batches > 0 else "INFO")
        self.log(f"Total Duration: {total_duration:.1f}s", "INFO")
        self.log(f"Average Coverage: {avg_coverage:.1f}%", "INFO")
        self.log(f"Report saved to: {report_file}", "INFO")
        
        # Print individual results
        self.log("\n📋 INDIVIDUAL RESULTS", "INFO")
        self.log("-"*60, "INFO")
        for result in self.results:
            status_icon = "✅" if result["status"] == "passed" else "❌"
            coverage_info = f" ({result['coverage']:.1f}%)" if result["coverage"] > 0 else ""
            self.log(f"{status_icon} {result['batch']} - {result['duration']:.1f}s{coverage_info}", "INFO")
        
        return report


def main():
    """Main entry point for the test batch runner."""
    runner = TestBatchRunner()
    
    try:
        # Run all test batches
        results = runner.run_all_batches()
        
        # Generate and display report
        report = runner.generate_report()
        
        # Exit with appropriate code
        failed_count = report["summary"]["failed"]
        if failed_count > 0:
            runner.log(f"\n⚠️ {failed_count} test batches failed!", "WARNING")
            sys.exit(1)
        else:
            runner.log("\n🎉 All test batches passed!", "SUCCESS")
            sys.exit(0)
            
    except KeyboardInterrupt:
        runner.log("\n⚠️ Test run interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        runner.log(f"\n❌ Test runner failed: {e}", "ERROR")
        sys.exit(1)


if __name__ == "__main__":
    main()
