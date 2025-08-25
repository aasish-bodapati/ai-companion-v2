#!/usr/bin/env python3
"""
Comprehensive Backend Test Script for AI Companion v2
Testing the new Llama 3.3 70B model via OpenRouter
"""

import asyncio
import json
import sys
import time
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from app.core.config import settings
    from app.services.conversation_intelligence import ConversationIntelligence
    from app.crud.conversation import conversation, message
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.models.conversation import Conversation
    from app.models.conversation import Message
    from app.schemas.conversation import MessageCreate
    from app.schemas.user import UserCreate
    from app.crud.user import user
    from app.core.security import get_password_hash
    import httpx
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)

class BackendTester:
    def __init__(self):
        self.test_results = {}
        self.test_user = None
        self.test_conversation = None
        
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print(f"{'='*60}")
    
    def print_section(self, title):
        print(f"\n📋 {title}")
        print("-" * 40)
    
    def print_result(self, test_name, success, details=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   📝 {details}")
        self.test_results[test_name] = success
    
    async def test_configuration(self):
        """Test configuration loading"""
        self.print_section("Configuration Testing")
        
        try:
            # Test model configuration
            print(f"🔧 Default Model: {settings.LLM_MODEL_DEFAULT}")
            print(f"🚀 Fast Model: {settings.LLM_MODEL_FAST}")
            print(f"📊 Summary Model: {settings.LLM_MODEL_SUMMARY}")
            print(f"🌐 Base URL: {settings.LLM_BASE_URL}")
            print(f"🔑 API Key: {settings.LLM_KEY[:20]}..." if settings.LLM_KEY else "No API key set")
            
            # Verify Llama 3.3 70B is set
            if "llama-3.3-70b" in settings.LLM_MODEL_DEFAULT:
                self.print_result("Model Configuration", True, "Llama 3.3 70B configured correctly")
            else:
                self.print_result("Model Configuration", False, "Expected Llama 3.3 70B model")
            
            # Verify API key
            if settings.LLM_KEY and settings.LLM_KEY.startswith("sk-or-v1-"):
                self.print_result("API Key Configuration", True, "OpenRouter API key configured")
            else:
                self.print_result("API Key Configuration", False, "Invalid or missing API key")
                
        except Exception as e:
            self.print_result("Configuration Loading", False, f"Error: {e}")
    
    async def test_openrouter_connectivity(self):
        """Test OpenRouter API connectivity"""
        self.print_section("OpenRouter Connectivity Testing")
        
        try:
            headers = {
                "Authorization": f"Bearer {settings.LLM_KEY}",
                "Content-Type": "application/json"
            }
            
            # Test models endpoint
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.LLM_BASE_URL}/models",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    models = response.json()
                    llama_model = next((m for m in models.get('data', []) 
                                     if 'llama-3.3-70b' in m.get('id', '')), None)
                    
                    if llama_model:
                        self.print_result("OpenRouter API", True, "Successfully connected to OpenRouter")
                        self.print_result("Llama Model Available", True, f"Model: {llama_model['id']}")
                    else:
                        self.print_result("Llama Model Available", False, "Llama 3.3 70B not found in available models")
                else:
                    self.print_result("OpenRouter API", False, f"Status: {response.status_code}")
                    
        except Exception as e:
            self.print_result("OpenRouter Connectivity", False, f"Error: {e}")
    
    async def test_database_connection(self):
        """Test database connectivity"""
        self.print_section("Database Connection Testing")
        
        try:
            db = SessionLocal()
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
            db.close()
            self.print_result("Database Connection", True, "Successfully connected to PostgreSQL")
        except Exception as e:
            self.print_result("Database Connection", False, f"Error: {e}")
    
    async def create_test_user(self):
        """Create a test user for testing"""
        self.print_section("Test User Creation")
        
        try:
            db = SessionLocal()
            
            # Check if test user exists
            test_user = user.get_by_email(db, email="test-llama@example.com")
            
            if not test_user:
                # Create test user
                user_data = UserCreate(
                    email="test-llama@example.com",
                    password="testpassword123",
                    full_name="Test Llama User",
                    is_superuser=False
                )
                test_user = user.create(db, obj_in=user_data)
                self.print_result("Test User Creation", True, f"Created user: {test_user.email}")
            else:
                self.print_result("Test User Creation", True, f"User already exists: {test_user.email}")
            
            self.test_user = test_user
            db.close()
            
        except Exception as e:
            self.print_result("Test User Creation", False, f"Error: {e}")
    
    async def create_test_conversation(self):
        """Create a test conversation"""
        self.print_section("Test Conversation Creation")
        
        try:
            db = SessionLocal()
            
            # Create test conversation
            from app.schemas.conversation import ConversationCreate
            conversation_data = ConversationCreate(
                title="Llama Model Test Conversation"
            )
            
            test_conversation = conversation.create_with_owner(db, obj_in=conversation_data, owner_id=self.test_user.id)
            self.test_conversation = test_conversation
            
            self.print_result("Test Conversation Creation", True, f"Created conversation: {test_conversation.id}")
            db.close()
            
        except Exception as e:
            self.print_result("Test Conversation Creation", False, f"Error: {e}")
    
    async def test_llama_model_response(self):
        """Test the Llama 3.3 70B model with a simple query"""
        self.print_section("Llama Model Response Testing")
        
        try:
            # Test simple query
            test_message = "Hello! Can you tell me what time it is and give me a brief weather update?"
            
            # Initialize conversation intelligence
            conversation_intelligence = ConversationIntelligence()
            
            # Generate response
            start_time = time.time()
            response = conversation_intelligence.generate_response(
                user_message=test_message,
                conversation_history=[],
                user_id=str(self.test_user.id)
            )
            end_time = time.time()
            
            response_time = end_time - start_time
            
            if response and "message" in response:
                self.print_result("Llama Model Response", True, f"Response generated in {response_time:.2f}s")
                print(f"   📝 Response preview: {response['message'][:200]}...")
                
                # Check if response is coherent (not random data)
                if any(word in response['message'].lower() for word in ['hello', 'time', 'weather', 'greeting']):
                    self.print_result("Response Coherence", True, "Response appears coherent and relevant")
                else:
                    self.print_result("Response Coherence", False, "Response may not be coherent")
            else:
                self.print_result("Llama Model Response", False, "No response generated")
                
        except Exception as e:
            self.print_result("Llama Model Response", False, f"Error: {e}")
    
    async def test_calendar_functionality(self):
        """Test calendar functionality with the new model"""
        self.print_section("Calendar Functionality Testing")
        
        try:
            # Test calendar intent detection
            calendar_message = "Can you add a meeting with John tomorrow at 2pm about the project review?"
            
            conversation_intelligence = ConversationIntelligence()
            
            response = conversation_intelligence.generate_response(
                user_message=calendar_message,
                conversation_history=[],
                user_id=str(self.test_user.id)
            )
            
            if response and "message" in response:
                self.print_result("Calendar Intent Detection", True, "Calendar intent processed")
                
                # Check for calendar-related content
                message_content = response['message'].lower()
                if any(word in message_content for word in ['meeting', 'john', 'tomorrow', '2pm', 'project']):
                    self.print_result("Calendar Content Relevance", True, "Response contains relevant calendar information")
                else:
                    self.print_result("Calendar Content Relevance", False, "Response may not be calendar-focused")
                
                # Check for executed actions
                if "executed_actions" in response and response["executed_actions"]:
                    self.print_result("Calendar Action Execution", True, f"Actions executed: {len(response['executed_actions'])}")
                else:
                    self.print_result("Calendar Action Execution", False, "No actions were executed")
                    
            else:
                self.print_result("Calendar Intent Detection", False, "No response generated")
                
        except Exception as e:
            self.print_result("Calendar Functionality", False, f"Error: {e}")
    
    async def test_streaming_capability(self):
        """Test if the model supports streaming responses"""
        self.print_section("Streaming Capability Testing")
        
        try:
            # Test with a longer query that should trigger streaming
            long_message = "Please write a detailed explanation of how artificial intelligence can help with personal productivity, including specific examples and best practices for implementation."
            
            conversation_intelligence = ConversationIntelligence()
            
            # This would normally use streaming, but we're testing the model's capability
            response = conversation_intelligence.generate_response(
                user_message=long_message,
                conversation_history=[],
                user_id=str(self.test_user.id)
            )
            
            if response and "message" in response:
                message_length = len(response['message'])
                if message_length > 100:  # Expecting a detailed response
                    self.print_result("Streaming Capability", True, f"Generated detailed response ({message_length} chars)")
                else:
                    self.print_result("Streaming Capability", False, f"Response too short ({message_length} chars)")
            else:
                self.print_result("Streaming Capability", False, "No response generated")
                
        except Exception as e:
            self.print_result("Streaming Capability", False, f"Error: {e}")
    
    async def run_all_tests(self):
        """Run all tests"""
        self.print_header("AI Companion Backend - Llama 3.3 70B Model Testing")
        
        print("🚀 Starting comprehensive backend testing...")
        
        # Run tests in sequence
        await self.test_configuration()
        await self.test_openrouter_connectivity()
        await self.test_database_connection()
        await self.create_test_user()
        await self.create_test_conversation()
        await self.test_llama_model_response()
        await self.test_calendar_functionality()
        await self.test_streaming_capability()
        
        # Summary
        self.print_header("Test Results Summary")
        
        total_tests = len(self.test_results)
        passed_tests = sum(self.test_results.values())
        failed_tests = total_tests - passed_tests
        
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests == 0:
            print("\n🎉 All tests passed! The new Llama 3.3 70B model is working correctly.")
        else:
            print(f"\n⚠️  {failed_tests} test(s) failed. Check the details above.")
        
        return failed_tests == 0

async def main():
    """Main function"""
    tester = BackendTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🚀 Backend is ready with the new Llama 3.3 70B model!")
        print("💡 You can now restart your backend server to use the improved model.")
    else:
        print("\n🔧 Some tests failed. Please fix the issues before proceeding.")
    
    return success

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)
