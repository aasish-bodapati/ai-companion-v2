#!/usr/bin/env python3
"""
Test Runner for Enhanced Memory Schema Evaluation
This script tests the evaluation framework and provides a quick summary.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_evaluation_framework():
    """Test the enhanced memory evaluation framework."""
    print("🧪 TESTING ENHANCED MEMORY SCHEMA EVALUATION FRAMEWORK")
    print("=" * 70)
    
    try:
        # Test Part 1: Core Structure
        print("\n📋 Testing Part 1: Core Structure...")
        from enhanced_memory_evaluation_part1 import create_test_cases, EnhancedMemoryTestCase
        
        test_cases = create_test_cases()
        print(f"✅ Created {len(test_cases)} test cases")
        
        # Display test case summary
        for i, test_case in enumerate(test_cases, 1):
            print(f"   {i}. {test_case.test_id} ({test_case.complexity_level})")
            print(f"      Expected Fields: {len(test_case.expected_enhanced_fields)}")
            print(f"      Expected Relationships: {len(test_case.expected_relationships)}")
            print(f"      Expected Evolution: {len(test_case.expected_evolution)}")
        
        # Test Part 2: Evaluation Methods
        print("\n🔍 Testing Part 2: Evaluation Methods...")
        from enhanced_memory_evaluation_part2 import EnhancedMemoryEvaluator
        
        evaluator = EnhancedMemoryEvaluator()
        print("✅ EnhancedMemoryEvaluator created successfully")
        
        # Test Part 3: Main Runner
        print("\n🚀 Testing Part 3: Main Runner...")
        from enhanced_memory_evaluation_part3 import EnhancedMemorySchemaRunner
        
        runner = EnhancedMemorySchemaRunner()
        print("✅ EnhancedMemorySchemaRunner created successfully")
        
        # Run a quick evaluation
        print("\n⚡ Running Quick Evaluation...")
        results = runner.run_comprehensive_evaluation("test_user_quick")
        
        # Display results summary
        print(f"\n📊 EVALUATION RESULTS SUMMARY:")
        print(f"   Field Population Rate: {results['enhanced_fields_evaluation']['field_population_rate']:.2%}")
        print(f"   Relationship Detection Rate: {results['relationship_evaluation']['relationship_detection_rate']:.2%}")
        print(f"   Evolution Tracking Rate: {results['evolution_evaluation']['evolution_tracking_rate']:.2%}")
        print(f"   Entity Extraction Accuracy: {results['semantic_intelligence_evaluation']['entity_extraction_accuracy']:.2%}")
        print(f"   Emotional Valence Accuracy: {results['semantic_intelligence_evaluation']['emotional_valence_accuracy']:.2%}")
        print(f"   Overall Enhanced Score: {results.get('overall_enhanced_score', 0):.2%}")
        
        # Generate and save report
        print("\n📄 Generating Report...")
        report = runner.generate_comprehensive_report()
        
        # Save results
        runner.save_results_to_file("test_evaluation_results.json")
        runner.save_report_to_file("test_evaluation_report.md")
        
        print("\n✅ ALL TESTS PASSED!")
        print("📁 Results saved to: test_evaluation_results.json")
        print("📄 Report saved to: test_evaluation_report.md")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("Make sure all three parts of the evaluation framework are available:")
        print("  - enhanced_memory_evaluation_part1.py")
        print("  - enhanced_memory_evaluation_part2.py")
        print("  - enhanced_memory_evaluation_part3.py")
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_individual_tests():
    """Run individual tests for each part."""
    print("\n🔬 RUNNING INDIVIDUAL TESTS")
    print("=" * 50)
    
    # Test Part 1
    try:
        print("\n📋 Testing Part 1...")
        exec(open("enhanced_memory_evaluation_part1.py").read())
        print("✅ Part 1 test completed")
    except Exception as e:
        print(f"❌ Part 1 test failed: {e}")
    
    # Test Part 2
    try:
        print("\n🔍 Testing Part 2...")
        exec(open("enhanced_memory_evaluation_part2.py").read())
        print("✅ Part 2 test completed")
    except Exception as e:
        print(f"❌ Part 2 test failed: {e}")
    
    # Test Part 3
    try:
        print("\n🚀 Testing Part 3...")
        exec(open("enhanced_memory_evaluation_part3.py").read())
        print("✅ Part 3 test completed")
    except Exception as e:
        print(f"❌ Part 3 test failed: {e}")


if __name__ == "__main__":
    print("🧪 Enhanced Memory Schema Evaluation - Test Runner")
    print("=" * 70)
    
    # Run main test
    success = test_evaluation_framework()
    
    if success:
        print("\n🎉 FRAMEWORK TESTING COMPLETED SUCCESSFULLY!")
        print("\nThe Enhanced Memory Schema evaluation framework is ready for use.")
        print("\nTo run a full evaluation:")
        print("  python enhanced_memory_evaluation_part3.py")
        print("\nTo run individual tests:")
        print("  python enhanced_memory_evaluation_part1.py")
        print("  python enhanced_memory_evaluation_part2.py")
        print("  python enhanced_memory_evaluation_part3.py")
    else:
        print("\n❌ FRAMEWORK TESTING FAILED!")
        print("Please check the error messages above and fix any issues.")
    
    # Optionally run individual tests
    print("\n" + "="*70)
    response = input("Run individual part tests? (y/n): ").lower().strip()
    if response in ['y', 'yes']:
        run_individual_tests()
    
    print("\n🏁 Test runner completed.")
