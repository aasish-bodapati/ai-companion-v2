"""
Tests for system prompts and prompt management.
"""

import pytest
from unittest.mock import patch, MagicMock

from app.core.prompts import (
    ENHANCED_SYSTEM_PROMPT,
    MEMORY_ATTRIBUTION_PROMPT,
    PROACTIVE_SUGGESTIONS_PROMPT,
    CONTINUITY_PROMPT,
    EMOTIONAL_INTELLIGENCE_PROMPT,
    OPTIMAL_SYSTEM_PROMPT,
    CONCISE_SYSTEM_PROMPT,
    MEMORY_FIRST_PROMPT
)


class TestEnhancedSystemPrompt:
    """Test the enhanced system prompt."""

    def test_enhanced_system_prompt_content(self):
        """Test that the enhanced system prompt contains expected content."""
        assert "intelligent, memory-aware AI companion" in ENHANCED_SYSTEM_PROMPT
        assert "CORE CAPABILITIES" in ENHANCED_SYSTEM_PROMPT
        assert "MEMORY GUIDELINES" in ENHANCED_SYSTEM_PROMPT
        assert "CONVERSATION STYLE" in ENHANCED_SYSTEM_PROMPT
        assert "RESPONSE STRUCTURE" in ENHANCED_SYSTEM_PROMPT
        assert "SPECIAL INSTRUCTIONS" in ENHANCED_SYSTEM_PROMPT

    def test_enhanced_system_prompt_memory_integration(self):
        """Test that the enhanced system prompt includes memory integration."""
        assert "Memory Integration" in ENHANCED_SYSTEM_PROMPT
        assert "Use learned information about the user" in ENHANCED_SYSTEM_PROMPT
        assert "reference relevant memories" in ENHANCED_SYSTEM_PROMPT

    def test_enhanced_system_prompt_conversation_style(self):
        """Test that the enhanced system prompt includes conversation style guidelines."""
        assert "warm, supportive, and genuinely helpful" in ENHANCED_SYSTEM_PROMPT
        assert "natural language that flows conversationally" in ENHANCED_SYSTEM_PROMPT
        assert "empathy and understanding" in ENHANCED_SYSTEM_PROMPT

    def test_enhanced_system_prompt_response_structure(self):
        """Test that the enhanced system prompt includes response structure."""
        assert "Acknowledge the user's request" in ENHANCED_SYSTEM_PROMPT
        assert "Reference relevant memories" in ENHANCED_SYSTEM_PROMPT
        assert "Provide helpful suggestions" in ENHANCED_SYSTEM_PROMPT
        assert "Ask follow-up questions" in ENHANCED_SYSTEM_PROMPT

    def test_enhanced_system_prompt_length(self):
        """Test that the enhanced system prompt has reasonable length."""
        assert len(ENHANCED_SYSTEM_PROMPT) > 500
        assert len(ENHANCED_SYSTEM_PROMPT) < 5000


class TestMemoryAttributionPrompt:
    """Test the memory attribution prompt."""

    def test_memory_attribution_prompt_content(self):
        """Test that the memory attribution prompt contains expected content."""
        assert "MEMORY REFERENCE PATTERNS" in MEMORY_ATTRIBUTION_PROMPT
        assert "AVOID" in MEMORY_ATTRIBUTION_PROMPT
        assert "natural attribution" in MEMORY_ATTRIBUTION_PROMPT

    def test_memory_attribution_prompt_reference_patterns(self):
        """Test that the memory attribution prompt includes reference patterns."""
        assert "I remember you mentioned" in MEMORY_ATTRIBUTION_PROMPT
        assert "Based on your preferences" in MEMORY_ATTRIBUTION_PROMPT
        assert "Since you" in MEMORY_ATTRIBUTION_PROMPT
        assert "Given that you" in MEMORY_ATTRIBUTION_PROMPT
        assert "I know you" in MEMORY_ATTRIBUTION_PROMPT
        assert "From our previous conversations" in MEMORY_ATTRIBUTION_PROMPT

    def test_memory_attribution_prompt_avoid_patterns(self):
        """Test that the memory attribution prompt includes avoid patterns."""
        assert "According to my records" in MEMORY_ATTRIBUTION_PROMPT
        assert "My data shows" in MEMORY_ATTRIBUTION_PROMPT
        assert "Based on stored information" in MEMORY_ATTRIBUTION_PROMPT
        assert "Generic responses without memory context" in MEMORY_ATTRIBUTION_PROMPT


