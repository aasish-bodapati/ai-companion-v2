from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware import Middleware
from sqlalchemy.orm import Session
from pathlib import Path
import os

from . import models
from .database import engine, get_db
from .api.endpoints import documents
from .core.config import settings

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Configure CORS
middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

app = FastAPI(
    title="AI Companion API",
    description="Backend API for the AI Companion application",
    version="0.1.0",
    middleware=middleware,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Include API routers
app.include_router(
    documents.router,
    prefix="/api/documents",
    tags=["documents"]
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}

# Create uploads directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Serve static files (for uploaded files in development)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
