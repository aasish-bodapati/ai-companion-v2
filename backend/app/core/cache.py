"""
Multi-level caching system for improved performance.
Implements memory, Redis, and database-level caching strategies.
"""

import json
import hashlib
import pickle
from typing import Any, Optional, Dict, List, Callable, Union
from datetime import datetime, timedelta
from functools import wraps
import asyncio
from contextlib import asynccontextmanager

# Simple in-memory cache for development
_memory_cache: Dict[str, Dict[str, Any]] = {}

class CacheConfig:
    """Cache configuration settings."""
    
    # Cache levels
    MEMORY_CACHE_ENABLED = True
    REDIS_CACHE_ENABLED = False  # Set to True when Redis is available
    
    # Default TTL values (in seconds)
    DEFAULT_TTL = 300  # 5 minutes
    SHORT_TTL = 60     # 1 minute
    MEDIUM_TTL = 900   # 15 minutes
    LONG_TTL = 3600    # 1 hour
    VERY_LONG_TTL = 86400  # 24 hours
    
    # Memory cache limits
    MAX_MEMORY_CACHE_SIZE = 1000
    MAX_MEMORY_CACHE_ITEM_SIZE = 1024 * 1024  # 1MB
    
    # Cache key prefixes
    USER_PREFIX = "user:"
    EXERCISE_PREFIX = "exercise:"
    FOOD_PREFIX = "food:"
    DASHBOARD_PREFIX = "dashboard:"
    SUGGESTIONS_PREFIX = "suggestions:"
    INSIGHTS_PREFIX = "insights:"


class CacheKey:
    """Cache key generator with consistent formatting."""
    
    @staticmethod
    def user_dashboard(user_id: str) -> str:
        return f"{CacheConfig.DASHBOARD_PREFIX}{user_id}"
    
    @staticmethod
    def user_suggestions(user_id: str, suggestion_type: str = "all") -> str:
        return f"{CacheConfig.SUGGESTIONS_PREFIX}{user_id}:{suggestion_type}"
    
    @staticmethod
    def user_patterns(user_id: str) -> str:
        return f"{CacheConfig.USER_PREFIX}patterns:{user_id}"
    
    @staticmethod
    def exercise_search(query: str, filters: Dict[str, Any]) -> str:
        filter_hash = hashlib.md5(json.dumps(filters, sort_keys=True).encode()).hexdigest()[:8]
        return f"{CacheConfig.EXERCISE_PREFIX}search:{query}:{filter_hash}"
    
    @staticmethod
    def food_search(query: str, filters: Dict[str, Any]) -> str:
        filter_hash = hashlib.md5(json.dumps(filters, sort_keys=True).encode()).hexdigest()[:8]
        return f"{CacheConfig.FOOD_PREFIX}search:{query}:{filter_hash}"
    
    @staticmethod
    def user_insights(user_id: str, insight_type: str) -> str:
        return f"{CacheConfig.INSIGHTS_PREFIX}{user_id}:{insight_type}"
    
    @staticmethod
    def popular_exercises(category: Optional[str] = None) -> str:
        return f"{CacheConfig.EXERCISE_PREFIX}popular:{category or 'all'}"
    
    @staticmethod
    def popular_foods(category: Optional[str] = None) -> str:
        return f"{CacheConfig.FOOD_PREFIX}popular:{category or 'all'}"