class TestProactiveSuggestionsPrompt:
    """Test the proactive suggestions prompt."""

    def test_proactive_suggestions_prompt_content(self):
        """Test that the proactive suggestions prompt contains expected content."""
        assert "WHEN TO SUGGEST" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "SUGGESTION STYLE" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "proactive in offering helpful suggestions" in PROACTIVE_SUGGESTIONS_PROMPT

    def test_proactive_suggestions_prompt_when_to_suggest(self):
        """Test that the proactive suggestions prompt includes when to suggest."""
        assert "User mentions stress or overwhelm" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "User asks about planning" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "User mentions goals" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "User shares problems" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "User seems stuck" in PROACTIVE_SUGGESTIONS_PROMPT

    def test_proactive_suggestions_prompt_suggestion_style(self):
        """Test that the proactive suggestions prompt includes suggestion style."""
        assert "specific and actionable" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "Consider the user's preferences" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "Offer multiple options" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "Follow up with implementation help" in PROACTIVE_SUGGESTIONS_PROMPT
        assert "Check in on progress" in PROACTIVE_SUGGESTIONS_PROMPT


class TestContinuityPrompt:
    """Test the continuity prompt."""

    def test_continuity_prompt_content(self):
        """Test that the continuity prompt contains expected content."""
        assert "CONTINUITY TECHNIQUES" in CONTINUITY_PROMPT
        assert "AVOID" in CONTINUITY_PROMPT
        assert "natural conversation continuity" in CONTINUITY_PROMPT

    def test_continuity_prompt_techniques(self):
        """Test that the continuity prompt includes continuity techniques."""
        assert "Reference previous parts of the conversation" in CONTINUITY_PROMPT
        assert "Use phrases like 'After that...'" in CONTINUITY_PROMPT
        assert "Build on previous suggestions" in CONTINUITY_PROMPT
        assert "Acknowledge progress or changes" in CONTINUITY_PROMPT
        assert "Connect current needs to past discussions" in CONTINUITY_PROMPT

    def test_continuity_prompt_avoid_patterns(self):
        """Test that the continuity prompt includes avoid patterns."""
        assert "Treating each message as independent" in CONTINUITY_PROMPT
        assert "Ignoring previous context" in CONTINUITY_PROMPT
        assert "Repeating information unnecessarily" in CONTINUITY_PROMPT
        assert "Breaking conversation flow" in CONTINUITY_PROMPT


class TestEmotionalIntelligencePrompt:
    """Test the emotional intelligence prompt."""

    def test_emotional_intelligence_prompt_content(self):
        """Test that the emotional intelligence prompt contains expected content."""
        assert "EMOTIONAL RECOGNITION" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "RESPONSE APPROACH" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "emotional intelligence" in EMOTIONAL_INTELLIGENCE_PROMPT

    def test_emotional_intelligence_prompt_recognition(self):
        """Test that the emotional intelligence prompt includes emotional recognition."""
        assert "Acknowledge feelings when users express them" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "Show empathy and understanding" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "Offer appropriate emotional support" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "Recognize stress, frustration, or overwhelm" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "Celebrate successes and progress" in EMOTIONAL_INTELLIGENCE_PROMPT

    def test_emotional_intelligence_prompt_response_approach(self):
        """Test that the emotional intelligence prompt includes response approach."""
        assert "Validate emotions without dismissing them" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "Offer practical coping strategies" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "Suggest positive reframing when helpful" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "Provide encouragement and support" in EMOTIONAL_INTELLIGENCE_PROMPT
        assert "Check in on emotional well-being" in EMOTIONAL_INTELLIGENCE_PROMPT


