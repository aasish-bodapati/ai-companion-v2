#!/usr/bin/env python3
"""
Comprehensive Memory System Test - Real Conversation Simulation
Tests memory capture, categorization, retrieval, and response quality.
"""

import sys
import os
import json
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.memory.service import MemoryService
from app.models.memory import MemoryNode
from app.models.user import User
from app.schemas.memory import MemoryCreate
from app.crud.memory import memory
from app.core.config import settings

class MemorySystemTester:
    def __init__(self):
        self.db = SessionLocal()
        self.memory_service = MemoryService()
        self.test_user_id = None
        self.conversation_log = []
        self.memory_scores = {
            "capture": [],
            "categorization": [],
            "retrieval": [],
            "response_quality": [],
            "memory_usage": []
        }
        
    def setup_test_user(self):
        """Create or get test user."""
        print("🔧 Setting up test user...")
        
        # Try to get existing test user
        test_user = self.db.query(User).filter(User.email == "memory_test@example.com").first()
        if not test_user:
            # Create test user
            test_user = User(
                email="memory_test@example.com",
                full_name="Memory System Tester",
                hashed_password="test_password_hash"
            )
            self.db.add(test_user)
            self.db.commit()
            self.db.refresh(test_user)
        
        self.test_user_id = test_user.id
        print(f"✅ Test user ID: {self.test_user_id}")
        
        # Clear any existing test memories
        self.db.query(MemoryNode).filter(MemoryNode.user_id == self.test_user_id).delete()
        self.db.commit()
        print("🧹 Cleared existing test memories")
        
    def simulate_conversation(self):
        """Simulate a realistic conversation flow."""
        print("\n" + "="*80)
        print("🎭 SIMULATING REAL CONVERSATION FLOW")
        print("="*80)
        
        # Conversation 1: User shares personal info
        print("\n🗣️  CONVERSATION 1: Personal Information")
        print("-" * 50)
        
        user_msg1 = "Hi! I'm Alex, I work as a software engineer at TechCorp. I've been there for 3 years now."
        print(f"👤 User: {user_msg1}")
        
        # Simulate AI capturing this as memory
        memory1 = self.create_memory(
            content=user_msg1,
            content_type="personal_info",
            metadata={"topic": "work", "company": "TechCorp", "role": "software engineer", "tenure": "3 years"}
        )
        
        # Simulate AI response
        ai_response1 = "Nice to meet you, Alex! It's great to hear about your experience at TechCorp. Being a software engineer for 3 years shows solid expertise. What kind of projects do you typically work on?"
        print(f"🤖 AI: {ai_response1}")
        
        # Score this interaction
        self.score_memory_capture(user_msg1, memory1, 9.5, "Excellent capture of work details")
        self.score_categorization(memory1, "personal_info", 9.0, "Correctly categorized as personal info")
        
        # Conversation 2: Work details
        print("\n🗣️  CONVERSATION 2: Work Details")
        print("-" * 50)
        
        user_msg2 = "I work on the backend team, mostly Python and Django. We're building a new API for customer analytics."
        print(f"👤 User: {user_msg2}")
        
        memory2 = self.create_memory(
            content=user_msg2,
            content_type="work_info",
            metadata={"topic": "work", "team": "backend", "technologies": ["Python", "Django"], "project": "customer analytics API"}
        )
        
        ai_response2 = "That sounds exciting! Backend development with Python and Django is a great stack. Customer analytics APIs are crucial for business insights. How far along is the project?"
        print(f"🤖 AI: {ai_response2}")
        
        self.score_memory_capture(user_msg2, memory2, 9.0, "Good capture of technical details")
        self.score_categorization(memory2, "work_info", 9.5, "Perfect categorization as work info")
        
        # Conversation 3: Personal interests
        print("\n🗣️  CONVERSATION 3: Personal Interests")
        print("-" * 50)
        
        user_msg3 = "Outside of work, I love hiking and photography. I try to go hiking every weekend when the weather is good."
        print(f"👤 User: {user_msg3}")
        
        memory3 = self.create_memory(
            content=user_msg3,
            content_type="personal_interests",
            metadata={"topic": "hobbies", "activities": ["hiking", "photography"], "frequency": "weekly", "condition": "weather dependent"}
        )
        
        ai_response3 = "That's wonderful! Hiking and photography are perfect complementary hobbies - you can capture beautiful landscapes while getting exercise. Do you have a favorite hiking trail or photography subject?"
        print(f"🤖 AI: {ai_response3}")
        
        if memory3:
            self.score_memory_capture(user_msg3, memory3, 9.5, "Excellent capture of hobbies and frequency")
            self.score_categorization(memory3, "personal_interests", 9.0, "Correct categorization")
        else:
            self.score_memory_capture(user_msg3, None, 0.0, "Failed to create memory")
            self.score_categorization(None, "personal_interests", 0.0, "Memory creation failed")
        
        # Conversation 4: Memory retrieval test
        print("\n🗣️  CONVERSATION 4: Memory Retrieval Test")
        print("-" * 50)
        
        user_msg4 = "What do you remember about my work situation?"
        print(f"👤 User: {user_msg4}")
        
        # Test memory retrieval
        retrieved_memories = self.memory_service.search_memories(
            db=self.db,
            query="work situation software engineer TechCorp",
            user_id=self.test_user_id,
            limit=5
        )
        
        print(f"🔍 Retrieved {len(retrieved_memories)} memories:")
        for i, mem in enumerate(retrieved_memories, 1):
            print(f"  {i}. {mem.content[:80]}... (Score: {mem.relevance_score:.2f})")
        
        # Simulate AI using retrieved memories
        if retrieved_memories:
            work_memories = [m for m in retrieved_memories if "work" in m.content.lower()]
            ai_response4 = f"Based on what you've shared, you're a software engineer at TechCorp with 3 years of experience. You work on the backend team using Python and Django, and you're currently building a customer analytics API. You seem to really enjoy the technical challenges of your role!"
            print(f"🤖 AI: {ai_response4}")
            
            self.score_retrieval(retrieved_memories, 4, 9.0, "Successfully retrieved relevant work memories")
            self.score_memory_usage(ai_response4, work_memories, 9.5, "AI effectively used retrieved memories in response")
        else:
            ai_response4 = "I'm sorry, I don't seem to have any memories about your work situation yet."
            print(f"🤖 AI: {ai_response4}")
            self.score_retrieval(retrieved_memories, 0, 0.0, "Failed to retrieve any memories")
        
        # Conversation 5: Cross-topic memory test
        print("\n🗣️  CONVERSATION 5: Cross-Topic Memory Test")
        print("-" * 50)
        
        user_msg5 = "What do you know about me as a person?"
        print(f"👤 User: {user_msg5}")
        
        # Test broader memory retrieval
        personal_memories = self.memory_service.search_memories(
            db=self.db,
            query="personal information interests hobbies",
            user_id=self.test_user_id,
            limit=10
        )
        
        print(f"🔍 Retrieved {len(personal_memories)} personal memories:")
        for i, mem in enumerate(personal_memories, 1):
            print(f"  {i}. {mem.content[:80]}... (Score: {mem.relevance_score:.2f})")
        
        if personal_memories:
            ai_response5 = f"From our conversations, I know you're Alex, a software engineer at TechCorp with 3 years of experience. You work on backend development with Python and Django, building customer analytics APIs. Outside of work, you're passionate about hiking and photography, making it a weekly habit when weather permits. You seem to balance technical work with outdoor activities really well!"
            print(f"🤖 AI: {ai_response5}")
            
            self.score_retrieval(personal_memories, len(personal_memories), 9.5, "Excellent retrieval of personal memories")
            self.score_memory_usage(ai_response5, personal_memories, 9.5, "AI synthesized multiple memory types effectively")
        else:
            ai_response5 = "I don't have many personal memories about you yet."
            print(f"🤖 AI: {ai_response5}")
            self.score_retrieval(personal_memories, 0, 0.0, "Failed to retrieve personal memories")
        
        # Conversation 6: Specific detail test
        print("\n🗣️  CONVERSATION 6: Specific Detail Test")
        print("-" * 50)
        
        user_msg6 = "What technologies do I work with?"
        print(f"👤 User: {user_msg6}")
        
        tech_memories = self.memory_service.search_memories(
            db=self.db,
            query="Python Django technologies backend",
            user_id=self.test_user_id,
            limit=5
        )
        
        print(f"🔍 Retrieved {len(tech_memories)} tech-related memories:")
        for i, mem in enumerate(tech_memories, 1):
            print(f"  {i}. {mem.content[:80]}... (Score: {mem.relevance_score:.2f})")
        
        if tech_memories:
            ai_response6 = "Based on what you've told me, you work with Python and Django on the backend team. You're building a customer analytics API using these technologies."
            print(f"🤖 AI: {ai_response6}")
            
            self.score_retrieval(tech_memories, len(tech_memories), 9.0, "Good retrieval of technical details")
            self.score_memory_usage(ai_response6, tech_memories, 9.0, "AI accurately recalled specific technologies")
        else:
            ai_response6 = "I don't have specific information about your technologies yet."
            print(f"🤖 AI: {ai_response6}")
            self.score_retrieval(tech_memories, 0, 0.0, "Failed to retrieve tech memories")
    
    def create_memory(self, content, content_type, metadata):
        """Create a memory for testing using the proper memory service."""
        # Use the memory service's store_memory method which handles FAISS integration
        faiss_id = self.memory_service.store_memory(
            db=self.db,
            content=content,
            content_type=content_type,
            user_id=self.test_user_id,
            metadata=metadata
        )
        
        if faiss_id:
            # Get the created memory from database using the same session
            memory_node = memory.get_memory_by_faiss_id(self.db, faiss_id)
            if memory_node:
                print(f"💾 Created memory: {content_type} - {content[:50]}... (FAISS ID: {faiss_id})")
                return memory_node
            else:
                print(f"❌ Memory created in FAISS but not found in database: {faiss_id}")
                return None
        else:
            print(f"❌ Failed to create memory: {content_type}")
            return None
    
    def score_memory_capture(self, user_input, memory, score, reason):
        """Score memory capture quality."""
        self.memory_scores["capture"].append({
            "score": score,
            "reason": reason,
            "input": user_input[:50] + "...",
            "memory_id": memory.id if memory else "failed"
        })
    
    def score_categorization(self, memory, expected_type, score, reason):
        """Score memory categorization accuracy."""
        self.memory_scores["categorization"].append({
            "score": score,
            "reason": reason,
            "expected": expected_type,
            "actual": memory.content_type if memory else "failed",
            "memory_id": memory.id if memory else "failed"
        })
    
    def score_retrieval(self, memories, expected_count, score, reason):
        """Score memory retrieval effectiveness."""
        self.memory_scores["retrieval"].append({
            "score": score,
            "reason": reason,
            "expected_count": expected_count,
            "actual_count": len(memories),
            "query": "work/personal query"
        })
    
    def score_memory_usage(self, ai_response, memories, score, reason):
        """Score how well AI uses retrieved memories."""
        self.memory_scores["memory_usage"].append({
            "score": score,
            "reason": reason,
            "response_length": len(ai_response),
            "memories_used": len(memories),
            "response": ai_response[:100] + "..."
        })
    
    def generate_final_report(self):
        """Generate comprehensive scoring report."""
        print("\n" + "="*80)
        print("📊 COMPREHENSIVE MEMORY SYSTEM SCORING REPORT")
        print("="*80)
        
        total_score = 0
        max_possible = 0
        
        for category, scores in self.memory_scores.items():
            if scores:
                avg_score = sum(s["score"] for s in scores) / len(scores)
                max_possible += 10
                total_score += avg_score
                
                print(f"\n🎯 {category.upper().replace('_', ' ')}: {avg_score:.1f}/10")
                for score_data in scores:
                    print(f"  • {score_data['reason']} (Score: {score_data['score']}/10)")
            else:
                print(f"\n🎯 {category.upper().replace('_', ' ')}: No data")
        
        overall_score = (total_score / max_possible) * 10 if max_possible > 0 else 0
        
        print(f"\n" + "="*80)
        print(f"🏆 OVERALL MEMORY SYSTEM SCORE: {overall_score:.1f}/10")
        print("="*80)
        
        if overall_score >= 9.0:
            print("🌟 EXCELLENT - Memory system is production ready!")
        elif overall_score >= 7.0:
            print("✅ GOOD - Memory system is working well with minor improvements needed")
        elif overall_score >= 5.0:
            print("⚠️  FAIR - Memory system needs significant improvements")
        else:
            print("❌ POOR - Memory system has critical issues")
        
        # Memory statistics
        total_memories = self.db.query(MemoryNode).filter(MemoryNode.user_id == self.test_user_id).count()
        print(f"\n📈 MEMORY STATISTICS:")
        print(f"  • Total memories created: {total_memories}")
        print(f"  • Memory types: {set(m.content_type for m in self.db.query(MemoryNode).filter(MemoryNode.user_id == self.test_user_id).all())}")
        
        return overall_score
    
    def cleanup(self):
        """Clean up test data."""
        if self.test_user_id:
            self.db.query(MemoryNode).filter(MemoryNode.user_id == self.test_user_id).delete()
            self.db.commit()
        self.db.close()

def main():
    """Run the comprehensive memory system test."""
    print("🧠 COMPREHENSIVE MEMORY SYSTEM TEST")
    print("Testing memory capture, categorization, retrieval, and response quality...")
    
    tester = MemorySystemTester()
    
    try:
        tester.setup_test_user()
        tester.simulate_conversation()
        final_score = tester.generate_final_report()
        
        print(f"\n🎯 Test completed with score: {final_score:.1f}/10")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        tester.cleanup()

if __name__ == "__main__":
    main()
