"""
Onboarding API endpoints for processing user briefings into memory.
"""

# Unused imports removed for Milestone 1 simplicity
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.memory.service import memory_service
from app.core.llm import SimpleLLMClient

router = APIRouter()


class BriefingRequest(BaseModel):
    briefing: str


class BriefingResponse(BaseModel):
    success: bool
    message: str
    memory_id: str = None


@router.post("/process-briefing", response_model=BriefingResponse)
async def process_briefing(
    request: BriefingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process user briefing text and store it as structured memory.
    """
    try:
        user_id = str(current_user.id)
        briefing_text = request.briefing.strip()
        
        if not briefing_text:
            raise HTTPException(status_code=400, detail="Briefing cannot be empty")
        
        # Use LLM to process and structure the briefing
        llm_client = SimpleLLMClient()
        
        # Create a prompt to extract structured information
        processing_prompt = f"""
        Analyze this user briefing and extract key information about their lifestyle, preferences, and goals.
        
        User Briefing: "{briefing_text}"
        
        Please extract and organize the following information:
        1. Daily routines and schedules
        2. Food preferences and restrictions
        3. Goals and areas of focus
        4. Personal preferences and habits
        5. Any other important details
        
        Format your response as a structured summary that captures the essence of who this person is.
        """
        
        # Get structured summary from LLM
        structured_summary = await llm_client.generate_response(
            system_prompt="You are an AI assistant that analyzes user briefings and extracts structured information about their lifestyle, preferences, and goals.",
            messages=[{"role": "user", "content": processing_prompt}],
            max_tokens=500
        )
        
        # Store the original briefing as unstructured memory
        briefing_memory_id = memory_service.store_memory(
            db=db,
            content=briefing_text,
            content_type="onboarding_briefing",
            user_id=user_id,
            metadata={
                "source": "onboarding",
                "type": "user_briefing",
                "importance": 0.9
            }
        )
        
        # Store the structured summary as structured memory
        summary_memory_id = memory_service.store_memory(
            db=db,
            content=structured_summary,
            content_type="onboarding_summary",
            user_id=user_id,
            metadata={
                "source": "onboarding",
                "type": "structured_summary",
                "importance": 0.95,
                "related_to": briefing_memory_id
            }
        )
        
        return BriefingResponse(
            success=True,
            message="Briefing processed and stored successfully",
            memory_id=summary_memory_id
        )
        
    except HTTPException:
        # Re-raise HTTPExceptions (like validation errors) without modification
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process briefing: {str(e)}")


@router.get("/status")
async def get_onboarding_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if user has completed onboarding.
    """
    try:
        user_id = str(current_user.id)
        
        # Check if user has any onboarding memories using database query instead of vector search
        from app.crud import memory as memory_crud
        
        # Get memories with onboarding content types
        onboarding_memories = memory_crud.get_user_memories(
            db=db, 
            user_id=user_id, 
            content_type="onboarding_briefing", 
            limit=1
        )
        
        # Also check for onboarding_summary content type
        if not onboarding_memories:
            onboarding_memories = memory_crud.get_user_memories(
                db=db, 
                user_id=user_id, 
                content_type="onboarding_summary", 
                limit=1
            )
        
        has_completed = len(onboarding_memories) > 0
        
        return {
            "completed": has_completed,
            "has_memories": len(onboarding_memories) > 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check onboarding status: {str(e)}")
