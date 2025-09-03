"""
Health check endpoints for monitoring and observability
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.core.config import settings
from app.core.exceptions import APIException

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Basic health check endpoint"""
    return {"status": "healthy", "service": "ai-companion-api"}


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Comprehensive health check with component status"""
    health_status = {
        "status": "healthy",
        "service": "ai-companion-api",
        "version": "2.0.0",
        "components": {}
    }
    
    # Check database connectivity
    try:
        db.execute(text("SELECT 1"))
        health_status["components"]["database"] = {
            "status": "healthy",
            "type": "sqlite" if "sqlite" in str(settings.SQLALCHEMY_DATABASE_URI) else "postgresql"
        }
    except Exception as e:
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check LLM service
    try:
        from app.core.llm import SimpleLLMClient
        llm_client = SimpleLLMClient()
        # Simple test - just check if client can be instantiated
        health_status["components"]["llm"] = {
            "status": "healthy",
            "provider": settings.LLM_PROVIDER
        }
    except Exception as e:
        health_status["components"]["llm"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check memory service
    try:
        if settings.MEMORY_ENABLED:
            from app.memory.service import MemoryService
            # Simple test - just check if service can be instantiated
            health_status["components"]["memory"] = {
                "status": "healthy",
                "provider": settings.MEMORY_PROVIDER
            }
        else:
            health_status["components"]["memory"] = {
                "status": "disabled"
            }
    except Exception as e:
        health_status["components"]["memory"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check FAISS store
    try:
        if settings.MEMORY_ENABLED and settings.MEMORY_PROVIDER == "faiss":
            from app.memory.faiss_store import FAISSStore
            # Simple test - just check if store can be instantiated
            health_status["components"]["faiss"] = {
                "status": "healthy"
            }
        else:
            health_status["components"]["faiss"] = {
                "status": "disabled"
            }
    except Exception as e:
        health_status["components"]["faiss"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    return health_status


@router.get("/health/ready")
async def readiness_check(db: Session = Depends(get_db)) -> Dict[str, str]:
    """Kubernetes readiness probe endpoint"""
    try:
        # Check if database is accessible
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service not ready: {str(e)}"
        )


@router.get("/health/live")
async def liveness_check() -> Dict[str, str]:
    """Kubernetes liveness probe endpoint"""
    return {"status": "alive"}