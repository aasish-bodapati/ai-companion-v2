import logging
import sys
import uuid
from contextlib import asynccontextmanager
from time import perf_counter
from http import HTTPStatus
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.metrics import dump_prometheus as dump_llm_metrics
from app.core.tracing import init_tracing

# Configure logging for all cases to ensure debug logs are visible
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# Debug: Log Python path and imports
logger.info("\n=== Python Path ===")
for path in sys.path:
    logger.info(f"- {path}")
logger.info("=================\n")

# No automatic table creation; always use Alembic migrations
logger.info("Database tables are managed by Alembic migrations.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize tracing first (if enabled)
    try:
        app.state.tracer_provider = init_tracing(app)
    except Exception as e:
        logger.warning("Tracing init failed: %s", e)

    # Startup: start scheduler
    try:
        from app.scheduler import start_scheduler

        start_scheduler()
    except Exception as e:
        logger.warning("Failed to start scheduler: %s", e)

    # Startup: auto-init DB for local SQLite to avoid login failures in dev/tests
    try:
        from app.core.config import settings as _settings

        db_url = getattr(_settings, "SQLALCHEMY_DATABASE_URI", "") or ""
        if isinstance(db_url, str) and db_url.startswith("sqlite:///"):
            logger.info("Detected SQLite DB; running init_db.init_db() for local dev...")
            from init_db import init_db as _init_db

            _init_db()
            logger.info("Local SQLite init complete.")
        elif isinstance(db_url, str) and db_url.startswith("postgresql://"):
            logger.info("Detected PostgreSQL DB; running Alembic migrations...")
            try:
                from alembic.config import Config
                from alembic import command
                import os
                
                # Get the alembic.ini path - in Docker container it's at /app/alembic.ini
                alembic_ini_path = os.path.join("/app", "alembic.ini")
                if os.path.exists(alembic_ini_path):
                    cfg = Config(alembic_ini_path)
                    # Set the database URL from settings
                    cfg.set_main_option("sqlalchemy.url", db_url)
                    # Run migrations
                    command.upgrade(cfg, "head")
                    logger.info("PostgreSQL migrations completed successfully.")
                else:
                    logger.warning(f"alembic.ini not found at {alembic_ini_path}, skipping migrations")
            except Exception as migration_error:
                logger.error(f"Failed to run migrations: {migration_error}")
                # Don't fail startup on migration errors
    except Exception as e:
        logger.warning("SQLite auto-init skipped/failed: %s", e)

    # Startup: log registered routes after inclusion
    yield
    # Shutdown: stop scheduler
    try:
        from app.scheduler import stop_scheduler as _stop

        _stop()
    except Exception as e:
        logger.warning("Failed to stop scheduler: %s", e)
    # Post-startup hook: log routes (mirrors prior on_event usage)
    logger.info("\n=== Final Registered Routes ===")
    for route in app.routes:
        logger.info(f"{route.methods} {route.path} -> {getattr(route, 'endpoint', 'N/A')}")
    logger.info("============================\n")


# Initialize FastAPI app (with lifespan)
logger.info("Initializing FastAPI application...")
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
logger.info("FastAPI application initialized")

# Set up CORS FIRST (before other middleware)
if settings.BACKEND_CORS_ORIGINS:
    # Debug: log the resolved CORS origins and types
    try:
        origins_value = settings.BACKEND_CORS_ORIGINS
        logger.info(
            "Resolved BACKEND_CORS_ORIGINS: %s (type=%s)",
            origins_value,
            type(origins_value).__name__,
        )
        if isinstance(origins_value, (list, tuple)):
            logger.info(
                "Origins entries and types: %s", [(o, type(o).__name__) for o in origins_value]
            )
    except Exception as e:
        logger.warning("Failed to log BACKEND_CORS_ORIGINS: %s", e)

    logger.info("Setting up CORS middleware...")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS middleware configured")
else:
    # Fallback: enable permissive CORS for local dev if not configured
    dev_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    logger.info("BACKEND_CORS_ORIGINS not set; applying dev CORS fallback: %s", dev_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=dev_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("Dev CORS fallback configured")

# Initialize lightweight metrics store in app state
app.state.metrics = {
    "total_requests": 0,
    # path -> {count, total_ms}
    "per_route": {},
    # (METHOD, STATUS) -> count
    "per_method_status": {},
    # Request duration histogram (milliseconds)
    # Prometheus-style histogram buckets
    "duration_hist": {
        "buckets": [50, 100, 250, 500, 1000, 2500, 5000, 10000],
        # le (as str) -> count
        "counts": {
            "50": 0,
            "100": 0,
            "250": 0,
            "500": 0,
            "1000": 0,
            "2500": 0,
            "5000": 0,
            "10000": 0,
            "+Inf": 0,
        },
        "sum_ms": 0.0,
        "count": 0,
    },
}

# Import API router after app creation to avoid circular imports
logger.info("Importing API router...")
try:
    from app.api.api_v1.api import api_router
    from app.core.config import settings
    from app.middleware.auth_cookies import AuthCookieMiddleware

    logger.info("Successfully imported API router")
    logger.info(f"Router prefix: {settings.API_V1_STR}")

    # Add cookie authentication middleware
    app.add_middleware(AuthCookieMiddleware)
    
    # Add rate limiting middleware if enabled
    if getattr(settings, "RATE_LIMIT_ENABLED", False):
        from app.middleware.rate_limit import RateLimitMiddleware, RateLimitConfig
        _rpm = max(1, int(getattr(settings, "RATE_LIMIT_SEND_PER_WINDOW", 60) or 60))
        _window = max(1, int(getattr(settings, "RATE_LIMIT_WINDOW_SECONDS", 60) or 60))
        # Make burst limit more permissive for dev: allow up to per-window count as burst
        # to accommodate React strict mode and concurrent requests.
        _burst = max(10, _rpm)
        rate_limit_config = RateLimitConfig(
            requests_per_minute=_rpm,
            requests_per_hour=1000,
            burst_limit=_burst,
            window_size=_window,
        )
        app.add_middleware(RateLimitMiddleware, config=rate_limit_config)

    # Include API router with version prefix
    app.include_router(api_router, prefix=settings.API_V1_STR)
    logger.info(f"API router included with prefix: {settings.API_V1_STR}")

except Exception as e:
    logger.error(f"Error importing or including API router: {str(e)}", exc_info=True)
    raise


# Correlation ID middleware (adds X-Request-ID header)
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    # attach to request state for downstream logging
    request.state.request_id = req_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


# Simple HTTP middleware to record request counts and latency
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = perf_counter()
    response = None
    try:
        response = await call_next(request)
        return response
    finally:
        try:
            elapsed_ms = (perf_counter() - start) * 1000.0
            path = request.url.path
            method = (request.method or "").upper()
            status = getattr(response, "status_code", 500) if response is not None else 500

            store = app.state.metrics
            # Total
            store["total_requests"] = int(store.get("total_requests", 0)) + 1

            # Per-route aggregates
            per = store.setdefault("per_route", {})
            node = per.setdefault(path, {"count": 0, "total_ms": 0.0})
            node["count"] += 1
            node["total_ms"] += float(elapsed_ms)

            # Per method/status counter
            pms = store.setdefault("per_method_status", {})
            key = f"{method}:{status}"
            pms[key] = int(pms.get(key, 0)) + 1

            # Duration histogram
            hist = store.setdefault("duration_hist", {})
            buckets = hist.get("buckets") or [50, 100, 250, 500, 1000, 2500, 5000, 10000]
            counts = hist.get("counts") or {}
            # Initialize if missing
            if not counts:
                counts = {str(b): 0 for b in buckets}
                counts["+Inf"] = 0
                hist["counts"] = counts
            # Increment appropriate buckets (cumulative semantics)
            placed = False
            for b in buckets:
                if elapsed_ms <= b:
                    counts[str(b)] = int(counts.get(str(b), 0)) + 1
                    placed = True
                elif placed:
                    # Still cumulative increment for higher buckets once placed
                    counts[str(b)] = int(counts.get(str(b), 0)) + 1
            # +Inf bucket always increases
            counts["+Inf"] = int(counts.get("+Inf", 0)) + 1

            # Sum and count
            hist["sum_ms"] = float(hist.get("sum_ms", 0.0)) + float(elapsed_ms)
            hist["count"] = int(hist.get("count", 0)) + 1

        except Exception as e:
            logger.debug("metrics_middleware failure: %s", e)


# Standardized error handlers (return consistent error shape)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Return RFC 7807 problem+json for HTTP exceptions."""
    status_code = int(getattr(exc, "status_code", 500) or 500)
    detail = exc.detail if isinstance(exc.detail, str) else (exc.detail or "HTTP error")
    try:
        title = HTTPStatus(status_code).phrase  # e.g., "Not Found"
    except Exception:
        title = "HTTP Error"
    problem = {
        "type": "about:blank",
        "title": title,
        "status": status_code,
        "detail": str(detail),
        "message": str(detail),
        "instance": str(getattr(request.url, "path", "/")),
        # Extensions
        "errors": None,
    }
    headers = getattr(exc, "headers", None) or {}
    return JSONResponse(
        status_code=status_code,
        content=problem,
        headers=headers,
        media_type="application/problem+json",
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return RFC 7807 problem+json for validation errors (422)."""
    status_code = 422
    try:
        title = HTTPStatus(status_code).phrase
    except Exception:
        title = "Unprocessable Entity"
    problem = {
        "type": "about:blank",
        "title": title,
        "status": status_code,
        "detail": "Validation Error",
        "message": "Validation Error",
        "instance": str(getattr(request.url, "path", "/")),
        # Extensions
        "errors": exc.errors(),
    }
    return JSONResponse(
        status_code=status_code, content=problem, media_type="application/problem+json"
    )


# Add root endpoint
@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "Welcome to Minimal AI Companion API"}


# Add health check endpoint
@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}


# Prometheus-compatible metrics endpoint
@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics from app.state.metrics.

    Metrics:
    - ai_companion_requests_total (counter)
    - ai_companion_requests_by_method_status_total (counter)
    - ai_companion_request_latency_ms_total (counter, by path)
    - ai_companion_request_duration_ms (histogram)
    """
    try:
        store = app.state.metrics or {}
        total = int(store.get("total_requests", 0))
        per = store.get("per_route", {})

        lines: list[str] = []
        lines.append("# HELP ai_companion_requests_total Total HTTP requests processed.")
        lines.append("# TYPE ai_companion_requests_total counter")
        lines.append(f"ai_companion_requests_total {total}")

        lines.append(
            "# HELP ai_companion_request_latency_ms_total Total request latency in milliseconds by path."
        )
        lines.append("# TYPE ai_companion_request_latency_ms_total counter")
        for path, node in per.items():
            total_ms = float(node.get("total_ms", 0.0))
            # sanitize path label value by escaping quotes and backslashes
            label_path = str(path).replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'ai_companion_request_latency_ms_total{{path="{label_path}"}} {total_ms}')

        # Per-method/status requests counter
        pms = store.get("per_method_status", {})
        lines.append(
            "# HELP ai_companion_requests_by_method_status_total Total HTTP requests by method and status."
        )
        lines.append("# TYPE ai_companion_requests_by_method_status_total counter")
        for key, c in pms.items():
            try:
                method, status = key.split(":", 1)
            except ValueError:
                method, status = "", ""
            method_esc = method.replace("\\", "\\\\").replace('"', '\\"')
            status_esc = status.replace("\\", "\\\\").replace('"', '\\"')
            lines.append(
                f'ai_companion_requests_by_method_status_total{{method="{method_esc}",status="{status_esc}"}} {int(c)}'
            )

        # Request duration histogram
        hist = store.get("duration_hist", {})
        buckets = hist.get("buckets", [])
        counts = hist.get("counts", {})
        sum_ms = float(hist.get("sum_ms", 0.0))
        cnt = int(hist.get("count", 0))
        lines.append("# HELP ai_companion_request_duration_ms Request duration in milliseconds.")
        lines.append("# TYPE ai_companion_request_duration_ms histogram")
        # Emit buckets in order
        for b in buckets:
            val = int(counts.get(str(b), 0))
            lines.append(f'ai_companion_request_duration_ms_bucket{{le="{b}"}} {val}')
        # +Inf bucket
        lines.append(
            f'ai_companion_request_duration_ms_bucket{{le="+Inf"}} {int(counts.get("+Inf", 0))}'
        )
        # count and sum
        lines.append(f"ai_companion_request_duration_ms_count {cnt}")
        lines.append(f"ai_companion_request_duration_ms_sum {sum_ms}")

        # Append LLM metrics
        try:
            llm_lines = dump_llm_metrics().split("\n") if dump_llm_metrics else []
            if llm_lines and llm_lines[0:1] != [""]:
                lines.extend(llm_lines)
        except Exception:
            pass

        body = "\n".join(lines) + "\n"
        return JSONResponse(content=body, media_type="text/plain; version=0.0.4; charset=utf-8")
    except Exception as e:
        logger.error("metrics endpoint failure: %s", e, exc_info=True)
        # Return minimal safe payload
        return JSONResponse(content="", media_type="text/plain; version=0.0.4; charset=utf-8")


# (Removed deprecated on_event startup handlers; handled in lifespan)
