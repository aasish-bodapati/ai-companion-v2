#!/usr/bin/env python3
"""
Quick test for ConversationIntelligence fixes
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def test_conversation_intelligence():
    try:
        from app.services.conversation_intelligence import ConversationIntelligence
        
        print("🔧 Testing ConversationIntelligence...")
        
        ci = ConversationIntelligence()
        
        # Test 1: Simple greeting
        print("\n📋 Test 1: Simple Greeting")
        response1 = ci.generate_response("Hello, how are you today?", [], "test-user")
        print(f"✅ Response: {response1.get('message', 'No message')[:100]}...")
        
        # Test 2: Calendar request
        print("\n📋 Test 2: Calendar Request")
        response2 = ci.generate_response("Can you schedule a meeting with John tomorrow at 2pm?", [], "test-user")
        print(f"✅ Response: {response2.get('message', 'No message')[:100]}...")
        
        if "executed_actions" in response2:
            print(f"✅ Actions executed: {len(response2['executed_actions'])}")
        else:
            print("❌ No actions executed")
        
        # Test 3: Check if responses are in English and relevant
        print("\n📋 Test 3: Quality Check")
        
        chinese_chars_1 = len([c for c in response1.get('message', '') if '\u4e00' <= c <= '\u9fff'])
        chinese_chars_2 = len([c for c in response2.get('message', '') if '\u4e00' <= c <= '\u9fff'])
        
        if chinese_chars_1 + chinese_chars_2 < 5:
            print("✅ Language: Responses are in English")
        else:
            print(f"❌ Language: Found {chinese_chars_1 + chinese_chars_2} Chinese characters")
        
        # Check for greeting response
        greeting_words = ['hello', 'hi', 'good', 'fine', 'well', 'today', 'great', 'thanks']
        if any(word in response1.get('message', '').lower() for word in greeting_words):
            print("✅ Greeting: Responds appropriately to greeting")
        else:
            print("❌ Greeting: Does not respond appropriately to greeting")
        
        # Check for calendar context
        calendar_words = ['meeting', 'schedule', 'john', 'tomorrow', '2pm', 'calendar']
        if any(word in response2.get('message', '').lower() for word in calendar_words):
            print("✅ Calendar: Response relates to calendar request")
        else:
            print("❌ Calendar: Response does not relate to calendar")
        
        print("\n🎉 ConversationIntelligence test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing ConversationIntelligence: {e}")
        return False

if __name__ == "__main__":
    success = test_conversation_intelligence()
    sys.exit(0 if success else 1)
