#!/usr/bin/env python3
"""
Human-Level Personal Assistant Evaluation CLI Runner

Comprehensive command-line tool for evaluating human-level personal assistant capabilities.
Combines memory, conversational intelligence, and task execution evaluation.
"""

import sys
import os
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import SessionLocal
from tests.human_level_evaluation_framework import (
    run_human_level_evaluation,
    generate_human_level_report
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_argparse() -> argparse.ArgumentParser:
    """Setup command line argument parsing."""
    parser = argparse.ArgumentParser(
        description="Human-Level Personal Assistant Evaluation Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run full human-level evaluation
  python scripts/run_human_level_evaluation.py --user-id user123

  # Run with verbose output and save report
  python scripts/run_human_level_evaluation.py --user-id user123 --verbose --output-dir reports/

  # Run with specific components only
  python scripts/run_human_level_evaluation.py --user-id user123 --components memory,conversation

  # Run with custom configuration
  python scripts/run_human_level_evaluation.py --user-id user123 --config evaluation_config.json
        """
    )
    
    parser.add_argument(
        "--user-id",
        required=True,
        help="User ID to evaluate"
    )
    
    parser.add_argument(
        "--components",
        choices=["memory", "conversation", "task", "integrated", "all"],
        default="all",
        help="Evaluation components to run (default: all)"
    )
    
    parser.add_argument(
        "--output-dir",
        default="evaluation_reports",
        help="Output directory for reports (default: evaluation_reports)"
    )
    
    parser.add_argument(
        "--format",
        choices=["json", "markdown", "both"],
        default="both",
        help="Output format for reports (default: both)"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    
    parser.add_argument(
        "--config",
        help="Path to configuration file"
    )
    
    parser.add_argument(
        "--save-results",
        action="store_true",
        default=True,
        help="Save evaluation results (default: True)"
    )
    
    parser.add_argument(
        "--show-details",
        action="store_true",
        help="Show detailed component scores"
    )
    
    return parser


def load_config(config_path: Optional[str]) -> Dict[str, Any]:
    """Load configuration from file."""
    if not config_path:
        return {}
    
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load config from {config_path}: {e}")
        return {}


def create_output_directory(output_dir: str) -> Path:
    """Create output directory if it doesn't exist."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    return output_path


def save_results(results: Dict[str, Any], output_dir: Path, user_id: str, format_type: str) -> None:
    """Save evaluation results to files."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format_type in ["json", "both"]:
        json_file = output_dir / f"human_level_evaluation_{user_id}_{timestamp}.json"
        with open(json_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        logger.info(f"JSON results saved to: {json_file}")
    
    if format_type in ["markdown", "both"]:
        markdown_file = output_dir / f"human_level_evaluation_{user_id}_{timestamp}.md"
        report = generate_human_level_report(results)
        with open(markdown_file, 'w') as f:
            f.write(report)
        logger.info(f"Markdown report saved to: {markdown_file}")


def print_summary(results: Dict[str, Any], show_details: bool = False) -> None:
    """Print evaluation summary."""
    assessment = results.get('human_level_assessment', {})
    overall_score = results.get('overall_human_level_score', 0)
    
    print("\n" + "="*60)
    print("🎯 HUMAN-LEVEL PERSONAL ASSISTANT EVALUATION SUMMARY")
    print("="*60)
    
    print(f"📊 Overall Human-Level Score: {overall_score:.1%}")
    print(f"🏆 Assessment Level: {assessment.get('level', 'Unknown')}")
    print(f"📝 Description: {assessment.get('description', 'No description')}")
    print(f"💡 Recommendation: {assessment.get('recommendation', 'No recommendation')}")
    
    if show_details:
        print("\n📈 DETAILED COMPONENT SCORES:")
        print("-" * 40)
        
        # Memory System
        memory_eval = results.get('memory_evaluation', {})
        print("🧠 Memory System (Foundation):")
        print(f"  • Capture Accuracy: {memory_eval.get('capture_evaluation', {}).get('overall_accuracy', 0):.1%}")
        print(f"  • Retrieval Precision: {memory_eval.get('retrieval_evaluation', {}).get('avg_precision', 0):.1%}")
        print(f"  • Storage Efficiency: {memory_eval.get('storage_evaluation', {}).get('storage_efficiency', 0):.1%}")
        
        # Conversational Intelligence
        conv_eval = results.get('conversational_evaluation', {})
        print("\n💬 Conversational Intelligence:")
        print(f"  • Multi-turn Coherence: {conv_eval.get('conversation_evaluation', {}).get('multi_turn_coherence', 0):.1%}")
        print(f"  • Context Retention: {conv_eval.get('conversation_evaluation', {}).get('context_retention_rate', 0):.1%}")
        print(f"  • Emotional Awareness: {conv_eval.get('emotional_evaluation', {}).get('emotional_awareness', 0):.1%}")
        print(f"  • Proactive Suggestions: {conv_eval.get('proactive_evaluation', {}).get('proactive_suggestions', 0):.1%}")
        
        # Task Execution
        task_eval = results.get('task_execution_evaluation', {})
        print("\n⚡ Task Execution:")
        print(f"  • Task Understanding: {task_eval.get('task_understanding_evaluation', {}).get('task_analysis_accuracy', 0):.1%}")
        print(f"  • Planning Quality: {task_eval.get('planning_evaluation', {}).get('planning_quality', 0):.1%}")
        print(f"  • Execution Efficiency: {task_eval.get('execution_evaluation', {}).get('execution_efficiency', 0):.1%}")
        print(f"  • Solution Quality: {task_eval.get('problem_solving_evaluation', {}).get('solution_quality', 0):.1%}")
        
        # Integration
        int_eval = results.get('integrated_evaluation', {})
        print("\n🔗 Human-Level Integration:")
        print(f"  • Conversation-Task Integration: {int_eval.get('conversational_task_integration', 0):.1%}")
        print(f"  • Memory-Conversation Integration: {int_eval.get('memory_conversation_integration', 0):.1%}")
        print(f"  • Proactive Anticipation: {int_eval.get('proactive_task_anticipation', 0):.1%}")
    
    print("\n🚀 NEXT STEPS:")
    print("-" * 20)
    for step in assessment.get('next_steps', []):
        print(f"  • {step}")
    
    print("\n" + "="*60)


def print_progress(component: str, step: str) -> None:
    """Print progress information."""
    print(f"🔄 {component}: {step}")


def run_component_evaluation(component: str, db, user_id: str, verbose: bool = False) -> Dict[str, Any]:
    """Run evaluation for a specific component."""
    if verbose:
        print_progress(component, "Starting evaluation...")
    
    try:
        if component == "memory":
            from tests.memory_evaluation_framework import run_memory_evaluation
            results = run_memory_evaluation(db, user_id)
        elif component == "conversation":
            from tests.conversational_intelligence_framework import run_conversational_evaluation
            results = run_conversational_evaluation(db, user_id)
        elif component == "task":
            from tests.task_execution_framework import run_task_execution_evaluation
            results = run_task_execution_evaluation(db, user_id)
        elif component == "integrated":
            # For integrated, we'll run the full evaluation but only return integrated part
            results = run_human_level_evaluation(db, user_id)
            return {"integrated_evaluation": results.get("integrated_evaluation", {})}
        else:
            raise ValueError(f"Unknown component: {component}")
        
        if verbose:
            print_progress(component, "Evaluation completed successfully")
        
        return results
    
    except Exception as e:
        logger.error(f"Error evaluating {component}: {e}")
        if verbose:
            print_progress(component, f"Error: {e}")
        return {}


def main():
    """Main function."""
    parser = setup_argparse()
    args = parser.parse_args()
    
    # Setup logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load configuration
    config = load_config(args.config)
    
    # Create output directory
    output_dir = create_output_directory(args.output_dir)
    
    print("🚀 Starting Human-Level Personal Assistant Evaluation")
    print(f"👤 User ID: {args.user_id}")
    print(f"📁 Output Directory: {output_dir}")
    print(f"🔧 Components: {args.components}")
    
    # Initialize database session
    db = SessionLocal()
    
    try:
        results = {}
        
        if args.components == "all":
            # Run full human-level evaluation
            if args.verbose:
                print("\n🔄 Running comprehensive human-level evaluation...")
            
            results = run_human_level_evaluation(db, args.user_id)
            
            if args.verbose:
                print("✅ Comprehensive evaluation completed")
        
        else:
            # Run specific components
            components = args.components.split(",")
            
            for component in components:
                component = component.strip()
                if args.verbose:
                    print(f"\n🔄 Running {component} evaluation...")
                
                component_results = run_component_evaluation(component, db, args.user_id, args.verbose)
                results.update(component_results)
        
        # Print summary
        print_summary(results, args.show_details)
        
        # Save results if requested
        if args.save_results:
            save_results(results, output_dir, args.user_id, args.format)
        
        # Return appropriate exit code based on assessment
        assessment = results.get('human_level_assessment', {})
        level = assessment.get('level', 'UNKNOWN')
        
        if 'EXCELLENT' in level or 'GOOD' in level:
            print("\n✅ Evaluation completed successfully - Human-level capabilities achieved!")
            return 0
        elif 'ADEQUATE' in level:
            print("\n⚠️ Evaluation completed - Some human-level capabilities present, improvement needed")
            return 1
        else:
            print("\n❌ Evaluation completed - Human-level capabilities need significant development")
            return 2
    
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        print(f"\n❌ Evaluation failed: {e}")
        return 1
    
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())

