#!/usr/bin/env python3
"""
Memory System Evaluation Runner

Script to run comprehensive memory system evaluation and generate reports.
Can be used for continuous monitoring and performance benchmarking.
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
from tests.memory_evaluation_framework import run_memory_evaluation, generate_evaluation_report


def main():
    parser = argparse.ArgumentParser(description="Run memory system evaluation")
    parser.add_argument("--user-id", required=True, help="User ID for evaluation")
    parser.add_argument("--output-dir", default="evaluation_reports", help="Output directory for reports")
    parser.add_argument("--format", choices=["json", "markdown", "both"], default="both", help="Output format")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)
    
    if args.verbose:
        print(f"Starting memory evaluation for user: {args.user_id}")
    
    try:
        # Get database session
        db = next(get_db())
        
        # Run comprehensive evaluation
        if args.verbose:
            print("Running comprehensive evaluation...")
        
        results = run_memory_evaluation(db, args.user_id)
        
        # Generate timestamp for filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"memory_evaluation_{args.user_id}_{timestamp}"
        
        # Save JSON results
        if args.format in ["json", "both"]:
            json_file = output_dir / f"{base_filename}.json"
            with open(json_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            if args.verbose:
                print(f"JSON results saved to: {json_file}")
        
        # Generate and save markdown report
        if args.format in ["markdown", "both"]:
            report = generate_evaluation_report(results)
            md_file = output_dir / f"{base_filename}.md"
            with open(md_file, 'w') as f:
                f.write(report)
            
            if args.verbose:
                print(f"Markdown report saved to: {md_file}")
        
        # Print summary to console
        print("\n" + "="*60)
        print("MEMORY SYSTEM EVALUATION SUMMARY")
        print("="*60)
        
        capture_acc = results['capture_evaluation']['overall_accuracy']
        storage_eff = results['storage_evaluation']['storage_efficiency']
        retrieval_prec = results['retrieval_evaluation']['avg_precision']
        throughput = results['performance_evaluation']['throughput_ops_per_sec']
        
        print(f"Capture Accuracy:    {capture_acc:.1%}")
        print(f"Storage Efficiency:  {storage_eff:.1%}")
        print(f"Retrieval Precision: {retrieval_prec:.1%}")
        print(f"System Throughput:   {throughput:.1f} ops/sec")
        
        # Overall health assessment
        overall_score = (capture_acc + storage_eff + retrieval_prec) / 3
        if overall_score >= 0.8:
            health = "🟢 EXCELLENT"
        elif overall_score >= 0.6:
            health = "🟡 GOOD"
        else:
            health = "🔴 NEEDS ATTENTION"
        
        print(f"\nOverall System Health: {health} ({overall_score:.1%})")
        print("="*60)
        
        db.close()
        
    except Exception as e:
        print(f"Error during evaluation: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
