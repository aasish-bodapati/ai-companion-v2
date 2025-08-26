"""
Conversational API endpoints for intelligent life management assistance.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import json
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/chat")
async def chat_with_assistant(
    message: str = Body(..., embed=True),
    conversation_history: Optional[List[Dict[str, Any]]] = Body(default=[]),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Chat with the intelligent life management assistant.
    The assistant understands context, remembers previous conversations,
    and provides empathetic, helpful responses.
    """
    try:
        user_id = str(current_user.id)
        
        # Generate intelligent response with human-level features
        response = conversation_intelligence.generate_response(
            user_message=message,
            conversation_history=conversation_history,
            user_id=user_id
        )
        
        # Add user context
        response["user_id"] = user_id
        response["timestamp"] = datetime.now().isoformat()
        response["message_id"] = f"msg_{int(datetime.now().timestamp())}"
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")

@router.get("/conversation-insights")
async def get_conversation_insights(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get insights about the user's conversation patterns and life management topics.
    """
    try:
        user_id = str(current_user.id)
        
        # Get neural system insights
        neural_insights = neural_memory_system.get_memory_insights()
        
        # Analyze conversation patterns
        conversation_insights = {
            "total_conversations": neural_insights["total_memories"],
            "conversation_patterns": neural_insights["conversation_patterns"],
            "emotional_trends": neural_insights["emotional_patterns"],
            "topic_distribution": {},
            "learning_progress": {
                "total_patterns_learned": len(neural_insights["conversation_patterns"]),
                "emotional_awareness": len(neural_insights["emotional_patterns"]),
                "context_understanding": len(neural_insights["temporal_patterns"])
            },
            "life_domain_engagement": {
                "fitness": 0,
                "nutrition": 0,
                "health": 0,
                "stress": 0,
                "scheduling": 0
            }
        }
        
        # Calculate domain engagement based on memory categories
        for memory in neural_memory_system.memories.values():
            for category in memory.categories:
                if category in conversation_insights["life_domain_engagement"]:
                    conversation_insights["life_domain_engagement"][category] += 1
        
        return conversation_insights
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversation insights: {str(e)}")

@router.post("/feedback")
async def provide_conversation_feedback(
    message_id: str = Body(..., embed=True),
    feedback_score: float = Body(..., embed=True),
    feedback_type: str = Body(default="relevance", embed=True),
    additional_comments: Optional[str] = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Provide feedback on assistant responses to improve learning.
    """
    try:
        user_id = str(current_user.id)
        
        # Validate feedback score
        if not 0.0 <= feedback_score <= 1.0:
            raise HTTPException(status_code=400, detail="Feedback score must be between 0.0 and 1.0")
        
        # Store feedback in neural system
        neural_memory_system.learn_from_feedback(message_id, feedback_score)
        
        # Create feedback memory
        feedback_memory = {
            "message_id": message_id,
            "feedback_score": feedback_score,
            "feedback_type": feedback_type,
            "comments": additional_comments,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add to neural system for learning
        neural_memory_system.add_memory(
            memory_id=f"feedback_{message_id}",
            content=f"User feedback: {feedback_type} - {feedback_score}",
            categories=["feedback", feedback_type, "learning"],
            importance=0.8,
            emotional_valence=0.0
        )
        
        return {
            "message": "Feedback received and stored for learning",
            "message_id": message_id,
            "feedback_score": feedback_score,
            "learning_progress": "The assistant will use this feedback to improve future responses."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store feedback: {str(e)}")

@router.get("/memory-recall")
async def recall_relevant_memories(
    query: str,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Recall memories relevant to a specific query or topic.
    Useful for remembering previous conversations and insights.
    """
    try:
        user_id = str(current_user.id)
        
        # Use neural system to find relevant memories
        relevant_memories = neural_memory_system.activate_memory_network(
            query=query,
            user_id=user_id,
            conversation_context={"query": query, "recall_request": True}
        )
        
        # Format memories for response
        memory_recall = []
        for memory in relevant_memories[:limit]:
            memory_recall.append({
                "memory_id": memory.memory_id,
                "content": memory.content,
                "categories": memory.categories,
                "importance": memory.importance,
                "last_accessed": memory.last_activated.isoformat() if memory.last_activated else None,
                "relevance_score": memory.consolidation_level,  # Use consolidation as relevance proxy
                "context": f"From conversation about {', '.join(memory.categories[:2])}"
            })
        
        return {
            "query": query,
            "memories_found": len(memory_recall),
            "relevant_memories": memory_recall,
            "suggested_follow_up": f"I found {len(memory_recall)} memories related to '{query}'. Would you like me to elaborate on any of these?"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to recall memories: {str(e)}")
