from fastapi import APIRouter, Response

from app.core.config import settings
import secrets

from app.memory.service import memory_service
from app.core.metrics import dump_prometheus
from app.monitoring.memory_metrics import memory_monitor

router = APIRouter()


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


@router.get("/metrics/prometheus")
def get_prometheus_metrics():
    """Expose Prometheus-formatted metrics for scraping."""
    try:
        data = dump_prometheus()
        return Response(content=data, media_type="text/plain; version=0.0.4")
    except Exception:
        return Response(content="", media_type="text/plain; version=0.0.4")


@router.get("/metrics/retrieval-summary")
def get_retrieval_summary(hours: int = 1):
    """Aggregated retrieval metrics from memory_monitor (rolling window)."""
    try:
        metrics = memory_monitor.metrics_collector.get_aggregated_metrics(hours=hours)
        # Include some derived layman rollups
        out = {
            "window_hours": int(hours),
            "metrics": metrics,
            "rollups": {
                "avg_retrieval_ms": metrics.get("retrieval_ms", {}).get("avg", 0.0),
                "avg_mmr_ms": metrics.get("mmr_ms", {}).get("avg", 0.0),
                "avg_selected": metrics.get("retrieval_selected_count", {}).get("avg", 0.0),
                "avg_diversity": metrics.get("retrieval_diversity", {}).get("avg", 0.0),
            },
        }
        return out
    except Exception:
        return {"window_hours": int(hours), "metrics": {}, "rollups": {}}


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


@router.get("/llm-latency/latest")
def get_llm_latency_latest():
    """Return the most recent first-token and total latency samples.

    Shape: { first_token_ms: float | null, llm_total_ms: float | null }
    """
    try:
        from app.main import app as _app

        store = getattr(_app.state, "llm_latency", None) or {}
        ft = store.get("first_token_ms") or []
        tt = store.get("llm_total_ms") or []
        return {
            "first_token_ms": float(ft[-1]) if ft else None,
            "llm_total_ms": float(tt[-1]) if tt else None,
        }
    except Exception:
        return {"first_token_ms": None, "llm_total_ms": None}


@router.get("/metrics/taxonomy")
def get_metrics_taxonomy():
    """Return canonical metrics taxonomy and definitions used by the system.

    Shape: { categories: { Retrieval: {...}, RAG_QA: {...}, Ops: {...} } }
    """
    try:
        taxonomy = {
            "categories": {
                "Retrieval": {
                    "retrieval_ms": "End-to-end retrieval latency including vector search, filters, reranking.",
                    "mmr_ms": "Latency spent in MMR reranking.",
                    "retrieval_selected_count": "Number of memories selected for the final context window.",
                    "retrieval_diversity": "Diversity of selected memories (1 - avg Jaccard token similarity).",
                    "no_result_count": "Number of retrievals that returned no results.",
                },
                "RAG_QA": {
                    "llm_total_ms": "LLM total generation latency for a reply (first byte to done).",
                    "first_token_ms": "Time to first streamed token in the reply.",
                    "prompt_tokens": "Tokens in prompt (if provided by provider).",
                    "completion_tokens": "Tokens in completion (if provided).",
                    "cost_usd": "Cost in USD for the call (if available).",
                },
                "Ops": {
                    "request_count": "HTTP requests handled by the API server.",
                    "route_avg_latency_ms": "Average per-route latency computed in-process.",
                    "errors": "Number of 5xx errors (if available in Prometheus dump).",
                },
            }
        }
        return taxonomy
    except Exception:
        return {"categories": {}}
