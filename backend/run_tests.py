#!/usr/bin/env python3
"""
Test runner script for AI Companion MVP tests.

This script provides an easy way to run all MVP tests with proper configuration.
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"❌ Command not found: {cmd[0]}")
        return False


def main():
    """Main test runner function."""
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print("🚀 AI Companion MVP Test Runner")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not (backend_dir / "app").exists():
        print("❌ Error: Not in backend directory or app folder not found")
        sys.exit(1)
    
    # Check if pytest is available
    try:
        subprocess.run(["pytest", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Error: pytest not found. Please install it with: pip install pytest")
        sys.exit(1)
    
    # Test commands
    test_commands = [
        {
            "cmd": ["pytest", "tests/", "-v", "--tb=short"],
            "description": "All MVP Tests"
        },
        {
            "cmd": ["pytest", "tests/test_conversations.py", "-v"],
            "description": "Conversation & Chat Tests"
        },
        {
            "cmd": ["pytest", "tests/test_memory_system.py", "-v"],
            "description": "Memory System Tests"
        },
        {
            "cmd": ["pytest", "tests/test_productivity_tools.py", "-v"],
            "description": "Productivity Tools Tests"
        },
        {
            "cmd": ["pytest", "tests/test_auth_user_management.py", "-v"],
            "description": "User Management & Auth Tests"
        },
        {
            "cmd": ["pytest", "tests/test_onboarding_flow.py", "-v"],
            "description": "Onboarding Flow Tests"
        },
        {
            "cmd": ["pytest", "tests/test_incognito_mode.py", "-v"],
            "description": "Incognito Mode Tests"
        },
        {
            "cmd": ["pytest", "tests/test_monitoring_analytics.py", "-v"],
            "description": "Monitoring & Analytics Tests"
        },
        {
            "cmd": ["pytest", "tests/test_performance.py", "-v", "-s"],
            "description": "Performance Tests"
        }
    ]
    
    # Coverage command
    coverage_commands = [
        {
            "cmd": ["pytest", "tests/", "--cov=app", "--cov-report=html", "--cov-report=term"],
            "description": "Test Coverage Report"
        }
    ]
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        
        if arg == "all":
            # Run all tests
            success = True
            for test_cmd in test_commands:
                if not run_command(test_cmd["cmd"], test_cmd["description"]):
                    success = False
            
            if success:
                print(f"\n🎉 All tests passed! MVP is ready for production.")
            else:
                print(f"\n⚠️  Some tests failed. Please review the output above.")
                sys.exit(1)
                
        elif arg == "coverage":
            # Run tests with coverage
            run_command(coverage_commands[0]["cmd"], coverage_commands[0]["description"])
            
        elif arg == "quick":
            # Run core tests only (skip performance)
            core_tests = [cmd for cmd in test_commands if "performance" not in cmd["description"].lower()]
            success = True
            for test_cmd in core_tests:
                if not run_command(test_cmd["cmd"], test_cmd["description"]):
                    success = False
            
            if success:
                print(f"\n🎉 Core tests passed!")
            else:
                print(f"\n⚠️  Some core tests failed.")
                sys.exit(1)
                
        elif arg in ["conv", "conversation"]:
            run_command(test_commands[1]["cmd"], test_commands[1]["description"])
        elif arg in ["mem", "memory"]:
            run_command(test_commands[2]["cmd"], test_commands[2]["description"])
        elif arg in ["prod", "productivity"]:
            run_command(test_commands[3]["cmd"], test_commands[3]["description"])
        elif arg in ["auth", "user"]:
            run_command(test_commands[4]["cmd"], test_commands[4]["description"])
        elif arg in ["onboard", "onboarding"]:
            run_command(test_commands[5]["cmd"], test_commands[5]["description"])
        elif arg in ["incognito", "privacy"]:
            run_command(test_commands[6]["cmd"], test_commands[6]["description"])
        elif arg in ["monitor", "analytics"]:
            run_command(test_commands[7]["cmd"], test_commands[7]["description"])
        elif arg in ["perf", "performance"]:
            run_command(test_commands[8]["cmd"], test_commands[8]["description"])
        else:
            print_usage()
    else:
        print_usage()


def print_usage():
    """Print usage information."""
    print("""
Usage: python run_tests.py [command]

Commands:
  all         Run all MVP tests (default)
  quick       Run core tests (skip performance)
  coverage    Run tests with coverage report
  conv        Run conversation & chat tests only
  memory      Run memory system tests only
  productivity Run productivity tools tests only
  auth        Run user management & auth tests only
  onboarding  Run onboarding flow tests only
  incognito   Run incognito mode tests only
  monitor     Run monitoring & analytics tests only
  performance Run performance tests only

Examples:
  python run_tests.py all
  python run_tests.py quick
  python run_tests.py coverage
  python run_tests.py memory

MVP Test Categories:
  1. Conversations & Chat - Message handling, AI replies, history
  2. Memory System - Capture, retrieval, deduplication, lifecycle
  3. Productivity Tools - Notes, tasks, reminders CRUD
  4. User Management - Authentication, profiles, security
  5. Onboarding Flow - Initial data processing into memories
  6. Incognito Mode - Privacy features, memory isolation
  7. Monitoring & Analytics - System observability, metrics
  8. Performance - Basic load testing, latency checks

Success Criteria:
  ✅ All tests pass → Production-ready MVP with memory-first architecture
  ❌ Any test fails → Review and fix issues before deployment
""")


if __name__ == "__main__":
    main()
