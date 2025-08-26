#!/usr/bin/env python3
"""
PHASE 3: COMPLETE USER FLOW TESTING
Tests complete user journeys and workflows
"""

import sys
import os
import time
import pytest
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

class UserFlowTester:
    def __init__(self):
        self.results = {}
        
    def test_flow(self, name: str, test_func):
        """Test a complete user flow"""
        print(f"\n🚀 Testing {name}...")
        start_time = time.time()
        
        try:
            result = test_func()
            duration = time.time() - start_time
            
            if result and "working" in result.lower():
                print(f"✅ {name}: PASS ({duration:.2f}s)")
                self.results[name] = {"status": "PASS", "duration": duration, "details": result}
                return True
            else:
                print(f"❌ {name}: FAIL ({duration:.2f}s)")
                self.results[name] = {"status": "FAIL", "duration": duration, "details": result or "Test failed"}
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            print(f"❌ {name}: ERROR ({duration:.2f}s) - {e}")
            self.results[name] = {"status": "ERROR", "duration": duration, "details": str(e)}
            return False
    
    def print_summary(self):
        """Print user flow testing summary"""
        total = len(self.results)
        passed = sum(1 for r in self.results.values() if r["status"] == "PASS")
        failed = sum(1 for r in self.results.values() if r["status"] in ["FAIL", "ERROR"])
        
        print(f"\n{'='*60}")
        print(f"📊 USER FLOW TESTING SUMMARY")
        print(f"{'='*60}")
        print(f"Total Flows: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED FLOWS:")
            for name, result in self.results.items():
                if result["status"] != "PASS":
                    print(f"   - {name}: {result['details']}")
        
        return passed/total

@pytest.mark.skip(reason="Related feature removed")
def test_fitness_workflow():
    """Test complete fitness user workflow"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        workflow_steps = [
            "I want to get in shape and lose weight",
            "My goal is to run a 5k in 30 minutes",
            "I need a workout routine for weekdays",
            "I completed my workout today and feel great",
            "I'm struggling to keep up with my schedule"
        ]
        
        conversation_history = []
        results = []
        intelligent_actions = 0
        adherence_learning = 0
        
        for i, step in enumerate(workflow_steps):
            print(f"   Step {i+1}: {step[:50]}...")
            
            response = conversation_intelligence.generate_response(
                step, conversation_history, "test_user"
            )
            
            if not response:
                results.append(f"Step {i+1} failed: No response")
                continue
            
            # Add to conversation history
            conversation_history.append({"role": "user", "content": step})
            conversation_history.append({"role": "assistant", "content": response.get("message", "")})
            
            # Check intelligent population
            intelligent_population = response.get("intelligent_population", {})
            calendar_action = intelligent_population.get("calendar", {}).get("calendar_action")
            fitness_action = intelligent_population.get("fitness", {}).get("fitness_action")
            
            if calendar_action == "populate" or fitness_action == "populate":
                intelligent_actions += 1
                results.append(f"Step {i+1} PASS: Intelligent population working")
            else:
                results.append(f"Step {i+1} WARNING: No intelligent population detected")
            
            # Check adherence learning
            adherence_insights = response.get("adherence_insights", {})
            if adherence_insights.get("learning_applied", False):
                adherence_learning += 1
        
        # Overall assessment
        passed = sum(1 for r in results if "PASS" in r)
        failed = sum(1 for r in results if "failed" in r.lower())
        
        print(f"   📊 Fitness Workflow Metrics:")
        print(f"      🎯 Intelligent Actions: {intelligent_actions}")
        print(f"      🧠 Adherence Learning: {adherence_learning}")
        print(f"      💬 Successful Steps: {passed}/{len(workflow_steps)}")
        
        if failed == 0 and intelligent_actions > 0:
            return f"Fitness workflow working: {passed}/{len(workflow_steps)} steps successful, {intelligent_actions} intelligent actions"
        elif failed == 0:
            return f"Fitness workflow functional: {passed}/{len(workflow_steps)} steps successful, limited intelligent features"
        else:
            return f"Fitness workflow has issues: {failed} failures, {passed} successes"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Workflow test failed: {e}"

@pytest.mark.skip(reason="Related feature removed")
def test_nutrition_workflow():
    """Test complete nutrition user workflow"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        workflow_steps = [
            "I want to eat healthier and lose weight",
            "I need help with meal planning",
            "I want to create a weekly meal prep routine",
            "I've been making good food choices lately",
            "I'm struggling with my diet plan"
        ]
        
        conversation_history = []
        results = []
        intelligent_actions = 0
        adherence_learning = 0
        
        for i, step in enumerate(workflow_steps):
            print(f"   Step {i+1}: {step[:50]}...")
            
            response = conversation_intelligence.generate_response(
                step, conversation_history, "test_user"
            )
            
            if not response:
                results.append(f"Step {i+1} failed: No response")
                continue
            
            # Add to conversation history
            conversation_history.append({"role": "user", "content": step})
            conversation_history.append({"role": "assistant", "content": response.get("message", "")})
            
            # Check intelligent population
            intelligent_population = response.get("intelligent_population", {})
            nutrition_action = intelligent_population.get("nutrition", {}).get("nutrition_action")
            
            if nutrition_action == "populate":
                intelligent_actions += 1
                results.append(f"Step {i+1} PASS: Nutrition population working")
            else:
                results.append(f"Step {i+1} WARNING: No nutrition population detected")
            
            # Check adherence learning
            adherence_insights = response.get("adherence_insights", {})
            if adherence_insights.get("learning_applied", False):
                adherence_learning += 1
        
        # Overall assessment
        passed = sum(1 for r in results if "PASS" in r)
        failed = sum(1 for r in results if "failed" in r.lower())
        
        print(f"   📊 Nutrition Workflow Metrics:")
        print(f"      🎯 Intelligent Actions: {intelligent_actions}")
        print(f"      🧠 Adherence Learning: {adherence_learning}")
        print(f"      💬 Successful Steps: {passed}/{len(workflow_steps)}")
        
        if failed == 0 and intelligent_actions > 0:
            return f"Nutrition workflow working: {passed}/{len(workflow_steps)} steps successful, {intelligent_actions} intelligent actions"
        elif failed == 0:
            return f"Nutrition workflow functional: {passed}/{len(workflow_steps)} steps successful, limited intelligent features"
        else:
            return f"Nutrition workflow has issues: {failed} failures, {passed} successes"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Workflow test failed: {e}"

