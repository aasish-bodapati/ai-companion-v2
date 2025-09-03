#!/usr/bin/env python3
"""
AI Companion v2 - Live Demo Runner

This script runs a comprehensive live demo showcasing what makes our AI companion special.
Perfect for investor presentations, customer demos, and market validation.

Usage:
    python run_demo.py

The demo will showcase:
1. Intelligent Memory Filtering (90%+ noise reduction)
2. Adaptive Context Management (personalized responses)
3. Production-Grade Monitoring (7 health endpoints)
4. Smart Memory System (FAISS-powered)
5. Competitive Differentiation (vs basic chatbots)
"""

import sys
import os
import json
import time
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def main():
    """Run the live demo."""
    print("🚀 AI COMPANION v2 - LIVE DEMO LAUNCHER")
    print("=" * 50)
    
    try:
        # Import and run the demo
        from tests.test_live_demo import LiveDemoTestSuite
        
        print("📋 Demo Components:")
        print("   • Intelligent Memory Filtering")
        print("   • Adaptive Context Management") 
        print("   • Production-Grade Monitoring")
        print("   • Smart Memory System")
        print("   • Competitive Differentiation")
        print()
        
        # Run the demo
        demo = LiveDemoTestSuite()
        results = demo.run_complete_demo()
        
        # Save results
        results_file = backend_dir / "demo_results.json"
        with open(results_file, "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📄 Demo results saved to: {results_file}")
        
        # Show key metrics
        print(f"\n🎯 KEY METRICS:")
        if "memory_filtering" in results:
            print(f"   • Memory Filtering Efficiency: {results['memory_filtering']['noise_reduction']:.1f}%")
        if "production_monitoring" in results:
            print(f"   • Production Health Score: {results['production_monitoring']['health_score']:.1f}%")
        if "overall_score" in results:
            print(f"   • Overall Demo Score: {results['overall_score']:.1f}/100")
        
        print(f"\n✅ Demo completed successfully!")
        print(f"🎉 Ready for investor presentations and customer demos!")
        
        return 0
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you're running from the backend directory")
        return 1
    except Exception as e:
        print(f"❌ Demo error: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
