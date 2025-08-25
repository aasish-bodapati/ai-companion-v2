"""
Rate limiting middleware for API protection
"""
import time
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio
from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)


class RateLimitConfig:
    """Rate limiting configuration"""
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_limit: int = 10,
        window_size: int = 60
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_limit = burst_limit
        self.window_size = window_size


class TokenBucket:
    """Token bucket algorithm for rate limiting"""
    
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate
        self.last_refill = time.time()
    
    def consume(self, tokens: int = 1) -> bool:
        """Try to consume tokens, return True if successful"""
        now = time.time()
        
        # Refill tokens based on time elapsed
        time_elapsed = now - self.last_refill
        self.tokens = min(
            self.capacity,
            self.tokens + time_elapsed * self.refill_rate
        )
        self.last_refill = now
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False


class RateLimitStore:
    """In-memory store for rate limiting data"""
    
    def __init__(self):
        self.buckets: Dict[str, TokenBucket] = {}
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque())
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = time.time()
    
    def get_bucket(self, key: str, config: RateLimitConfig) -> TokenBucket:
        """Get or create token bucket for key"""
        if key not in self.buckets:
            # Create bucket with per-minute rate
            refill_rate = config.requests_per_minute / 60.0
            self.buckets[key] = TokenBucket(
                capacity=config.burst_limit,
                refill_rate=refill_rate
            )
        return self.buckets[key]
    
    def record_request(self, key: str) -> None:
        """Record a request timestamp"""
        now = time.time()
        self.request_history[key].append(now)
        
        # Clean up old entries (older than 1 hour)
        cutoff = now - 3600
        while (self.request_history[key] and 
               self.request_history[key][0] < cutoff):
            self.request_history[key].popleft()
    
    def get_request_count(self, key: str, window_seconds: int) -> int:
        """Get request count in the given time window"""
        now = time.time()
        cutoff = now - window_seconds
        
        history = self.request_history[key]
        return sum(1 for timestamp in history if timestamp >= cutoff)
    
    def cleanup_old_entries(self) -> None:
        """Clean up old buckets and request history"""
        now = time.time()
        if now - self.last_cleanup < self.cleanup_interval:
            return
        
        cutoff = now - 3600  # 1 hour
        
        # Clean up old buckets (not used recently)
        old_buckets = [
            key for key, bucket in self.buckets.items()
            if bucket.last_refill < cutoff
        ]
        for key in old_buckets:
            del self.buckets[key]
        
        # Clean up old request history
        old_histories = [
            key for key, history in self.request_history.items()
            if not history or history[-1] < cutoff
        ]
        for key in old_histories:
            del self.request_history[key]
        
        self.last_cleanup = now


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using token bucket algorithm"""
    
    def __init__(self, app, config: Optional[RateLimitConfig] = None):
        super().__init__(app)
        self.config = config or RateLimitConfig()
        self.store = RateLimitStore()
        self.exempt_paths = {
            "/health",
            "/metrics",
            "/docs",
            "/openapi.json"
        }
    
    def get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Try to get user ID from request state (set by auth middleware)
        if hasattr(request.state, 'user_id'):
            return f"user:{request.state.user_id}"
        
        # Fall back to IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        return f"ip:{client_ip}"
    
    def is_exempt(self, path: str) -> bool:
        """Check if path is exempt from rate limiting"""
        return any(path.startswith(exempt) for exempt in self.exempt_paths)
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        
        # Skip rate limiting for exempt paths
        if self.is_exempt(request.url.path):
            return await call_next(request)
        
        # Clean up old entries periodically
        self.store.cleanup_old_entries()
        
        client_id = self.get_client_id(request)
        
        # Check token bucket (burst protection)
        bucket = self.store.get_bucket(client_id, self.config)
        if not bucket.consume():
            logger.warning(f"Rate limit exceeded (burst): {client_id}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests, please slow down"
                },
                headers={"Retry-After": "60"}
            )
        
        # Record request
        self.store.record_request(client_id)
        
        # Check hourly limit
        hourly_count = self.store.get_request_count(client_id, 3600)
        if hourly_count > self.config.requests_per_hour:
            logger.warning(f"Hourly rate limit exceeded: {client_id}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Hourly request limit exceeded"
                },
                headers={"Retry-After": "3600"}
            )
        
        # Add rate limit headers to response
        response = await call_next(request)
        
        minute_count = self.store.get_request_count(client_id, 60)
        remaining = max(0, self.config.requests_per_minute - minute_count)
        
        response.headers["X-RateLimit-Limit"] = str(self.config.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)
        
        return response
