import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4

from app.api.endpoints.streaming.llm_handler import (
    _is_trivial_greeting,
    _needs_web_search,
    _perform_web_search,
    stream_llm_response
)


class TestTrivialGreetingDetection:
    def test_is_trivial_greeting_simple_greetings(self):
        """Test detection of simple greetings."""
        assert _is_trivial_greeting("hi") is True
        assert _is_trivial_greeting("hello") is True
        assert _is_trivial_greeting("hey") is True
        assert _is_trivial_greeting("yo") is True
        assert _is_trivial_greeting("hola") is True
        assert _is_trivial_greeting("hi!") is True
        assert _is_trivial_greeting("hello!") is True
        assert _is_trivial_greeting("hey!") is True

    def test_is_trivial_greeting_with_punctuation(self):
        """Test detection of greetings with punctuation."""
        assert _is_trivial_greeting("hi!") is True
        assert _is_trivial_greeting("hello.") is True
        assert _is_trivial_greeting("hey,") is True
        assert _is_trivial_greeting("hi...") is True

    def test_is_trivial_greeting_with_whitespace(self):
        """Test detection of greetings with whitespace."""
        assert _is_trivial_greeting("  hi  ") is True
        assert _is_trivial_greeting("hello ") is True
        assert _is_trivial_greeting(" hey") is True

    def test_is_trivial_greeting_case_insensitive(self):
        """Test that greeting detection is case insensitive."""
        assert _is_trivial_greeting("HI") is True
        assert _is_trivial_greeting("Hello") is True
        assert _is_trivial_greeting("HEY") is True

    def test_is_trivial_greeting_non_greetings(self):
        """Test that non-greetings are not detected as trivial."""
        assert _is_trivial_greeting("") is False
        assert _is_trivial_greeting("how are you") is False
        assert _is_trivial_greeting("what's the weather") is False
        assert _is_trivial_greeting("hi there") is False
        assert _is_trivial_greeting("hello world") is False
        assert _is_trivial_greeting("hey buddy") is False

    def test_is_trivial_greeting_none_input(self):
        """Test handling of None input."""
        assert _is_trivial_greeting(None) is False


class TestWebSearchDetection:
    def test_needs_web_search_temporal_patterns(self):
        """Test detection of temporal patterns that need web search."""
        assert _needs_web_search("what's the latest news") is True
        assert _needs_web_search("recent developments") is True
        assert _needs_web_search("current events") is True
        assert _needs_web_search("today's weather") is True
        assert _needs_web_search("this week's stock prices") is True
        assert _needs_web_search("this month's trends") is True

    def test_needs_web_search_search_patterns(self):
        """Test detection of explicit search patterns."""
        assert _needs_web_search("search for information") is True
        assert _needs_web_search("look up something") is True
        assert _needs_web_search("find information about") is True

    def test_needs_web_search_news_patterns(self):
        """Test detection of news-related patterns."""
        assert _needs_web_search("breaking news") is True
        assert _needs_web_search("what's happening") is True
        assert _needs_web_search("what happened") is True
        assert _needs_web_search("what's new") is True

    def test_needs_web_search_case_insensitive(self):
        """Test that web search detection is case insensitive."""
        assert _needs_web_search("LATEST news") is True
        assert _needs_web_search("Current Events") is True
        assert _needs_web_search("TODAY'S weather") is True

    def test_needs_web_search_no_patterns(self):
        """Test that messages without patterns don't trigger web search."""
        assert _needs_web_search("") is False
        assert _needs_web_search("how are you") is False
        assert _needs_web_search("tell me a joke") is False
        assert _needs_web_search("what's your name") is False

    def test_needs_web_search_none_input(self):
        """Test handling of None input."""
        assert _needs_web_search(None) is False


