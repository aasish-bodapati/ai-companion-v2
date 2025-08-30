"""
Memory evolution service for tracking how memories change and evolve over time.
Handles consolidation, forgetting, reinforcement, and other evolution processes.
"""

import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.memory import MemoryNode, MemoryEvolution, MemoryRelationship
from app.core.memory_types import EvolutionType, RelationshipType
from app.schemas.memory import MemoryEvolutionCreate, MemoryMetadata
from app.services.memory_metadata import memory_metadata_service
from app.services.memory_relationships import memory_relationship_service

logger = logging.getLogger(__name__)


@dataclass
class ConsolidationCandidate:
    """Candidate memories for consolidation"""
    memories: List[MemoryNode]
    similarity_score: float
    consolidation_type: str  # "merge", "summarize", "hierarchy"
    reason: str


@dataclass
class EvolutionSuggestion:
    """Suggestion for memory evolution"""
    memory_id: str
    evolution_type: EvolutionType
    suggested_content: Optional[str]
    suggested_metadata: Optional[Dict[str, Any]]
    confidence: float
    reason: str


@dataclass
class MemoryLifecycleStats:
    """Statistics about memory lifecycle"""
    total_memories: int
    evolved_memories: int
    consolidated_memories: int
    forgotten_memories: int
    reinforced_memories: int
    evolution_rate: float


