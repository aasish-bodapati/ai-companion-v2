#!/usr/bin/env python3
"""
Test Migration Script

This script automatically migrates existing tests to the new organized structure:
- tests/unit/ - Fast, isolated unit tests
- tests/integration/ - Component interaction tests  
- tests/e2e/ - End-to-end workflow tests
- tests/performance/ - Performance and load tests

Usage:
    python scripts/migrate_tests.py [--dry-run] [--force]
"""

import os
import shutil
import re
import argparse
from pathlib import Path
from typing import Dict, List, Tuple


# Test classification rules
TEST_CLASSIFICATIONS = {
    # Unit tests - isolated, fast, no external dependencies
    'unit': [
        'test_.*_utils\.py',
        'test_.*_service.*\.py',
        'test_.*_model.*\.py',
        'test_.*_core.*\.py',
        'test_.*_helper.*\.py',
        'test_.*_validator.*\.py',
        'test_.*_formatter.*\.py',
        'test_.*_converter.*\.py',
    ],
    
    # Integration tests - component interactions, database, API
    'integration': [
        'test_.*_api.*\.py',
        'test_.*_endpoint.*\.py',
        'test_.*_database.*\.py',
        'test_.*_crud.*\.py',
        'test_.*_middleware.*\.py',
        'test_.*_auth.*\.py',
        'test_.*_conversation.*\.py',
        'test_.*_memory.*\.py',
    ],
    
    # E2E tests - complete workflows, user scenarios
    'e2e': [
        'test_.*_workflow.*\.py',
        'test_.*_scenario.*\.py',
        'test_.*_user.*\.py',
        'test_.*_complete.*\.py',
        'test_.*_real.*\.py',
        'test_.*_world.*\.py',
        'test_.*_effectiveness.*\.py',
        'test_.*_behavior.*\.py',
        'test_.*_evaluation.*\.py',
        'test_.*_integration.*\.py',
    ],
    
    # Performance tests - load testing, benchmarks
    'performance': [
        'test_.*_performance.*\.py',
        'test_.*_load.*\.py',
        'test_.*_stress.*\.py',
        'test_.*_benchmark.*\.py',
        'test_.*_scalability.*\.py',
    ]
}


def classify_test_file(filename: str) -> str:
    """Classify a test file based on its name and content."""
    filename_lower = filename.lower()
    
    # Check each classification
    for test_type, patterns in TEST_CLASSIFICATIONS.items():
        for pattern in patterns:
            if re.match(pattern, filename_lower):
                return test_type
    
    # Default to unit if no pattern matches
    return 'unit'


def analyze_test_content(file_path: Path) -> str:
    """Analyze test file content to better classify it."""
    try:
        content = file_path.read_text(encoding='utf-8')
        content_lower = content.lower()
        
        # Look for integration indicators
        if any(indicator in content_lower for indicator in [
            'testclient', 'fastapi.testclient', 'httpx.asynctestclient',
            'database', 'session', 'transaction', 'commit', 'rollback',
            'middleware', 'authentication', 'authorization'
        ]):
            return 'integration'
        
        # Look for E2E indicators
        if any(indicator in content_lower for indicator in [
            'workflow', 'scenario', 'user story', 'complete flow',
            'real world', 'effectiveness', 'behavior', 'evaluation'
        ]):
            return 'e2e'
        
        # Look for performance indicators
        if any(indicator in content_lower for indicator in [
            'performance', 'load', 'stress', 'benchmark', 'scalability',
            'timeout', 'concurrent', 'parallel'
        ]):
            return 'performance'
        
    except Exception as e:
        print(f"Warning: Could not analyze {file_path}: {e}")
    
    return 'unit'  # Default fallback


def get_target_directory(test_type: str) -> Path:
    """Get the target directory for a test type."""
    return Path(f"tests/{test_type}")


