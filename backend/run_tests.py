#!/usr/bin/env python3
"""
Test runner script for AI Companion Backend tests.
"""

import sys
import subprocess
import os
from pathlib import Path


def run_tests():
    """Run the test suite with proper configuration."""
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Test configuration
    test_args = [
        "python", "-m", "pytest",
        "tests/",
        "-v",  # Verbose output
        "--tb=short",  # Short traceback format
        "--cov=app",  # Coverage for app module
        "--cov-report=term-missing",  # Show missing lines
        "--cov-report=html:htmlcov",  # HTML coverage report
        "--cov-fail-under=80",  # Fail if coverage < 80%
        "-x",  # Stop on first failure
        "--disable-warnings",  # Disable warnings for cleaner output
    ]
    
    # Add specific test markers if needed
    if len(sys.argv) > 1:
        if sys.argv[1] == "--unit":
            test_args.extend(["-m", "not integration"])
        elif sys.argv[1] == "--integration":
            test_args.extend(["-m", "integration"])
        elif sys.argv[1] == "--memory":
            test_args.extend(["tests/test_memory_correctness.py"])
        elif sys.argv[1] == "--api":
            test_args.extend(["tests/test_api_endpoints.py"])
        elif sys.argv[1] == "--crud":
            test_args.extend(["tests/test_memory_crud.py"])
        elif sys.argv[1] == "--service":
            test_args.extend(["tests/test_memory_service.py"])
        elif sys.argv[1] == "--onboarding":
            test_args.extend(["tests/test_onboarding_processing.py"])
    
    print("Running AI Companion Backend Tests...")
    print(f"Command: {' '.join(test_args)}")
    print("-" * 60)
    
    try:
        result = subprocess.run(test_args, check=False)
        return result.returncode
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
        return 1
    except Exception as e:
        print(f"Error running tests: {e}")
        return 1


def run_specific_test_suite():
    """Run specific test suites based on command line arguments."""
    
    if len(sys.argv) < 2:
        print("Usage: python run_tests.py [--unit|--integration|--memory|--api|--crud|--service|--onboarding]")
        print("\nTest suites:")
        print("  --unit         Run unit tests only")
        print("  --integration  Run integration tests only")
        print("  --memory       Run memory correctness tests")
        print("  --api          Run API endpoint tests")
        print("  --crud         Run CRUD operation tests")
        print("  --service      Run memory service tests")
        print("  --onboarding   Run onboarding processing tests")
        return 1
    
    return run_tests()


if __name__ == "__main__":
    if len(sys.argv) == 1:
        # Run all tests
        exit_code = run_tests()
    else:
        # Run specific test suite
        exit_code = run_specific_test_suite()
    
    sys.exit(exit_code)
