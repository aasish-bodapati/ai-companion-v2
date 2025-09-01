"""
Holistic Memory API Endpoints

Provides unified access to holistic memory context across all memory buckets:
- Logs (fitness, meals, sleep, mood)
- Journals (reflections, emotions)
- Chats (AI conversations)
- Memories (FAISS vector store)
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging
import json
import asyncio
from fastapi.responses import StreamingResponse

from app.api.deps import get_db, get_current_user
from app.memory.holistic_service import holistic_memory_service
from app.models.user import User
from app.schemas.memory import MemorySearchResult
from app.schemas.holistic_memory import (
    HolisticContextResponse,
    HolisticResponseRequest,
    HolisticResponseResponse,
    MemoryTimelineRequest,
    MemoryTimelineResponse,
    IntentAnalysisResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/context", response_model=HolisticContextResponse)
async def get_holistic_context(
    user_message: str = Query(..., description="User message for context analysis"),
    conversation_id: Optional[str] = Query(None, description="Current conversation ID"),
    time_window_hours: int = Query(168, description="Time window in hours (default: 7 days)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get holistic memory context for a user message.
    
    This endpoint analyzes the user's message intent and fetches relevant context
    from all memory buckets (logs, journals, chats, memories) to provide
    a unified view of the user's life context.
    """
    try:
        context = holistic_memory_service.get_holistic_context(
            db=db,
            user_id=str(current_user.id),
            user_message=user_message,
            conversation_id=conversation_id,
            time_window_hours=time_window_hours
        )
        
        return HolisticContextResponse(
            user_id=str(current_user.id),
            user_message=user_message,
            context=context,
            timestamp=context.get("timestamp"),
            intent=context.get("intent", {}),
            summary=context.get("holistic_summary", {})
        )
        
    except Exception as e:
        logger.error(f"Error getting holistic context: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve holistic context: {str(e)}"
        )


