#!/usr/bin/env python3
"""
Direct test of our improved conversation intelligence system
Tests the improvements without needing the full server
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.conversation_intelligence import conversation_intelligence
from app.services.human_response_generator import human_response_generator
from app.services.personality_engine import personality_engine
from app.services.context_intelligence import context_intelligence

def test_conversation_intelligence():
    """Test the conversation intelligence improvements"""
    print("🚀 TESTING CONVERSATION INTELLIGENCE IMPROVEMENTS")
    print("=" * 60)
    
    test_cases = [
        {
            "message": "I need help with my fitness routine",
            "expected_domains": ["fitness"],
            "conversation_history": []
        },
        {
            "message": "I want to build strength and lose weight",
            "expected_domains": ["fitness", "nutrition"],
            "conversation_history": []
        },
        {
            "message": "I'm feeling stressed about my upcoming presentation",
            "expected_domains": ["stress", "health"],
            "conversation_history": [
                {"role": "user", "content": "I need help with my fitness routine"},
                {"role": "assistant", "content": "I can help you create a workout plan"}
            ]
        },
        {
            "message": "I also have trouble sleeping",
            "expected_domains": ["health"],
            "conversation_history": [
                {"role": "user", "content": "I need help with my fitness routine"},
                {"role": "assistant", "content": "I can help you create a workout plan"},
                {"role": "user", "content": "I'm feeling stressed about my upcoming presentation"},
                {"role": "assistant", "content": "I can help with stress management"}
            ]
        },
        {
            "message": "I need to schedule my workouts and meal prep",
            "expected_domains": ["scheduling", "fitness", "nutrition"],
            "conversation_history": [
                {"role": "user", "content": "I want to build strength and lose weight"},
                {"role": "assistant", "content": "I can help with fitness and nutrition"}
            ]
        }
    ]
    
    total_score = 0
    max_score = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 TEST CASE {i}: {test_case['message'][:50]}...")
        
        try:
            # Generate response using our improved system
            response = conversation_intelligence.generate_response(
                user_message=test_case["message"],
                conversation_history=test_case["conversation_history"],
                user_id="test_user"
            )
            
            # Analyze the response
            detected_domains = response.get("context_analysis", {}).get("detected_domains", [])
            has_continuity = response.get("has_context_continuity", False)
            message = response.get("message", "")
            suggested_actions = response.get("context_analysis", {}).get("suggested_actions", [])
            
            print(f"   🎯 Expected domains: {test_case['expected_domains']}")
            print(f"   🔍 Detected domains: {detected_domains}")
            print(f"   🔗 Context continuity: {has_continuity}")
            print(f"   💬 Response: {message[:100]}...")
            print(f"   🎬 Actions: {len(suggested_actions)} suggestions")
            
            # Score the response
            test_score = 0
            test_max = 100
            
            # Domain detection scoring (30 points)
            expected_set = set(test_case["expected_domains"])
            detected_set = set(detected_domains)
            overlap = expected_set.intersection(detected_set)
            
            if overlap == expected_set:
                test_score += 30
                print(f"   ✅ Perfect domain detection (+30)")
            elif overlap:
                test_score += 20
                print(f"   ⚠️ Partial domain detection (+20)")
            else:
                print(f"   ❌ Domain detection failed (0)")
            
            # Response quality (25 points)
            if len(message) > 100:
                test_score += 25
                print(f"   ✅ Comprehensive response (+25)")
            elif len(message) > 50:
                test_score += 20
                print(f"   ✅ Detailed response (+20)")
            elif len(message) > 20:
                test_score += 10
                print(f"   ⚠️ Basic response (+10)")
            
            # Context continuity (25 points)
            if len(test_case["conversation_history"]) > 0:
                if has_continuity:
                    test_score += 25
                    print(f"   ✅ Context continuity detected (+25)")
                else:
                    print(f"   ❌ No context continuity (0)")
            else:
                test_score += 25  # No history to continue from
                print(f"   ✅ No history to continue from (+25)")
            
            # Actionable suggestions (20 points)
            if len(suggested_actions) >= 3:
                test_score += 20
                print(f"   ✅ Rich suggestions (+20)")
            elif len(suggested_actions) >= 1:
                test_score += 15
                print(f"   ✅ Some suggestions (+15)")
            else:
                print(f"   ❌ No suggestions (0)")
            
            print(f"   📊 Test Score: {test_score}/{test_max} ({test_score/test_max*100:.1f}%)")
            
            total_score += test_score
            max_score += test_max
            
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            max_score += 100
    
    overall_percentage = (total_score / max_score * 100) if max_score > 0 else 0
    print(f"\n🏆 OVERALL PERFORMANCE: {overall_percentage:.1f}% ({total_score}/{max_score})")
    
    if overall_percentage >= 80:
        print("🎉 EXCELLENT! System performing at high level")
    elif overall_percentage >= 60:
        print("👍 GOOD! System showing solid improvements")
    elif overall_percentage >= 40:
        print("⚠️ FAIR! System has potential but needs more work")
    else:
        print("🔧 NEEDS WORK! System requires significant improvements")
    
    return overall_percentage

def test_domain_detection():
    """Test domain detection improvements"""
    print("\n🔍 TESTING DOMAIN DETECTION")
    print("-" * 40)
    
    test_messages = [
        ("I need help with my fitness routine", ["fitness"]),
        ("I want to build strength and lose weight", ["fitness", "nutrition"]),
        ("I'm feeling stressed and overwhelmed", ["stress"]),
        ("I have a doctor appointment tomorrow", ["health", "scheduling"]),
        ("Need to meal prep for the week", ["nutrition", "scheduling"])
    ]
    
    for message, expected in test_messages:
        context = conversation_intelligence.analyze_conversation_context(message, [])
        detected = context.get("detected_domains", [])
        
        print(f"Message: {message}")
        print(f"Expected: {expected}")
        print(f"Detected: {detected}")
        
        # Check accuracy
        expected_set = set(expected)
        detected_set = set(detected)
        overlap = expected_set.intersection(detected_set)
        
        if overlap == expected_set:
            print("✅ Perfect match")
        elif overlap:
            print("⚠️ Partial match")
        else:
            print("❌ No match")
        print()

if __name__ == "__main__":
    # Test domain detection first
    test_domain_detection()
    
    # Test overall conversation intelligence
    score = test_conversation_intelligence()
    
    print(f"\n🎯 FINAL ASSESSMENT:")
    print(f"System Performance: {score:.1f}%")
    
    if score > 50:
        print("✅ Improvements are working! System shows significant enhancement.")
    else:
        print("❌ More work needed to reach target performance.")
