#!/usr/bin/env python3
"""
Test runner script for the health logging application.
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print('='*60)
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        return False


def main():
    """Main test runner function."""
    # Change to the backend directory
    backend_dir = Path(__file__).parent.parent
    os.chdir(backend_dir)
    
    print("Health Logging Application - Test Suite")
    print("=" * 50)
    
    # Install dependencies if needed
    print("\n1. Installing test dependencies...")
    if not run_command("pip install -r requirements.txt", "Installing dependencies"):
        print("Failed to install dependencies. Please check your Python environment.")
        return 1
    
    # Run unit tests
    print("\n2. Running unit tests...")
    if not run_command("python -m pytest tests/unit/ -v --tb=short", "Unit tests"):
        print("Unit tests failed!")
        return 1
    
    # Run integration tests
    print("\n3. Running integration tests...")
    if not run_command("python -m pytest tests/integration/ -v --tb=short", "Integration tests"):
        print("Integration tests failed!")
        return 1
    
    # Run all tests with coverage
    print("\n4. Running all tests with coverage...")
    if not run_command("python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing", "All tests with coverage"):
        print("Some tests failed, but continuing...")
    
    print("\n" + "="*60)
    print("Test suite completed!")
    print("Coverage report generated in htmlcov/index.html")
    print("="*60)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
