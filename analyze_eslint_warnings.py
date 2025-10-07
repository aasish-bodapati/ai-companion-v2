#!/usr/bin/env python3
"""
ESLint Warning Analyzer
Finds the 5 files with the most number of warnings from ESLint output
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

def analyze_eslint_results(json_file_path):
    """Analyze ESLint JSON results and find files with most warnings"""
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {json_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {json_file_path}: {e}")
        return
    
    # Count warnings per file
    file_warnings = defaultdict(int)
    file_errors = defaultdict(int)
    file_details = defaultdict(list)
    
    for result in data:
        file_path = result.get('filePath', 'unknown')
        messages = result.get('messages', [])
        
        for message in messages:
            severity = message.get('severity', 0)
            line = message.get('line', 0)
            column = message.get('column', 0)
            rule = message.get('ruleId', 'unknown')
            message_text = message.get('message', '')
            
            if severity == 1:  # Warning
                file_warnings[file_path] += 1
                file_details[file_path].append({
                    'type': 'warning',
                    'line': line,
                    'column': column,
                    'rule': rule,
                    'message': message_text
                })
            elif severity == 2:  # Error
                file_errors[file_path] += 1
                file_details[file_path].append({
                    'type': 'error',
                    'line': line,
                    'column': column,
                    'rule': rule,
                    'message': message_text
                })
    
    # Sort files by warning count (descending)
    sorted_warnings = sorted(file_warnings.items(), key=lambda x: x[1], reverse=True)
    
    print("=" * 80)
    print("ESLint Warning Analysis - Top 5 Files with Most Warnings")
    print("=" * 80)
    print()
    
    if not sorted_warnings:
        print("No warnings found in ESLint results.")
        return
    
    # Show top 5 files with most warnings
    for i, (file_path, warning_count) in enumerate(sorted_warnings[:5], 1):
        error_count = file_errors.get(file_path, 0)
        total_issues = warning_count + error_count
        
        print(f"{i}. {file_path}")
        print(f"   Warnings: {warning_count}")
        print(f"   Errors: {error_count}")
        print(f"   Total Issues: {total_issues}")
        print()
        
        # Show first 5 warnings for this file
        warnings = [msg for msg in file_details[file_path] if msg['type'] == 'warning'][:5]
        if warnings:
            print("   Top warnings:")
            for j, warning in enumerate(warnings, 1):
                print(f"   {j}. Line {warning['line']}, Col {warning['column']}: {warning['message']}")
                print(f"      Rule: {warning['rule']}")
            print()
        
        print("-" * 80)
        print()
    
    # Summary statistics
    total_warnings = sum(file_warnings.values())
    total_errors = sum(file_errors.values())
    total_files = len(file_warnings) + len(file_errors)
    
    print("Summary Statistics:")
    print(f"Total files with issues: {total_files}")
    print(f"Total warnings: {total_warnings}")
    print(f"Total errors: {total_errors}")
    print(f"Total issues: {total_warnings + total_errors}")
    
    # Show all files with warnings (if more than 5)
    if len(sorted_warnings) > 5:
        print(f"\nAll {len(sorted_warnings)} files with warnings:")
        for i, (file_path, warning_count) in enumerate(sorted_warnings, 1):
            error_count = file_errors.get(file_path, 0)
            print(f"{i:2d}. {file_path:<50} Warnings: {warning_count:3d}, Errors: {error_count:3d}")

if __name__ == "__main__":
    # Check if JSON file exists
    json_file = Path("mobile/eslint-results.json")
    
    if not json_file.exists():
        print(f"Error: {json_file} not found.")
        print("Please run: cd mobile && npm run lint -- --format=json > eslint-results.json")
        sys.exit(1)
    
    analyze_eslint_results(json_file)
