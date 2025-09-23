import logging
import sys
import os
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from time import perf_counter
from http import HTTPStatus
# Unused imports removed

# Ensure correct Python path for uvicorn
if "uvicorn" in sys.modules and "/usr/local/bin" in sys.path:
    sys.path.remove("/usr/local/bin")
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
# TrustedHostMiddleware removed - not used
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.rate_limiting import rate_limit_middleware

# Configure logging for all cases to ensure debug logs are visible
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# Python path configured

# No automatic table creation; always use Alembic migrations

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize tracing first (if enabled)
    try:
        # init_tracing()  # Commented out until tracing is properly implemented
        app.state.tracer_provider = "tracing_initialized"
    except Exception as e:
        logger.warning("Tracing init failed: %s", e)

    # Startup: scheduler removed (not needed for current functionality)

    # Startup: database is managed by Alembic migrations

    # Startup: log registered routes after inclusion
    yield
    # Shutdown: scheduler removed (not needed for current functionality)
    # Routes registered successfully

# Initialize FastAPI app (with lifespan)
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    ## HealthLog AI - Your Personal Wellness Assistant

    A comprehensive health and fitness tracking API that helps users manage their wellness journey.

    ### Features
    - **Authentication**: JWT-based user authentication and authorization
    - **Health Logging**: Track workouts, nutrition, and health metrics
    - **Routine Management**: Create and manage custom fitness and nutrition routines
    - **Analytics**: Get insights and recommendations based on your data
    - **Exercise Database**: Access to comprehensive exercise and food databases

    ### Authentication
    Most endpoints require authentication. Use the `/login/access-token` endpoint to get a JWT token, then include it in the Authorization header:
    ```
    Authorization: Bearer <your-token>
    ```

    ### Rate Limiting
    API requests are rate limited to prevent abuse:
    - Authentication endpoints: 10 requests per minute
    - Search endpoints: 30 requests per minute
    - General API: 100 requests per minute
    """,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    contact={
        "name": "HealthLog AI Support",
        "email": "support@healthlog-ai.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)
# FastAPI application initialized

# Add security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)

    # CORS headers (manual fallback)
    origin = request.headers.get("origin")
    if origin and origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    # Content Security Policy
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none';"
    )
    response.headers["Content-Security-Policy"] = csp

    return response

# Rate limiting middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    """Apply rate limiting to all requests."""
    return await rate_limit_middleware(request, call_next)

# Set up CORS FIRST (before other middleware) - TEMPORARILY ALLOW ALL ORIGINS FOR DEBUGGING
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS middleware configured to allow all origins for debugging")

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

# Add OPTIONS handler for CORS preflight requests
@app.options("/{full_path:path}")
async def options_handler(request: Request):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Import and include API router
try:
    from app.api.api_v1.api import api_router
    from app.core.config import settings
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Debug: Print all registered routes
    logger.info("=== REGISTERED ROUTES ===")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            logger.info(f"Route: {list(route.methods)} {route.path}")
    logger.info("=== END REGISTERED ROUTES ===")

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

# Timeout middleware to prevent hanging requests
@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    import asyncio

    try:
        # Set a 30-second timeout for all requests
        response = await asyncio.wait_for(call_next(request), timeout=30.0)
        return response
    except asyncio.TimeoutError:
        logger.warning(f"Request timeout: {request.method} {request.url.path}")
        return JSONResponse(
            status_code=504,
            content={"detail": "Request timeout - server took too long to respond"}
        )

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
    return {"message": "Welcome to HealthLog API"}

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

        # LLM metrics removed for simplicity

        body = "\n".join(lines) + "\n"
        return JSONResponse(content=body, media_type="text/plain; version=0.0.4; charset=utf-8")
    except Exception as e:
        logger.error("metrics endpoint failure: %s", e, exc_info=True)
        # Return minimal safe payload
        return JSONResponse(content="", media_type="text/plain; version=0.0.4; charset=utf-8")

# (Removed deprecated on_event startup handlers; handled in lifespan)
