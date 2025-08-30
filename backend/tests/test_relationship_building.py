"""
Test suite for Relationship Building features

Tests the relationship memory service, trust building engine, and their integration
with the conversational intelligence system.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.services.relationship_memory import (
    relationship_memory_service,
    TrustLevel,
    CommunicationStyle,
    ExperienceType
)
from app.services.trust_building import (
    trust_building_engine,
    TrustBuildingStrategy,
    VulnerabilityLevel,
    TrustRepairType
)
from app.services.conversational_intelligence import (
    conversational_intelligence,
    ConversationContext,
    ResponseStyle
)


class TestRelationshipMemory:
    """Test the Relationship Memory Service."""
    
    @pytest.fixture
    def sample_user_id(self):
        return "test_user_123"
    
    @pytest.fixture
    def sample_interaction_data(self):
        return {
            "session_duration": 5.0,
            "message_style": {
                "style": "supportive",
                "confidence": 0.8,
                "context": "emotional_support",
                "effectiveness": 0.9
            },
            "experience_significance": 0.7,
            "conversation_depth": 0.8,
            "vulnerability_shared": True,
            "vulnerability_type": "emotional"
        }
    
    @pytest.mark.asyncio
    async def test_get_relationship_context_new_user(self, sample_user_id):
        """Test getting relationship context for a new user."""
        context = await relationship_memory_service.get_relationship_context(sample_user_id)
        
        assert context.user_id == sample_user_id
        assert context.current_trust_level == TrustLevel.STRANGER
        assert context.trust_score == 0.0
        assert context.total_interactions == 0
        assert context.relationship_start is not None
    
    @pytest.mark.asyncio
    async def test_record_interaction_basic(self, sample_user_id, sample_interaction_data):
        """Test recording a basic interaction."""
        await relationship_memory_service.record_interaction(sample_user_id, sample_interaction_data)
        
        context = await relationship_memory_service.get_relationship_context(sample_user_id)
        
        assert context.total_interactions == 1
        assert context.average_session_length == 5.0
        assert len(context.communication_preferences) == 1
        assert context.communication_preferences[0].style == CommunicationStyle.SUPPORTIVE
    
    @pytest.mark.asyncio
    async def test_trust_event_recording(self, sample_user_id):
        """Test recording trust events."""
        interaction_data = {
            "trust_event": {
                "type": "build",
                "description": "User shared personal story",
                "impact": 0.3,
                "context": "emotional_vulnerability",
                "user_behavior": "opened_up",
                "ai_response": "supportive_listening",
                "trust_change": 0.2
            }
        }
        
        await relationship_memory_service.record_interaction(sample_user_id, interaction_data)
        
        context = await relationship_memory_service.get_relationship_context(sample_user_id)
        
        assert context.trust_score == 0.2
        assert context.current_trust_level == TrustLevel.ACQUAINTANCE
        assert len(context.trust_events) == 1
        assert context.trust_events[0].event_type == "build"
    
    @pytest.mark.asyncio
    async def test_shared_experience_recording(self, sample_user_id):
        """Test recording shared experiences."""
        interaction_data = {
            "experience_significance": 0.8,
            "type": "deep_talk",
            "title": "Life Philosophy Discussion",
            "description": "Deep conversation about life goals",
            "emotional_impact": 0.6,
            "keywords": ["philosophy", "goals", "meaning"],
            "user_sentiment": "reflective",
            "ai_role": "listener",
            "outcome": "deeper_understanding"
        }
        
        await relationship_memory_service.record_interaction(sample_user_id, interaction_data)
        
        context = await relationship_memory_service.get_relationship_context(sample_user_id)
        
        assert len(context.shared_experiences) == 1
        assert context.shared_experiences[0].title == "Life Philosophy Discussion"
        assert context.shared_experiences[0].experience_type == ExperienceType.DEEP_TALK
        assert "philosophy" in context.recent_themes
    
    @pytest.mark.asyncio
    async def test_milestone_detection(self, sample_user_id):
        """Test milestone detection."""
        # First, build up trust
        for i in range(5):
            await relationship_memory_service.record_interaction(sample_user_id, {
                "trust_event": {
                    "type": "build",
                    "trust_change": 0.1
                }
            })
        
        # Add deep conversation
        await relationship_memory_service.record_interaction(sample_user_id, {
            "conversation_depth": 0.8,
            "experience_significance": 0.9
        })
        
        context = await relationship_memory_service.get_relationship_context(sample_user_id)
        
        assert len(context.milestones) > 0
        milestone_types = [m.milestone_type for m in context.milestones]
        assert "first_deep_conversation" in milestone_types or "trust_breakthrough" in milestone_types
    
    @pytest.mark.asyncio
    async def test_relationship_summary(self, sample_user_id, sample_interaction_data):
        """Test getting relationship summary."""
        await relationship_memory_service.record_interaction(sample_user_id, sample_interaction_data)
        
        summary = await relationship_memory_service.get_relationship_summary(sample_user_id)
        
        assert "trust_level" in summary
        assert "trust_score" in summary
        assert "relationship_stage" in summary
        assert "total_interactions" in summary
        assert "preferred_communication_style" in summary
        assert "relationship_strengths" in summary
        assert "relationship_challenges" in summary
        assert "growth_areas" in summary
    
    @pytest.mark.asyncio
    async def test_personality_adaptation(self, sample_user_id):
        """Test personality adaptation based on relationship context."""
        # Build up trust first
        await relationship_memory_service.record_interaction(sample_user_id, {
            "trust_event": {"type": "build", "trust_change": 0.4}
        })
        
        adaptations = await relationship_memory_service.get_personality_adaptation(sample_user_id)
        
        assert "approach" in adaptations
        assert "humor" in adaptations
        assert "communication_style" in adaptations
        assert "formality" in adaptations
        assert "personal_sharing" in adaptations


class TestTrustBuilding:
    """Test the Trust Building Engine."""
    
    @pytest.fixture
    def sample_conversation_context(self):
        return {
            "stage": "exploring",
            "conversation_history": ["Hello", "How are you?", "I'm feeling stressed"],
            "user_patterns": ["stress", "work", "anxiety"]
        }
    
    @pytest.mark.asyncio
    async def test_vulnerability_opportunity_detection(self, sample_conversation_context):
        """Test detecting vulnerability sharing opportunities."""
        message = "I'm really struggling with work right now"
        emotion = "stressed"
        trust_level = 0.5
        
        opportunity = await trust_building_engine.analyze_trust_building_opportunity(
            message, emotion, trust_level, sample_conversation_context
        )
        
        assert opportunity is not None
        assert opportunity.strategy == TrustBuildingStrategy.VULNERABILITY
        assert opportunity.risk_level < 0.5
        assert opportunity.expected_impact > 0.2
    
    @pytest.mark.asyncio
    async def test_validation_opportunity_detection(self, sample_conversation_context):
        """Test detecting validation opportunities."""
        message = "I finally finished that big project!"
        emotion = "excited"
        trust_level = 0.3
        
        opportunity = await trust_building_engine.analyze_trust_building_opportunity(
            message, emotion, trust_level, sample_conversation_context
        )
        
        assert opportunity is not None
        assert opportunity.strategy == TrustBuildingStrategy.VALIDATION
        assert opportunity.risk_level < 0.2
        assert opportunity.expected_impact > 0.2
    
    @pytest.mark.asyncio
    async def test_consistency_opportunity_detection(self, sample_conversation_context):
        """Test detecting consistency opportunities."""
        message = "You always help me with this"
        emotion = "grateful"
        trust_level = 0.6
        
        # Add more history to trigger consistency detection
        sample_conversation_context["conversation_history"] = ["msg1", "msg2", "msg3", "msg4", "msg5"]
        sample_conversation_context["user_patterns"] = ["pattern1", "pattern2", "pattern3"]
        
        opportunity = await trust_building_engine.analyze_trust_building_opportunity(
            message, emotion, trust_level, sample_conversation_context
        )
        
        assert opportunity is not None
        assert opportunity.strategy == TrustBuildingStrategy.CONSISTENCY
    
    @pytest.mark.asyncio
    async def test_vulnerability_share_generation(self):
        """Test generating appropriate vulnerability shares."""
        user_vulnerability = "work stress"
        trust_level = 0.4
        user_emotion = "stressed"
        context = {"conversation_depth": 0.6, "user_boundaries": []}
        
        vulnerability_share = await trust_building_engine.generate_vulnerability_share(
            user_vulnerability, trust_level, user_emotion, context
        )
        
        assert vulnerability_share is not None
        assert vulnerability_share.level == VulnerabilityLevel.LIGHT
        assert vulnerability_share.appropriateness > 0.3
        assert len(vulnerability_share.safety_checks) > 0
    
    @pytest.mark.asyncio
    async def test_trust_repair_action_generation(self):
        """Test generating trust repair actions."""
        trust_issue = "I promised to help but didn't follow through"
        user_concern = "reliability"
        trust_level = 0.5
        
        repair_action = await trust_building_engine.generate_trust_repair_action(
            trust_issue, user_concern, trust_level
        )
        
        assert repair_action is not None
        assert repair_action.repair_type == TrustRepairType.COMMITMENT
        assert "commitment" in repair_action.description.lower()
        assert len(repair_action.ai_response) > 0
    
    @pytest.mark.asyncio
    async def test_trust_building_prompt_generation(self, sample_conversation_context):
        """Test generating trust building prompts."""
        opportunity = await trust_building_engine.analyze_trust_building_opportunity(
            "I'm feeling overwhelmed", "stressed", 0.4, sample_conversation_context
        )
        
        vulnerability_share = await trust_building_engine.generate_vulnerability_share(
            "overwhelm", 0.4, "stressed", {"conversation_depth": 0.5, "user_boundaries": []}
        )
        
        prompt = await trust_building_engine.generate_trust_building_prompt(
            opportunity, vulnerability_share
        )
        
        assert len(prompt) > 0
        assert "vulnerability" in prompt.lower() or "sharing" in prompt.lower()
        assert "safety" in prompt.lower()


class TestIntegration:
    """Test integration between relationship building and conversational intelligence."""
    
    @pytest.fixture
    def sample_conversation_data(self):
        return {
            "user_message": "I'm really struggling with my relationship right now",
            "conversation_history": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi! How are you doing?"},
                {"role": "user", "content": "I'm really struggling with my relationship right now"}
            ],
            "user_memories": [
                {"content": "User is going through a difficult time"},
                {"content": "User values emotional support"}
            ],
            "user_id": "test_user_456"
        }
    
    @pytest.mark.asyncio
    async def test_full_relationship_building_pipeline(self, sample_conversation_data):
        """Test the complete relationship building pipeline."""
        # Analyze conversation context
        context = await conversational_intelligence.analyze_conversation_context(
            user_message=sample_conversation_data["user_message"],
            conversation_history=sample_conversation_data["conversation_history"],
            user_memories=sample_conversation_data["user_memories"],
            user_id=sample_conversation_data["user_id"]
        )
        
        assert context.emotional_state.primary_emotion in ["sad", "stressed", "anxious", "worried"]
        assert context.emotional_state.intensity > 0.5
        
        # Determine response style
        style = await conversational_intelligence.determine_response_style(
            context, sample_conversation_data["user_id"]
        )
        
        assert style.emotional_support is True
        assert style.trust_building is True
        assert style.relationship_focused is True
        
        # Generate contextual prompt
        prompt = await conversational_intelligence.generate_contextual_prompt(
            context, style, sample_conversation_data["user_memories"],
            sample_conversation_data["user_id"]
        )
        
        assert len(prompt) > 0
        assert "emotional" in prompt.lower() or "support" in prompt.lower()
        assert "trust" in prompt.lower() or "relationship" in prompt.lower()
    
    @pytest.mark.asyncio
    async def test_relationship_memory_integration(self, sample_conversation_data):
        """Test that relationship memory is properly integrated."""
        # First, record some relationship data
        await relationship_memory_service.record_interaction(
            sample_conversation_data["user_id"],
            {
                "trust_event": {"type": "build", "trust_change": 0.3},
                "experience_significance": 0.6
            }
        )
        
        # Analyze conversation context (should include relationship data)
        context = await conversational_intelligence.analyze_conversation_context(
            user_message=sample_conversation_data["user_message"],
            conversation_history=sample_conversation_data["conversation_history"],
            user_memories=sample_conversation_data["user_memories"],
            user_id=sample_conversation_data["user_id"]
        )
        
        # Check that relationship dynamics include relationship memory data
        assert "trust_score" in context.relationship_dynamics
        assert "relationship_stage" in context.relationship_dynamics
        assert "total_interactions" in context.relationship_dynamics
    
    @pytest.mark.asyncio
    async def test_trust_building_integration(self, sample_conversation_data):
        """Test that trust building is properly integrated."""
        # Analyze conversation context
        context = await conversational_intelligence.analyze_conversation_context(
            user_message=sample_conversation_data["user_message"],
            conversation_history=sample_conversation_data["conversation_history"],
            user_memories=sample_conversation_data["user_memories"],
            user_id=sample_conversation_data["user_id"]
        )
        
        # Determine response style
        style = await conversational_intelligence.determine_response_style(
            context, sample_conversation_data["user_id"]
        )
        
        # Generate prompt (should include trust building guidance)
        prompt = await conversational_intelligence.generate_contextual_prompt(
            context, style, sample_conversation_data["user_memories"],
            sample_conversation_data["user_id"]
        )
        
        # Check that trust building guidance is included
        assert "trust" in prompt.lower() or "vulnerability" in prompt.lower() or "relationship" in prompt.lower()


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    @pytest.mark.asyncio
    async def test_empty_user_id_handling(self):
        """Test handling of empty user IDs."""
        context = await conversational_intelligence.analyze_conversation_context(
            user_message="Hello",
            conversation_history=[],
            user_memories=[],
            user_id=None
        )
        
        assert context is not None
        assert context.relationship_dynamics == {}
    
    @pytest.mark.asyncio
    async def test_service_failure_handling(self):
        """Test handling of service failures."""
        with patch.object(relationship_memory_service, 'get_relationship_summary', side_effect=Exception("Service error")):
            context = await conversational_intelligence.analyze_conversation_context(
                user_message="Hello",
                conversation_history=[],
                user_memories=[],
                user_id="test_user"
            )
            
            assert context is not None
            assert context.relationship_dynamics == {}
    
    @pytest.mark.asyncio
    async def test_invalid_trust_levels(self):
        """Test handling of invalid trust levels."""
        # Test with negative trust level
        interaction_data = {
            "trust_event": {
                "type": "betrayal",
                "trust_change": -0.5
            }
        }
        
        await relationship_memory_service.record_interaction("test_user", interaction_data)
        context = await relationship_memory_service.get_relationship_context("test_user")
        
        assert context.trust_score >= 0.0  # Should not go below 0
        
        # Test with trust level above 1.0
        interaction_data = {
            "trust_event": {
                "type": "build",
                "trust_change": 1.5
            }
        }
        
        await relationship_memory_service.record_interaction("test_user", interaction_data)
        context = await relationship_memory_service.get_relationship_context("test_user")
        
        assert context.trust_score <= 1.0  # Should not go above 1.0


if __name__ == "__main__":
    pytest.main([__file__])