class TestWebSearchPerformance:
    @pytest.mark.asyncio
    async def test_perform_web_search_success(self):
        """Test successful web search with results."""
        mock_results = [
            {"title": "Test Title", "snippet": "Test snippet", "source": "test.com"},
            {"title": "Another Title", "snippet": "Another snippet", "source": "another.com"}
        ]
        
        with patch('app.api.endpoints.streaming.llm_handler.web_search_service') as mock_service:
            mock_service.search_web = AsyncMock(return_value=mock_results)
            
            result = await _perform_web_search("test query")
            
            assert "Here's what I found:" in result
            assert "Test Title" in result
            assert "Test snippet" in result
            assert "test.com" in result
            assert "Another Title" in result
            assert "Another snippet" in result
            assert "another.com" in result

    @pytest.mark.asyncio
    async def test_perform_web_search_no_results(self):
        """Test web search with no results."""
        with patch('app.api.endpoints.streaming.llm_handler.web_search_service') as mock_service:
            mock_service.search_web = AsyncMock(return_value=[])
            
            result = await _perform_web_search("test query")
            
            assert result == "No recent information found on this topic."

    @pytest.mark.asyncio
    async def test_perform_web_search_exception(self):
        """Test web search with exception handling."""
        with patch('app.api.endpoints.streaming.llm_handler.web_search_service') as mock_service:
            mock_service.search_web = AsyncMock(side_effect=Exception("Search failed"))
            
            result = await _perform_web_search("test query")
            
            assert result == "I'm unable to search for current information right now."


