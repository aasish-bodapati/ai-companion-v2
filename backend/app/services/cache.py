"""
Caching service for frequently accessed data.
"""

import json
import pickle
from typing import Any, Optional, Union
from datetime import datetime, timedelta
from functools import wraps
import hashlib


class CacheService:
    """Simple in-memory cache service (can be replaced with Redis later)."""
    
    def __init__(self):
        self._cache = {}
        self._expiry = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key in self._cache:
            if key in self._expiry and datetime.now() < self._expiry[key]:
                return self._cache[key]
            else:
                # Expired, remove from cache
                self.delete(key)
        return None
    
    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        """Set value in cache with expiration."""
        self._cache[key] = value
        self._expiry[key] = datetime.now() + timedelta(seconds=expire_seconds)
    
    def delete(self, key: str) -> None:
        """Delete key from cache."""
        self._cache.pop(key, None)
        self._expiry.pop(key, None)
    
    def clear(self) -> None:
        """Clear all cache."""
        self._cache.clear()
        self._expiry.clear()
    
    def generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments."""
        key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
        return hashlib.md5(key_data.encode()).hexdigest()


# Global cache instance
cache = CacheService()


def cached(expire_seconds: int = 300, key_prefix: str = ""):
    """Decorator for caching function results."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache.generate_key(
                f"{key_prefix}:{func.__name__}", 
                *args, 
                **kwargs
            )
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, expire_seconds)
            return result
        
        return wrapper
    return decorator


class HealthDataCache:
    """Specialized cache for health data."""
    
    @staticmethod
    def get_user_dashboard_key(user_id: str) -> str:
        """Get cache key for user dashboard data."""
        return f"dashboard:{user_id}"
    
    @staticmethod
    def get_fitness_logs_key(user_id: str, period: str, page: int = 1) -> str:
        """Get cache key for fitness logs."""
        return f"fitness_logs:{user_id}:{period}:{page}"
    
    @staticmethod
    def get_nutrition_logs_key(user_id: str, period: str, page: int = 1) -> str:
        """Get cache key for nutrition logs."""
        return f"nutrition_logs:{user_id}:{period}:{page}"
    
    @staticmethod
    def get_analytics_key(user_id: str, analysis_type: str) -> str:
        """Get cache key for analytics data."""
        return f"analytics:{user_id}:{analysis_type}"
    
    @staticmethod
    def invalidate_user_data(user_id: str) -> None:
        """Invalidate all cache entries for a user."""
        keys_to_delete = []
        for key in cache._cache.keys():
            if f":{user_id}:" in key or key.endswith(f":{user_id}"):
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            cache.delete(key)
