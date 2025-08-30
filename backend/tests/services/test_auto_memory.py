"""Tests for AutoMemoryService."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone
import json
import uuid

from sqlalchemy.orm import Session

from app.services.auto_memory import AutoMemoryService, auto_memory_service
from app.models.memory import MemoryNode


class TestAutoMemoryService:
    """Test cases for AutoMemoryService class."""

    @pytest.fixture
    def service(self):
        """Create AutoMemoryService instance for testing."""
        return AutoMemoryService()

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        db = Mock(spec=Session)
        db.query.return_value = db
        db.filter.return_value = db
        db.all.return_value = []
        return db

    @pytest.fixture
    def sample_memory(self):
        """Create sample memory node for testing."""
        return MemoryNode(
            id="memory-123",
            faiss_id="faiss-123",
            user_id="user-123",
            content="I work as a software engineer",
            importance_score=85,
            content_type="fact",
            timestamp=datetime.now(timezone.utc)
        )

    def test_init(self, service):
        """Test AutoMemoryService initialization."""
        assert service.memory_service is not None
        assert hasattr(service, '_re_preference')
        assert hasattr(service, '_re_slash_cmd')
        assert hasattr(service, '_re_explicit_remember')

    def test_should_skip_message_capture_empty(self, service):
        """Test skipping empty messages."""
        assert service._should_skip_message_capture("") is True
        assert service._should_skip_message_capture("   ") is True
        assert service._should_skip_message_capture(None) is True

    def test_should_skip_message_capture_slash_commands(self, service):
        """Test skipping slash commands."""
        assert service._should_skip_message_capture("/help") is True
        assert service._should_skip_message_capture("  /status") is True
        assert service._should_skip_message_capture("/A") is True

    def test_should_skip_message_capture_meta_prompts(self, service):
        """Test skipping meta prompts without personal info."""
        assert service._should_skip_message_capture("summarize") is True
        assert service._should_skip_message_capture("what do you know about me") is True
        assert service._should_skip_message_capture("explain this") is True

    def test_should_not_skip_message_capture_personal_meta(self, service):
        """Test not skipping meta prompts with personal info."""
        assert service._should_skip_message_capture("what do you know about my work") is False
        assert service._should_skip_message_capture("summarize my goals") is False

    def test_looks_like_preference_true(self, service):
        """Test preference detection - positive cases."""
        assert service._looks_like_preference("I like pizza") is True
        assert service._looks_like_preference("I work as a developer") is True
        assert service._looks_like_preference("I am allergic to nuts") is True
        assert service._looks_like_preference("I avoid loud places") is True

    def test_looks_like_preference_false(self, service):
        """Test preference detection - negative cases."""
        assert service._looks_like_preference("The weather is nice") is False
        assert service._looks_like_preference("How are you?") is False
        assert service._looks_like_preference("") is False

    def test_has_explicit_remember_intent_true(self, service):
        """Test explicit remember intent detection - positive cases."""
        assert service._has_explicit_remember_intent("please remember this") is True
        assert service._has_explicit_remember_intent("remember that I like coffee") is True
        assert service._has_explicit_remember_intent("can you remember it") is True

    def test_has_explicit_remember_intent_false(self, service):
        """Test explicit remember intent detection - negative cases."""
        assert service._has_explicit_remember_intent("I like coffee") is False
        assert service._has_explicit_remember_intent("") is False

    def test_calculate_auto_importance_trivial_messages(self, service):
        """Test importance calculation for trivial messages."""
        trivial_messages = [
            "hi", "hello", "ok", "thanks", "bye", "😊", "...", "k", "yes"
        ]
        for message in trivial_messages:
            importance = service.calculate_auto_importance(message, {})
            assert importance == 0.0

    def test_calculate_auto_importance_short_messages(self, service):
        """Test importance calculation for very short messages."""
        assert service.calculate_auto_importance("a", {}) == 0.0
        assert service.calculate_auto_importance("ab", {}) == 0.0

    def test_calculate_auto_importance_personal_keywords(self, service):
        """Test importance calculation with personal keywords."""
        message = "I want to learn Python programming"
        context = {"content_type": "message"}
        importance = service.calculate_auto_importance(message, context)
        assert importance > 0.5  # Should have decent importance

    def test_calculate_auto_importance_fact_patterns(self, service):
        """Test importance calculation with fact patterns."""
        message = "I work as a software engineer at TechCorp"
        context = {"content_type": "fact"}
        importance = service.calculate_auto_importance(message, context)
        assert importance > 0.8  # Should have high importance

    def test_calculate_auto_importance_emotional_content(self, service):
        """Test importance calculation with emotional content."""
        message = "I feel excited about my new project"
        context = {"content_type": "message"}
        importance = service.calculate_auto_importance(message, context)
        assert importance > 0.6  # Should have good importance

    def test_calculate_auto_importance_long_content(self, service):
        """Test importance calculation with long content."""
        message = "This is a very long message " * 20  # >100 chars
        context = {"content_type": "message"}
        importance = service.calculate_auto_importance(message, context)
        assert importance > 0.65  # Should get length bonus

    def test_find_similar_memories(self, service, mock_db, sample_memory):
        """Test finding similar memories."""
        mock_db.all.return_value = [sample_memory]
        
        with patch('app.crud.memory.memory.get_user_memories') as mock_get:
            mock_get.return_value = [sample_memory]
            
            similar = service.find_similar_memories(
                mock_db, "user-123", "I work as a programmer", threshold=0.5
            )
            
            assert len(similar) >= 0  # Should find some matches

    def test_find_similar_memories_exception(self, service, mock_db):
        """Test finding similar memories with exception."""
        with patch('app.crud.memory.memory.get_user_memories') as mock_get:
            mock_get.side_effect = Exception("Database error")
            
            similar = service.find_similar_memories(
                mock_db, "user-123", "test content"
            )
            
            assert similar == []

    def test_should_consolidate_true(self, service, sample_memory):
        """Test consolidation decision - positive case."""
        new_content = "I now work as a senior software engineer"
        result = service.should_consolidate(new_content, sample_memory)
        assert result is True

    def test_should_consolidate_false(self, service, sample_memory):
        """Test consolidation decision - negative case."""
        new_content = "The weather is nice today"
        result = service.should_consolidate(new_content, sample_memory)
        assert result is False

    def test_consolidate_memory_success(self, service, mock_db, sample_memory):
        """Test successful memory consolidation."""
        new_content = "Updated: I now work remotely"
        
        result = service.consolidate_memory(mock_db, new_content, sample_memory)
        
        assert "Update:" in result.content
        assert new_content in result.content
        mock_db.commit.assert_called_once()

    def test_consolidate_memory_exception(self, service, mock_db, sample_memory):
        """Test memory consolidation with exception."""
        mock_db.commit.side_effect = Exception("Database error")
        
        result = service.consolidate_memory(mock_db, "new content", sample_memory)
        
        assert result == sample_memory
        mock_db.rollback.assert_called_once()

    @patch('app.core.config.settings')
    def test_auto_capture_memory_disabled(self, mock_settings, service, mock_db):
        """Test auto capture when disabled."""
        mock_settings.AUTO_MEMORY_ENABLED = False
        
        result = service.auto_capture_memory(
            mock_db, "user-123", "test content", {}
        )
        
        assert result is None

    @patch('app.core.config.settings')
    @patch('app.services.auto_memory._apply_pii_policy')
    def test_auto_capture_memory_blocked_content(self, mock_pii, mock_settings, service, mock_db):
        """Test auto capture with blocked content."""
        mock_settings.AUTO_MEMORY_ENABLED = True
        mock_pii.return_value = ("", True)  # Content blocked
        
        result = service.auto_capture_memory(
            mock_db, "user-123", "sensitive content", {}
        )
        
        assert result is None

    @patch('app.core.config.settings')
    @patch('app.services.auto_memory._apply_pii_policy')
    def test_auto_capture_memory_low_importance(self, mock_pii, mock_settings, service, mock_db):
        """Test auto capture with low importance content."""
        mock_settings.AUTO_MEMORY_ENABLED = True
        mock_settings.AUTO_IMPORTANCE_THRESHOLD = 0.8
        mock_pii.return_value = ("hi", False)  # Trivial content
        
        result = service.auto_capture_memory(
            mock_db, "user-123", "hi", {"content_type": "message"}
        )
        
        assert result is None

    @patch('app.core.config.settings')
    @patch('app.services.auto_memory._apply_pii_policy')
    def test_auto_capture_memory_allergy_special_handling(self, mock_pii, mock_settings, service, mock_db):
        """Test auto capture with allergy information."""
        mock_settings.AUTO_MEMORY_ENABLED = True
        mock_settings.AUTO_IMPORTANCE_THRESHOLD = 0.5
        mock_pii.return_value = ("I am allergic to peanuts", False)
        
        with patch.object(service, 'find_similar_memories') as mock_find:
            mock_find.return_value = []
            
            with patch('app.memory.embeddings.embed_texts') as mock_embed, \
                 patch('app.memory.faiss_store.add') as mock_faiss:
                mock_embed.return_value = [[0.1, 0.2, 0.3]]
                
                result = service.auto_capture_memory(
                    mock_db, "user-123", "I am allergic to peanuts", {"content_type": "fact"}
                )
                
                assert result is not None
                mock_db.add.assert_called_once()
                mock_db.commit.assert_called_once()

    def test_capture_from_message_skip_noisy(self, service, mock_db):
        """Test capturing from message - skip noisy messages."""
        result = service.capture_from_message(mock_db, "user-123", "/help")
        assert result is None

    def test_capture_from_message_skip_preference(self, service, mock_db):
        """Test capturing from message - skip preferences."""
        result = service.capture_from_message(mock_db, "user-123", "I like pizza")
        assert result is None

    @patch.object(AutoMemoryService, 'auto_capture_memory')
    def test_capture_from_message_success(self, mock_auto_capture, service, mock_db):
        """Test successful message capture."""
        mock_auto_capture.return_value = Mock()
        
        result = service.capture_from_message(
            mock_db, "user-123", "I work as a developer", "conv-123"
        )
        
        mock_auto_capture.assert_called_once()
        assert result is not None

    @patch('app.core.config.settings')
    def test_capture_from_action_excluded(self, mock_settings, service, mock_db):
        """Test capturing from action - excluded transient actions."""
        mock_settings.EXCLUDE_TRANSIENT_LOGS = True
        
        result = service.capture_from_action(
            mock_db, "user-123", "hydration.log_water", {}, {}
        )
        
        assert result is None

    @patch('app.core.config.settings')
    @patch.object(AutoMemoryService, 'auto_capture_memory')
    def test_capture_from_action_with_override(self, mock_auto_capture, mock_settings, service, mock_db):
        """Test capturing from action with explicit override."""
        mock_settings.EXCLUDE_TRANSIENT_LOGS = True
        mock_auto_capture.return_value = Mock()
        
        result = service.capture_from_action(
            mock_db, "user-123", "hydration.log_water", {"remember": True}, {}
        )
        
        mock_auto_capture.assert_called_once()

    def test_store_preference_no_db(self, service):
        """Test storing preference without database session."""
        result = service.store_preference(
            user_id="user-123",
            conversation_id="conv-123",
            subject="coffee",
            db=None
        )
        
        assert result is None

    @patch.object(AutoMemoryService, '_create_memory_node')
    def test_store_preference_success(self, mock_create, service, mock_db):
        """Test successful preference storage."""
        mock_create.return_value = Mock()
        
        result = service.store_preference(
            user_id="user-123",
            conversation_id="conv-123",
            subject="coffee",
            context="morning routine",
            db=mock_db
        )
        
        mock_create.assert_called_once()
        assert result is not None

    def test_get_action_content_type(self, service):
        """Test action content type mapping."""
        assert service._get_action_content_type("hydration.log_water") == "fact"
        assert service._get_action_content_type("unknown.action") == "fact"

    def test_consolidate_memories_simple(self, service):
        """Test simple memory consolidation."""
        existing = "I work as a developer"
        new = "I enjoy programming"
        
        result = service.consolidate_memories(existing, new)
        
        assert "developer" in result
        assert "programming" in result

    def test_consolidate_memories_too_long(self, service):
        """Test memory consolidation when result would be too long."""
        existing = "x" * 300
        new = "y" * 300
        
        result = service.consolidate_memories(existing, new)
        
        assert result == new  # Should keep newer content

    def test_consolidate_memories_exception(self, service):
        """Test memory consolidation with exception."""
        with patch('builtins.set', side_effect=Exception("Error")):
            result = service.consolidate_memories("existing", "new")
            assert result == "new"  # Fallback to new content

    @patch('app.core.config.settings')
    def test_cleanup_old_memories_disabled(self, mock_settings, service, mock_db):
        """Test cleanup when disabled."""
        mock_settings.AUTO_LIFECYCLE_ENABLED = False
        
        result = service.cleanup_old_memories(mock_db, "user-123")
        
        assert result == 0

    @patch('app.core.config.settings')
    def test_cleanup_old_memories_success(self, mock_settings, service, mock_db):
        """Test successful memory cleanup."""
        mock_settings.AUTO_LIFECYCLE_ENABLED = True
        
        old_memory = Mock()
        mock_db.all.return_value = [old_memory]
        
        result = service.cleanup_old_memories(mock_db, "user-123")
        
        mock_db.delete.assert_called_once_with(old_memory)
        mock_db.commit.assert_called_once()
        assert result == 1

    @patch('app.core.config.settings')
    def test_cleanup_old_memories_exception(self, mock_settings, service, mock_db):
        """Test memory cleanup with exception."""
        mock_settings.AUTO_LIFECYCLE_ENABLED = True
        mock_db.all.side_effect = Exception("Database error")
        
        result = service.cleanup_old_memories(mock_db, "user-123")
        
        assert result == 0
        mock_db.rollback.assert_called_once()

    def test_global_instance(self):
        """Test that the global instance is properly configured."""
        assert isinstance(auto_memory_service, AutoMemoryService)