def test_scheduling_workflow():
    """Test complete scheduling user workflow"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        workflow_steps = [
            "I need to organize my daily schedule",
            "I want to wake up at 6 AM every day",
            "I need to schedule workouts at 6 PM on weekdays",
            "I'm following my schedule perfectly",
            "My schedule is too rigid, I need more flexibility"
        ]
        
        conversation_history = []
        results = []
        intelligent_actions = 0
        adherence_learning = 0
        
        for i, step in enumerate(workflow_steps):
            print(f"   Step {i+1}: {step[:50]}...")
            
            response = conversation_intelligence.generate_response(
                step, conversation_history, "test_user"
            )
            
            if not response:
                results.append(f"Step {i+1} failed: No response")
                continue
            
            # Add to conversation history
            conversation_history.append({"role": "user", "content": step})
            conversation_history.append({"role": "assistant", "content": response.get("message", "")})
            
            # Check intelligent population and adherence
            intelligent_population = response.get("intelligent_population", {})
            adherence_insights = response.get("adherence_insights", {})
            
            calendar_action = intelligent_population.get("calendar", {}).get("calendar_action")
            learning_applied = adherence_insights.get("learning_applied", False)
            
            if calendar_action == "populate":
                intelligent_actions += 1
                results.append(f"Step {i+1} PASS: Calendar population working")
            elif learning_applied:
                adherence_learning += 1
                results.append(f"Step {i+1} PASS: Adherence learning working")
            else:
                results.append(f"Step {i+1} WARNING: Limited functionality detected")
        
        # Overall assessment
        passed = sum(1 for r in results if "PASS" in r)
        failed = sum(1 for r in results if "failed" in r.lower())
        
        print(f"   📊 Scheduling Workflow Metrics:")
        print(f"      🎯 Intelligent Actions: {intelligent_actions}")
        print(f"      🧠 Adherence Learning: {adherence_learning}")
        print(f"      💬 Successful Steps: {passed}/{len(workflow_steps)}")
        
        if failed == 0 and (intelligent_actions > 0 or adherence_learning > 0):
            return f"Scheduling workflow working: {passed}/{len(workflow_steps)} steps successful, {intelligent_actions} actions, {adherence_learning} learning"
        elif failed == 0:
            return f"Scheduling workflow functional: {passed}/{len(workflow_steps)} steps successful, limited intelligent features"
        else:
            return f"Scheduling workflow has issues: {failed} failures, {passed} successes"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Workflow test failed: {e}"

def test_complete_user_journey():
    """Test a complete user journey from onboarding to daily use"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        journey_steps = [
            # Initial setup
            "Hi, I'm new here and need help organizing my life",
            "I want to get in shape and eat better",
            "I need help creating a daily routine",
            
            # Goal setting
            "My goal is to lose 20 pounds and run a 5k",
            "I want to create a meal plan for weight loss",
            "I need a workout schedule that fits my busy life",
            
            # Daily usage
            "I completed my workout today, feeling great!",
            "I'm struggling to stick to my meal plan",
            "Can you help me adjust my schedule?",
            
            # Problem solving
            "I'm overwhelmed with too many goals",
            "I need to simplify my routine",
            "I want to focus on just fitness for now"
        ]
        
        conversation_history = []
        results = []
        intelligent_actions = 0
        adherence_learning = 0
        
        for i, step in enumerate(journey_steps):
            print(f"   Journey Step {i+1}: {step[:50]}...")
            
            response = conversation_intelligence.generate_response(
                step, conversation_history, "test_user"
            )
            
            if not response:
                results.append(f"Step {i+1} failed: No response")
                continue
            
            # Add to conversation history
            conversation_history.append({"role": "user", "content": step})
            conversation_history.append({"role": "assistant", "content": response.get("message", "")})
            
            # Track intelligent features
            intelligent_population = response.get("intelligent_population", {})
            adherence_insights = response.get("adherence_insights", {})
            
            # Count intelligent actions
            for domain in ["calendar", "fitness", "nutrition"]:
                if intelligent_population.get(domain, {}).get(f"{domain}_action") == "populate":
                    intelligent_actions += 1
            
            # Count adherence learning
            if adherence_insights.get("learning_applied", False):
                adherence_learning += 1
            
            results.append(f"Step {i+1} PASS: Response generated successfully")
            
        # Overall journey assessment
        passed = sum(1 for r in results if "PASS" in r)
        failed = sum(1 for r in results if "failed" in r.lower())
        
        print(f"   📊 Journey Metrics:")
        print(f"      🎯 Intelligent Actions: {intelligent_actions}")
        print(f"      🧠 Adherence Learning: {adherence_learning}")
        print(f"      💬 Successful Steps: {passed}/{len(journey_steps)}")
        
        if failed == 0 and intelligent_actions > 0 and adherence_learning > 0:
            return f"Complete user journey working: {passed} steps, {intelligent_actions} actions, {adherence_learning} learning events"
        elif failed == 0:
            return f"User journey functional but limited: {passed} steps, limited intelligent features"
        else:
            return f"User journey has issues: {failed} failures, {passed} successes"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Journey test failed: {e}"

