import logging
import sys
from contextlib import asynccontextmanager
from time import perf_counter
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings

# Configure logging only when run as a script to avoid noisy logs during tests/imports
if __name__ == "__main__":
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
    # Startup: start scheduler
    try:
        from app.scheduler import start_scheduler

        start_scheduler()
    except Exception as e:
        logger.warning("Failed to start scheduler: %s", e)

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

# Initialize lightweight metrics store in app state
app.state.metrics = {
    "total_requests": 0,
    "per_route": {},  # path -> {count, total_ms}
}

# Import API router after app creation to avoid circular imports
logger.info("Importing API router...")
try:
    from app.api.api_v1.api import api_router

    logger.info("Successfully imported API router")
    logger.info(f"Router prefix: {settings.API_V1_STR}")

    # Include API router with version prefix
    app.include_router(api_router, prefix=settings.API_V1_STR)
    logger.info(f"API router included with prefix: {settings.API_V1_STR}")

except Exception as e:
    logger.error(f"Error importing or including API router: {str(e)}", exc_info=True)
    raise

# Simple HTTP middleware to record request counts and latency
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = perf_counter()
    try:
        response = await call_next(request)
        return response
    finally:
        try:
            elapsed_ms = (perf_counter() - start) * 1000.0
            path = request.url.path
            store = app.state.metrics
            store["total_requests"] = store.get("total_requests", 0) + 1
            per = store.setdefault("per_route", {})
            node = per.setdefault(path, {"count": 0, "total_ms": 0.0})
            node["count"] += 1
            node["total_ms"] += elapsed_ms
        except Exception as e:
            logger.debug("metrics_middleware failure: %s", e)

# Set up CORS
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


# Standardized error handlers (return consistent error shape)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "HTTP error"
    payload = {
        "detail": message,
        "message": message,
        "errors": None,
    }
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = exc.errors()
    payload = {
        "detail": "Validation Error",
        "message": "Validation Error",
        "errors": details,
    }
    return JSONResponse(status_code=422, content=payload)


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


# (Removed deprecated on_event startup handlers; handled in lifespan)