def migrate_test_file(source_path: Path, test_type: str, dry_run: bool = False) -> bool:
    """Migrate a single test file to its new location."""
    target_dir = get_target_directory(test_type)
    target_path = target_dir / source_path.name
    
    # Create target directory if it doesn't exist
    if not dry_run:
        target_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine if we need to move or copy
    if source_path.parent == Path("tests"):
        # File is in root tests directory, move it
        if dry_run:
            print(f"Would move: {source_path} -> {target_path}")
        else:
            shutil.move(str(source_path), str(target_path))
            print(f"Moved: {source_path} -> {target_path}")
        return True
    else:
        # File is already in a subdirectory, check if it's in the right place
        current_type = source_path.parent.name
        if current_type == test_type:
            print(f"Already in correct location: {source_path}")
            return False
        else:
            if dry_run:
                print(f"Would move: {source_path} -> {target_path}")
            else:
                shutil.move(str(source_path), str(target_path))
                print(f"Moved: {source_path} -> {target_path}")
            return True


def create_init_files(dry_run: bool = False):
    """Create __init__.py files in all test directories."""
    init_content = '''"""
Test package for {test_type} tests.
"""

# This file ensures the directory is treated as a Python package
'''
    
    for test_type in TEST_CLASSIFICATIONS.keys():
        target_dir = get_target_directory(test_type)
        init_file = target_dir / "__init__.py"
        
        if not dry_run:
            target_dir.mkdir(parents=True, exist_ok=True)
            init_file.write_text(init_content.format(test_type=test_type))
            print(f"Created: {init_file}")
        else:
            print(f"Would create: {init_file}")


def migrate_tests(dry_run: bool = False, force: bool = False) -> Dict[str, int]:
    """Migrate all tests to the new organized structure."""
    tests_dir = Path("tests")
    if not tests_dir.exists():
        print("Error: tests directory not found!")
        return {}
    
    # Statistics
    stats = {test_type: 0 for test_type in TEST_CLASSIFICATIONS.keys()}
    stats['skipped'] = 0
    stats['errors'] = 0
    
    # Find all test files
    test_files = []
    for pattern in ["test_*.py", "*_test.py"]:
        test_files.extend(tests_dir.rglob(pattern))
    
    print(f"Found {len(test_files)} test files to migrate")
    print()
    
    for test_file in test_files:
        try:
            # Skip if it's already in the right place
            if test_file.parent.name in TEST_CLASSIFICATIONS.keys():
                print(f"Skipping (already organized): {test_file}")
                stats['skipped'] += 1
                continue
            
            # Classify the test
            test_type = classify_test_file(test_file.name)
            
            # Double-check with content analysis
            content_type = analyze_test_content(test_file)
            if content_type != test_type:
                print(f"Reclassified {test_file.name}: {test_type} -> {content_type}")
                test_type = content_type
            
            # Migrate the file
            if migrate_test_file(test_file, test_type, dry_run):
                stats[test_type] += 1
            
        except Exception as e:
            print(f"Error processing {test_file}: {e}")
            stats['errors'] += 1
    
    # Create __init__.py files
    create_init_files(dry_run)
    
    return stats


def main():
    parser = argparse.ArgumentParser(description="Migrate tests to new organized structure")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without doing it")
    parser.add_argument("--force", action="store_true", help="Force migration even if files exist")
    
    args = parser.parse_args()
    
    print("🧪 Test Migration Script")
    print("=" * 50)
    
    if args.dry_run:
        print("DRY RUN MODE - No files will be modified")
        print()
    
    # Run migration
    stats = migrate_tests(dry_run=args.dry_run, force=args.force)
    
    # Print summary
    print()
    print("📊 Migration Summary")
    print("=" * 50)
    for test_type, count in stats.items():
        if count > 0:
            print(f"{test_type.capitalize()}: {count}")
    
    if args.dry_run:
        print()
        print("To actually perform the migration, run without --dry-run")
    else:
        print()
        print("✅ Migration complete!")
        print()
        print("Next steps:")
        print("1. Review the new test organization")
        print("2. Update any import statements if needed")
        print("3. Run tests to ensure everything works")
        print("4. Commit the new structure")


if __name__ == "__main__":
    main()