class TestOptimalSystemPrompt:
    """Test the optimal system prompt."""

    def test_optimal_system_prompt_content(self):
        """Test that the optimal system prompt contains all component prompts."""
        assert ENHANCED_SYSTEM_PROMPT in OPTIMAL_SYSTEM_PROMPT
        assert MEMORY_ATTRIBUTION_PROMPT in OPTIMAL_SYSTEM_PROMPT
        assert PROACTIVE_SUGGESTIONS_PROMPT in OPTIMAL_SYSTEM_PROMPT
        assert CONTINUITY_PROMPT in OPTIMAL_SYSTEM_PROMPT
        assert EMOTIONAL_INTELLIGENCE_PROMPT in OPTIMAL_SYSTEM_PROMPT

    def test_optimal_system_prompt_final_reminder(self):
        """Test that the optimal system prompt includes the final reminder."""
        assert "FINAL REMINDER" in OPTIMAL_SYSTEM_PROMPT
        assert "caring, intelligent companion" in OPTIMAL_SYSTEM_PROMPT
        assert "remembers, understands, and helps" in OPTIMAL_SYSTEM_PROMPT
        assert "make the user feel heard, supported, and empowered" in OPTIMAL_SYSTEM_PROMPT

    def test_optimal_system_prompt_length(self):
        """Test that the optimal system prompt has reasonable length."""
        assert len(OPTIMAL_SYSTEM_PROMPT) > 1000
        assert len(OPTIMAL_SYSTEM_PROMPT) < 10000


class TestConciseSystemPrompt:
    """Test the concise system prompt."""

    def test_concise_system_prompt_content(self):
        """Test that the concise system prompt contains expected content."""
        assert "memory-aware AI companion" in CONCISE_SYSTEM_PROMPT
        assert "warm, concise" in CONCISE_SYSTEM_PROMPT
        assert "personalized" in CONCISE_SYSTEM_PROMPT
        assert "Reference what you know about the user" in CONCISE_SYSTEM_PROMPT
        assert "specific, actionable help" in CONCISE_SYSTEM_PROMPT

    def test_concise_system_prompt_length(self):
        """Test that the concise system prompt is appropriately short."""
        assert len(CONCISE_SYSTEM_PROMPT) < 500
        assert len(CONCISE_SYSTEM_PROMPT) > 100

    def test_concise_system_prompt_sentence_count(self):
        """Test that the concise system prompt has appropriate sentence count."""
        sentences = CONCISE_SYSTEM_PROMPT.split('.')
        assert len(sentences) <= 10  # Should be concise


class TestMemoryFirstPrompt:
    """Test the memory first prompt."""

    def test_memory_first_prompt_content(self):
        """Test that the memory first prompt contains expected content."""
        assert "personal assistant with a notepad" in MEMORY_FIRST_PROMPT
        assert "CORE BEHAVIOR" in MEMORY_FIRST_PROMPT
        assert "RESPONSE STYLE" in MEMORY_FIRST_PROMPT
        assert "AVOID" in MEMORY_FIRST_PROMPT

    def test_memory_first_prompt_core_behavior(self):
        """Test that the memory first prompt includes core behavior."""
        assert "Use known facts without re-asking" in MEMORY_FIRST_PROMPT
        assert "Reference memories naturally" in MEMORY_FIRST_PROMPT
        assert "concise and actionable" in MEMORY_FIRST_PROMPT
        assert "Offer specific suggestions" in MEMORY_FIRST_PROMPT
        assert "Ask one clarifying question if needed" in MEMORY_FIRST_PROMPT
        assert "Confirm before any data-changing action" in MEMORY_FIRST_PROMPT

    def test_memory_first_prompt_response_style(self):
        """Test that the memory first prompt includes response style."""
        assert "Warm but professional" in MEMORY_FIRST_PROMPT
        assert "2-4 sentences unless detail requested" in MEMORY_FIRST_PROMPT
        assert "Specific and actionable" in MEMORY_FIRST_PROMPT
        assert "Personal and contextual" in MEMORY_FIRST_PROMPT
        assert "Proactive in offering help" in MEMORY_FIRST_PROMPT

    def test_memory_first_prompt_avoid_patterns(self):
        """Test that the memory first prompt includes avoid patterns."""
        assert "Generic responses like 'I understand you're looking for help'" in MEMORY_FIRST_PROMPT
        assert "Long explanations unless requested" in MEMORY_FIRST_PROMPT
        assert "Repeating what the user just said" in MEMORY_FIRST_PROMPT
        assert "Multiple questions at once" in MEMORY_FIRST_PROMPT
        assert "Making up information not in context" in MEMORY_FIRST_PROMPT

    def test_memory_first_prompt_memory_reference_patterns(self):
        """Test that the memory first prompt includes memory reference patterns."""
        assert "I remember you mentioned" in MEMORY_FIRST_PROMPT
        assert "Based on your preferences" in MEMORY_FIRST_PROMPT

    def test_memory_first_prompt_suggestion_patterns(self):
        """Test that the memory first prompt includes suggestion patterns."""
        assert "I suggest" in MEMORY_FIRST_PROMPT
        assert "Try" in MEMORY_FIRST_PROMPT


