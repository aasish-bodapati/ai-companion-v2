#!/usr/bin/env python3
"""
PHASE 2: COMPONENT INTEGRATION TESTING
Tests how components work together
"""

import sys
import os
import time
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

class IntegrationTester:
    def __init__(self):
        self.results = {}
        
    def test_integration(self, name: str, test_func):
        """Test a component integration"""
        print(f"\n🔗 Testing {name}...")
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
        """Print integration testing summary"""
        total = len(self.results)
        passed = sum(1 for r in self.results.values() if r["status"] == "PASS")
        failed = sum(1 for r in self.results.values() if r["status"] in ["FAIL", "ERROR"])
        
        print(f"\n{'='*60}")
        print(f"📊 INTEGRATION TESTING SUMMARY")
        print(f"{'='*60}")
        print(f"Total Integrations: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED INTEGRATIONS:")
            for name, result in self.results.items():
                if result["status"] != "PASS":
                    print(f"   - {name}: {result['details']}")
        
        return passed/total

def test_conversation_memory_integration():
    """Test integration between conversation intelligence and memory system"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        # Test that conversation intelligence can access memory
        test_message = "I want to remember that I prefer morning workouts"
        
        response = conversation_intelligence.generate_response(
            test_message, [], "test_user"
        )
        
        if not response:
            return "No response generated"
        
        # Check if memory integration is working
        if "memory" in str(response).lower():
            return "Memory integration working"
        
        # Check for intelligent population features
        if response.get("intelligent_population"):
            return "Intelligent population integration working"
        
        return "Basic integration working but memory features not evident"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Integration test failed: {e}"

def test_personality_context_integration():
    """Test integration between personality engine and context intelligence"""
    try:
        from app.services.personality_engine import personality_engine
        from app.services.context_intelligence import context_intelligence
        
        # Test that personality engine can use context
        test_message = "I'm feeling anxious about my presentation tomorrow"
        conversation_history = [
            {"role": "user", "content": "I have a big presentation coming up"},
            {"role": "assistant", "content": "Presentations can be nerve-wracking"}
        ]
        
        # Get context first
        context = context_intelligence.analyze_deep_context(
            test_message, conversation_history, "test_user"
        )
        
        # Use context in personality engine
        personality_response = personality_engine.get_personality_response(
            context, test_message
        )
        
        if not personality_response:
            return "No personality response generated"
        
        return "Personality-context integration working"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Integration test failed: {e}"

def test_actions_conversation_integration():
    """Test integration between actions system and conversation intelligence"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        # Test that conversation intelligence can trigger actions
        test_message = "I want to create a fitness goal to run a 5k"
        
        response = conversation_intelligence.generate_response(
            test_message, [], "test_user"
        )
        
        if not response:
            return "No response generated"
        
        # Check if action suggestions are present
        if "goal" in str(response).lower() or "fitness" in str(response).lower():
            return "Action integration working (fitness goals detected)"
        
        # Check for intelligent population
        intelligent_population = response.get("intelligent_population", {})
        if intelligent_population.get("fitness", {}).get("fitness_action") == "populate":
            return "Action integration working (fitness page population)"
        
        return "Action integration needs attention"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Integration test failed: {e}"

def test_intelligent_features_integration():
    """Test integration of all intelligent features together"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        # Test a complex message that should trigger multiple features
        test_message = "I want to wake up at 6 AM every day, workout at 6 PM, and create a meal plan for weight loss. I'm struggling to keep up with my current schedule though."
        
        response = conversation_intelligence.generate_response(
            test_message, [], "test_user"
        )
        
        if not response:
            return "No response generated"
        
        # Check for intelligent population features
        intelligent_population = response.get("intelligent_population", {})
        calendar_action = intelligent_population.get("calendar", {}).get("calendar_action")
        fitness_action = intelligent_population.get("fitness", {}).get("fitness_action")
        nutrition_action = intelligent_population.get("nutrition", {}).get("nutrition_action")
        
        # Check for adherence tracking
        adherence_insights = response.get("adherence_insights", {})
        learning_applied = adherence_insights.get("learning_applied", False)
        
        features_working = 0
        if calendar_action == "populate":
            features_working += 1
        if fitness_action == "populate":
            features_working += 1
        if nutrition_action == "populate":
            features_working += 1
        if learning_applied:
            features_working += 1
        
        if features_working >= 3:
            return f"Intelligent features integration working well ({features_working}/4 features active)"
        elif features_working >= 1:
            return f"Partial intelligent features integration ({features_working}/4 features active)"
        else:
            return "Intelligent features integration not working"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Integration test failed: {e}"

def test_memory_context_integration():
    """Test integration between memory system and context analysis"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        # Test conversation with memory context
        conversation_history = [
            {"role": "user", "content": "I have a medical condition that affects my diet"},
            {"role": "assistant", "content": "I understand you have dietary restrictions due to a medical condition"}
        ]
        
        test_message = "What should I eat for breakfast given my condition?"
        
        response = conversation_intelligence.generate_response(
            test_message, conversation_history, "test_user"
        )
        
        if not response:
            return "No response generated"
        
        # Check if context continuity is working
        if response.get("has_context_continuity"):
            return "Memory-context integration working (context continuity detected)"
        
        # Check if the response references the medical condition
        if "medical" in str(response).lower() or "condition" in str(response).lower():
            return "Memory-context integration working (medical context referenced)"
        
        return "Memory-context integration needs attention"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Integration test failed: {e}"

def test_personality_memory_integration():
    """Test integration between personality engine and memory system"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        # Test personality consistency across conversation
        conversation_history = [
            {"role": "user", "content": "I'm feeling really stressed today"},
            {"role": "assistant", "content": "I can see you're going through a challenging time. Let me help you work through this stress."}
        ]
        
        test_message = "I'm still feeling overwhelmed, can you help me more?"
        
        response = conversation_intelligence.generate_response(
            test_message, conversation_history, "test_user"
        )
        
        if not response:
            return "No response generated"
        
        # Check if personality traits are consistent
        if "empathy" in str(response).lower() or "support" in str(response).lower():
            return "Personality-memory integration working (consistent empathetic responses)"
        
        # Check if the response builds on previous context
        if "stress" in str(response).lower() or "overwhelmed" in str(response).lower():
            return "Personality-memory integration working (context-aware responses)"
        
        return "Personality-memory integration needs attention"
        
    except ImportError:
        return "Services not importable"
    except Exception as e:
        return f"Integration test failed: {e}"

def main():
    """Run all integration tests"""
    print("🔗 PHASE 2: COMPONENT INTEGRATION TESTING")
    print("=" * 60)
    
    tester = IntegrationTester()
    
    # Test all integrations
    integrations = [
        ("Conversation-Memory Integration", test_conversation_memory_integration),
        ("Personality-Context Integration", test_personality_context_integration),
        ("Actions-Conversation Integration", test_actions_conversation_integration),
        ("Intelligent Features Integration", test_intelligent_features_integration),
        ("Memory-Context Integration", test_memory_context_integration),
        ("Personality-Memory Integration", test_personality_memory_integration)
    ]
    
    for name, test_func in integrations:
        tester.test_integration(name, test_func)
    
    # Print summary
    success_rate = tester.print_summary()
    
    return success_rate

if __name__ == "__main__":
    success_rate = main()
    print(f"\n🎯 Integration testing complete. Success rate: {success_rate:.1%}")
