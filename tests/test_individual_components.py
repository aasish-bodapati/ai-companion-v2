#!/usr/bin/env python3
"""
PHASE 1: INDIVIDUAL COMPONENT TESTING
Tests each service, API, and model in isolation
"""

import sys
import os
import time
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

class ComponentTester:
    def __init__(self):
        self.results = {}
        
    def test_component(self, name: str, test_func):
        """Test a single component"""
        print(f"\n🧪 Testing {name}...")
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
        """Print component testing summary"""
        total = len(self.results)
        passed = sum(1 for r in self.results.values() if r["status"] == "PASS")
        failed = sum(1 for r in self.results.values() if r["status"] in ["FAIL", "ERROR"])
        
        print(f"\n{'='*60}")
        print(f"📊 COMPONENT TESTING SUMMARY")
        print(f"{'='*60}")
        print(f"Total Components: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED COMPONENTS:")
            for name, result in self.results.items():
                if result["status"] != "PASS":
                    print(f"   - {name}: {result['details']}")
        
        return passed/total

def test_conversation_intelligence():
    """Test conversation intelligence service"""
    try:
        from app.services.conversation_intelligence import conversation_intelligence
        
        # Test basic functionality
        if not hasattr(conversation_intelligence, 'life_domains'):
            return "Missing life_domains attribute"
        
        # Test domain detection
        test_message = "I need help with my fitness routine"
        context = conversation_intelligence.analyze_conversation_context(test_message, [])
        
        if not context.get("detected_domains"):
            return "Domain detection not working"
        
        if "fitness" not in context.get("detected_domains", []):
            return "Fitness domain not detected correctly"
        
        return "All basic functionality working"
        
    except ImportError:
        return "Service not importable"
    except Exception as e:
        return f"Test failed: {e}"

def test_human_response_generator():
    """Test human response generator service"""
    try:
        from app.services.human_response_generator import human_response_generator
        
        # Test basic response generation
        test_message = "I'm feeling stressed about work"
        response = human_response_generator.generate_human_response(
            test_message, [], "test_user"
        )
        
        if not response.get("message"):
            return "No message generated"
        
        if len(response.get("message", "")) < 10:
            return "Response too short"
        
        return "Response generation working correctly"
        
    except ImportError:
        return "Service not importable"
    except Exception as e:
        return f"Test failed: {e}"

def test_personality_engine():
    """Test personality engine service"""
    try:
        from app.services.personality_engine import personality_engine
        
        # Test personality response generation
        context = {"emotional_state": "stressed", "detected_domains": ["stress"]}
        response = personality_engine.get_personality_response(context, "I need help")
        
        if not response:
            return "No personality response generated"
        
        # Check if personality traits are present
        if not hasattr(personality_engine, 'core_traits'):
            return "Missing core personality traits"
        
        return "Personality engine working correctly"
        
    except ImportError:
        return "Service not importable"
    except Exception as e:
        return f"Test failed: {e}"

def test_context_intelligence():
    """Test context intelligence service"""
    try:
        from app.services.context_intelligence import context_intelligence
        
        # Test deep context analysis
        conversation_history = [
            {"role": "user", "content": "I need help with fitness"},
            {"role": "assistant", "content": "I can help with your fitness goals"}
        ]
        
        context = context_intelligence.analyze_deep_context(
            "I want to lose weight", conversation_history, "test_user"
        )
        
        if not context:
            return "No context analysis generated"
        
        return "Context intelligence working correctly"
        
    except ImportError:
        return "Service not importable"
    except Exception as e:
        return f"Test failed: {e}"

def test_memory_system():
    """Test memory system"""
    try:
        from app.memory.service import memory_service
        from app.memory.neural_system import neural_memory_system
        
        # Test memory service initialization
        if not hasattr(memory_service, 'store_memory'):
            return "Memory service missing store_memory method"
        
        # Test neural memory system
        if not hasattr(neural_memory_system, 'add_memory'):
            return "Neural memory system missing add_memory method"
        
        return "Memory system components present and accessible"
        
    except ImportError:
        return "Service not importable"
    except Exception as e:
        return f"Test failed: {e}"

def test_actions_registry():
    """Test actions registry"""
    try:
        from app.actions.registry import ActionsRegistry
        
        # Test registry initialization
        registry = ActionsRegistry()
        
        if not hasattr(registry, '_catalog'):
            return "Actions registry missing catalog"
        
        # Check if key actions are registered
        if 'fitness.create_goal' not in registry._catalog:
            return "Fitness actions not registered"
        
        return "Actions registry properly initialized with fitness actions"
        
    except ImportError:
        return "Service not importable"
    except Exception as e:
        return f"Test failed: {e}"

def test_action_router():
    """Test action router"""
    try:
        from app.actions.router import ActionRouter
        
        # Test router initialization
        router = ActionRouter()
        
        if not hasattr(router, 'execute_action'):
            return "Action router missing execute_action method"
        
        return "Action router properly initialized"
        
    except ImportError:
        return "Service not importable"
    except Exception as e:
        return f"Test failed: {e}"

def main():
    """Run all component tests"""
    print("🔧 PHASE 1: INDIVIDUAL COMPONENT TESTING")
    print("=" * 60)
    
    tester = ComponentTester()
    
    # Test all components
    components = [
        ("Conversation Intelligence", test_conversation_intelligence),
        ("Human Response Generator", test_human_response_generator),
        ("Personality Engine", test_personality_engine),
        ("Context Intelligence", test_context_intelligence),
        ("Memory System", test_memory_system),
        ("Actions Registry", test_actions_registry),
        ("Action Router", test_action_router)
    ]
    
    for name, test_func in components:
        tester.test_component(name, test_func)
    
    # Print summary
    success_rate = tester.print_summary()
    
    return success_rate

if __name__ == "__main__":
    success_rate = main()
    print(f"\n🎯 Component testing complete. Success rate: {success_rate:.1%}")
