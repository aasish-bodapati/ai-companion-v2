"""
Debug endpoints for development and troubleshooting.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from ...core.config import settings
from ...core.llm import get_llm_status
from ...db.session import get_db
from ...api.deps import get_current_user
from ...models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/debug/status")
def get_debug_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get comprehensive debug status for troubleshooting."""
    
    try:
        # Get LLM status
        llm_status = get_llm_status()
        
        # Get user info
        user_info = {
            "id": str(current_user.id),
            "email": current_user.email,
            "memory_enabled": getattr(current_user, "memory_enabled", True),
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        }
        
        # Get system configuration
        config_info = {
            "memory_enabled": settings.MEMORY_ENABLED,
            "llm_provider": settings.LLM_PROVIDER,
            "llm_dev_mode": getattr(settings, "LLM_DEV_MODE", True),
            "llm_model_default": settings.LLM_MODEL_DEFAULT,
        }
        
        return {
            "status": "ok",
            "user": user_info,
            "llm": llm_status,
            "config": config_info,
            "timestamp": "2024-12-19T12:00:00Z"  # You can make this dynamic
        }
        
    except Exception as e:
        logger.error(f"Error in debug status: {e}")
        raise HTTPException(status_code=500, detail=f"Debug error: {str(e)}")

@router.get("/debug/test-llm")
def test_llm_response(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Test LLM response generation."""
    
    try:
        from ...core.llm import generate_response
        
        # Test with a simple query
        system_prompt = "You are a helpful assistant."
        messages = [{"role": "user", "content": "What is my name?"}]
        
        response = generate_response(
            system_prompt=system_prompt,
            messages=messages,
            max_tokens=100
        )
        
        return {
            "status": "ok",
            "test_query": "What is my name?",
            "response": response,
            "llm_status": get_llm_status()
        }
        
    except Exception as e:
        logger.error(f"Error in LLM test: {e}")
        return {
            "status": "error",
            "error": str(e),
            "llm_status": get_llm_status()
        }
