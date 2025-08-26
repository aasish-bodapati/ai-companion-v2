"""
Improved test runner for the AI companion testing suite
Organized by test categories and priorities
"""

import subprocess
import sys
import os
from pathlib import Path
import argparse
from typing import List, Dict, Optional


class TestRunner:
    """Organized test runner for different test categories"""
    
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path(__file__).parent.parent
        self.test_categories = {
            'unit': {
                'description': 'Fast unit tests for individual components',
                'paths': ['tests/unit/'],
                'priority': 1
            },
            'integration': {
                'description': 'Integration tests for service interactions',
                'paths': ['tests/integration/'],
                'priority': 2
            },
            'api': {
                'description': 'API endpoint tests',
                'paths': ['tests/test_api.py', 'tests/unit/test_api_endpoints.py'],
                'priority': 2
            },
            'deduplication': {
                'description': 'Deduplication and no-repeated-context tests',
                'paths': [
                    'tests/unit/test_deduplication_service.py',
                    'tests/unit/test_context_tracker.py',
                    'tests/unit/test_consolidation_service.py',
                    'tests/integration/test_deduplication_api.py',
                    'tests/integration/test_no_repeated_context_flow.py'
                ],
                'priority': 1
            },
            'memory': {
                'description': 'Memory system tests (simplified)',
                'paths': [
                    'tests/integration/test_memory_integration.py',
                    'tests/integration/test_vector_search.py',
                    'tests/unit/test_simplified_memory_components.py'
                ],
                'priority': 2
            },
            'e2e': {
                'description': 'End-to-end user flow tests',
                'paths': ['tests/e2e/'],
                'priority': 3
            },
            'smoke': {
                'description': 'Quick smoke tests for basic functionality',
                'paths': ['tests/test_backend_basic.py', 'tests/test_auth_smoke.py'],
                'priority': 1
            }
        }
    
    def run_category(self, category: str, verbose: bool = False, fail_fast: bool = False) -> bool:
        """Run tests for a specific category"""
        if category not in self.test_categories:
            print(f"❌ Unknown test category: {category}")
            print(f"Available categories: {', '.join(self.test_categories.keys())}")
            return False
        
        config = self.test_categories[category]
        print(f"🧪 Running {category} tests: {config['description']}")
        
        # Build pytest command
        cmd = ['python', '-m', 'pytest']
        
        # Add paths
        for path in config['paths']:
            full_path = self.project_root / path
            if full_path.exists():
                cmd.append(str(full_path))
            else:
                print(f"⚠️  Path not found: {path}")
        
        # Add options
        if verbose:
            cmd.append('-v')
        if fail_fast:
            cmd.append('-x')
        
        # Add coverage for unit tests
        if category == 'unit':
            cmd.extend(['--cov=app', '--cov-report=term-missing'])
        
        # Run tests
        try:
            result = subprocess.run(cmd, cwd=self.project_root, capture_output=False)
            success = result.returncode == 0
            
            if success:
                print(f"✅ {category} tests passed")
            else:
                print(f"❌ {category} tests failed")
            
            return success
        except Exception as e:
            print(f"❌ Failed to run {category} tests: {e}")
            return False
    
    def run_priority(self, priority: int, verbose: bool = False, fail_fast: bool = False) -> bool:
        """Run all tests of a specific priority level"""
        categories = [cat for cat, config in self.test_categories.items() 
                     if config['priority'] == priority]
        
        if not categories:
            print(f"❌ No test categories found for priority {priority}")
            return False
        
        print(f"🎯 Running priority {priority} tests: {', '.join(categories)}")
        
        all_passed = True
        for category in categories:
            success = self.run_category(category, verbose, fail_fast)
            all_passed = all_passed and success
            
            if not success and fail_fast:
                break
        
        return all_passed
    
    def run_all(self, verbose: bool = False, fail_fast: bool = False) -> bool:
        """Run all test categories in priority order"""
        print("🚀 Running all tests in priority order")
        
        all_passed = True
        for priority in sorted(set(config['priority'] for config in self.test_categories.values())):
            success = self.run_priority(priority, verbose, fail_fast)
            all_passed = all_passed and success
            
            if not success and fail_fast:
                break
        
        return all_passed
    
    def list_categories(self):
        """List all available test categories"""
        print("📋 Available test categories:")
        for category, config in sorted(self.test_categories.items()):
            priority = config['priority']
            description = config['description']
            paths = ', '.join(config['paths'])
            print(f"  {category} (priority {priority}): {description}")
            print(f"    Paths: {paths}")
            print()
    
    def run_changed_tests(self, verbose: bool = False) -> bool:
        """Run tests related to recently changed files"""
        # Get changed files from git
        try:
            result = subprocess.run(
                ['git', 'diff', '--name-only', 'HEAD~1', 'HEAD'],
                capture_output=True, text=True, cwd=self.project_root
            )
            changed_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
        except:
            print("⚠️  Could not get changed files from git, running deduplication tests instead")
            return self.run_category('deduplication', verbose)
        
        if not changed_files:
            print("ℹ️  No changed files detected, running smoke tests")
            return self.run_category('smoke', verbose)
        
        # Determine which test categories to run based on changed files
        categories_to_run = set()
        
        for file in changed_files:
            if 'deduplication' in file or 'context_tracker' in file or 'consolidation' in file:
                categories_to_run.add('deduplication')
            elif 'memory' in file:
                categories_to_run.add('memory')
            elif 'api' in file:
                categories_to_run.add('api')
            elif file.endswith('.py') and 'backend' in file:
                categories_to_run.add('unit')
            elif file.endswith(('.tsx', '.ts')) and 'frontend' in file:
                categories_to_run.add('smoke')  # Frontend changes trigger smoke tests
        
        if not categories_to_run:
            categories_to_run.add('smoke')
        
        print(f"🎯 Running tests for changed files: {', '.join(categories_to_run)}")
        
        all_passed = True
        for category in categories_to_run:
            success = self.run_category(category, verbose)
            all_passed = all_passed and success
        
        return all_passed


def main():
    parser = argparse.ArgumentParser(description='AI Companion Test Runner')
    parser.add_argument('command', nargs='?', default='changed',
                       help='Test command: category name, "priority N", "all", "changed", or "list"')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Verbose output')
    parser.add_argument('-x', '--fail-fast', action='store_true',
                       help='Stop on first failure')
    parser.add_argument('--project-root', type=str,
                       help='Project root directory')
    
    args = parser.parse_args()
    
    runner = TestRunner(args.project_root)
    
    if args.command == 'list':
        runner.list_categories()
        return
    
    success = False
    
    if args.command == 'all':
        success = runner.run_all(args.verbose, args.fail_fast)
    elif args.command == 'changed':
        success = runner.run_changed_tests(args.verbose)
    elif args.command.startswith('priority'):
        try:
            priority = int(args.command.split()[1])
            success = runner.run_priority(priority, args.verbose, args.fail_fast)
        except (IndexError, ValueError):
            print("❌ Invalid priority format. Use 'priority N' where N is a number")
            sys.exit(1)
    else:
        success = runner.run_category(args.command, args.verbose, args.fail_fast)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
