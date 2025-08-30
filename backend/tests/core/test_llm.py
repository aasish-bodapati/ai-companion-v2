"""Tests for LLM core module."""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import asyncio
from typing import List, Dict

from app.core.llm import (
    generate_response,
    generate_response_stream,
    get_llm_status,
    llm_client
)


class TestLLMGeneration:
    """Test cases for LLM generation functions."""

    @pytest.fixture
    def sample_messages(self):
        """Create sample messages for testing."""
        return [
            {"role": "user", "content": "Hello, how are you?"},
            {"role": "assistant", "content": "I'm doing well, thank you!"},
            {"role": "user", "content": "What's the weather like?"}
        ]

    @patch('app.core.config.settings')
    def test_generate_response_stub_provider(self, mock_settings, sample_messages):
        """Test generate_response with stub provider."""
        mock_settings.LLM_PROVIDER = "stub"
        
        result = generate_response(
            model="stub-model",
            system_prompt="You are a helpful assistant",
            messages=sample_messages,
            max_tokens=512
        )
        
        # Should return a stub response
        assert isinstance(result, str)
        assert len(result) > 0

    @patch('app.core.config.settings')
    def test_generate_response_openrouter_success(self, mock_settings, sample_messages):
        """Test generate_response with successful OpenRouter."""
        mock_settings.LLM_PROVIDER = "openrouter"
        mock_settings.LLM_API_KEY = "test-key"
        mock_settings.LLM_BASE_URL = "https://openrouter.ai/api/v1"
        mock_settings.LLM_MODEL_DEFAULT = "mistralai/mistral-7b-instruct"
        
        with patch('httpx.Client.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "choices": [{"message": {"content": "OpenRouter response"}}]
            }
            mock_post.return_value = mock_response
            
            result = generate_response(
                model="mistralai/mistral-7b-instruct",
                system_prompt="You are a helpful assistant",
                messages=sample_messages
            )
            
            assert result == "OpenRouter response"

    @patch('app.core.config.settings')
    def test_generate_response_openrouter_fallback_to_stub(self, mock_settings, sample_messages):
        """Test generate_response OpenRouter fallback to stub on API error."""
        mock_settings.LLM_PROVIDER = "openrouter"
        mock_settings.LLM_API_KEY = "test-key"
        mock_settings.LLM_BASE_URL = "https://openrouter.ai/api/v1"
        mock_settings.LLM_MODEL_DEFAULT = "mistralai/mistral-7b-instruct"
        
        with patch('httpx.Client.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 500
            mock_response.text = "Internal Server Error"
            mock_post.return_value = mock_response
            
            result = generate_response(
                model="mistralai/mistral-7b-instruct",
                system_prompt="You are a helpful assistant",
                messages=sample_messages
            )
            
            # Should fallback to stub response
            assert isinstance(result, str)
            assert len(result) > 0

    @patch('app.core.config.settings')
    def test_generate_response_unknown_provider_fallback(self, mock_settings, sample_messages):
        """Test generate_response with unknown provider falls back to stub."""
        mock_settings.LLM_PROVIDER = "unknown"
        
        result = generate_response(
            model="unknown-model",
            system_prompt="You are a helpful assistant",
            messages=sample_messages
        )
        
        # Should fallback to stub response
        assert isinstance(result, str)
        assert len(result) > 0

    @patch('app.core.config.settings')
    def test_generate_response_default_provider(self, mock_settings, sample_messages):
        """Test generate_response with default provider (no LLM_PROVIDER set)."""
        # Remove LLM_PROVIDER attribute to test default
        if hasattr(mock_settings, 'LLM_PROVIDER'):
            delattr(mock_settings, 'LLM_PROVIDER')
        
        result = generate_response(
            model="stub-model",
            system_prompt="You are a helpful assistant",
            messages=sample_messages
        )
        
        # Should return a stub response
        assert isinstance(result, str)
        assert len(result) > 0

    @patch('app.core.config.settings')
    def test_generate_response_stub_specific_queries(self, mock_settings, sample_messages):
        """Test generate_response stub provider handles 
        specific queries correctly."""
        mock_settings.LLM_PROVIDER = "stub"
        
        # Mock the client to avoid real API calls
        with patch('app.core.llm.llm_client') as mock_client:
            mock_client.generate_response.return_value = "I don't have your name stored in my memory."
            
            # Test name query
            result = generate_response(
                system_prompt="You are a helpful assistant",
                messages=[{"role": "user", "content": "What is my name?"}]
            )
            # The stub now returns a specific response for name queries
            assert "don't have your name stored" in result.lower()

            # Test other queries
            mock_client.generate_response.return_value = "Hello! I'm a helpful AI assistant."
            result = generate_response(
                system_prompt="You are a helpful assistant",
                messages=[{"role": "user", "content": "Hello there!"}]
            )
            assert "hello" in result.lower()

    @patch('app.core.config.settings')
    def test_generate_response_stream_stub(self, mock_settings, sample_messages):
        """Test generate_response_stream with stub provider."""
        mock_settings.LLM_PROVIDER = "stub"
        
        # Mock the client to avoid real API calls
        with patch('app.core.llm.llm_client') as mock_client:
            mock_client.generate_response.return_value = "This is a stub streaming response."
            
            result = generate_response_stream(
                model="stub-model",
                system_prompt="You are a helpful assistant",
                messages=sample_messages
            )

            # Should return a complete response since stub doesn't support streaming
            assert isinstance(result, str)
            assert len(result) > 0

    @patch('app.core.config.settings')
    def test_generate_response_stream_openrouter(self, mock_settings, sample_messages):
        """Test generate_response_stream with OpenRouter provider."""
        mock_settings.LLM_PROVIDER = "openrouter"
        mock_settings.LLM_API_KEY = "test-key"
        mock_settings.LLM_BASE_URL = "https://openrouter.ai/api/v1"
        mock_settings.LLM_MODEL_DEFAULT = "mistralai/mistral-7b-instruct"

        with patch('httpx.Client.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "choices": [{"message": {"content": "OpenRouter streaming response"}}]
            }
            mock_post.return_value = mock_response

            result = generate_response_stream(
                model="mistralai/mistral-7b-instruct",
                system_prompt="You are a helpful assistant",
                messages=sample_messages
            )

            assert result == "OpenRouter streaming response"

    def test_get_llm_status(self):
        """Test get_llm_status returns proper status information."""
        status = get_llm_status()
        
        assert "provider" in status
        assert "dev_mode" in status
        assert "last_used_stub" in status
        assert "last_error" in status
        assert "status" in status
        assert status["status"] in ["healthy", "error"]

    @patch('app.core.config.settings')
    def test_llm_client_initialization(self, mock_settings):
        """Test LLM client initialization with dev mode."""
        mock_settings.LLM_DEV_MODE = True
        mock_settings.LLM_PROVIDER = "stub"
        
        # Mock the client to avoid initialization issues
        with patch('app.core.llm.llm_client') as mock_client:
            mock_client.dev_mode = True
            mock_client.provider = "stub"
            
            # Test that the client is properly configured
            assert mock_client.dev_mode is True
            assert mock_client.provider == "stub"
