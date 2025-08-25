"""
Memory Visualization API endpoints for the brain-like memory system.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import json
from datetime import datetime, timedelta, timezone
import logging

from app.db.session import get_db
from app.crud.user import user as user_crud
from app.memory.neural_system import neural_memory_system
from app.memory.efficient_storage import efficient_storage
from app.crud.memory import memory as memory_crud
from app.api.deps import get_current_user

router = APIRouter()

logger = logging.getLogger(__name__)

def get_utc_now():
    """Get current UTC datetime without timezone info (timezone-naive)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

def is_recent_memory(memory_timestamp: datetime, days: int = 1) -> bool:
    """Check if memory is recent, handling timezone issues by using naive datetimes."""
    if memory_timestamp is None:
        return False
    
    now = get_utc_now()
    
    # Debug logging
    logger.debug(f"Memory timestamp: {memory_timestamp}, tzinfo: {memory_timestamp.tzinfo}")
    logger.debug(f"Current UTC time: {now}, tzinfo: {now.tzinfo}")
    
    # Convert both to naive UTC datetimes to avoid timezone issues
    if memory_timestamp.tzinfo is not None:
        # If it has timezone info, convert to UTC and make naive
        memory_timestamp = memory_timestamp.astimezone(timezone.utc).replace(tzinfo=None)
        logger.debug(f"Converted to naive UTC: {memory_timestamp}")
    
    # Now both are naive UTC datetimes, safe to subtract
    days_diff = (now - memory_timestamp).days
    logger.debug(f"Days difference: {days_diff}")
    
    return days_diff < days