class TestLLMResponseStreaming:
    @pytest.mark.asyncio
    async def test_stream_llm_response_trivial_greeting(self):
        """Test streaming response for trivial greeting."""
        conversation_id = uuid4()
        message_content = "hi"
        db = MagicMock()
        current_user = MagicMock()
        system_prompt = "You are a helpful assistant."
        conversation_history = []
        
        with patch('app.api.endpoints.streaming.llm_handler.generate_response_stream') as mock_stream, \
             patch('app.api.endpoints.streaming.llm_handler.persist_assistant_message') as mock_persist, \
             patch('app.api.endpoints.streaming.llm_handler.client_disconnected') as mock_disconnected, \
             patch('app.api.endpoints.streaming.llm_handler.settings') as mock_settings:
            
            mock_settings.LLM_MODEL_DEFAULT = "test-model"
            mock_disconnected.return_value = False
            mock_stream.return_value = self._mock_stream_generator(["Hello", " there", "!"])
            mock_persist.return_value = None
            
            chunks = []
            async for chunk in stream_llm_response(
                conversation_id, message_content, db, current_user, system_prompt, conversation_history
            ):
                chunks.append(chunk)
            
            # Verify the response was streamed
            assert len(chunks) > 0
            assert any("data: Hello" in chunk for chunk in chunks)
            assert any("data: [DONE]" in chunk for chunk in chunks)
            
            # Verify persistence was called
            mock_persist.assert_called_once()

    @pytest.mark.asyncio
    async def test_stream_llm_response_with_web_search(self):
        """Test streaming response with web search."""
        conversation_id = uuid4()
        message_content = "what's the latest news"
        db = MagicMock()
        current_user = MagicMock()
        system_prompt = "You are a helpful assistant."
        conversation_history = []
        
        with patch('app.api.endpoints.streaming.llm_handler.generate_response_stream') as mock_stream, \
             patch('app.api.endpoints.streaming.llm_handler.persist_assistant_message') as mock_persist, \
             patch('app.api.endpoints.streaming.llm_handler.client_disconnected') as mock_disconnected, \
             patch('app.api.endpoints.streaming.llm_handler.settings') as mock_settings, \
             patch('app.api.endpoints.streaming.llm_handler._perform_web_search') as mock_search:
            
            mock_settings.LLM_MODEL_DEFAULT = "test-model"
            mock_disconnected.return_value = False
            mock_search.return_value = "Search results here"
            mock_stream.return_value = self._mock_stream_generator(["Based on", " the latest", " news"])
            mock_persist.return_value = None
            
            chunks = []
            async for chunk in stream_llm_response(
                conversation_id, message_content, db, current_user, system_prompt, conversation_history
            ):
                chunks.append(chunk)
            
            # Verify web search was performed
            mock_search.assert_called_once_with(message_content, 3)
            
            # Verify the response was streamed
            assert len(chunks) > 0
            assert any("data: [DONE]" in chunk for chunk in chunks)

    @pytest.mark.asyncio
    async def test_stream_llm_response_client_disconnected(self):
        """Test streaming response when client disconnects."""
        conversation_id = uuid4()
        message_content = "hello"
        db = MagicMock()
        current_user = MagicMock()
        system_prompt = "You are a helpful assistant."
        conversation_history = []
        
        with patch('app.api.endpoints.streaming.llm_handler.generate_response_stream') as mock_stream, \
             patch('app.api.endpoints.streaming.llm_handler.persist_assistant_message') as mock_persist, \
             patch('app.api.endpoints.streaming.llm_handler.client_disconnected') as mock_disconnected, \
             patch('app.api.endpoints.streaming.llm_handler.settings') as mock_settings:
            
            mock_settings.LLM_MODEL_DEFAULT = "test-model"
            # Simulate client disconnection after first chunk
            disconnect_calls = [False, True]
            mock_disconnected.side_effect = lambda: disconnect_calls.pop(0)
            mock_stream.return_value = self._mock_stream_generator(["Hello", " there", "!"])
            mock_persist.return_value = None
            
            chunks = []
            async for chunk in stream_llm_response(
                conversation_id, message_content, db, current_user, system_prompt, conversation_history
            ):
                chunks.append(chunk)
            
            # Should stop streaming when client disconnects
            assert len(chunks) > 0

    @pytest.mark.asyncio
    async def test_stream_llm_response_exception_handling(self):
        """Test streaming response with exception handling."""
        conversation_id = uuid4()
        message_content = "hello"
        db = MagicMock()
        current_user = MagicMock()
        system_prompt = "You are a helpful assistant."
        conversation_history = []
        
        with patch('app.api.endpoints.streaming.llm_handler.generate_response_stream') as mock_stream, \
             patch('app.api.endpoints.streaming.llm_handler.persist_assistant_message') as mock_persist, \
             patch('app.api.endpoints.streaming.llm_handler.client_disconnected') as mock_disconnected, \
             patch('app.api.endpoints.streaming.llm_handler.settings') as mock_settings:
            
            mock_settings.LLM_MODEL_DEFAULT = "test-model"
            mock_disconnected.return_value = False
            mock_stream.side_effect = Exception("LLM error")
            mock_persist.return_value = None
            
            chunks = []
            async for chunk in stream_llm_response(
                conversation_id, message_content, db, current_user, system_prompt, conversation_history
            ):
                chunks.append(chunk)
            
            # Should stream error message
            assert len(chunks) > 0
            assert any("data: [DONE]" in chunk for chunk in chunks)
            
            # Should persist error message
            mock_persist.assert_called_once()

    @pytest.mark.asyncio
    async def test_stream_llm_response_with_conversation_history(self):
        """Test streaming response with conversation history."""
        conversation_id = uuid4()
        message_content = "how are you"
        db = MagicMock()
        current_user = MagicMock()
        system_prompt = "You are a helpful assistant."
        conversation_history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"}
        ]
        
        with patch('app.api.endpoints.streaming.llm_handler.generate_response_stream') as mock_stream, \
             patch('app.api.endpoints.streaming.llm_handler.persist_assistant_message') as mock_persist, \
             patch('app.api.endpoints.streaming.llm_handler.client_disconnected') as mock_disconnected, \
             patch('app.api.endpoints.streaming.llm_handler.settings') as mock_settings:
            
            mock_settings.LLM_MODEL_DEFAULT = "test-model"
            mock_disconnected.return_value = False
            mock_stream.return_value = self._mock_stream_generator(["I'm", " doing", " well"])
            mock_persist.return_value = None
            
            chunks = []
            async for chunk in stream_llm_response(
                conversation_id, message_content, db, current_user, system_prompt, conversation_history
            ):
                chunks.append(chunk)
            
            # Verify the response was streamed
            assert len(chunks) > 0
            assert any("data: [DONE]" in chunk for chunk in chunks)

    def _mock_stream_generator(self, chunks):
        """Helper method to create a mock stream generator."""
        async def generator():
            for chunk in chunks:
                yield chunk
        return generator()
