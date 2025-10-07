#!/usr/bin/env python3
"""
ESLint Warning Counter
Counts warnings per file from ESLint output
"""

import subprocess
import sys
import re
from collections import defaultdict

def run_eslint_and_count():
    """Run ESLint and count warnings per file"""
    
    try:
        # Run ESLint with compact format
        result = subprocess.run(
            ['npm', 'run', 'lint', '--', '--format=compact'],
            cwd='mobile',
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        if result.returncode != 0 and not result.stdout:
            print(f"Error running ESLint: {result.stderr}")
            return
        
        # Parse the output
        lines = result.stdout.strip().split('\n')
        file_warnings = defaultdict(int)
        file_errors = defaultdict(int)
        file_details = defaultdict(list)
        
        for line in lines:
            if 'Warning' in line or 'Error' in line:
                # Parse file path and warning/error info
                # Format: filepath: line X, col Y, Warning/Error - message
                match = re.match(r'^([^:]+):\s+line\s+(\d+),\s+col\s+(\d+),\s+(Warning|Error)\s+-\s+(.+)$', line)
                if match:
                    file_path = match.group(1)
                    line_num = int(match.group(2))
                    col_num = int(match.group(3))
                    severity = match.group(4)
                    message = match.group(5)
                    
                    # Extract rule name if present
                    rule_match = re.search(r'\(([^)]+)\)$', message)
                    rule = rule_match.group(1) if rule_match else 'unknown'
                    
                    if severity == 'Warning':
                        file_warnings[file_path] += 1
                        file_details[file_path].append({
                            'type': 'warning',
                            'line': line_num,
                            'column': col_num,
                            'rule': rule,
                            'message': message
                        })
                    elif severity == 'Error':
                        file_errors[file_path] += 1
                        file_details[file_path].append({
                            'type': 'error',
                            'line': line_num,
                            'column': col_num,
                            'rule': rule,
                            'message': message
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
            
            # Clean up file path for display
            display_path = file_path.replace('E:\\docs\\ai-companion-v2\\mobile\\', '')
            
            print(f"{i}. {display_path}")
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
                display_path = file_path.replace('E:\\docs\\ai-companion-v2\\mobile\\', '')
                print(f"{i:2d}. {display_path:<50} Warnings: {warning_count:3d}, Errors: {error_count:3d}")
        
    except Exception as e:
        print(f"Error running ESLint analysis: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_eslint_and_count()