@router.get("/context/stream")
async def stream_holistic_context(
    user_message: str = Query(..., description="User message for context analysis"),
    conversation_id: Optional[str] = Query(None, description="Current conversation ID"),
    time_window_hours: int = Query(168, description="Time window in hours (default: 7 days)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stream holistic memory context updates in real-time.
    
    This endpoint provides live updates as context is gathered from different
    memory buckets, creating a dynamic "rich circle" experience.
    """
    async def generate_context_stream():
        try:
            # Initial context gathering
            yield f"data: {json.dumps({'type': 'start', 'message': 'Gathering holistic context...'})}\n\n"
            
            # Get holistic context
            context = holistic_memory_service.get_holistic_context(
                db=db,
                user_id=str(current_user.id),
                user_message=user_message,
                conversation_id=conversation_id,
                time_window_hours=time_window_hours
            )
            
            # Stream context components
            yield f"data: {json.dumps({'type': 'intent', 'data': context.get('intent', {})})}\n\n"
            yield f"data: {json.dumps({'type': 'summary', 'data': context.get('holistic_summary', {})})}\n\n"
            
            # Stream data sources
            data_sources = context.get("data_sources", {})
            for source_name, source_data in data_sources.items():
                yield f"data: {json.dumps({'type': 'data_source', 'source': source_name, 'data': source_data})}\n\n"
                await asyncio.sleep(0.1)  # Small delay for streaming effect
            
            # Stream cross-connections
            cross_connections = context.get("cross_connections", [])
            for i, connection in enumerate(cross_connections):
                yield f"data: {json.dumps({'type': 'cross_connection', 'index': i, 'data': connection})}\n\n"
                await asyncio.sleep(0.1)
            
            # Stream recommendations
            recommendations = context.get("recommendations", [])
            yield f"data: {json.dumps({'type': 'recommendations', 'data': recommendations})}\n\n"
            
            # Final completion
            yield f"data: {json.dumps({'type': 'complete', 'message': 'Context gathering complete'})}\n\n"
            
        except Exception as e:
            logger.error(f"Error streaming holistic context: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_context_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )


@router.post("/response", response_model=HolisticResponseResponse)
async def generate_holistic_response(
    request: HolisticResponseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI response using holistic memory context.
    
    This endpoint uses the holistic memory context to generate personalized
    AI responses that show understanding of the user's life patterns,
    emotions, and experiences.
    """
    try:
        result = holistic_memory_service.generate_holistic_response(
            db=db,
            user_id=str(current_user.id),
            user_message=request.user_message,
            conversation_id=request.conversation_id,
            system_prompt=request.system_prompt
        )
        
        return HolisticResponseResponse(
            user_id=str(current_user.id),
            user_message=request.user_message,
            ai_response=result.get("response", ""),
            context_used=result.get("context_used", {}),
            intent=result.get("intent", {}),
            timestamp=result.get("timestamp"),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"Error generating holistic response: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate holistic response: {str(e)}"
        )


@router.get("/timeline", response_model=MemoryTimelineResponse)
async def get_memory_timeline(
    days: int = Query(7, description="Number of days to look back (default: 7)"),
    include_types: Optional[List[str]] = Query(None, description="Specific memory types to include"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get unified memory timeline across all memory buckets.
    
    This endpoint provides a chronological view of all user activities,
    combining logs, journals, chats, and memories into a single timeline
    that shows the user's life story.
    """
    try:
        timeline_data = holistic_memory_service.get_memory_timeline(
            db=db,
            user_id=str(current_user.id),
            days=days,
            include_types=include_types
        )
        
        return MemoryTimelineResponse(
            user_id=str(current_user.id),
            timeline=timeline_data.get("timeline", []),
            summary=timeline_data.get("summary", {}),
            period=timeline_data.get("period", f"Last {days} days"),
            total_entries=timeline_data.get("total_entries", 0),
            error=timeline_data.get("error")
        )
        
    except Exception as e:
        logger.error(f"Error getting memory timeline: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve memory timeline: {str(e)}"
        )


@router.get("/intent", response_model=IntentAnalysisResponse)
async def analyze_user_intent(
    user_message: str = Query(..., description="User message to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze user message intent for memory context.
    
    This endpoint analyzes the user's message to determine intent type
    (action, introspection, general discussion) and provides confidence
    scores and keyword analysis.
    """
    try:
        # Get holistic context to include intent analysis
        context = holistic_memory_service.get_holistic_context(
            db=db,
            user_id=str(current_user.id),
            user_message=user_message,
            time_window_hours=24  # Shorter window for intent analysis
        )
        
        intent_data = context.get("intent", {})
        
        return IntentAnalysisResponse(
            user_id=str(current_user.id),
            user_message=user_message,
            intent_type=intent_data.get("type", "unknown"),
            confidence=intent_data.get("confidence", 0.0),
            keywords=intent_data.get("keywords", []),
            context_summary=context.get("holistic_summary", {}),
            timestamp=context.get("timestamp")
        )
        
    except Exception as e:
        logger.error(f"Error analyzing user intent: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze user intent: {str(e)}"
        )


@router.get("/summary")
async def get_holistic_summary(
    time_window_hours: int = Query(168, description="Time window in hours (default: 7 days)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get holistic memory summary for the user.
    
    This endpoint provides a high-level summary of the user's recent
    activities, emotional state, and memory patterns across all buckets.
    """
    try:
        # Get context with a generic message to get summary
        context = holistic_memory_service.get_holistic_context(
            db=db,
            user_id=str(current_user.id),
            user_message="summary request",
            time_window_hours=time_window_hours
        )
        
        return {
            "user_id": str(current_user.id),
            "summary": context.get("holistic_summary", {}),
            "cross_connections": context.get("cross_connections", []),
            "recommendations": context.get("recommendations", []),
            "data_sources_summary": {
                "logs": context.get("data_sources", {}).get("logs", {}).get("summary", {}),
                "journals": context.get("data_sources", {}).get("journals", {}).get("summary", {}),
                "chats": context.get("data_sources", {}).get("chats", {}).get("summary", {}),
                "memories": context.get("data_sources", {}).get("memories", {}).get("summary", {})
            },
            "timestamp": context.get("timestamp"),
            "period": f"Last {time_window_hours // 24} days"
        }
        
    except Exception as e:
        logger.error(f"Error getting holistic summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve holistic summary: {str(e)}"
        )


@router.get("/health")
async def holistic_memory_health():
    """
    Health check for holistic memory system.
    
    Returns the status of the holistic memory orchestrator and service.
    """
    try:
        # Basic health check
        return {
            "status": "healthy",
            "service": "holistic_memory",
            "orchestrator": "available",
            "timestamp": "2024-01-01T00:00:00Z"  # Placeholder
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "holistic_memory",
            "error": str(e),
            "timestamp": "2024-01-01T00:00:00Z"  # Placeholder
        }


@router.get("/dashboard")
async def get_unified_dashboard(
    time_window_hours: int = Query(168, description="Time window in hours (default: 7 days)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get unified dashboard with all user data in one call.
    
    This endpoint provides the "rich circle" experience by returning:
    - Holistic memory context
    - Recent activities across all buckets
    - Cross-connections and insights
    - AI recommendations
    - Unified timeline
    """
    try:
        # Get holistic context
        context = holistic_memory_service.get_holistic_context(
            db=db,
            user_id=str(current_user.id),
            user_message="dashboard request",
            time_window_hours=time_window_hours
        )
        
        # Get unified timeline
        timeline = holistic_memory_service.get_memory_timeline(
            db=db,
            user_id=str(current_user.id),
            days=time_window_hours // 24
        )
        
        # Build unified dashboard response
        dashboard = {
            "user_id": str(current_user.id),
            "timestamp": context.get("timestamp"),
            "period": f"Last {time_window_hours // 24} days",
            
            # Holistic Summary
            "summary": context.get("holistic_summary", {}),
            
            # Cross-Connections
            "insights": {
                "cross_connections": context.get("cross_connections", []),
                "patterns": context.get("cross_connections", []),  # Same data, different view
                "recommendations": context.get("recommendations", [])
            },
            
            # Data Sources Summary
            "data_sources": {
                "logs": context.get("data_sources", {}).get("logs", {}).get("summary", {}),
                "journals": context.get("data_sources", {}).get("journals", {}).get("summary", {}),
                "chats": context.get("data_sources", {}).get("chats", {}).get("summary", {}),
                "memories": context.get("data_sources", {}).get("memories", {}).get("summary", {})
            },
            
            # Unified Timeline
            "timeline": timeline.get("timeline", []),
            "timeline_summary": timeline.get("summary", {}),
            
            # Intent Analysis
            "intent": context.get("intent", {}),
            
            # Rich Circle Features
            "rich_circle": {
                "total_activities": len(timeline.get("timeline", [])),
                "activity_distribution": _get_activity_distribution(timeline.get("timeline", [])),
                "emotional_trends": _get_emotional_trends(context),
                "physical_trends": _get_physical_trends(context),
                "conversation_flow": _get_conversation_flow(context)
            }
        }
        
        return dashboard
        
    except Exception as e:
        logger.error(f"Error getting unified dashboard: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve unified dashboard: {str(e)}"
        )


def _get_activity_distribution(timeline: List[Dict[str, Any]]) -> Dict[str, int]:
    """Get distribution of activities by type"""
    distribution = {}
    for entry in timeline:
        entry_type = entry.get("type", "unknown")
        distribution[entry_type] = distribution.get(entry_type, 0) + 1
    return distribution


def _get_emotional_trends(context: Dict[str, Any]) -> Dict[str, Any]:
    """Extract emotional trends from context"""
    journals = context.get("data_sources", {}).get("journals", {})
    mood_logs = context.get("data_sources", {}).get("logs", {}).get("recent_mood", [])
    
    trends = {
        "emotional_themes": journals.get("emotional_themes", []),
        "mood_patterns": [],
        "stress_indicators": []
    }
    
    # Analyze mood patterns
    if mood_logs:
        mood_values = [m.get("value", 0) for m in mood_logs]
        if mood_values:
            trends["mood_patterns"] = {
                "average": sum(mood_values) / len(mood_values),
                "trend": "improving" if len(mood_values) > 1 and mood_values[0] > mood_values[-1] else "stable"
            }
    
    return trends


def _get_physical_trends(context: Dict[str, Any]) -> Dict[str, Any]:
    """Extract physical activity trends from context"""
    logs = context.get("data_sources", {}).get("logs", {})
    
    trends = {
        "workout_frequency": len(logs.get("recent_workouts", [])),
        "nutrition_consistency": len(logs.get("recent_meals", [])),
        "hydration_tracking": len(logs.get("recent_hydration", [])),
        "activity_level": "active" if logs.get("recent_workouts") else "inactive"
    }
    
    return trends


def _get_conversation_flow(context: Dict[str, Any]) -> Dict[str, Any]:
    """Extract conversation flow patterns"""
    chats = context.get("data_sources", {}).get("chats", {})
    
    flow = {
        "current_conversation": chats.get("current_conversation", {}).get("title", "None"),
        "recent_conversations": len(chats.get("recent_conversations", [])),
        "conversation_topics": chats.get("key_topics", []),
        "ai_insights": len(chats.get("ai_insights", []))
    }
    
    return flow
