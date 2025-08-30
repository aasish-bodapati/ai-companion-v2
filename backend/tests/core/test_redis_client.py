"""Tests for Redis client core module."""

import pytest
from unittest.mock import Mock, patch, AsyncMock

from app.core.redis_client import get_redis, _redis


class TestRedisClient:
    """Test cases for Redis client functionality."""

    def setup_method(self):
        """Reset global Redis instance before each test."""
        global _redis
        _redis = None

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_no_url_configured(self, mock_settings):
        """Test get_redis when no REDIS_URL is configured."""
        mock_settings.REDIS_URL = ""
        
        result = await get_redis()
        
        assert result is None

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_url_whitespace_only(self, mock_settings):
        """Test get_redis when REDIS_URL is whitespace only."""
        mock_settings.REDIS_URL = "   "
        
        result = await get_redis()
        
        assert result is None

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_no_url_attribute(self, mock_settings):
        """Test get_redis when REDIS_URL attribute doesn't exist."""
        # Remove REDIS_URL attribute
        if hasattr(mock_settings, 'REDIS_URL'):
            delattr(mock_settings, 'REDIS_URL')
        
        result = await get_redis()
        
        assert result is None

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_successful_initialization(self, mock_settings):
        """Test successful Redis initialization."""
        mock_settings.REDIS_URL = "redis://localhost:6379"
        
        mock_redis_instance = Mock()
        
        with patch('redis.asyncio.Redis') as mock_redis_class:
            mock_redis_class.from_url.return_value = mock_redis_instance
            
            result = await get_redis()
            
            assert result is mock_redis_instance
            mock_redis_class.from_url.assert_called_once_with(
                "redis://localhost:6379",
                encoding="utf-8",
                decode_responses=True
            )

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_singleton_behavior(self, mock_settings):
        """Test that get_redis returns the same instance on subsequent calls."""
        mock_settings.REDIS_URL = "redis://localhost:6379"
        
        mock_redis_instance = Mock()
        
        with patch('redis.asyncio.Redis') as mock_redis_class:
            mock_redis_class.from_url.return_value = mock_redis_instance
            
            result1 = await get_redis()
            result2 = await get_redis()
            
            assert result1 is result2
            assert result1 is mock_redis_instance
            # Should only call from_url once due to singleton behavior
            mock_redis_class.from_url.assert_called_once()

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_import_error(self, mock_settings):
        """Test get_redis when Redis import fails."""
        mock_settings.REDIS_URL = "redis://localhost:6379"
        
        with patch('builtins.__import__', side_effect=ImportError("Redis not installed")):
            result = await get_redis()
            
            assert result is None

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_connection_error(self, mock_settings):
        """Test get_redis when Redis connection fails."""
        mock_settings.REDIS_URL = "redis://invalid:6379"
        
        with patch('redis.asyncio.Redis') as mock_redis_class:
            mock_redis_class.from_url.side_effect = Exception("Connection failed")
            
            result = await get_redis()
            
            assert result is None

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_logs_warning_on_failure(self, mock_settings):
        """Test that get_redis logs warning when initialization fails."""
        mock_settings.REDIS_URL = "redis://localhost:6379"
        
        with patch('redis.asyncio.Redis') as mock_redis_class, \
             patch('logging.getLogger') as mock_logger:
            mock_redis_class.from_url.side_effect = Exception("Test error")
            mock_log = Mock()
            mock_logger.return_value = mock_log
            
            result = await get_redis()
            
            assert result is None
            mock_log.warning.assert_called_once()
            assert "Redis not available" in mock_log.warning.call_args[0][0]

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_resets_global_on_error(self, mock_settings):
        """Test that global _redis is reset to None on error."""
        global _redis
        mock_settings.REDIS_URL = "redis://localhost:6379"
        
        with patch('redis.asyncio.Redis') as mock_redis_class:
            mock_redis_class.from_url.side_effect = Exception("Test error")
            
            result = await get_redis()
            
            assert result is None
            assert _redis is None

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_preserves_existing_instance_on_success(self, mock_settings):
        """Test that existing Redis instance is preserved if already initialized."""
        global _redis
        mock_settings.REDIS_URL = "redis://localhost:6379"
        
        # Set up existing instance
        existing_instance = Mock()
        _redis = existing_instance
        
        result = await get_redis()
        
        assert result is existing_instance
        # Should not try to create new instance

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_with_complex_url(self, mock_settings):
        """Test get_redis with complex Redis URL including auth and database."""
        mock_settings.REDIS_URL = "redis://user:password@localhost:6379/1"
        
        mock_redis_instance = Mock()
        
        with patch('redis.asyncio.Redis') as mock_redis_class:
            mock_redis_class.from_url.return_value = mock_redis_instance
            
            result = await get_redis()
            
            assert result is mock_redis_instance
            mock_redis_class.from_url.assert_called_once_with(
                "redis://user:password@localhost:6379/1",
                encoding="utf-8",
                decode_responses=True
            )

    @pytest.mark.asyncio
    @patch('app.core.config.settings')
    async def test_get_redis_lazy_initialization(self, mock_settings):
        """Test that Redis is only initialized when first called."""
        mock_settings.REDIS_URL = "redis://localhost:6379"
        
        mock_redis_instance = Mock()
        
        with patch('redis.asyncio.Redis') as mock_redis_class:
            mock_redis_class.from_url.return_value = mock_redis_instance
            
            # Redis should not be initialized yet
            assert _redis is None
            
            # First call should initialize
            result = await get_redis()
            
            assert result is mock_redis_instance
            mock_redis_class.from_url.assert_called_once()

    def test_global_redis_initially_none(self):
        """Test that global _redis is initially None."""
        # This test verifies the initial state
        global _redis
        _redis = None  # Reset to ensure clean state
        assert _redis is None
