"""Tests for rate limiting middleware."""

import pytest
from unittest.mock import Mock, patch, MagicMock
import time
from fastapi import Request, status
from fastapi.responses import JSONResponse
from collections import deque

from app.middleware.rate_limit import (
    RateLimitConfig,
    TokenBucket,
    RateLimitStore,
    RateLimitMiddleware
)


class TestRateLimitConfig:
    """Test cases for RateLimitConfig class."""

    def test_init_default(self):
        """Test RateLimitConfig initialization with defaults."""
        config = RateLimitConfig()
        assert config.requests_per_minute == 60
        assert config.requests_per_hour == 1000
        assert config.burst_limit == 10
        assert config.window_size == 60

    def test_init_custom(self):
        """Test RateLimitConfig initialization with custom values."""
        config = RateLimitConfig(
            requests_per_minute=30,
            requests_per_hour=500,
            burst_limit=5,
            window_size=30
        )
        assert config.requests_per_minute == 30
        assert config.requests_per_hour == 500
        assert config.burst_limit == 5
        assert config.window_size == 30


class TestTokenBucket:
    """Test cases for TokenBucket class."""

    def test_init(self):
        """Test TokenBucket initialization."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        assert bucket.capacity == 10
        assert bucket.tokens == 10
        assert bucket.refill_rate == 1.0
        assert bucket.last_refill > 0

    def test_consume_success(self):
        """Test successful token consumption."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        
        result = bucket.consume(5)
        
        assert result is True
        assert bucket.tokens == 5

    def test_consume_insufficient_tokens(self):
        """Test token consumption with insufficient tokens."""
        bucket = TokenBucket(capacity=5, refill_rate=1.0)
        
        result = bucket.consume(10)
        
        assert result is False
        assert bucket.tokens == 5  # Unchanged

    def test_consume_exact_tokens(self):
        """Test consuming exact number of available tokens."""
        bucket = TokenBucket(capacity=5, refill_rate=1.0)
        
        result = bucket.consume(5)
        
        assert result is True
        assert bucket.tokens == 0

    def test_refill_tokens(self):
        """Test token refill over time."""
        bucket = TokenBucket(capacity=10, refill_rate=2.0)  # 2 tokens per second
        bucket.tokens = 0
        bucket.last_refill = time.time() - 1.0  # 1 second ago
        
        result = bucket.consume(1)
        
        assert result is True
        assert bucket.tokens >= 1  # Should have refilled ~2 tokens

    def test_refill_cap_at_capacity(self):
        """Test that refill doesn't exceed capacity."""
        bucket = TokenBucket(capacity=5, refill_rate=10.0)
        bucket.tokens = 0
        bucket.last_refill = time.time() - 10.0  # 10 seconds ago
        
        # Should refill to capacity, not beyond
        bucket.consume(0)  # Trigger refill
        
        assert bucket.tokens <= 5