class TestPromptIntegration:
    """Test prompt integration and consistency."""

    def test_all_prompts_are_strings(self):
        """Test that all prompts are strings."""
        prompts = [
            ENHANCED_SYSTEM_PROMPT,
            MEMORY_ATTRIBUTION_PROMPT,
            PROACTIVE_SUGGESTIONS_PROMPT,
            CONTINUITY_PROMPT,
            EMOTIONAL_INTELLIGENCE_PROMPT,
            OPTIMAL_SYSTEM_PROMPT,
            CONCISE_SYSTEM_PROMPT,
            MEMORY_FIRST_PROMPT
        ]
        
        for prompt in prompts:
            assert isinstance(prompt, str)
            assert len(prompt) > 0

    def test_prompt_consistency_memory_references(self):
        """Test that memory reference patterns are consistent across prompts."""
        memory_patterns = [
            "I remember you mentioned",
            "Based on your preferences"
        ]
        
        for pattern in memory_patterns:
            assert pattern in ENHANCED_SYSTEM_PROMPT or pattern in MEMORY_ATTRIBUTION_PROMPT
            assert pattern in MEMORY_FIRST_PROMPT

    def test_prompt_consistency_conversation_style(self):
        """Test that conversation style guidelines are consistent."""
        style_elements = [
            "warm",
            "supportive",
            "helpful"
        ]
        
        for element in style_elements:
            assert element in ENHANCED_SYSTEM_PROMPT
            assert element in CONCISE_SYSTEM_PROMPT or element in MEMORY_FIRST_PROMPT

    def test_prompt_consistency_actionable_guidance(self):
        """Test that actionable guidance is consistent across prompts."""
        actionable_elements = [
            "specific",
            "actionable",
            "suggestions"
        ]
        
        for element in actionable_elements:
            assert element in ENHANCED_SYSTEM_PROMPT or element in PROACTIVE_SUGGESTIONS_PROMPT
            assert element in CONCISE_SYSTEM_PROMPT or element in MEMORY_FIRST_PROMPT

    def test_optimal_prompt_completeness(self):
        """Test that the optimal prompt includes all key components."""
        key_components = [
            "memory-aware",
            "conversational",
            "proactive",
            "emotional intelligence",
            "continuity"
        ]
        
        for component in key_components:
            assert component in OPTIMAL_SYSTEM_PROMPT.lower()

    def test_prompt_length_appropriateness(self):
        """Test that prompt lengths are appropriate for their purpose."""
        # Enhanced prompt should be comprehensive
        assert len(ENHANCED_SYSTEM_PROMPT) > len(CONCISE_SYSTEM_PROMPT)
        
        # Optimal prompt should be the longest
        assert len(OPTIMAL_SYSTEM_PROMPT) > len(ENHANCED_SYSTEM_PROMPT)
        
        # Concise prompt should be appropriately short
        assert len(CONCISE_SYSTEM_PROMPT) < len(ENHANCED_SYSTEM_PROMPT)
        
        # Memory first prompt should be moderate length
        assert len(MEMORY_FIRST_PROMPT) > len(CONCISE_SYSTEM_PROMPT)
        assert len(MEMORY_FIRST_PROMPT) < len(OPTIMAL_SYSTEM_PROMPT)

    def test_prompt_no_duplicate_content(self):
        """Test that prompts don't have excessive duplicate content."""
        # Check that the optimal prompt doesn't repeat the enhanced prompt multiple times
        enhanced_count = OPTIMAL_SYSTEM_PROMPT.count("intelligent, memory-aware AI companion")
        assert enhanced_count == 1  # Should appear only once

    def test_prompt_formatting_consistency(self):
        """Test that prompt formatting is consistent."""
        prompts = [
            ENHANCED_SYSTEM_PROMPT,
            MEMORY_ATTRIBUTION_PROMPT,
            PROACTIVE_SUGGESTIONS_PROMPT,
            CONTINUITY_PROMPT,
            EMOTIONAL_INTELLIGENCE_PROMPT,
            OPTIMAL_SYSTEM_PROMPT,
            CONCISE_SYSTEM_PROMPT,
            MEMORY_FIRST_PROMPT
        ]
        
        for prompt in prompts:
            # Should not have excessive whitespace
            assert "  " not in prompt  # No double spaces
            assert prompt.strip() == prompt  # No leading/trailing whitespace