class MemoryEvolutionService:
    """Service for managing memory evolution and lifecycle"""
    
    def __init__(self):
        self.consolidation_threshold = 0.7
        self.forgetting_threshold = 0.1
        self.reinforcement_threshold = 0.8
        self.max_consolidation_candidates = 5
        self.evolution_batch_size = 10
        
        # Time windows for different evolution processes
        self.consolidation_window_days = 7
        self.forgetting_evaluation_days = 30
        self.reinforcement_window_days = 1

    def record_evolution(
        self, 
        db: Session, 
        evolution_data: MemoryEvolutionCreate
    ) -> MemoryEvolution:
        """
        Record a memory evolution event.
        
        Args:
            db: Database session
            evolution_data: Evolution event data
            
        Returns:
            Created MemoryEvolution record
        """
        # Validate memory exists
        memory = db.query(MemoryNode).filter(MemoryNode.id == evolution_data.memory_id).first()
        if not memory:
            raise ValueError(f"Memory {evolution_data.memory_id} not found")
        
        # Create evolution record
        evolution = MemoryEvolution(
            memory_id=evolution_data.memory_id,
            evolution_type=evolution_data.evolution_type,
            old_content=evolution_data.old_content,
            new_content=evolution_data.new_content,
            old_metadata=json.dumps(evolution_data.old_metadata) if evolution_data.old_metadata else None,
            new_metadata=json.dumps(evolution_data.new_metadata) if evolution_data.new_metadata else None,
            reason=evolution_data.reason,
            confidence=evolution_data.confidence,
            triggered_by=evolution_data.triggered_by or "system"
        )
        
        db.add(evolution)
        db.commit()
        db.refresh(evolution)
        
        logger.info(f"Recorded evolution for memory {evolution_data.memory_id}: {evolution_data.evolution_type}")
        return evolution

    def consolidate_memories(
        self, 
        db: Session, 
        user_id: str, 
        limit: int = None
    ) -> List[MemoryEvolution]:
        """
        Consolidate similar memories for a user.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of consolidations to perform
            
        Returns:
            List of evolution records for consolidations
        """
        # Find consolidation candidates
        candidates = self.find_consolidation_candidates(db, user_id)
        
        if limit:
            candidates = candidates[:limit]
        
        evolutions = []
        
        for candidate in candidates:
            try:
                evolution = self._perform_consolidation(db, candidate)
                if evolution:
                    evolutions.append(evolution)
            except Exception as e:
                logger.error(f"Failed to consolidate memories: {e}")
                continue
        
        return evolutions

    def find_consolidation_candidates(
        self, 
        db: Session, 
        user_id: str
    ) -> List[ConsolidationCandidate]:
        """
        Find memories that are candidates for consolidation.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of ConsolidationCandidate objects
        """
        # Get recent memories for analysis
        recent_date = datetime.utcnow() - timedelta(days=self.consolidation_window_days)
        memories = db.query(MemoryNode).filter(
            MemoryNode.user_id == user_id,
            MemoryNode.timestamp >= recent_date
        ).all()
        
        candidates = []
        processed_memory_ids = set()
        
        for memory in memories:
            if memory.id in processed_memory_ids:
                continue
            
            # Find similar memories
            similar_memories = self._find_similar_memories(db, memory, memories)
            
            if len(similar_memories) >= 2:  # Need at least 2 memories to consolidate
                similarity_score = self._calculate_consolidation_score(similar_memories)
                
                if similarity_score >= self.consolidation_threshold:
                    consolidation_type = self._determine_consolidation_type(similar_memories)
                    reason = self._generate_consolidation_reason(similar_memories, similarity_score)
                    
                    candidates.append(ConsolidationCandidate(
                        memories=similar_memories,
                        similarity_score=similarity_score,
                        consolidation_type=consolidation_type,
                        reason=reason
                    ))
                    
                    # Mark these memories as processed
                    for mem in similar_memories:
                        processed_memory_ids.add(mem.id)
        
        # Sort by similarity score
        candidates.sort(key=lambda x: x.similarity_score, reverse=True)
        return candidates[:self.max_consolidation_candidates]

    def evaluate_forgetting(
        self, 
        db: Session, 
        user_id: str, 
        limit: int = None
    ) -> List[MemoryEvolution]:
        """
        Evaluate memories for potential forgetting based on usage and relevance.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of forgetting operations
            
        Returns:
            List of evolution records for forgetting
        """
        # Get old, unused memories
        cutoff_date = datetime.utcnow() - timedelta(days=self.forgetting_evaluation_days)
        
        forgotten_candidates = db.query(MemoryNode).filter(
            MemoryNode.user_id == user_id,
            MemoryNode.timestamp < cutoff_date,
            or_(
                MemoryNode.access_count == 0,
                MemoryNode.last_accessed.is_(None),
                MemoryNode.last_accessed < cutoff_date
            ),
            MemoryNode.relevance_score < self.forgetting_threshold
        ).limit(limit or self.evolution_batch_size).all()
        
        evolutions = []
        
        for memory in forgotten_candidates:
            try:
                # Check if memory has important relationships
                relationships = memory_relationship_service.get_memory_relationships(db, memory.id)
                important_relationships = [
                    r for r in relationships 
                    if r.relationship_type in [RelationshipType.SUPPORTS, RelationshipType.CAUSES, RelationshipType.ENABLES]
                    and r.strength > 0.7
                ]
                
                if important_relationships:
                    # Archive instead of forget
                    evolution = self._archive_memory(db, memory, "Has important relationships")
                else:
                    # Soft forget
                    evolution = self._forget_memory(db, memory, "Low usage and relevance")
                
                if evolution:
                    evolutions.append(evolution)
                    
            except Exception as e:
                logger.error(f"Failed to evaluate forgetting for memory {memory.id}: {e}")
                continue
        
        return evolutions

    def reinforce_memories(
        self, 
        db: Session, 
        user_id: str, 
        limit: int = None
    ) -> List[MemoryEvolution]:
        """
        Reinforce frequently accessed and important memories.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of reinforcements
            
        Returns:
            List of evolution records for reinforcements
        """
        recent_date = datetime.utcnow() - timedelta(days=self.reinforcement_window_days)
        
        # Find frequently accessed memories
        reinforcement_candidates = db.query(MemoryNode).filter(
            MemoryNode.user_id == user_id,
            MemoryNode.last_accessed >= recent_date,
            MemoryNode.access_count >= 3,
            MemoryNode.importance_score >= 70
        ).limit(limit or self.evolution_batch_size).all()
        
        evolutions = []
        
        for memory in reinforcement_candidates:
            try:
                evolution = self._reinforce_memory(db, memory)
                if evolution:
                    evolutions.append(evolution)
            except Exception as e:
                logger.error(f"Failed to reinforce memory {memory.id}: {e}")
                continue
        
        return evolutions

    def suggest_memory_improvements(
        self, 
        db: Session, 
        memory: MemoryNode
    ) -> List[EvolutionSuggestion]:
        """
        Suggest improvements for a memory.
        
        Args:
            db: Database session
            memory: Memory to analyze
            
        Returns:
            List of EvolutionSuggestion objects
        """
        suggestions = []
        
        # Analyze current memory state
        metadata = memory_metadata_service.validate_metadata(
            json.loads(memory.memory_metadata) if memory.memory_metadata else None
        )
        
        # Suggest metadata enhancements
        if not memory.category:
            suggestions.append(EvolutionSuggestion(
                memory_id=memory.id,
                evolution_type=EvolutionType.CATEGORIZATION,
                suggested_content=None,
                suggested_metadata={"category": "suggested_category"},
                confidence=0.7,
                reason="Memory lacks categorization"
            ))
        
        # Suggest content enhancement
        if len(memory.content) < 50:
            suggestions.append(EvolutionSuggestion(
                memory_id=memory.id,
                evolution_type=EvolutionType.ENHANCEMENT,
                suggested_content=f"{memory.content} [Enhanced with context]",
                suggested_metadata=None,
                confidence=0.6,
                reason="Content could be more detailed"
            ))
        
        # Suggest relationship creation
        potential_relationships = memory_relationship_service.suggest_new_relationships(db, memory, limit=3)
        if potential_relationships:
            suggestions.append(EvolutionSuggestion(
                memory_id=memory.id,
                evolution_type=EvolutionType.RECONTEXTUALIZATION,
                suggested_content=None,
                suggested_metadata={"suggested_relationships": len(potential_relationships)},
                confidence=0.8,
                reason=f"Found {len(potential_relationships)} potential relationships"
            ))
        
        return suggestions

    def get_memory_evolution_history(
        self, 
        db: Session, 
        memory_id: str
    ) -> List[MemoryEvolution]:
        """
        Get evolution history for a memory.
        
        Args:
            db: Database session
            memory_id: Memory ID
            
        Returns:
            List of MemoryEvolution records
        """
        return db.query(MemoryEvolution).filter(
            MemoryEvolution.memory_id == memory_id
        ).order_by(MemoryEvolution.timestamp.desc()).all()

    def get_user_lifecycle_stats(
        self, 
        db: Session, 
        user_id: str, 
        days: int = 30
    ) -> MemoryLifecycleStats:
        """
        Get lifecycle statistics for a user's memories.
        
        Args:
            db: Database session
            user_id: User ID
            days: Number of days to analyze
            
        Returns:
            MemoryLifecycleStats object
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get total memories
        total_memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).count()
        
        # Get evolution statistics
        memory_ids = db.query(MemoryNode.id).filter(MemoryNode.user_id == user_id).subquery()
        
        evolutions = db.query(MemoryEvolution).filter(
            MemoryEvolution.memory_id.in_(memory_ids),
            MemoryEvolution.timestamp >= cutoff_date
        ).all()
        
        evolution_counts = {}
        for evolution in evolutions:
            evolution_counts[evolution.evolution_type] = evolution_counts.get(evolution.evolution_type, 0) + 1
        
        evolved_memories = len(set(e.memory_id for e in evolutions))
        evolution_rate = evolved_memories / max(1, total_memories)
        
        return MemoryLifecycleStats(
            total_memories=total_memories,
            evolved_memories=evolved_memories,
            consolidated_memories=evolution_counts.get(EvolutionType.CONSOLIDATION, 0),
            forgotten_memories=evolution_counts.get(EvolutionType.FORGETTING, 0),
            reinforced_memories=evolution_counts.get(EvolutionType.REINFORCEMENT, 0),
            evolution_rate=evolution_rate
        )

    def _find_similar_memories(
        self, 
        db: Session, 
        target_memory: MemoryNode, 
        candidate_memories: List[MemoryNode]
    ) -> List[MemoryNode]:
        """Find memories similar to the target memory"""
        similar = []
        
        for candidate in candidate_memories:
            if candidate.id == target_memory.id:
                continue
            
            # Calculate similarity
            similarity = memory_relationship_service._calculate_semantic_similarity(target_memory, candidate)
            
            # Additional similarity factors
            if target_memory.category and target_memory.category == candidate.category:
                similarity += 0.2
            
            if target_memory.content_type == candidate.content_type:
                similarity += 0.1
            
            if similarity >= self.consolidation_threshold:
                similar.append(candidate)
        
        return similar

    def _calculate_consolidation_score(self, memories: List[MemoryNode]) -> float:
        """Calculate overall consolidation score for a group of memories"""
        if len(memories) < 2:
            return 0.0
        
        total_similarity = 0.0
        comparisons = 0
        
        for i in range(len(memories)):
            for j in range(i + 1, len(memories)):
                similarity = memory_relationship_service._calculate_semantic_similarity(memories[i], memories[j])
                total_similarity += similarity
                comparisons += 1
        
        return total_similarity / comparisons if comparisons > 0 else 0.0

    def _determine_consolidation_type(self, memories: List[MemoryNode]) -> str:
        """Determine the best consolidation approach"""
        if len(memories) <= 3:
            return "merge"
        elif len(memories) <= 6:
            return "summarize"
        else:
            return "hierarchy"

    def _generate_consolidation_reason(self, memories: List[MemoryNode], score: float) -> str:
        """Generate reason for consolidation"""
        return f"Found {len(memories)} similar memories (similarity: {score:.2f})"

    def _perform_consolidation(self, db: Session, candidate: ConsolidationCandidate) -> Optional[MemoryEvolution]:
        """Perform the actual consolidation"""
        if candidate.consolidation_type == "merge":
            return self._merge_memories(db, candidate.memories, candidate.reason)
        elif candidate.consolidation_type == "summarize":
            return self._summarize_memories(db, candidate.memories, candidate.reason)
        elif candidate.consolidation_type == "hierarchy":
            return self._create_memory_hierarchy(db, candidate.memories, candidate.reason)
        
        return None

    def _merge_memories(self, db: Session, memories: List[MemoryNode], reason: str) -> MemoryEvolution:
        """Merge multiple memories into one"""
        primary_memory = memories[0]  # Use first memory as primary
        
        # Combine content
        combined_content = primary_memory.content
        for memory in memories[1:]:
            combined_content += f"\n\n{memory.content}"
        
        # Store old content
        old_content = primary_memory.content
        
        # Update primary memory
        primary_memory.content = combined_content
        primary_memory.relevance_score = max(m.relevance_score for m in memories)
        primary_memory.importance_score = max(m.importance_score for m in memories)
        
        # Record evolution
        evolution = MemoryEvolution(
            memory_id=primary_memory.id,
            evolution_type=EvolutionType.MERGE,
            old_content=old_content,
            new_content=combined_content,
            reason=f"Merged with {len(memories)-1} similar memories: {reason}",
            confidence=0.8,
            triggered_by="consolidation"
        )
        
        db.add(evolution)
        
        # Mark other memories as forgotten
        for memory in memories[1:]:
            memory.relevance_score = 0.0
            forgotten_evolution = MemoryEvolution(
                memory_id=memory.id,
                evolution_type=EvolutionType.FORGETTING,
                old_content=memory.content,
                new_content=None,
                reason=f"Merged into memory {primary_memory.id}",
                confidence=0.9,
                triggered_by="consolidation"
            )
            db.add(forgotten_evolution)
        
        db.commit()
        return evolution

    def _summarize_memories(self, db: Session, memories: List[MemoryNode], reason: str) -> MemoryEvolution:
        """Create a summary of multiple memories"""
        # Create summary content (simplified - in practice, would use LLM)
        summary_content = f"Summary of {len(memories)} related memories:\n"
        for i, memory in enumerate(memories, 1):
            summary_content += f"{i}. {memory.content[:100]}...\n"
        
        # Create new summary memory
        primary_memory = memories[0]
        summary_memory = MemoryNode(
            content=summary_content,
            content_type="summary",
            user_id=primary_memory.user_id,
            category=primary_memory.category,
            relevance_score=max(m.relevance_score for m in memories),
            importance_score=max(m.importance_score for m in memories),
            created_via="consolidation"
        )
        
        db.add(summary_memory)
        db.flush()  # Get ID
        
        # Record evolution
        evolution = MemoryEvolution(
            memory_id=summary_memory.id,
            evolution_type=EvolutionType.CONSOLIDATION,
            old_content=None,
            new_content=summary_content,
            reason=f"Summarized {len(memories)} memories: {reason}",
            confidence=0.7,
            triggered_by="consolidation"
        )
        
        db.add(evolution)
        db.commit()
        return evolution

    def _create_memory_hierarchy(self, db: Session, memories: List[MemoryNode], reason: str) -> MemoryEvolution:
        """Create hierarchical relationship between memories"""
        # Use most important memory as parent
        parent_memory = max(memories, key=lambda m: m.importance_score)
        child_memories = [m for m in memories if m.id != parent_memory.id]
        
        # Create parent-child relationships
        for child in child_memories:
            child.parent_memory_id = parent_memory.id
        
        # Record evolution
        evolution = MemoryEvolution(
            memory_id=parent_memory.id,
            evolution_type=EvolutionType.CONSOLIDATION,
            old_content=None,
            new_content=None,
            reason=f"Created hierarchy with {len(child_memories)} child memories: {reason}",
            confidence=0.6,
            triggered_by="consolidation"
        )
        
        db.add(evolution)
        db.commit()
        return evolution

    def _forget_memory(self, db: Session, memory: MemoryNode, reason: str) -> MemoryEvolution:
        """Mark memory as forgotten"""
        old_relevance = memory.relevance_score
        memory.relevance_score = 0.0
        
        evolution = MemoryEvolution(
            memory_id=memory.id,
            evolution_type=EvolutionType.FORGETTING,
            old_content=memory.content,
            new_content=None,
            reason=reason,
            confidence=0.9,
            triggered_by="lifecycle_management"
        )
        
        db.add(evolution)
        db.commit()
        return evolution

    def _archive_memory(self, db: Session, memory: MemoryNode, reason: str) -> MemoryEvolution:
        """Archive memory instead of forgetting"""
        memory.relevance_score = max(0.1, memory.relevance_score * 0.5)
        
        evolution = MemoryEvolution(
            memory_id=memory.id,
            evolution_type=EvolutionType.ARCHIVAL,
            old_content=None,
            new_content=None,
            reason=reason,
            confidence=0.8,
            triggered_by="lifecycle_management"
        )
        
        db.add(evolution)
        db.commit()
        return evolution

    def _reinforce_memory(self, db: Session, memory: MemoryNode) -> MemoryEvolution:
        """Reinforce frequently accessed memory"""
        old_relevance = memory.relevance_score
        memory.relevance_score = min(1.0, memory.relevance_score * 1.1)
        memory.importance_score = min(100, memory.importance_score + 5)
        
        evolution = MemoryEvolution(
            memory_id=memory.id,
            evolution_type=EvolutionType.REINFORCEMENT,
            old_content=None,
            new_content=None,
            reason=f"Frequent access (count: {memory.access_count})",
            confidence=0.9,
            triggered_by="usage_pattern"
        )
        
        db.add(evolution)
        db.commit()
        return evolution


# Global service instance
memory_evolution_service = MemoryEvolutionService()
