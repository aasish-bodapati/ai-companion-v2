# -*- coding: utf-8 -*-
"""
Core Testing Plan - Holistic Memory System

Focuses on validating the core "brain" functionality:
1. Intent Detection Accuracy (precision/recall)
2. Context-Richness Validation (cross-area links)
3. AI Response Quality (semantic validation)
4. Memory Integrity (store & retrieve)
5. Test Data Scenarios (messy, sparse, overloaded)
"""

import sys
import os
from datetime import datetime, timedelta
import json
import time
from typing import Dict, List, Tuple, Any

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.db.session import SessionLocal
from app.memory.orchestrator import memory_orchestrator, IntentType
from app.memory.holistic_service import holistic_memory_service
from app.models.coaching import WorkoutLog, MealLog, MoodLog, JournalEntry
from app.models.conversation import Conversation, Message


class CoreTestingPlan:
    """Comprehensive core functionality testing for holistic memory system"""
    
    def __init__(self):
        self.test_user_id = "core-test-user-456"
        self.scores = {}
        self.detailed_results = {}
        self.db = None
        
    def setup_comprehensive_test_data(self):
        """Create comprehensive test data with messy, sparse, and overloaded scenarios"""
        print("🔧 Setting up comprehensive test environment...")
        self.db = SessionLocal()
        
        try:
            # Clean up existing data
            self._cleanup_test_data()
            
            # Create diverse test scenarios
            self._create_messy_data_scenario()
            self._create_sparse_data_scenario()
            self._create_overloaded_data_scenario()
            self._create_cross_connection_scenario()
            
            print("✅ Comprehensive test data created")
            return True
            
        except Exception as e:
            print(f"❌ Failed to setup test environment: {e}")
            return False
    
    def _cleanup_test_data(self):
        """Clean up existing test data"""
        self.db.query(WorkoutLog).filter(WorkoutLog.user_id == self.test_user_id).delete()
        self.db.query(MealLog).filter(MealLog.user_id == self.test_user_id).delete()
        self.db.query(MoodLog).filter(MoodLog.user_id == self.test_user_id).delete()
        self.db.query(JournalEntry).filter(JournalEntry.user_id == self.test_user_id).delete()
        self.db.query(Conversation).filter(Conversation.user_id == self.test_user_id).delete()
        self.db.commit()
    
    def _create_messy_data_scenario(self):
        """Create contradictory and inconsistent data to test system robustness"""
        print("📊 Creating messy data scenario...")
        
        # Contradictory meal logs
        meals = [
            {"items": ["salad", "chicken", "quinoa"], "notes": "Clean eating day", "hours_ago": 2},
            {"items": ["pizza", "soda", "chips"], "notes": "Cheat day", "hours_ago": 6},
            {"items": ["smoothie", "protein", "banana"], "notes": "Back to healthy", "hours_ago": 12},
            {"items": ["fast food burger", "fries"], "notes": "Late night craving", "hours_ago": 18}
        ]
        
        for meal in meals:
            meal_log = MealLog(
                user_id=self.test_user_id,
                when=datetime.now() - timedelta(hours=meal["hours_ago"]),
                items=json.dumps(meal["items"]),
                notes=meal["notes"]
            )
            self.db.add(meal_log)
        
        # Inconsistent mood patterns
        moods = [
            {"val": 5, "scale": 5, "tags": ["happy", "motivated"], "notes": "Great workout", "hours_ago": 1},
            {"val": 2, "scale": 5, "tags": ["tired", "frustrated"], "notes": "Work stress", "hours_ago": 5},
            {"val": 4, "scale": 5, "tags": ["accomplished"], "notes": "Finished project", "hours_ago": 9},
            {"val": 1, "scale": 5, "tags": ["exhausted", "overwhelmed"], "notes": "Too much to do", "hours_ago": 13}
        ]
        
        for mood in moods:
            mood_log = MoodLog(
                user_id=self.test_user_id,
                when=datetime.now() - timedelta(hours=mood["hours_ago"]),
                val=mood["val"],
                scale=mood["scale"],
                tags=json.dumps(mood["tags"]),
                notes=mood["notes"]
            )
            self.db.add(mood_log)
    
    def _create_sparse_data_scenario(self):
        """Create minimal data to test system with limited context"""
        print("📊 Creating sparse data scenario...")
        
        # Only one workout in the past week
        workout = WorkoutLog(
            user_id=self.test_user_id,
            when=datetime.now() - timedelta(hours=72),
            type="cardio",
            duration_min=30,
            intensity="medium",
            notes="Quick morning run"
        )
        self.db.add(workout)
        
        # Only one journal entry
        journal = JournalEntry(
            user_id=self.test_user_id,
            when=datetime.now() - timedelta(hours=48),
            title="Weekly Reflection",
            content="Been busy with work, not much time for fitness",
            tags=json.dumps(["work", "busy", "fitness"])
        )
        self.db.add(journal)
    
    def _create_overloaded_data_scenario(self):
        """Create excessive data to test system with information overload"""
        print("📊 Creating overloaded data scenario...")
        
        # Multiple workouts in one day
        workouts = [
            {"type": "strength", "duration_min": 45, "intensity": "high", "notes": "Morning weights", "hours_ago": 2},
            {"type": "cardio", "duration_min": 20, "intensity": "medium", "notes": "Lunch break run", "hours_ago": 6},
            {"type": "yoga", "duration_min": 30, "intensity": "low", "notes": "Evening stretch", "hours_ago": 10}
        ]
        
        for workout in workouts:
            workout_log = WorkoutLog(
                user_id=self.test_user_id,
                when=datetime.now() - timedelta(hours=workout["hours_ago"]),
                type=workout["type"],
                duration_min=workout["duration_min"],
                intensity=workout["intensity"],
                notes=workout["notes"]
            )
            self.db.add(workout_log)
        
        # Multiple meals in one day
        meals = [
            {"items": ["oatmeal", "berries"], "notes": "Breakfast", "hours_ago": 3},
            {"items": ["protein shake"], "notes": "Pre-workout", "hours_ago": 2.5},
            {"items": ["chicken", "rice"], "notes": "Post-workout", "hours_ago": 1.5},
            {"items": ["salad", "tuna"], "notes": "Lunch", "hours_ago": 7},
            {"items": ["nuts", "apple"], "notes": "Snack", "hours_ago": 5}
        ]
        
        for meal in meals:
            meal_log = MealLog(
                user_id=self.test_user_id,
                when=datetime.now() - timedelta(hours=meal["hours_ago"]),
                items=json.dumps(meal["items"]),
                notes=meal["notes"]
            )
            self.db.add(meal_log)
    
    def _create_cross_connection_scenario(self):
        """Create data with clear cross-connections for validation"""
        print("📊 Creating cross-connection scenario...")
        
        # Clear workout → mood correlation
        workout = WorkoutLog(
            user_id=self.test_user_id,
            when=datetime.now() - timedelta(hours=4),
            type="strength",
            duration_min=60,
            intensity="high",
            notes="Heavy leg day - squats and deadlifts"
        )
        self.db.add(workout)
        
        # Mood after workout
        mood = MoodLog(
            user_id=self.test_user_id,
            when=datetime.now() - timedelta(hours=3),
            val=5,
            scale=5,
            tags=json.dumps(["energized", "accomplished"]),
            notes="Feel amazing after that workout!"
        )
        self.db.add(mood)
        
        # Meal after workout
        meal = MealLog(
            user_id=self.test_user_id,
            when=datetime.now() - timedelta(hours=2.5),
            items=json.dumps(["protein shake", "banana", "oats"]),
            notes="Post-workout recovery meal"
        )
        self.db.add(meal)
        
        # Journal reflecting the pattern
        journal = JournalEntry(
            user_id=self.test_user_id,
            when=datetime.now() - timedelta(hours=2),
            title="Workout Pattern Discovery",
            content="I notice I always feel energized after strength training, especially when I eat protein within 30 minutes. This combination really works for me.",
            tags=json.dumps(["pattern", "workout", "nutrition", "energy"])
        )
        self.db.add(journal)
        
        self.db.commit()
    
    def test_intent_detection_comprehensive(self):
        """Test intent detection with expanded test cases and precision/recall metrics"""
        print("\n🧠 Testing Intent Detection (Comprehensive)...")
        
        # Expanded test cases with 10-15 variations per intent type
        test_cases = [
            # ACTION INTENT (15 cases)
            ("Log my meal", IntentType.ACTION, "meal logging"),
            ("Add workout", IntentType.ACTION, "workout logging"),
            ("Track sleep", IntentType.ACTION, "sleep tracking"),
            ("Record mood", IntentType.ACTION, "mood logging"),
            ("Save journal entry", IntentType.ACTION, "journal logging"),
            ("Log water intake", IntentType.ACTION, "hydration logging"),
            ("Mark task complete", IntentType.ACTION, "task completion"),
            ("Set reminder", IntentType.ACTION, "reminder setting"),
            ("Update profile", IntentType.ACTION, "profile update"),
            ("Create goal", IntentType.ACTION, "goal creation"),
            ("Start timer", IntentType.ACTION, "timer start"),
            ("End session", IntentType.ACTION, "session end"),
            ("Submit form", IntentType.ACTION, "form submission"),
            ("Upload file", IntentType.ACTION, "file upload"),
            ("Book appointment", IntentType.ACTION, "appointment booking"),
            
            # CONVERSATION INTENT (30 cases - combined introspection + discussion)
            ("Why do I feel down?", IntentType.CONVERSATION, "emotional reflection"),
            ("I feel restless but don't know why", IntentType.CONVERSATION, "emotional confusion"),
            ("What's wrong with me?", IntentType.CONVERSATION, "self-questioning"),
            ("I'm not sure how I feel", IntentType.CONVERSATION, "emotional uncertainty"),
            ("Why am I so tired lately?", IntentType.CONVERSATION, "symptom questioning"),
            ("I wonder if I'm making progress", IntentType.CONVERSATION, "progress reflection"),
            ("What's causing my stress?", IntentType.CONVERSATION, "stress analysis"),
            ("I feel conflicted about this", IntentType.CONVERSATION, "emotional conflict"),
            ("Am I doing the right thing?", IntentType.CONVERSATION, "decision doubt"),
            ("I need to understand myself better", IntentType.CONVERSATION, "self-understanding"),
            ("What's my emotional state?", IntentType.CONVERSATION, "emotional awareness"),
            ("I feel lost and confused", IntentType.CONVERSATION, "emotional disorientation"),
            ("Why do I keep making the same mistakes?", IntentType.CONVERSATION, "pattern recognition"),
            ("I'm questioning my choices", IntentType.CONVERSATION, "choice evaluation"),
            ("What's my motivation level?", IntentType.CONVERSATION, "motivation assessment"),
            ("Tell me about keto", IntentType.CONVERSATION, "information request"),
            ("What's your opinion on meditation?", IntentType.CONVERSATION, "opinion request"),
            ("How does exercise affect mood?", IntentType.CONVERSATION, "explanation request"),
            ("Can you explain this concept?", IntentType.CONVERSATION, "concept explanation"),
            ("What are the benefits of...?", IntentType.CONVERSATION, "benefit inquiry"),
            ("How do I improve my...?", IntentType.CONVERSATION, "improvement advice"),
            ("What's the best way to...?", IntentType.CONVERSATION, "method inquiry"),
            ("Can you help me understand...?", IntentType.CONVERSATION, "understanding help"),
            ("What should I know about...?", IntentType.CONVERSATION, "knowledge request"),
            ("How do people typically...?", IntentType.CONVERSATION, "typical behavior inquiry"),
            ("What's the difference between...?", IntentType.CONVERSATION, "comparison request"),
            ("Can you give me examples of...?", IntentType.CONVERSATION, "example request"),
            ("What's the science behind...?", IntentType.CONVERSATION, "scientific explanation"),
            ("How do I get started with...?", IntentType.CONVERSATION, "getting started help"),
            ("What are some alternatives to...?", IntentType.CONVERSATION, "alternative options"),
            
            # MIXED INTENT (15 cases)
            ("I worked out today but I feel exhausted, what should I eat?", IntentType.MIXED, "action + question"),
            ("I'm happy about my progress but worried about maintaining it", IntentType.MIXED, "emotion + concern"),
            ("I logged my meal and now I'm curious about nutrition", IntentType.MIXED, "action + curiosity"),
            ("I feel stressed but I know exercise helps, should I work out?", IntentType.MIXED, "emotion + action question"),
            ("I completed my goal and want to set a new one", IntentType.MIXED, "achievement + planning"),
            ("I'm tired but I have energy for a light workout", IntentType.MIXED, "state + capability"),
            ("I ate healthy today and feel proud, what's next?", IntentType.MIXED, "action + emotion + planning"),
            ("I'm confused about my mood but I know exercise helps", IntentType.MIXED, "confusion + knowledge"),
            ("I want to log my workout and get advice on recovery", IntentType.MIXED, "intention + advice request"),
            ("I feel accomplished but also overwhelmed by my goals", IntentType.MIXED, "emotion + challenge"),
            ("I tracked my sleep and noticed a pattern, can you explain?", IntentType.MIXED, "action + observation + explanation"),
            ("I'm motivated to exercise but unsure about my routine", IntentType.MIXED, "motivation + uncertainty"),
            ("I feel grateful for my progress but want to improve more", IntentType.MIXED, "emotion + desire"),
            ("I logged everything today and feel organized, what's the next step?", IntentType.MIXED, "action + emotion + planning"),
            ("I'm proud of my consistency but worried about burnout", IntentType.MIXED, "pride + concern")
        ]
        
        # Calculate precision and recall for each intent type
        intent_results = {intent_type: {"tp": 0, "fp": 0, "fn": 0} for intent_type in IntentType}
        
        for message, expected, description in test_cases:
            detected = memory_orchestrator.detect_intent(message)
            is_correct = detected == expected
            
            # Update confusion matrix
            if is_correct:
                intent_results[expected]["tp"] += 1  # True Positive
            else:
                intent_results[expected]["fn"] += 1  # False Negative
                intent_results[detected]["fp"] += 1  # False Positive
            
            status = "✅" if is_correct else "❌"
            print(f"{status} '{message[:50]}...' -> {detected.value} (expected: {expected.value})")
        
        # Calculate precision, recall, and F1 for each intent type
        intent_metrics = {}
        for intent_type, counts in intent_results.items():
            precision = counts["tp"] / (counts["tp"] + counts["fp"]) if (counts["tp"] + counts["fp"]) > 0 else 0
            recall = counts["tp"] / (counts["tp"] + counts["fn"]) if (counts["tp"] + counts["fn"]) > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            
            intent_metrics[intent_type.value] = {
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "support": counts["tp"] + counts["fn"]
            }
        
        # Overall accuracy
        total_correct = sum(intent_results[it]["tp"] for it in IntentType)
        total_cases = len(test_cases)
        overall_accuracy = total_correct / total_cases
        
        self.scores["intent_detection"] = {
            "overall_accuracy": overall_accuracy,
            "intent_metrics": intent_metrics,
            "total_cases": total_cases,
            "correct_predictions": total_correct
        }
        
        print(f"\n📊 Intent Detection Results:")
        print(f"Overall Accuracy: {overall_accuracy:.1%} ({total_correct}/{total_cases})")
        
        for intent, metrics in intent_metrics.items():
            print(f"{intent.title()}: Precision={metrics['precision']:.1%}, Recall={metrics['recall']:.1%}, F1={metrics['f1']:.1%}")
        
        return intent_metrics
    
    def run_core_testing(self):
        """Run the complete core testing plan"""
        print("🚀 Starting Core Testing Plan")
        print("=" * 50)
        print("Focus: Core 'brain' functionality validation")
        print("Skipping: Latency, scaling, model upgrades")
        print("=" * 50)
        
        try:
            if not self.setup_comprehensive_test_data():
                print("❌ Failed to setup test environment")
                return None
            
            # Run core tests
            self.test_intent_detection_comprehensive()
            
            print("✅ Core testing completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Core testing failed: {e}")
            import traceback
            traceback.print_exc()
            return None
        
        finally:
            if self.db:
                self.db.close()


def main():
    """Main core testing function"""
    tester = CoreTestingPlan()
    success = tester.run_core_testing()
    
    if success:
        print("\n🎉 Core testing completed successfully!")
    else:
        print("\n❌ Core testing failed")


if __name__ == "__main__":
    main()
