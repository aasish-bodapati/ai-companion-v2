"""
Enhanced Memory Service that integrates all the new memory capabilities.
Serves as the main interface for memory operations with full feature support.
"""

import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from app.memory.service import MemoryService
from app.models.memory import MemoryNode, MemoryRelationship, MemoryEvolution
from app.schemas.memory import (
    MemoryNodeCreate, MemoryNodeUpdate, MemoryNodeResponse,
    MemoryRelationshipCreate, MemoryEvolutionCreate,
    MemoryMetadata, PrivacyLevel
)
from app.services.memory_metadata import memory_metadata_service
from app.services.memory_relationships import memory_relationship_service
from app.services.memory_evolution import memory_evolution_service
from app.core.memory_types import memory_type_registry, MemoryType
from app.crud.memory import memory

logger = logging.getLogger(__name__)


class EnhancedMemoryService(MemoryService):
    """
    Enhanced memory service with full support for relationships, evolution, and metadata.
    Extends the base MemoryService with new capabilities.
    """
    
    def __init__(self):
        super().__init__()
        self.metadata_service = memory_metadata_service
        self.relationship_service = memory_relationship_service
        self.evolution_service = memory_evolution_service
        self.type_registry = memory_type_registry

    def store_enhanced_memory(
        self,
        db: Session,
        content: str,
        content_type: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Optional[str]:
        """
        Store memory with enhanced metadata, relationships, and analysis.
        
        Args:
            db: Database session
            content: Memory content
            content_type: Type of memory
            user_id: User ID
            conversation_id: Optional conversation ID
            metadata: Optional base metadata
            **kwargs: Additional parameters
            
        Returns:
            Memory ID if successful, None otherwise
        """
        try:
            # Enhance content with semantic analysis
            semantic_analysis = self.metadata_service.analyze_semantic_content(content, content_type)
            
            # Extract entities
            entities = self.metadata_service.extract_entities(content)
            
            # Enrich metadata
            enhanced_metadata = self.metadata_service.enrich_memory_metadata(
                content, content_type, metadata
            )
            
            # Get suggested categories from type registry
            suggested_categories = self.type_registry.suggest_categories(content, MemoryType(content_type))
            
            # Create memory with enhanced fields
            memory_data = MemoryNodeCreate(
                faiss_id=kwargs.get('faiss_id', ''),  # Will be set by storage layer
                content=content,
                content_type=content_type,
                user_id=user_id,
                conversation_id=conversation_id,
                category=semantic_analysis.categories[0] if semantic_analysis.categories else None,
                subcategory=semantic_analysis.subcategories[0] if semantic_analysis.subcategories else None,
                confidence_score=semantic_analysis.confidence_score,
                emotional_valence=semantic_analysis.emotional_valence,
                memory_metadata=enhanced_metadata,
                tags=semantic_analysis.tags,
                entities=entities.people + entities.places + entities.organizations,
                privacy_level=self.metadata_service.determine_privacy_level(content, entities),
                importance_score=self.grade_importance(content, content_type),
                created_via=kwargs.get('created_via', 'enhanced_store')
            )
            
            # Store the memory using base service
            memory_id = super().store_memory(
                db=db,
                content=content,
                content_type=content_type,
                user_id=user_id,
                conversation_id=conversation_id,
                metadata=enhanced_metadata.dict() if enhanced_metadata else None,
                **kwargs
            )
            
            if memory_id:
                # Find and create relationships
                self._create_automatic_relationships(db, memory_id, user_id)
                
                # Record creation in evolution history
                self._record_memory_creation(db, memory_id, content, enhanced_metadata)
                
                logger.info(f"Stored enhanced memory {memory_id} for user {user_id}")
            
            return memory_id
            
        except Exception as e:
            logger.error(f"Failed to store enhanced memory: {e}")
            return None

    def update_memory_with_evolution(
        self,
        db: Session,
        memory_id: str,
        user_id: str,
        updates: MemoryNodeUpdate
    ) -> Optional[MemoryNodeResponse]:
        """
        Update memory and track evolution.
        
        Args:
            db: Database session
            memory_id: Memory ID to update
            user_id: User ID
            updates: Update data
            
        Returns:
            Updated memory node or None
        """
        try:
            # Get current memory
            current_memory = memory.get_by_id(db, memory_id)
            if not current_memory or current_memory.user_id != user_id:
                return None
            
            # Store old state for evolution tracking
            old_content = current_memory.content
            old_metadata = json.loads(current_memory.memory_metadata) if current_memory.memory_metadata else {}
            
            # Apply updates
            update_data = updates.dict(exclude_unset=True)
            for field, value in update_data.items():
                if hasattr(current_memory, field):
                    setattr(current_memory, field, value)
            
            db.commit()
            db.refresh(current_memory)
            
            # Record evolution
            if old_content != current_memory.content:
                evolution_data = MemoryEvolutionCreate(
                    memory_id=memory_id,
                    evolution_type="correction",
                    old_content=old_content,
                    new_content=current_memory.content,
                    old_metadata=old_metadata,
                    new_metadata=json.loads(current_memory.memory_metadata) if current_memory.memory_metadata else {},
                    reason="Manual update",
                    confidence=0.9,
                    triggered_by="user"
                )
                self.evolution_service.record_evolution(db, evolution_data)
            
            return MemoryNodeResponse.from_orm(current_memory)
            
        except Exception as e:
            logger.error(f"Failed to update memory with evolution: {e}")
            return None

    def get_memory_with_relationships(
        self,
        db: Session,
        memory_id: str,
        user_id: str,
        include_evolution: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Get memory with its relationships and evolution history.
        
        Args:
            db: Database session
            memory_id: Memory ID
            user_id: User ID
            include_evolution: Whether to include evolution history
            
        Returns:
            Memory data with relationships or None
        """
        try:
            # Get base memory
            memory_node = memory.get_by_id(db, memory_id)
            if not memory_node or memory_node.user_id != user_id:
                return None
            
            # Get relationships
            relationships = self.relationship_service.get_memory_relationships(db, memory_id)
            
            # Get evolution history if requested
            evolution_history = []
            if include_evolution:
                evolution_history = self.evolution_service.get_memory_evolution_history(db, memory_id)
            
            # Build response
            result = {
                "memory": MemoryNodeResponse.from_orm(memory_node),
                "relationships": [
                    {
                        "id": rel.id,
                        "type": rel.relationship_type,
                        "target_memory_id": rel.target_memory_id if rel.source_memory_id == memory_id else rel.source_memory_id,
                        "strength": rel.strength,
                        "context": rel.context
                    }
                    for rel in relationships
                ],
                "evolution_history": [
                    {
                        "id": evo.id,
                        "type": evo.evolution_type,
                        "timestamp": evo.timestamp,
                        "reason": evo.reason,
                        "confidence": evo.confidence
                    }
                    for evo in evolution_history
                ]
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get memory with relationships: {e}")
            return None

    def run_memory_lifecycle_management(
        self,
        db: Session,
        user_id: str,
        include_consolidation: bool = True,
        include_forgetting: bool = True,
        include_reinforcement: bool = True
    ) -> Dict[str, Any]:
        """
        Run comprehensive memory lifecycle management.
        
        Args:
            db: Database session
            user_id: User ID
            include_consolidation: Whether to run consolidation
            include_forgetting: Whether to run forgetting evaluation
            include_reinforcement: Whether to run reinforcement
            
        Returns:
            Summary of lifecycle operations
        """
        results = {
            "consolidations": [],
            "forgetting": [],
            "reinforcements": [],
            "stats": {}
        }
        
        try:
            # Run consolidation
            if include_consolidation:
                consolidations = self.evolution_service.consolidate_memories(db, user_id, limit=5)
                results["consolidations"] = [
                    {
                        "memory_id": evo.memory_id,
                        "type": evo.evolution_type,
                        "reason": evo.reason
                    }
                    for evo in consolidations
                ]
            
            # Run forgetting evaluation
            if include_forgetting:
                forgotten = self.evolution_service.evaluate_forgetting(db, user_id, limit=10)
                results["forgetting"] = [
                    {
                        "memory_id": evo.memory_id,
                        "type": evo.evolution_type,
                        "reason": evo.reason
                    }
                    for evo in forgotten
                ]
            
            # Run reinforcement
            if include_reinforcement:
                reinforcements = self.evolution_service.reinforce_memories(db, user_id, limit=5)
                results["reinforcements"] = [
                    {
                        "memory_id": evo.memory_id,
                        "type": evo.evolution_type,
                        "reason": evo.reason
                    }
                    for evo in reinforcements
                ]
            
            # Get lifecycle stats
            results["stats"] = self.evolution_service.get_user_lifecycle_stats(db, user_id).dict()
            
            logger.info(f"Completed lifecycle management for user {user_id}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to run lifecycle management: {e}")
            return results

    def analyze_memory_patterns(
        self,
        db: Session,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze memory patterns and provide insights.
        
        Args:
            db: Database session
            user_id: User ID
            days: Number of days to analyze
            
        Returns:
            Memory pattern analysis
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Get recent memories
            memories = db.query(MemoryNode).filter(
                MemoryNode.user_id == user_id,
                MemoryNode.timestamp >= cutoff_date
            ).all()
            
            # Analyze patterns
            analysis = {
                "total_memories": len(memories),
                "memory_types": {},
                "categories": {},
                "emotional_patterns": {},
                "relationship_clusters": [],
                "insights": []
            }
            
            # Count by type and category
            for mem in memories:
                # Type distribution
                mem_type = mem.content_type
                analysis["memory_types"][mem_type] = analysis["memory_types"].get(mem_type, 0) + 1
                
                # Category distribution
                if mem.category:
                    analysis["categories"][mem.category] = analysis["categories"].get(mem.category, 0) + 1
                
                # Emotional patterns
                if mem.emotional_valence is not None:
                    valence_category = "positive" if mem.emotional_valence > 0.1 else "negative" if mem.emotional_valence < -0.1 else "neutral"
                    analysis["emotional_patterns"][valence_category] = analysis["emotional_patterns"].get(valence_category, 0) + 1
            
            # Find memory clusters
            clusters = self.relationship_service.find_memory_clusters(db, user_id)
            analysis["relationship_clusters"] = [
                {"size": len(cluster), "memory_ids": cluster}
                for cluster in clusters
            ]
            
            # Generate insights
            insights = []
            
            # Most common type
            if analysis["memory_types"]:
                most_common_type = max(analysis["memory_types"], key=analysis["memory_types"].get)
                insights.append(f"Your most common memory type is {most_common_type}")
            
            # Most common category
            if analysis["categories"]:
                most_common_category = max(analysis["categories"], key=analysis["categories"].get)
                insights.append(f"Your most common memory category is {most_common_category}")
            
            # Emotional tendency
            if analysis["emotional_patterns"]:
                dominant_emotion = max(analysis["emotional_patterns"], key=analysis["emotional_patterns"].get)
                insights.append(f"Your memories tend to be {dominant_emotion}")
            
            # Clustering insight
            if clusters:
                avg_cluster_size = sum(len(c) for c in clusters) / len(clusters)
                insights.append(f"You have {len(clusters)} memory clusters with average size {avg_cluster_size:.1f}")
            
            analysis["insights"] = insights
            
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze memory patterns: {e}")
            return {"error": str(e)}

    def suggest_memory_improvements(
        self,
        db: Session,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Suggest improvements for user's memories.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of suggestions
            
        Returns:
            List of improvement suggestions
        """
        try:
            # Get user memories
            memories = db.query(MemoryNode).filter(
                MemoryNode.user_id == user_id
            ).order_by(MemoryNode.timestamp.desc()).limit(50).all()
            
            suggestions = []
            
            for memory_node in memories:
                memory_suggestions = self.evolution_service.suggest_memory_improvements(db, memory_node)
                
                for suggestion in memory_suggestions:
                    suggestions.append({
                        "memory_id": memory_node.id,
                        "memory_content": memory_node.content[:100] + "..." if len(memory_node.content) > 100 else memory_node.content,
                        "suggestion_type": suggestion.evolution_type,
                        "reason": suggestion.reason,
                        "confidence": suggestion.confidence,
                        "suggested_content": suggestion.suggested_content,
                        "suggested_metadata": suggestion.suggested_metadata
                    })
                
                if len(suggestions) >= limit:
                    break
            
            # Sort by confidence
            suggestions.sort(key=lambda x: x["confidence"], reverse=True)
            
            return suggestions[:limit]
            
        except Exception as e:
            logger.error(f"Failed to suggest memory improvements: {e}")
            return []

    def _create_automatic_relationships(self, db: Session, memory_id: str, user_id: str):
        """Create automatic relationships for a new memory"""
        try:
            # Get the new memory
            memory_node = memory.get_by_id(db, memory_id)
            if not memory_node:
                return
            
            # Get recent memories for relationship analysis
            recent_memories = db.query(MemoryNode).filter(
                MemoryNode.user_id == user_id,
                MemoryNode.id != memory_id,
                MemoryNode.timestamp >= memory_node.timestamp - timedelta(days=7)
            ).limit(20).all()
            
            # Analyze relationships
            analysis = self.relationship_service.analyze_potential_relationships(
                db, memory_node, recent_memories
            )
            
            # Create top relationships
            for candidate in analysis.candidates[:3]:  # Top 3 relationships
                if candidate.confidence > 0.6:  # High confidence threshold
                    relationship_data = MemoryRelationshipCreate(
                        source_memory_id=candidate.source_memory_id,
                        target_memory_id=candidate.target_memory_id,
                        relationship_type=candidate.relationship_type,
                        strength=candidate.strength,
                        context=candidate.evidence,
                        created_by="system"
                    )
                    self.relationship_service.create_relationship(db, relationship_data)
            
        except Exception as e:
            logger.warning(f"Failed to create automatic relationships: {e}")

    def _record_memory_creation(
        self, 
        db: Session, 
        memory_id: str, 
        content: str, 
        metadata: Optional[MemoryMetadata]
    ):
        """Record memory creation in evolution history"""
        try:
            evolution_data = MemoryEvolutionCreate(
                memory_id=memory_id,
                evolution_type="creation",
                old_content=None,
                new_content=content,
                old_metadata=None,
                new_metadata=metadata.dict() if metadata else None,
                reason="Memory created",
                confidence=1.0,
                triggered_by="system"
            )
            self.evolution_service.record_evolution(db, evolution_data)
            
        except Exception as e:
            logger.warning(f"Failed to record memory creation: {e}")


# Global instance
enhanced_memory_service = EnhancedMemoryService()
