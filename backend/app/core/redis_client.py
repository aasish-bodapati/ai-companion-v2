from __future__ import annotations

import logging
from typing import Optional, TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from redis.asyncio import Redis

_redis: Optional["Redis"] = None


async def get_redis() -> Optional["Redis"]:
    """
    Returns a singleton Redis asyncio client if REDIS_URL is configured; otherwise None.
    Lazy-initializes on first call.
    """
    global _redis
    if not getattr(settings, "REDIS_URL", "").strip():
        return None
    if _redis is not None:
        return _redis

    try:
        # Import here to avoid mandatory dependency when REDIS_URL is not used
        from redis.asyncio import Redis  # type: ignore

        _redis = Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        # Do not perform a network call here; callers can ping if needed
        return _redis
    except Exception as e:
        logging.getLogger(__name__).warning(f"Redis not available or failed to initialize: {e}")
        _redis = None
        return None