def test_medical_document_workflow():
    """Test medical document upload and learning workflow"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        workflow_steps = [
            "I have a medical condition that affects my diet",
            "I need to remember my medication schedule",
            "What should I eat for breakfast given my condition?",
            "I want to track my symptoms daily",
            "Can you remind me of my dietary restrictions?"
        ]
        
        conversation_history = []
        results = []
        context_continuity = 0
        
        for i, step in enumerate(workflow_steps):
            print(f"   Step {i+1}: {step[:50]}...")
            
            response = conversation_intelligence.generate_response(
                step, conversation_history, "test_user"
            )
            
            if not response:
                results.append(f"Step {i+1} failed: No response")
                continue
            
            # Add to conversation history
            conversation_history.append({"role": "user", "content": step})
            conversation_history.append({"role": "assistant", "content": response.get("message", "")})
            
            # Check context continuity
            if response.get("has_context_continuity"):
                context_continuity += 1
                results.append(f"Step {i+1} PASS: Context continuity working")
            else:
                results.append(f"Step {i+1} WARNING: Limited context continuity")
        
        # Overall assessment
        passed = sum(1 for r in results if "PASS" in r)
        failed = sum(1 for r in results if "failed" in r.lower())
        
        print(f"   📊 Medical Workflow Metrics:")
        print(f"      🔗 Context Continuity: {context_continuity}")
        print(f"      💬 Successful Steps: {passed}/{len(workflow_steps)}")
        
        if failed == 0 and context_continuity > 0:
            return f"Medical workflow working: {passed}/{len(workflow_steps)} steps successful, {context_continuity} context continuity events"
        elif failed == 0:
            return f"Medical workflow functional: {passed}/{len(workflow_steps)} steps successful, limited context continuity"
        else:
            return f"Medical workflow has issues: {failed} failures, {passed} successes"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Workflow test failed: {e}"

def main():
    """Run all user flow tests"""
    print("🚀 PHASE 3: COMPLETE USER FLOW TESTING")
    print("=" * 60)
    
    tester = UserFlowTester()
    
    # Test all user flows
    flows = [
        ("Fitness Workflow", test_fitness_workflow),
        ("Nutrition Workflow", test_nutrition_workflow),
        ("Scheduling Workflow", test_scheduling_workflow),
        ("Complete User Journey", test_complete_user_journey),
        ("Medical Document Workflow", test_medical_document_workflow)
    ]
    
    for name, test_func in flows:
        tester.test_flow(name, test_func)
    
    # Print summary
    success_rate = tester.print_summary()
    
    return success_rate

if __name__ == "__main__":
    success_rate = main()
    print(f"\n🎯 User flow testing complete. Success rate: {success_rate:.1%}")