class TestRateLimitStore:
    """Test cases for RateLimitStore class."""

    @pytest.fixture
    def store(self):
        """Create RateLimitStore instance for testing."""
        return RateLimitStore()

    @pytest.fixture
    def config(self):
        """Create RateLimitConfig for testing."""
        return RateLimitConfig(requests_per_minute=60, burst_limit=10)

    def test_init(self, store):
        """Test RateLimitStore initialization."""
        assert store.buckets == {}
        assert isinstance(store.request_history, dict)
        assert store.cleanup_interval == 300
        assert store.last_cleanup > 0

    def test_get_bucket_new(self, store, config):
        """Test getting new bucket."""
        bucket = store.get_bucket("test_key", config)
        
        assert isinstance(bucket, TokenBucket)
        assert bucket.capacity == config.burst_limit
        assert "test_key" in store.buckets

    def test_get_bucket_existing(self, store, config):
        """Test getting existing bucket."""
        bucket1 = store.get_bucket("test_key", config)
        bucket2 = store.get_bucket("test_key", config)
        
        assert bucket1 is bucket2

    def test_record_request(self, store):
        """Test recording a request."""
        store.record_request("test_key")
        
        assert "test_key" in store.request_history
        assert len(store.request_history["test_key"]) == 1

    def test_record_multiple_requests(self, store):
        """Test recording multiple requests."""
        for _ in range(5):
            store.record_request("test_key")
        
        assert len(store.request_history["test_key"]) == 5

    def test_record_request_cleanup_old(self, store):
        """Test that old requests are cleaned up."""
        # Add old request
        old_time = time.time() - 4000  # More than 1 hour ago
        store.request_history["test_key"].append(old_time)
        
        # Add new request
        store.record_request("test_key")
        
        # Old request should be removed
        assert len(store.request_history["test_key"]) == 1
        assert store.request_history["test_key"][0] > old_time

    def test_get_request_count(self, store):
        """Test getting request count in time window."""
        now = time.time()
        
        # Add requests at different times
        store.request_history["test_key"] = deque([
            now - 30,   # 30 seconds ago
            now - 90,   # 90 seconds ago (outside 60s window)
            now - 10,   # 10 seconds ago
        ])
        
        count = store.get_request_count("test_key", 60)
        
        assert count == 2  # Only requests within 60 seconds

    def test_get_request_count_empty(self, store):
        """Test getting request count for non-existent key."""
        count = store.get_request_count("nonexistent", 60)
        assert count == 0

    def test_cleanup_old_entries(self, store, config):
        """Test cleanup of old entries."""
        # Add old bucket
        old_bucket = TokenBucket(10, 1.0)
        old_bucket.last_refill = time.time() - 4000  # Very old
        store.buckets["old_key"] = old_bucket
        
        # Add old request history
        old_time = time.time() - 4000
        store.request_history["old_history"] = deque([old_time])
        
        # Add recent entries
        recent_bucket = store.get_bucket("recent_key", config)
        store.record_request("recent_history")
        
        # Force cleanup
        store.last_cleanup = 0
        store.cleanup_old_entries()
        
        # Old entries should be removed
        assert "old_key" not in store.buckets
        assert "old_history" not in store.request_history
        # Recent entries should remain
        assert "recent_key" in store.buckets
        assert "recent_history" in store.request_history

    def test_cleanup_skip_recent(self, store):
        """Test that cleanup is skipped if done recently."""
        store.last_cleanup = time.time()  # Just cleaned up
        initial_cleanup_time = store.last_cleanup
        
        store.cleanup_old_entries()
        
        # Cleanup time should be unchanged
        assert store.last_cleanup == initial_cleanup_time


