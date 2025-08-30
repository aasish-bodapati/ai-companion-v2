#!/usr/bin/env python3
"""
Comprehensive test runner for AI Companion backend.

This script provides a unified interface for running different types of tests
with various configurations and reporting options.
"""

import argparse
import subprocess
import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Any
import json


class TestRunner:
    """Manages test execution and reporting."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.tests_dir = project_root / "tests"
        self.results_dir = project_root / "test_results"
        self.results_dir.mkdir(exist_ok=True)
        
    def run_tests(self, 
                  test_type: str = "all",
                  markers: List[str] = None,
                  coverage: bool = False,
                  parallel: bool = False,
                  verbose: bool = False,
                  output_format: str = "text") -> Dict[str, Any]:
        """Run tests with specified configuration."""
        
        start_time = time.time()
        
        # Build pytest command
        cmd = ["python", "-m", "pytest"]
        
        # Add test type filters
        if test_type != "all":
            if test_type == "unit":
                cmd.extend(["-m", "unit"])
            elif test_type == "integration":
                cmd.extend(["-m", "integration"])
            elif test_type == "e2e":
                cmd.extend(["-m", "e2e"])
            elif test_type == "performance":
                cmd.extend(["-m", "performance"])
            elif test_type == "smoke":
                cmd.extend(["-m", "smoke"])
            elif test_type == "fast":
                cmd.extend(["-m", "not slow"])
        
        # Add markers
        if markers:
            for marker in markers:
                cmd.extend(["-m", marker])
        
        # Add coverage
        if coverage:
            cmd.extend([
                "--cov=app",
                "--cov-report=html",
                "--cov-report=term-missing",
                "--cov-report=json"
            ])
        
        # Add parallel execution
        if parallel:
            cmd.extend(["-n", "auto"])
        
        # Add verbosity
        if verbose:
            cmd.extend(["-v", "-s"])
        
        # Add output format
        if output_format == "json":
            cmd.extend(["--json-report"])
        
        # Add test discovery
        cmd.append(str(self.tests_dir))
        
        print(f"Running tests with command: {' '.join(cmd)}")
        print(f"Test type: {test_type}")
        print(f"Markers: {markers or 'None'}")
        print(f"Coverage: {coverage}")
        print(f"Parallel: {parallel}")
        print(f"Verbose: {verbose}")
        print("-" * 80)
        
        # Execute tests
        try:
            start_time = time.time()
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout
            )
            
            execution_time = time.time() - start_time
            
            # Parse results
            test_results = self._parse_results(result, execution_time)
            
            # Save results
            self._save_results(test_results, output_format)
            
            # Print summary
            self._print_summary(test_results)
            
            return test_results
            
        except subprocess.TimeoutExpired:
            print("❌ Tests timed out after 1 hour")
            return {"success": False, "error": "Timeout"}
        except Exception as e:
            print(f"❌ Error running tests: {e}")
            return {"success": False, "error": str(e)}
    
    def _parse_results(self, result: subprocess.CompletedProcess, execution_time: float) -> Dict[str, Any]:
        """Parse test execution results."""
        
        success = result.returncode == 0
        
        # Try to extract test counts from output
        output = result.stdout
        error_output = result.stderr
        

        
        # Parse pytest output for test counts
        passed = 0
        failed = 0
        skipped = 0
        errors = 0
        
        # Look for the final summary line that looks like "22 passed, 843 deselected, 4 warnings in 14.44s"
        for line in output.split('\n'):
            line = line.strip()
            # Remove ANSI color codes for parsing
            import re
            clean_line = re.sub(r'\x1b\[[0-9;]*m', '', line)
            
            if 'passed' in clean_line and any(keyword in clean_line for keyword in ['deselected', 'failed', 'warnings', 'skipped']):
                # Look for pattern like "22 passed, 843 deselected, 4 warnings in 14.44s"
                # or "10 passed, 2 failed, 1 skipped"
                parts = clean_line.split(',')
                for part in parts:
                    part = part.strip()
                    # Extract the number from the part
                    if 'passed' in part and not 'deselected' in part:
                        try:
                            # Find the first number in the part
                            numbers = re.findall(r'\d+', part)
                            if numbers:
                                passed = int(numbers[0])
                        except (ValueError, IndexError):
                            pass
                    elif 'failed' in part:
                        try:
                            numbers = re.findall(r'\d+', part)
                            if numbers:
                                failed = int(numbers[0])
                        except (ValueError, IndexError):
                            pass
                    elif 'skipped' in part:
                        try:
                            numbers = re.findall(r'\d+', part)
                            if numbers:
                                skipped = int(numbers[0])
                        except (ValueError, IndexError):
                            pass
                    elif 'error' in part and 'errors' not in part:
                        try:
                            numbers = re.findall(r'\d+', part)
                            if numbers:
                                errors = int(numbers[0])
                        except (ValueError, IndexError):
                            pass
                break
        
        return {
            "success": success,
            "return_code": result.returncode,
            "execution_time": execution_time,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "errors": errors,
            "total": passed + failed + skipped + errors,
            "stdout": output,
            "stderr": error_output
        }
    
    def _save_results(self, results: Dict[str, Any], output_format: str):
        """Save test results to file."""
        
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        if output_format == "json":
            filename = self.results_dir / f"test_results_{timestamp}.json"
            with open(filename, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"Results saved to: {filename}")
        
        # Always save a summary
        summary_file = self.results_dir / f"test_summary_{timestamp}.txt"
        with open(summary_file, 'w') as f:
            f.write(f"Test Results Summary - {timestamp}\n")
            f.write("=" * 50 + "\n")
            f.write(f"Success: {results['success']}\n")
            f.write(f"Execution Time: {results['execution_time']:.2f}s\n")
            f.write(f"Passed: {results['passed']}\n")
            f.write(f"Failed: {results['failed']}\n")
            f.write(f"Skipped: {results['skipped']}\n")
            f.write(f"Errors: {results['errors']}\n")
            f.write(f"Total: {results['total']}\n")
        
        print(f"Summary saved to: {summary_file}")
    
    def _print_summary(self, results: Dict[str, Any]):
        """Print test results summary."""
        
        print("\n" + "=" * 80)
        print("TEST RESULTS SUMMARY")
        print("=" * 80)
        
        if results["success"]:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed")
        
        print(f"⏱️  Execution time: {results['execution_time']:.2f}s")
        print(f"✅ Passed: {results['passed']}")
        print(f"❌ Failed: {results['failed']}")
        print(f"⏭️  Skipped: {results['skipped']}")
        print(f"💥 Errors: {results['errors']}")
        print(f"📊 Total: {results['total']}")
        
        if results['failed'] > 0 or results['errors'] > 0:
            print("\n❌ FAILED TESTS:")
            # Extract failed test names from output
            output_lines = results['stdout'].split('\n')
            for line in output_lines:
                if 'FAILED' in line or 'ERROR' in line:
                    print(f"  {line.strip()}")
        
        print("=" * 80)
    
    def run_specific_tests(self, test_files: List[str], **kwargs) -> Dict[str, Any]:
        """Run specific test files."""
        
        if not test_files:
            return {"success": False, "error": "No test files specified"}
        
        # Build command for specific files
        cmd = ["python", "-m", "pytest"]
        
        if kwargs.get("coverage"):
            cmd.extend(["--cov=app", "--cov-report=term-missing"])
        
        if kwargs.get("verbose"):
            cmd.extend(["-v", "-s"])
        
        cmd.extend(test_files)
        
        print(f"Running specific tests: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            execution_time = time.time()
            test_results = self._parse_results(result, execution_time)
            self._print_summary(test_results)
            
            return test_results
            
        except Exception as e:
            print(f"❌ Error running specific tests: {e}")
            return {"success": False, "error": str(e)}
    
    def list_test_categories(self):
        """List available test categories."""
        
        print("Available test categories:")
        print("-" * 30)
        
        categories = [
            ("unit", "Fast unit tests (< 100ms each)"),
            ("integration", "Integration tests (100ms - 1s each)"),
            ("e2e", "End-to-end tests (1s+ each)"),
            ("performance", "Performance and load tests"),
            ("smoke", "Critical path tests"),
            ("fast", "All tests except slow ones"),
            ("all", "All tests")
        ]
        
        for category, description in categories:
            print(f"  {category:<15} - {description}")
        
        print("\nAvailable markers:")
        print("-" * 20)
        
        markers = [
            "memory", "auth", "api", "database", "llm", 
            "conversation", "scheduler", "slow", "timeout"
        ]
        
        for marker in markers:
            print(f"  {marker}")
    
    def generate_test_report(self, output_format: str = "html"):
        """Generate comprehensive test report."""
        
        print(f"Generating {output_format} test report...")
        
        if output_format == "html":
            cmd = [
                "python", "-m", "pytest",
                "--cov=app",
                "--cov-report=html",
                "--cov-report=term-missing",
                "--html=test_results/report.html",
                "--self-contained-html"
            ]
        else:
            cmd = [
                "python", "-m", "pytest",
                "--cov=app",
                "--cov-report=json",
                "--json-report"
            ]
        
        try:
            subprocess.run(cmd, cwd=self.project_root, check=True)
            print("✅ Test report generated successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error generating report: {e}")


def main():
    """Main entry point."""
    
    parser = argparse.ArgumentParser(
        description="AI Companion Backend Test Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all tests
  python run_tests.py
  
  # Run only unit tests
  python run_tests.py --type unit
  
  # Run tests with coverage
  python run_tests.py --coverage
  
  # Run specific test files
  python run_tests.py --files tests/unit/test_memory.py tests/integration/test_api.py
  
  # Run tests with specific markers
  python run_tests.py --markers memory auth
  
  # Generate HTML report
  python run_tests.py --report html
        """
    )
    
    parser.add_argument(
        "--type", "-t",
        choices=["all", "unit", "integration", "e2e", "performance", "smoke", "fast"],
        default="all",
        help="Type of tests to run"
    )
    
    parser.add_argument(
        "--markers", "-m",
        nargs="+",
        help="Pytest markers to include"
    )
    
    parser.add_argument(
        "--coverage", "-c",
        action="store_true",
        help="Generate coverage report"
    )
    
    parser.add_argument(
        "--parallel", "-p",
        action="store_true",
        help="Run tests in parallel"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output"
    )
    
    parser.add_argument(
        "--output", "-o",
        choices=["text", "json"],
        default="text",
        help="Output format"
    )
    
    parser.add_argument(
        "--files", "-f",
        nargs="+",
        help="Specific test files to run"
    )
    
    parser.add_argument(
        "--report", "-r",
        choices=["html", "json"],
        help="Generate test report"
    )
    
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List available test categories and markers"
    )
    
    args = parser.parse_args()
    
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir
    
    runner = TestRunner(project_root)
    
    if args.list:
        runner.list_test_categories()
        return
    
    if args.report:
        runner.generate_test_report(args.report)
        return
    
    if args.files:
        # Run specific test files
        results = runner.run_specific_tests(
            args.files,
            coverage=args.coverage,
            verbose=args.verbose
        )
    else:
        # Run tests by category
        results = runner.run_tests(
            test_type=args.type,
            markers=args.markers,
            coverage=args.coverage,
            parallel=args.parallel,
            verbose=args.verbose,
            output_format=args.output
        )
    
    # Exit with appropriate code
    sys.exit(0 if results.get("success", False) else 1)


if __name__ == "__main__":
    main()
