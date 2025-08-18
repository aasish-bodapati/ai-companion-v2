from fastapi import APIRouter, Response

from app.core.config import settings
import secrets

router = APIRouter()
from app.memory.service import memory_service


@router.post("/test-email")
def test_email(email_to: str):
    """
    Test emails.
    """
    # In a real app, you would send an email here
    return {"msg": "Test email sent", "email_to": email_to}


@router.get("/health")
def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}


@router.get("/retrieval-settings")
def retrieval_settings():
    """
    Return read-only retrieval knobs for display in Settings UI.
    """
    return {
        "MEMORY_ENABLED": settings.MEMORY_ENABLED,
        "MEMORY_PROVIDER": settings.MEMORY_PROVIDER,
        "EMBEDDING_MODEL_NAME": settings.EMBEDDING_MODEL_NAME,
        "RETRIEVAL_TOP_K": settings.RETRIEVAL_TOP_K,
        "RETRIEVAL_RECENT_MESSAGES": settings.RETRIEVAL_RECENT_MESSAGES,
        "MEMORY_MIN_RELEVANCE": settings.MEMORY_MIN_RELEVANCE,
    }


@router.get("/csrf-token")
def get_csrf_token(response: Response):
    """
    Issue a CSRF token and set it as a cookie `csrftoken`.
    Frontend reads this cookie and sends it in `X-CSRF-Token` header.
    """
    token = secrets.token_urlsafe(32)
    secure = settings.ENVIRONMENT.lower() == "production"
    # Set cookie accessible by JS (not HttpOnly) so SPA can read it and attach to headers
    response.set_cookie(
        key="csrftoken",
        value=token,
        max_age=60 * 60 * 24,  # 1 day
        path="/",
        secure=secure,
        httponly=False,
        samesite="lax",
    )
    return {"csrf_token": token}


@router.get("/metrics")
def get_metrics():
    """
    Lightweight request metrics collected by middleware.
    Shape: { total_requests: int, per_route: { path: {count:int, total_ms: float} } }
    """
    try:
        from app.main import app as _app

        store = getattr(_app.state, "metrics", {"total_requests": 0, "per_route": {}})
        # Return a shallow copy to avoid accidental mutation by clients/tests
        return {
            "total_requests": int(store.get("total_requests", 0)),
            "per_route": dict(store.get("per_route", {})),
        }
    except Exception:
        return {"total_requests": 0, "per_route": {}}


@router.get("/retrieval-metrics")
def get_retrieval_metrics():
    """
    Lightweight retrieval diagnostics from the memory service.
    Shape: { total_requests: int, last: { query_prefix, mmr_lambda, top_k_limit, min_relevance, selected_count } }
    """
    try:
        return memory_service.get_retrieval_metrics()
    except Exception:
        return {"total_requests": 0, "last": {}}


@router.get("/llm-latency")
def get_llm_latency():
    """Return rolling latency metrics for LLM calls recorded by reply_stream.

    Shape: {
      first_token_ms: { avg: float, min: float, max: float, count: int },
      llm_total_ms: { avg: float, min: float, max: float, count: int }
    }
    """
    try:
        from app.main import app as _app

        store = getattr(_app.state, "llm_latency", None) or {}
        def stats(arr):
            try:
                data = list(arr or [])
                if not data:
                    return {"avg": 0.0, "min": 0.0, "max": 0.0, "count": 0}
                total = float(sum(data))
                n = len(data)
                return {"avg": round(total / n, 2), "min": min(data), "max": max(data), "count": n}
            except Exception:
                return {"avg": 0.0, "min": 0.0, "max": 0.0, "count": 0}

        return {
            "first_token_ms": stats(store.get("first_token_ms")),
            "llm_total_ms": stats(store.get("llm_total_ms")),
        }
    except Exception:
        return {
            "first_token_ms": {"avg": 0.0, "min": 0.0, "max": 0.0, "count": 0},
            "llm_total_ms": {"avg": 0.0, "min": 0.0, "max": 0.0, "count": 0},
        }