@router.get("/neural-network")
async def get_neural_network(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get the neural network visualization data."""
    try:
        user_id = str(current_user.id)
        
        # Get user's memories from FAISS/DB
        user_memories = memory_crud.get_user_memories(db, user_id=user_id, limit=100)
        
        # Sync FAISS memories to neural system if neural system is empty
        if len(neural_memory_system.memories) == 0 and user_memories:
            logger.info(f"Syncing {len(user_memories)} memories to neural system for user {user_id}")
            for memory in user_memories:
                try:
                    # Extract metadata
                    metadata = json.loads(memory.memory_metadata) if memory.memory_metadata else {}
                    categories = metadata.get("categories", ["general"])
                    importance = metadata.get("importance", 0.5)
                    
                    # Add to neural system
                    neural_memory_system.add_memory(
                        memory_id=memory.faiss_id,
                        content=memory.content,
                        categories=categories,
                        importance=importance,
                        emotional_valence=metadata.get("emotional_valence", 0.0)
                    )
                except Exception as e:
                    logger.warning(f"Failed to sync memory {memory.faiss_id}: {e}")
        
        # Get neural system insights
        neural_insights = neural_memory_system.get_memory_insights()
        
        # Get storage statistics
        storage_stats = efficient_storage.get_storage_stats()
        
        # Build neural network graph
        network_data = {
            "nodes": [],
            "edges": [],
            "clusters": {},
            "insights": neural_insights,
            "storage": storage_stats
        }
        
        # Add memory nodes
        for memory in user_memories:
            node = {
                "id": memory.faiss_id,
                "label": memory.content[:50] + "..." if len(memory.content) > 50 else memory.content,
                "content": memory.content,
                "categories": json.loads(memory.memory_metadata).get("categories", []) if memory.memory_metadata else [],
                "importance": json.loads(memory.memory_metadata).get("importance", 0.5) if memory.memory_metadata else 0.5,
                "consolidation_level": json.loads(memory.memory_metadata).get("consolidation_level", 0.1) if memory.memory_metadata else 0.1,
                "activation_count": json.loads(memory.memory_metadata).get("activation_count", 0) if memory.memory_metadata else 0,
                "last_accessed": memory.timestamp.isoformat() if memory.timestamp else None,
                "size": len(memory.content),
                "type": memory.content_type
            }
            network_data["nodes"].append(node)
            
            # Group by primary category for clustering
            primary_category = node["categories"][0] if node["categories"] else "general"
            if primary_category not in network_data["clusters"]:
                network_data["clusters"][primary_category] = []
            network_data["clusters"][primary_category].append(memory.faiss_id)
        
        # Add neural connections as edges
        for connection_id, connection in neural_memory_system.connections.items():
            edge = {
                "id": connection_id,
                "source": connection.source_memory_id,
                "target": connection.target_memory_id,
                "strength": connection.strength,
                "type": connection.connection_type,
                "activation_count": connection.activation_count,
                "last_activated": connection.last_activated.isoformat()
            }
            network_data["edges"].append(edge)
        
        return network_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get neural network: {str(e)}")

@router.get("/memory-timeline")
async def get_memory_timeline(
    days: int = Query(30, description="Number of days to show"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get memory consolidation timeline data."""
    try:
        user_id = str(current_user.id)
        
        # Get user's memories
        user_memories = memory_crud.get_user_memories(db, user_id=user_id, limit=1000)
        
        # Group memories by date
        timeline_data = {}
        end_date = get_utc_now()
        start_date = end_date - timedelta(days=days)
        
        current_date = start_date
        while current_date <= end_date:
            date_key = current_date.strftime("%Y-%m-%d")
            timeline_data[date_key] = {
                "date": date_key,
                "memories_created": 0,
                "memories_consolidated": 0,
                "total_activations": 0,
                "avg_importance": 0.0,
                "categories": {}
            }
            current_date += timedelta(days=1)
        
        # Process memories
        for memory in user_memories:
            if memory.timestamp:
                date_key = memory.timestamp.strftime("%Y-%m-%d")
                if date_key in timeline_data:
                    timeline_data[date_key]["memories_created"] += 1
                    
                    # Parse metadata
                    if memory.memory_metadata:
                        metadata = json.loads(memory.memory_metadata)
                        importance = metadata.get("importance", 0.5)
                        activation_count = metadata.get("activation_count", 0)
                        consolidation_level = metadata.get("consolidation_level", 0.1)
                        categories = metadata.get("categories", [])
                        
                        timeline_data[date_key]["total_activations"] += activation_count
                        timeline_data[date_key]["avg_importance"] += importance
                        
                        # Track categories
                        for category in categories:
                            if category not in timeline_data[date_key]["categories"]:
                                timeline_data[date_key]["categories"][category] = 0
                            timeline_data[date_key]["categories"][category] += 1
                        
                        # Check if memory was consolidated on this date
                        if consolidation_level > 0.7:
                            timeline_data[date_key]["memories_consolidated"] += 1
        
        # Calculate averages
        for date_data in timeline_data.values():
            if date_data["memories_created"] > 0:
                date_data["avg_importance"] /= date_data["memories_created"]
        
        return list(timeline_data.values())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get memory timeline: {str(e)}")

@router.get("/pattern-insights")
async def get_pattern_insights(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get pattern recognition insights."""
    try:
        user_id = str(current_user.id)
        
        # Get user's conversation patterns
        user_memories = memory_crud.get_user_memories(db, user_id=user_id, limit=100)
        
        # Sync FAISS memories to neural system if neural system is empty
        if len(neural_memory_system.memories) == 0 and user_memories:
            logger.info(f"Syncing {len(user_memories)} memories to neural system for user {user_id}")
            for memory in user_memories:
                try:
                    # Extract metadata
                    metadata = json.loads(memory.memory_metadata) if memory.memory_metadata else {}
                    categories = metadata.get("categories", ["general"])
                    importance = metadata.get("importance", 0.5)
                    
                    # Add to neural system
                    neural_memory_system.add_memory(
                        memory_id=memory.faiss_id,
                        content=memory.content,
                        categories=categories,
                        importance=importance,
                        emotional_valence=metadata.get("emotional_valence", 0.0)
                    )
                except Exception as e:
                    logger.warning(f"Failed to sync memory {memory.faiss_id}: {e}")
        
        # Get neural system insights
        neural_insights = neural_memory_system.get_memory_insights()
        
        # Analyze patterns
        pattern_insights = {
            "conversation_patterns": neural_insights["conversation_patterns"],
            "temporal_patterns": neural_insights["temporal_patterns"],
            "emotional_patterns": neural_insights["emotional_patterns"],
            "category_distribution": {},
            "memory_growth_rate": 0,
            "learning_velocity": 0,
            "neural_plasticity_score": neural_insights["avg_plasticity"],
            "connection_strength_score": neural_insights["avg_connection_strength"]
        }
        
        # Analyze category distribution
        for memory in user_memories:
            if memory.memory_metadata:
                metadata = json.loads(memory.memory_metadata)
                categories = metadata.get("categories", [])
                for category in categories:
                    if category not in pattern_insights["category_distribution"]:
                        pattern_insights["category_distribution"][category] = 0
                    pattern_insights["category_distribution"][category] += 1
        
        # Calculate memory growth rate (memories per day)
        if user_memories:
            oldest_memory = min(user_memories, key=lambda x: x.timestamp if x.timestamp else get_utc_now())
            newest_memory = max(user_memories, key=lambda x: x.timestamp if x.timestamp else get_utc_now())
            
            if oldest_memory.timestamp and newest_memory.timestamp:
                # Ensure both timestamps are timezone-aware
                old_ts = oldest_memory.timestamp
                new_ts = newest_memory.timestamp
                
                if old_ts.tzinfo is None:
                    old_ts = old_ts.replace(tzinfo=timezone.utc)
                if new_ts.tzinfo is None:
                    new_ts = new_ts.replace(tzinfo=timezone.utc)
                
                days_diff = (new_ts - old_ts).days
                if days_diff > 0:
                    pattern_insights["memory_growth_rate"] = len(user_memories) / days_diff
        
        # Calculate learning velocity (how quickly patterns are recognized)
        total_patterns = sum(neural_insights["conversation_patterns"].values())
        if total_patterns > 0:
            pattern_insights["learning_velocity"] = total_patterns / max(1, len(user_memories))
        
        return pattern_insights
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pattern insights: {str(e)}")

@router.get("/memory-analytics")
async def get_memory_analytics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get comprehensive memory analytics."""
    try:
        user_id = str(current_user.id)
        
        # Get all data sources
        neural_insights = neural_memory_system.get_memory_insights()
        storage_stats = efficient_storage.get_storage_stats()
        user_memories = memory_crud.get_user_memories(db, user_id=user_id, limit=1000)
        
        # Calculate comprehensive analytics
        analytics = {
            "overview": {
                "total_memories": len(user_memories),
                "total_connections": neural_insights["total_connections"],
                "avg_connection_strength": neural_insights["avg_connection_strength"],
                "avg_plasticity": neural_insights["avg_plasticity"]
            },
            "consolidation": neural_insights["memory_consolidation"],
            "storage_efficiency": {
                "compression_ratio": storage_stats["compression_ratio"],
                "storage_efficiency": storage_stats["storage_efficiency"],
                "cache_hit_rate": storage_stats["cache_hit_rate"],
                "hot_cache_size": storage_stats["hot_cache_size"],
                "cold_cache_size": storage_stats["cold_cache_size"]
            },
            "learning_metrics": {
                "conversation_patterns_learned": len(neural_insights["conversation_patterns"]),
                "temporal_patterns_learned": len(neural_insights["temporal_patterns"]),
                "emotional_patterns_learned": len(neural_insights["emotional_patterns"]),
                "total_patterns": sum(neural_insights["conversation_patterns"].values())
            },
            "performance": {
                "total_accesses": storage_stats["total_accesses"],
                "avg_access_per_memory": storage_stats["avg_access_per_memory"],
                "memory_retrieval_speed": "fast" if storage_stats["cache_hit_rate"] > 0.7 else "normal"
            }
        }
        
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get memory analytics: {str(e)}")

@router.post("/feedback")
async def submit_memory_feedback(
    memory_id: str,
    feedback_score: float,
    feedback_type: str = "relevance",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Submit feedback for a memory to improve learning."""
    try:
        user_id = str(current_user.id)
        
        # Validate feedback score
        if not 0.0 <= feedback_score <= 1.0:
            raise HTTPException(status_code=400, detail="Feedback score must be between 0.0 and 1.0")
        
        # Submit feedback to neural system
        neural_memory_system.learn_from_feedback(memory_id, feedback_score)
        
        return {"message": "Feedback submitted successfully", "memory_id": memory_id, "feedback_score": feedback_score}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")

@router.get("/live-activity")
async def get_live_activity(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get real-time memory system activity."""
    try:
        user_id = str(current_user.id)
        
        # Get recent memory activity
        recent_memories = memory_crud.get_user_memories(db, user_id=user_id, limit=10)
        logger.debug(f"Retrieved {len(recent_memories)} recent memories for user {user_id}")
        
        # Sync FAISS memories to neural system if neural system is empty
        if len(neural_memory_system.memories) == 0 and recent_memories:
            all_memories = memory_crud.get_user_memories(db, user_id=user_id, limit=100)
            logger.info(f"Syncing {len(all_memories)} memories to neural system for user {user_id}")
            for memory in all_memories:
                try:
                    # Extract metadata
                    metadata = json.loads(memory.memory_metadata) if memory.memory_metadata else {}
                    categories = metadata.get("categories", ["general"])
                    importance = metadata.get("importance", 0.5)
                    
                    # Add to neural system
                    neural_memory_system.add_memory(
                        memory_id=memory.faiss_id,
                        content=memory.content,
                        categories=categories,
                        importance=importance,
                        emotional_valence=metadata.get("emotional_valence", 0.0)
                    )
                except Exception as e:
                    logger.warning(f"Failed to sync memory {memory.faiss_id}: {e}")
        
        # Get current neural system state
        neural_insights = neural_memory_system.get_memory_insights()
        
        live_activity = {
            "timestamp": get_utc_now().isoformat(),
            "recent_activity": [],
            "system_status": {
                "neural_connections": neural_insights["total_connections"],
                "active_memories": len([m for m in recent_memories if is_recent_memory(m.timestamp, days=1)]),
                "learning_rate": len(neural_insights["conversation_patterns"]) / max(1, neural_insights["total_memories"])
            }
        }
        
        # Add recent memory activity
        for memory in recent_memories:
            if memory.timestamp:
                logger.debug(f"Processing memory {memory.faiss_id} with timestamp: {memory.timestamp}")
                activity = {
                    "memory_id": memory.faiss_id,
                    "content": memory.content[:100] + "..." if len(memory.content) > 100 else memory.content,
                    "timestamp": memory.timestamp.isoformat(),
                    "type": memory.content_type,
                    "activity_type": "created" if is_recent_memory(memory.timestamp, days=1) else "accessed"
                }
                live_activity["recent_activity"].append(activity)
        
        return live_activity
        
    except Exception as e:
        logger.error(f"Error in live-activity endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get live activity: {str(e)}")
