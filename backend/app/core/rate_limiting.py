"""
Rate limiting middleware and utilities for API endpoints.
Implements token bucket algorithm with Redis support.
"""

import time
import hashlib
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter using token bucket algorithm."""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.memory_store: Dict[str, Dict[str, Any]] = {}
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier."""
        # Use IP address as primary identifier
        client_ip = request.client.host if request.client else "unknown"
        
        # For authenticated users, also include user ID for more granular limiting
        user_id = getattr(request.state, 'user_id', None)
        if user_id:
            return f"user:{user_id}:{client_ip}"
        
        return f"ip:{client_ip}"
    
    def _get_key(self, client_id: str, endpoint: str) -> str:
        """Generate cache key for rate limiting."""
        key_data = f"rate_limit:{client_id}:{endpoint}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    async def _get_bucket(self, key: str) -> Dict[str, Any]:
        """Get token bucket from cache."""
        if self.redis_client:
            try:
                data = await self.redis_client.get(key)
                if data:
                    return eval(data)  # In production, use proper serialization
            except Exception as e:
                logger.warning(f"Redis error in rate limiting: {e}")
        
        # Fallback to memory store
        return self.memory_store.get(key, {
            'tokens': 0,
            'last_refill': time.time()
        })
    
    async def _set_bucket(self, key: str, bucket: Dict[str, Any], ttl: int = 60):
        """Set token bucket in cache."""
        if self.redis_client:
            try:
                await self.redis_client.setex(key, ttl, str(bucket))
            except Exception as e:
                logger.warning(f"Redis error in rate limiting: {e}")
        
        # Always update memory store as fallback
        self.memory_store[key] = bucket
    
    async def is_allowed(
        self, 
        request: Request, 
        endpoint: str,
        max_requests: int = 100,
        window_seconds: int = 60,
        refill_rate: float = 1.0
    ) -> bool:
        """
        Check if request is allowed based on rate limit.
        
        Args:
            request: FastAPI request object
            endpoint: API endpoint being accessed
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            refill_rate: Tokens refilled per second
        
        Returns:
            bool: True if request is allowed, False otherwise
        """
        client_id = self._get_client_id(request)
        key = self._get_key(client_id, endpoint)
        
        now = time.time()
        bucket = await self._get_bucket(key)
        
        # Calculate tokens to add based on time passed
        time_passed = now - bucket.get('last_refill', now)
        tokens_to_add = time_passed * refill_rate
        
        # Refill bucket (up to max_requests)
        current_tokens = min(
            bucket.get('tokens', 0) + tokens_to_add,
            max_requests
        )
        
        # Check if request is allowed
        if current_tokens >= 1:
            # Consume one token
            current_tokens -= 1
            bucket = {
                'tokens': current_tokens,
                'last_refill': now
            }
            await self._set_bucket(key, bucket, window_seconds)
            return True
        
        # Request denied
        bucket = {
            'tokens': current_tokens,
            'last_refill': now
        }
        await self._set_bucket(key, bucket, window_seconds)
        return False

# Global rate limiter instance
rate_limiter = RateLimiter()

# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    'auth': {'max_requests': 10, 'window_seconds': 60, 'refill_rate': 0.2},  # 10 requests per minute
    'api': {'max_requests': 100, 'window_seconds': 60, 'refill_rate': 1.0},  # 100 requests per minute
    'search': {'max_requests': 30, 'window_seconds': 60, 'refill_rate': 0.5},  # 30 requests per minute
    'upload': {'max_requests': 20, 'window_seconds': 60, 'refill_rate': 0.3},  # 20 requests per minute
    'default': {'max_requests': 50, 'window_seconds': 60, 'refill_rate': 0.8}  # 50 requests per minute
}

def get_rate_limit_config(endpoint: str) -> Dict[str, Any]:
    """Get rate limit configuration for endpoint."""
    if '/auth/' in endpoint or '/login' in endpoint:
        return RATE_LIMITS['auth']
    elif '/search' in endpoint:
        return RATE_LIMITS['search']
    elif '/upload' in endpoint:
        return RATE_LIMITS['upload']
    elif '/api/' in endpoint:
        return RATE_LIMITS['api']
    else:
        return RATE_LIMITS['default']

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware."""
    try:
        # Import here to avoid circular imports
        from app.core.config import settings
        import os
        
        # Skip rate limiting in test environment or if disabled
        if (os.getenv("PYTEST_CURRENT_TEST") or 
            os.getenv("TESTING") == "true" or 
            not settings.RATE_LIMITING_ENABLED):
            return await call_next(request)
        
        # TEMPORARILY DISABLE RATE LIMITING FOR DEBUGGING
        logger.info(f"🚫 [RATE LIMITING] Temporarily disabled for debugging")
        return await call_next(request)
        
        endpoint = request.url.path
        config = get_rate_limit_config(endpoint)
        
        is_allowed = await rate_limiter.is_allowed(
            request, 
            endpoint,
            **config
        )
        
        if not is_allowed:
            logger.warning(f"Rate limit exceeded for {request.client.host} on {endpoint}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after": config['window_seconds']
                },
                headers={"Retry-After": str(config['window_seconds'])}
            )
        
        response = await call_next(request)
        return response
        
    except Exception as e:
        logger.error(f"Rate limiting error: {e}")
        # If rate limiting fails, allow the request to proceed
        return await call_next(request)