class TestRateLimitMiddleware:
    """Test cases for RateLimitMiddleware class."""

    @pytest.fixture
    def config(self):
        """Create RateLimitConfig for testing."""
        return RateLimitConfig(requests_per_minute=10, requests_per_hour=100, burst_limit=5)

    @pytest.fixture
    def middleware(self, config):
        """Create RateLimitMiddleware instance for testing."""
        return RateLimitMiddleware(None, config)

    @pytest.fixture
    def mock_request(self):
        """Create mock request."""
        request = Mock(spec=Request)
        request.method = "GET"
        request.url = Mock()
        request.url.path = "/api/test"
        request.client = Mock()
        request.client.host = "127.0.0.1"
        request.headers = {}
        request.state = Mock()
        return request

    def test_init_default_config(self):
        """Test middleware initialization with default config."""
        middleware = RateLimitMiddleware(None)
        assert isinstance(middleware.config, RateLimitConfig)
        assert middleware.config.requests_per_minute == 60

    def test_init_custom_config(self, config):
        """Test middleware initialization with custom config."""
        middleware = RateLimitMiddleware(None, config)
        assert middleware.config is config

    def test_get_client_id_with_user(self, middleware, mock_request):
        """Test getting client ID with authenticated user."""
        mock_request.state.user_id = "user123"
        
        client_id = middleware.get_client_id(mock_request)
        
        assert client_id == "user:user123"

    def test_get_client_id_with_ip(self, middleware, mock_request):
        """Test getting client ID with IP address."""
        # No user_id attribute
        delattr(mock_request.state, 'user_id') if hasattr(mock_request.state, 'user_id') else None
        
        client_id = middleware.get_client_id(mock_request)
        
        assert client_id == "ip:127.0.0.1"

    def test_get_client_id_with_forwarded_for(self, middleware, mock_request):
        """Test getting client ID with X-Forwarded-For header."""
        mock_request.headers = {"X-Forwarded-For": "192.168.1.1, 10.0.0.1"}
        
        client_id = middleware.get_client_id(mock_request)
        
        assert client_id == "ip:192.168.1.1"

    def test_get_client_id_no_client(self, middleware, mock_request):
        """Test getting client ID when no client info available."""
        mock_request.client = None
        
        client_id = middleware.get_client_id(mock_request)
        
        assert client_id == "ip:unknown"

    def test_is_exempt_health(self, middleware):
        """Test exemption for health endpoint."""
        assert middleware.is_exempt("/health") is True
        assert middleware.is_exempt("/health/check") is True

    def test_is_exempt_docs(self, middleware):
        """Test exemption for docs endpoints."""
        assert middleware.is_exempt("/docs") is True
        assert middleware.is_exempt("/openapi.json") is True

    def test_is_exempt_regular_path(self, middleware):
        """Test non-exempt regular path."""
        assert middleware.is_exempt("/api/users") is False

    @pytest.mark.asyncio
    async def test_dispatch_options_request(self, middleware, mock_request):
        """Test dispatch with OPTIONS request (CORS preflight)."""
        mock_request.method = "OPTIONS"
        
        async def mock_call_next(request):
            return Mock()
        
        response = await middleware.dispatch(mock_request, mock_call_next)
        
        assert response is not None

    @pytest.mark.asyncio
    async def test_dispatch_exempt_path(self, middleware, mock_request):
        """Test dispatch with exempt path."""
        mock_request.url.path = "/health"
        
        async def mock_call_next(request):
            return Mock()
        
        response = await middleware.dispatch(mock_request, mock_call_next)
        
        assert response is not None

    @pytest.mark.asyncio
    async def test_dispatch_success(self, middleware, mock_request):
        """Test successful dispatch within limits."""
        async def mock_call_next(request):
            response = Mock()
            response.headers = {}
            return response
        
        response = await middleware.dispatch(mock_request, mock_call_next)
        
        assert response is not None
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers

    @pytest.mark.asyncio
    async def test_dispatch_burst_limit_exceeded(self, middleware, mock_request):
        """Test dispatch when burst limit is exceeded."""
        # Exhaust the token bucket
        client_id = middleware.get_client_id(mock_request)
        bucket = middleware.store.get_bucket(client_id, middleware.config)
        bucket.tokens = 0  # No tokens left
        
        async def mock_call_next(request):
            return Mock()
        
        response = await middleware.dispatch(mock_request, mock_call_next)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    @pytest.mark.asyncio
    async def test_dispatch_hourly_limit_exceeded(self, middleware, mock_request):
        """Test dispatch when hourly limit is exceeded."""
        # Fill request history beyond hourly limit
        client_id = middleware.get_client_id(mock_request)
        now = time.time()
        middleware.store.request_history[client_id] = deque([
            now - i for i in range(middleware.config.requests_per_hour + 1)
        ])
        
        async def mock_call_next(request):
            return Mock()
        
        response = await middleware.dispatch(mock_request, mock_call_next)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    @patch('app.core.config.settings')
    def test_cors_aware_headers_allowed_origin(self, mock_settings, middleware, mock_request):
        """Test CORS-aware headers with allowed origin."""
        mock_settings.BACKEND_CORS_ORIGINS = ["http://localhost:3000"]
        mock_request.headers = {"origin": "http://localhost:3000"}
        
        headers = middleware._cors_aware_headers(mock_request, {"test": "value"})
        
        assert headers["access-control-allow-origin"] == "http://localhost:3000"
        assert headers["access-control-allow-credentials"] == "true"
        assert headers["vary"] == "Origin"
        assert headers["test"] == "value"

    @patch('app.core.config.settings')
    def test_cors_aware_headers_disallowed_origin(self, mock_settings, middleware, mock_request):
        """Test CORS-aware headers with disallowed origin."""
        mock_settings.BACKEND_CORS_ORIGINS = ["http://localhost:3000"]
        mock_request.headers = {"origin": "http://evil.com"}
        
        headers = middleware._cors_aware_headers(mock_request, {"test": "value"})
        
        assert "access-control-allow-origin" not in headers
        assert headers["test"] == "value"

    @patch('app.core.config.settings')
    def test_cors_aware_headers_no_origin(self, mock_settings, middleware, mock_request):
        """Test CORS-aware headers with no origin header."""
        mock_settings.BACKEND_CORS_ORIGINS = ["http://localhost:3000"]
        mock_request.headers = {}
        
        headers = middleware._cors_aware_headers(mock_request, {"test": "value"})
        
        assert "access-control-allow-origin" not in headers
        assert headers["test"] == "value"

    @patch('app.core.config.settings')
    def test_cors_aware_headers_settings_exception(self, mock_settings, middleware, mock_request):
        """Test CORS-aware headers when settings access fails."""
        mock_settings.BACKEND_CORS_ORIGINS = Mock(side_effect=Exception("Settings error"))
        mock_request.headers = {"origin": "http://localhost:3000"}
        
        headers = middleware._cors_aware_headers(mock_request, {"test": "value"})
        
        assert "access-control-allow-origin" not in headers
        assert headers["test"] == "value"
