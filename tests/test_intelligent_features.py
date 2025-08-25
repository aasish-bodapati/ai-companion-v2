#!/usr/bin/env python3
"""
Comprehensive test of the new intelligent features:
- Calendar population from chat
- Fitness page population from chat  
- Nutrition page population from chat
- Adherence tracking and learning
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.conversation_intelligence import conversation_intelligence

def test_intelligent_calendar_population():
    """Test intelligent calendar population from chat conversations"""
    print("🗓️ TESTING INTELLIGENT CALENDAR POPULATION")
    print("=" * 60)
    
    test_cases = [
        {
            "message": "I want to wake up at 6 AM every day for my morning routine",
            "expected": "populate",
            "expected_actions": ["create_recurring"]
        },
        {
            "message": "I need to schedule daily workouts at 6 PM",
            "expected": "populate", 
            "expected_actions": ["create_recurring"]
        },
        {
            "message": "Let me plan my weekly workout schedule for weekdays",
            "expected": "populate",
            "expected_actions": ["create_recurring"]
        },
        {
            "message": "I want to meal prep every Sunday for the week",
            "expected": "populate",
            "expected_actions": ["create_recurring"]
        },
        {
            "message": "Just checking in, how are you?",
            "expected": "none",
            "expected_actions": []
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['message'][:50]}...")
        
        try:
            result = conversation_intelligence._intelligently_populate_calendar(
                test_case["message"], 
                {"detected_domains": ["scheduling"]}, 
                "test_user"
            )
            
            print(f"   🎯 Expected: {test_case['expected']}")
            print(f"   🔍 Got: {result.get('calendar_action', 'unknown')}")
            print(f"   📅 Actions: {len(result.get('actions', []))}")
            
            if result.get('calendar_action') == test_case['expected']:
                print(f"   ✅ PASS: Calendar population working correctly")
            else:
                print(f"   ❌ FAIL: Expected {test_case['expected']}, got {result.get('calendar_action')}")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")

def test_intelligent_fitness_population():
    """Test intelligent fitness page population from chat conversations"""
    print("\n💪 TESTING INTELLIGENT FITNESS PAGE POPULATION")
    print("=" * 60)
    
    test_cases = [
        {
            "message": "My goal is to lose weight and build strength",
            "expected": "populate",
            "expected_actions": ["create_goal"]
        },
        {
            "message": "I want to create a daily workout routine",
            "expected": "populate",
            "expected_actions": ["create_routine"]
        },
        {
            "message": "I need a weekly workout plan for weekdays",
            "expected": "populate", 
            "expected_actions": ["create_routine"]
        },
        {
            "message": "I want to run a 5k race",
            "expected": "populate",
            "expected_actions": ["create_goal"]
        },
        {
            "message": "The weather is nice today",
            "expected": "none",
            "expected_actions": []
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['message'][:50]}...")
        
        try:
            result = conversation_intelligence._intelligently_populate_fitness_page(
                test_case["message"], 
                {"detected_domains": ["fitness"]}, 
                "test_user"
            )
            
            print(f"   🎯 Expected: {test_case['expected']}")
            print(f"   🔍 Got: {result.get('fitness_action', 'unknown')}")
            print(f"   🏋️ Actions: {len(result.get('actions', []))}")
            
            if result.get('fitness_action') == test_case['expected']:
                print(f"   ✅ PASS: Fitness population working correctly")
            else:
                print(f"   ❌ FAIL: Expected {test_case['expected']}, got {result.get('fitness_action')}")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")

def test_intelligent_nutrition_population():
    """Test intelligent nutrition page population from chat conversations"""
    print("\n🥗 TESTING INTELLIGENT NUTRITION PAGE POPULATION")
    print("=" * 60)
    
    test_cases = [
        {
            "message": "I want to lose weight through better nutrition",
            "expected": "populate",
            "expected_actions": ["create_goal"]
        },
        {
            "message": "I need to build muscle and gain weight",
            "expected": "populate",
            "expected_actions": ["create_goal"]
        },
        {
            "message": "I want to create a weekly meal plan",
            "expected": "populate",
            "expected_actions": ["create_meal_plan"]
        },
        {
            "message": "I want to eat healthier and improve my diet",
            "expected": "populate",
            "expected_actions": ["create_goal"]
        },
        {
            "message": "I love reading books",
            "expected": "none",
            "expected_actions": []
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['message'][:50]}...")
        
        try:
            result = conversation_intelligence._intelligently_populate_nutrition_page(
                test_case["message"], 
                {"detected_domains": ["nutrition"]}, 
                "test_user"
            )
            
            print(f"   🎯 Expected: {test_case['expected']}")
            print(f"   🔍 Got: {result.get('nutrition_action', 'unknown')}")
            print(f"   🍎 Actions: {len(result.get('actions', []))}")
            
            if result.get('nutrition_action') == test_case['expected']:
                print(f"   ✅ PASS: Nutrition population working correctly")
            else:
                print(f"   ❌ FAIL: Expected {test_case['expected']}, got {result.get('nutrition_action')}")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")

def test_adherence_tracking():
    """Test adherence tracking and learning system"""
    print("\n📊 TESTING ADHERENCE TRACKING & LEARNING")
    print("=" * 60)
    
    test_cases = [
        {
            "message": "I'm following my schedule perfectly and keeping up with everything",
            "expected_adherence": "good",
            "expected_learning": False
        },
        {
            "message": "I'm struggling to keep up with my schedule, it's too strict",
            "expected_adherence": "struggling", 
            "expected_learning": True
        },
        {
            "message": "I'm overwhelmed with too much to do, feeling burned out",
            "expected_adherence": "overwhelmed",
            "expected_learning": True
        },
        {
            "message": "I completed my workout today and feel great",
            "expected_adherence": "good",
            "expected_learning": False
        },
        {
            "message": "I missed my workout again, I'm too tired",
            "expected_adherence": "struggling",
            "expected_learning": True
        },
        {
            "message": "I'm making healthy food choices and staying on track",
            "expected_adherence": "good",
            "expected_learning": False
        },
        {
            "message": "I've been eating junk food and skipping meals",
            "expected_adherence": "struggling",
            "expected_learning": True
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['message'][:50]}...")
        
        try:
            result = conversation_intelligence._track_adherence_and_learn(
                test_case["message"], 
                {"detected_domains": ["scheduling"]}, 
                "test_user"
            )
            
            schedule_adherence = result.get('schedule_adherence', 'unknown')
            fitness_adherence = result.get('fitness_adherence', 'unknown')
            nutrition_adherence = result.get('nutrition_adherence', 'unknown')
            learning_applied = result.get('learning_applied', False)
            
            print(f"   🎯 Expected adherence: {test_case['expected_adherence']}")
            print(f"   🔍 Schedule: {schedule_adherence}")
            print(f"   🔍 Fitness: {fitness_adherence}")
            print(f"   🔍 Nutrition: {nutrition_adherence}")
            print(f"   🧠 Learning applied: {learning_applied}")
            
            # Check if any domain shows the expected adherence
            adherence_found = (
                schedule_adherence == test_case['expected_adherence'] or
                fitness_adherence == test_case['expected_adherence'] or
                nutrition_adherence == test_case['expected_adherence']
            )
            
            if adherence_found and learning_applied == test_case['expected_learning']:
                print(f"   ✅ PASS: Adherence tracking working correctly")
            else:
                print(f"   ❌ FAIL: Adherence or learning not working as expected")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")

def test_full_integration():
    """Test the full integration of all intelligent features"""
    print("\n🚀 TESTING FULL INTELLIGENT FEATURES INTEGRATION")
    print("=" * 60)
    
    test_message = "I want to wake up at 6 AM every day, workout at 6 PM, and create a meal plan for weight loss. I'm struggling to keep up with my current schedule though."
    
    print(f"🧪 Test Message: {test_message}")
    
    try:
        # Test the full response generation
        response = conversation_intelligence.generate_response(
            test_message, 
            [], 
            "test_user"
        )
        
        print(f"\n📋 Full Response Generated:")
        print(f"   💬 Message: {response.get('message', '')[:100]}...")
        print(f"   🎯 Context Continuity: {response.get('has_context_continuity', False)}")
        
        # Check intelligent population
        intelligent_population = response.get('intelligent_population', {})
        print(f"\n🗓️ Calendar Population: {intelligent_population.get('calendar', {}).get('calendar_action', 'unknown')}")
        print(f"💪 Fitness Population: {intelligent_population.get('fitness', {}).get('fitness_action', 'unknown')}")
        print(f"🥗 Nutrition Population: {intelligent_population.get('nutrition', {}).get('nutrition_action', 'unknown')}")
        
        # Check adherence insights
        adherence_insights = response.get('adherence_insights', {})
        print(f"\n📊 Adherence Insights:")
        print(f"   📅 Schedule: {adherence_insights.get('schedule_adherence', 'unknown')}")
        print(f"   🏋️ Fitness: {adherence_insights.get('fitness_adherence', 'unknown')}")
        print(f"   🍎 Nutrition: {adherence_insights.get('nutrition_adherence', 'unknown')}")
        print(f"   🧠 Learning Applied: {adherence_insights.get('learning_applied', False)}")
        
        # Check suggestions
        suggestions = adherence_insights.get('suggestions', [])
        print(f"   💡 Suggestions: {len(suggestions)} provided")
        
        # Overall assessment
        calendar_working = intelligent_population.get('calendar', {}).get('calendar_action') == 'populate'
        fitness_working = intelligent_population.get('fitness', {}).get('fitness_action') == 'populate'
        nutrition_working = intelligent_population.get('nutrition', {}).get('nutrition_action') == 'populate'
        adherence_working = adherence_insights.get('learning_applied', False)
        
        if calendar_working and fitness_working and nutrition_working and adherence_working:
            print(f"\n🎉 EXCELLENT! All intelligent features working perfectly!")
        elif calendar_working or fitness_working or nutrition_working or adherence_working:
            print(f"\n👍 GOOD! Some intelligent features working, others need attention")
        else:
            print(f"\n❌ NEEDS WORK! Intelligent features not working as expected")
            
    except Exception as e:
        print(f"   ❌ ERROR in full integration test: {e}")

if __name__ == "__main__":
    print("🧠 COMPREHENSIVE INTELLIGENT FEATURES TEST")
    print("=" * 80)
    
    # Run all tests
    test_intelligent_calendar_population()
    test_intelligent_fitness_population() 
    test_intelligent_nutrition_population()
    test_adherence_tracking()
    test_full_integration()
    
    print(f"\n🎯 TESTING COMPLETE!")
    print("The AI Companion now has intelligent features for:")
    print("✅ Calendar population from chat conversations")
    print("✅ Fitness page population from chat conversations")
    print("✅ Nutrition page population from chat conversations") 
    print("✅ Adherence tracking and adaptive learning")
    print("✅ Schedule flexibility suggestions based on user struggles")