class MemoryCache:
    """Simple in-memory cache implementation."""
    
    def __init__(self):
        self.cache = _memory_cache
        self.access_times: Dict[str, datetime] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get item from memory cache."""
        if not CacheConfig.MEMORY_CACHE_ENABLED:
            return None
        
        if key not in self.cache:
            return None
        
        item = self.cache[key]
        
        # Check expiration
        if item['expires_at'] and datetime.utcnow() > item['expires_at']:
            self.delete(key)
            return None
        
        # Update access time for LRU
        self.access_times[key] = datetime.utcnow()
        return item['data']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set item in memory cache."""
        if not CacheConfig.MEMORY_CACHE_ENABLED:
            return False
        
        # Check size limits
        try:
            serialized_size = len(pickle.dumps(value))
            if serialized_size > CacheConfig.MAX_MEMORY_CACHE_ITEM_SIZE:
                return False
        except:
            return False
        
        # Cleanup if cache is full
        self._cleanup_if_needed()
        
        expires_at = None
        if ttl:
            expires_at = datetime.utcnow() + timedelta(seconds=ttl)
        
        self.cache[key] = {
            'data': value,
            'created_at': datetime.utcnow(),
            'expires_at': expires_at,
            'access_count': 1
        }
        self.access_times[key] = datetime.utcnow()
        
        return True
    
    def delete(self, key: str) -> bool:
        """Delete item from memory cache."""
        if key in self.cache:
            del self.cache[key]
        if key in self.access_times:
            del self.access_times[key]
        return True
    
    def clear(self) -> None:
        """Clear all items from memory cache."""
        self.cache.clear()
        self.access_times.clear()
    
    def _cleanup_if_needed(self) -> None:
        """Cleanup old items if cache is full."""
        if len(self.cache) < CacheConfig.MAX_MEMORY_CACHE_SIZE:
            return
        
        # Remove expired items first
        expired_keys = []
        now = datetime.utcnow()
        
        for key, item in self.cache.items():
            if item['expires_at'] and now > item['expires_at']:
                expired_keys.append(key)
        
        for key in expired_keys:
            self.delete(key)
        
        # If still full, remove least recently used items
        if len(self.cache) >= CacheConfig.MAX_MEMORY_CACHE_SIZE:
            # Sort by access time (oldest first)
            sorted_keys = sorted(
                self.access_times.keys(),
                key=lambda k: self.access_times[k]
            )
            
            # Remove oldest 10% of items
            items_to_remove = max(1, len(sorted_keys) // 10)
            for key in sorted_keys[:items_to_remove]:
                self.delete(key)


class CacheManager:
    """Main cache manager that coordinates different cache levels."""
    
    def __init__(self):
        self.memory_cache = MemoryCache()
        # Redis cache would be initialized here if available
        self.redis_cache = None
    
    async def get(self, key: str) -> Optional[Any]:
        """Get item from cache (checks all levels)."""
        
        # Level 1: Memory cache
        result = self.memory_cache.get(key)
        if result is not None:
            return result
        
        # Level 2: Redis cache (if available)
        if self.redis_cache:
            # Redis implementation would go here
            pass
        
        return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None,
        memory_only: bool = False
    ) -> bool:
        """Set item in cache (all appropriate levels)."""
        
        if ttl is None:
            ttl = CacheConfig.DEFAULT_TTL
        
        success = True
        
        # Set in memory cache
        if not self.memory_cache.set(key, value, ttl):
            success = False
        
        # Set in Redis cache (if available and not memory_only)
        if self.redis_cache and not memory_only:
            # Redis implementation would go here
            pass
        
        return success
    
    async def delete(self, key: str) -> bool:
        """Delete item from all cache levels."""
        
        success = True
        
        # Delete from memory cache
        if not self.memory_cache.delete(key):
            success = False
        
        # Delete from Redis cache (if available)
        if self.redis_cache:
            # Redis implementation would go here
            pass
        
        return success
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching a pattern."""
        
        cleared_count = 0
        
        # Clear from memory cache
        keys_to_clear = [
            key for key in self.memory_cache.cache.keys()
            if pattern in key
        ]
        
        for key in keys_to_clear:
            if self.memory_cache.delete(key):
                cleared_count += 1
        
        # Clear from Redis cache (if available)
        if self.redis_cache:
            # Redis pattern clearing would go here
            pass
        
        return cleared_count
    
    async def invalidate_user_cache(self, user_id: str) -> int:
        """Invalidate all cache entries for a specific user."""
        
        patterns = [
            f"{CacheConfig.USER_PREFIX}{user_id}",
            f"{CacheConfig.DASHBOARD_PREFIX}{user_id}",
            f"{CacheConfig.SUGGESTIONS_PREFIX}{user_id}",
            f"{CacheConfig.INSIGHTS_PREFIX}{user_id}"
        ]
        
        total_cleared = 0
        for pattern in patterns:
            total_cleared += await self.clear_pattern(pattern)
        
        return total_cleared


# Global cache manager instance
cache_manager = CacheManager()


def cache_result(
    key_func: Optional[Callable] = None,
    ttl: Optional[int] = None,
    memory_only: bool = False,
    skip_cache: Optional[Callable] = None
):
    """
    Decorator for caching function results.
    
    Args:
        key_func: Function to generate cache key from function args
        ttl: Time to live in seconds
        memory_only: Only use memory cache, skip Redis
        skip_cache: Function to determine if cache should be skipped
    """
    
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default key generation
                func_name = f"{func.__module__}.{func.__name__}"
                args_hash = hashlib.md5(
                    json.dumps([str(arg) for arg in args] + [f"{k}={v}" for k, v in kwargs.items()]).encode()
                ).hexdigest()[:8]
                cache_key = f"{func_name}:{args_hash}"
            
            # Check if we should skip cache
            if skip_cache and skip_cache(*args, **kwargs):
                return await func(*args, **kwargs)
            
            # Try to get from cache
            cached_result = await cache_manager.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            
            if result is not None:
                await cache_manager.set(cache_key, result, ttl, memory_only)
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # For sync functions, create a simple sync version
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                func_name = f"{func.__module__}.{func.__name__}"
                args_hash = hashlib.md5(
                    json.dumps([str(arg) for arg in args] + [f"{k}={v}" for k, v in kwargs.items()]).encode()
                ).hexdigest()[:8]
                cache_key = f"{func_name}:{args_hash}"
            
            # Check if we should skip cache
            if skip_cache and skip_cache(*args, **kwargs):
                return func(*args, **kwargs)
            
            # Try to get from memory cache only (sync)
            cached_result = cache_manager.memory_cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            
            if result is not None:
                cache_manager.memory_cache.set(cache_key, result, ttl)
            
            return result
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


class CacheInvalidator:
    """Handles cache invalidation based on data changes."""
    
    @staticmethod
    async def on_user_activity_logged(user_id: str, activity_type: str) -> None:
        """Invalidate caches when user logs new activity."""
        
        # Invalidate user-specific caches
        await cache_manager.delete(CacheKey.user_dashboard(user_id))
        await cache_manager.delete(CacheKey.user_suggestions(user_id))
        await cache_manager.delete(CacheKey.user_patterns(user_id))
        
        # Invalidate activity-specific insights
        await cache_manager.delete(CacheKey.user_insights(user_id, activity_type))
        await cache_manager.delete(CacheKey.user_insights(user_id, "overall"))
    
    @staticmethod
    async def on_routine_updated(user_id: str, routine_type: str) -> None:
        """Invalidate caches when user updates routines."""
        
        await cache_manager.delete(CacheKey.user_dashboard(user_id))
        await cache_manager.delete(CacheKey.user_suggestions(user_id, routine_type))
        await cache_manager.delete(CacheKey.user_suggestions(user_id, "all"))
    
    @staticmethod
    async def on_exercise_usage_updated(exercise_id: str) -> None:
        """Invalidate caches when exercise usage is updated."""
        
        # Invalidate popular exercises cache
        await cache_manager.clear_pattern(f"{CacheConfig.EXERCISE_PREFIX}popular")
        
        # Invalidate exercise search results that might include this exercise
        await cache_manager.clear_pattern(f"{CacheConfig.EXERCISE_PREFIX}search")
    
    @staticmethod
    async def on_food_usage_updated(food_id: str) -> None:
        """Invalidate caches when food usage is updated."""
        
        # Invalidate popular foods cache
        await cache_manager.clear_pattern(f"{CacheConfig.FOOD_PREFIX}popular")
        
        # Invalidate food search results that might include this food
        await cache_manager.clear_pattern(f"{CacheConfig.FOOD_PREFIX}search")


# Cache invalidator instance
cache_invalidator = CacheInvalidator()


# Utility functions for common caching patterns

async def get_or_compute(
    key: str,
    compute_func: Callable,
    ttl: Optional[int] = None,
    *args,
    **kwargs
) -> Any:
    """Get value from cache or compute it if not found."""
    
    cached_result = await cache_manager.get(key)
    if cached_result is not None:
        return cached_result
    
    result = await compute_func(*args, **kwargs) if asyncio.iscoroutinefunction(compute_func) else compute_func(*args, **kwargs)
    
    if result is not None:
        await cache_manager.set(key, result, ttl)
    
    return result


def cache_key_for_search(query: str, filters: Dict[str, Any], prefix: str) -> str:
    """Generate consistent cache key for search operations."""
    
    # Normalize query
    normalized_query = query.lower().strip() if query else ""
    
    # Create filter hash
    filter_items = []
    for key, value in sorted(filters.items()):
        if value is not None:
            if isinstance(value, list):
                filter_items.append(f"{key}={','.join(sorted(map(str, value)))}")
            else:
                filter_items.append(f"{key}={value}")
    
    filter_string = "&".join(filter_items)
    filter_hash = hashlib.md5(filter_string.encode()).hexdigest()[:8] if filter_string else "none"
    
    return f"{prefix}search:{normalized_query}:{filter_hash}"


@asynccontextmanager
async def cache_context(user_id: str):
    """Context manager for batch cache operations."""
    
    # Could be used for batch invalidation or warming
    try:
        yield
    finally:
        # Cleanup or final operations could go here
        pass


# Example usage decorators for specific use cases

def cache_dashboard_data(ttl: int = CacheConfig.MEDIUM_TTL):
    """Cache decorator specifically for dashboard data."""
    
    def key_func(*args, **kwargs):
        # Assume first arg is user_id or extract from kwargs
        user_id = args[0] if args else kwargs.get('user_id')
        return CacheKey.user_dashboard(user_id)
    
    return cache_result(key_func=key_func, ttl=ttl)


def cache_suggestions(suggestion_type: str = "all", ttl: int = CacheConfig.SHORT_TTL):
    """Cache decorator for user suggestions."""
    
    def key_func(*args, **kwargs):
        user_id = args[0] if args else kwargs.get('user_id')
        return CacheKey.user_suggestions(user_id, suggestion_type)
    
    return cache_result(key_func=key_func, ttl=ttl)


def cache_search_results(prefix: str, ttl: int = CacheConfig.LONG_TTL):
    """Cache decorator for search results."""
    
    def key_func(*args, **kwargs):
        query = kwargs.get('query', '')
        filters = {k: v for k, v in kwargs.items() if k not in ['query', 'limit', 'offset']}
        return cache_key_for_search(query, filters, prefix)
    
    return cache_result(key_func=key_func, ttl=ttl, memory_only=True)


# Health check for cache system
async def cache_health_check() -> Dict[str, Any]:
    """Check cache system health and performance."""
    
    health_info = {
        "memory_cache": {
            "enabled": CacheConfig.MEMORY_CACHE_ENABLED,
            "items": len(cache_manager.memory_cache.cache),
            "max_size": CacheConfig.MAX_MEMORY_CACHE_SIZE
        },
        "redis_cache": {
            "enabled": CacheConfig.REDIS_CACHE_ENABLED,
            "connected": cache_manager.redis_cache is not None
        }
    }
    
    # Test cache operations
    test_key = "health_check_test"
    test_value = {"timestamp": datetime.utcnow().isoformat()}
    
    try:
        await cache_manager.set(test_key, test_value, 10)
        retrieved = await cache_manager.get(test_key)
        await cache_manager.delete(test_key)
        
        health_info["operations_working"] = retrieved is not None
    except Exception as e:
        health_info["operations_working"] = False
        health_info["error"] = str(e)
    
    return health_info
