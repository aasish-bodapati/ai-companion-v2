import logging
import sys
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import models
from app.core.config import settings
from app.db.session import engine, SessionLocal

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Debug: Log Python path and imports
logger.info("\n=== Python Path ===")
for path in sys.path:
    logger.info(f"- {path}")
logger.info("=================\n")

# Create database tables only for SQLite (dev/test). For Postgres, rely on migrations.
try:
    db_uri = str(getattr(settings, 'SQLALCHEMY_DATABASE_URI', '') or '')
    if db_uri.startswith('sqlite'):
        models.Base.metadata.create_all(bind=engine)
    else:
        logger.info("Skipping automatic table creation for non-SQLite database; use migrations instead.")
except Exception as e:
    logger.warning(f"Skipping automatic table creation due to error: {e}")

# Initialize FastAPI app
logger.info("Initializing FastAPI application...")
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)
logger.info("FastAPI application initialized")

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
            logger.info("Origins entries and types: %s", [(o, type(o).__name__) for o in origins_value])
    except Exception as e:
        logger.warning("Failed to log BACKEND_CORS_ORIGINS: %s", e)

    logger.info("Setting up CORS middleware...")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip('/') for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS middleware configured")

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

# Debug: Log registered routes after all routes are added
@app.on_event("startup")
async def log_routes():
    logger.info("\n=== Final Registered Routes ===")
    for route in app.routes:
        logger.info(f"{route.methods} {route.path} -> {getattr(route, 'endpoint', 'N/A')}")
    logger.info("============================\n")

# For debugging: Print all registered routes
@app.on_event("startup")
async def startup_event():
    print("\nRegistered routes:")
    for route in app.routes:
        print(f"{route.methods} {route.path}")
    print()
