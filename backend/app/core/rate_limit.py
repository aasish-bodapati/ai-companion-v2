from __future__ import annotations

import time
from typing import Optional, Tuple

from fastapi import HTTPException

from app.core.config import settings
from app.core import redis_client


async def _identifier_from_request(request, user_id: Optional[str]) -> str:
    """Prefer user_id; fallback to client IP. Returns a safe identifier string."""
    if user_id:
        return f"user:{user_id}"
    try:
        ip = request.client.host if request and request.client else "unknown"
    except Exception:
        ip = "unknown"
    return f"ip:{ip}"


async def check_rate_limit(
    request,
    user_id: Optional[str],
    scope: str,
    limit: int,
    window_seconds: int,
) -> Tuple[int, int]:
    """
    Sliding window rate limiting using Redis sorted sets.

    Key: rl:{scope}:{identifier}
    Member score: epoch seconds

    Returns (remaining, reset_in_seconds).
    Raises HTTPException 429 if exceeded, with Retry-After header.
    If Redis is unavailable or not configured, this becomes a no-op.
    """
    # Short-circuit if disabled or limit not configured
    if not getattr(settings, "RATE_LIMIT_ENABLED", True) or limit <= 0:
        return (limit, window_seconds)

    r = await redis_client.get_redis()
    if r is None:
        # No-op if Redis not available
        return (limit, window_seconds)

    now = int(time.time())
    window_start = now - window_seconds
    ident = await _identifier_from_request(request, user_id)
    key = f"rl:{scope}:{ident}"

    # Remove entries outside window, add current, get count, set TTL
    # Using pipeline for atomicity
    # Note: redis-py asyncio pipeline is context-managed
    async with r.pipeline(transaction=True) as pipe:  # type: ignore[attr-defined]
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window_seconds)
        res = await pipe.execute()

    current_count = int(res[2]) if isinstance(res, list) and len(res) >= 3 else 0
    remaining = max(0, limit - current_count)

    if current_count > limit:
        # Compute reset as time until oldest entry exits window
        try:
            oldest_scores = await r.zrange(key, 0, 0, withscores=True)  # type: ignore[attr-defined]
            if oldest_scores:
                oldest_ts = int(oldest_scores[0][1])
                reset_in = max(1, window_seconds - (now - oldest_ts))
            else:
                reset_in = window_seconds
        except Exception:
            reset_in = window_seconds
        # Raise 429 with Retry-After header
        raise HTTPException(
            status_code=429, detail="Rate limit exceeded", headers={"Retry-After": str(reset_in)}
        )

    # Estimate reset time relative to window start
    reset_in = window_seconds
    return (remaining, reset_in)
