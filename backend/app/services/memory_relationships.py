"""
Memory relationship service for modeling connections between memories.
Handles relationship detection, creation, and analysis.
"""

import json
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from sqlalchemy.orm import Session

from app.models.memory import MemoryNode, MemoryRelationship
from app.core.memory_types import RelationshipType, MemoryType, memory_type_registry
from app.schemas.memory import MemoryRelationshipCreate, MemoryRelationshipResponse

logger = logging.getLogger(__name__)


@dataclass
class RelationshipCandidate:
    """Candidate relationship between two memories"""
    source_memory_id: str
    target_memory_id: str
    relationship_type: RelationshipType
    strength: float
    evidence: str
    confidence: float


@dataclass
class RelationshipAnalysis:
    """Analysis result for memory relationships"""
    candidates: List[RelationshipCandidate]
    semantic_similarity: float
    temporal_proximity: float
    contextual_overlap: float
    entity_overlap: float


class MemoryRelationshipService:
    """Service for managing memory relationships"""
    
    def __init__(self):
        self.similarity_threshold = 0.3
        self.temporal_window_days = 7
        self.max_relationships_per_memory = 10
        
        # Keywords for different relationship types
        self.relationship_indicators = {
            RelationshipType.CONTRADICTS: [
                "but", "however", "although", "despite", "contrary", "opposite",
                "actually", "instead", "rather", "not", "never", "wrong"
            ],
            RelationshipType.SUPPORTS: [
                "also", "furthermore", "additionally", "moreover", "similarly",
                "likewise", "agrees", "confirms", "validates", "proves"
            ],
            RelationshipType.ELABORATES: [
                "specifically", "for example", "in detail", "more precisely",
                "to clarify", "in other words", "meaning", "explains"
            ],
            RelationshipType.UPDATES: [
                "now", "currently", "updated", "changed", "revised", "modified",
                "latest", "recent", "new information", "correction"
            ],
            RelationshipType.CAUSES: [
                "because", "due to", "caused by", "results in", "leads to",
                "triggers", "brings about", "produces", "generates"
            ],
            RelationshipType.FOLLOWS: [
                "after", "then", "next", "following", "subsequently", "later",
                "eventually", "finally", "afterwards", "as a result"
            ]
        }

    def analyze_potential_relationships(
        self, 
        db: Session, 
        memory: MemoryNode, 
        candidate_memories: List[MemoryNode]
    ) -> RelationshipAnalysis:
        """
        Analyze potential relationships between a memory and candidates.
        
        Args:
            db: Database session
            memory: Source memory
            candidate_memories: List of potential related memories
            
        Returns:
            RelationshipAnalysis with detected relationships
        """
        candidates = []
        
        for candidate in candidate_memories:
            if candidate.id == memory.id:
                continue
                
            # Calculate various similarity metrics
            semantic_sim = self._calculate_semantic_similarity(memory, candidate)
            temporal_prox = self._calculate_temporal_proximity(memory, candidate)
            contextual_overlap = self._calculate_contextual_overlap(memory, candidate)
            entity_overlap = self._calculate_entity_overlap(memory, candidate)
            
            # Detect specific relationship types
            relationship_candidates = self._detect_relationship_types(memory, candidate)
            
            for rel_type, strength, evidence in relationship_candidates:
                # Calculate overall confidence
                confidence = self._calculate_relationship_confidence(
                    semantic_sim, temporal_prox, contextual_overlap, entity_overlap, strength
                )
                
                if confidence > self.similarity_threshold:
                    candidates.append(RelationshipCandidate(
                        source_memory_id=memory.id,
                        target_memory_id=candidate.id,
                        relationship_type=rel_type,
                        strength=strength,
                        evidence=evidence,
                        confidence=confidence
                    ))
        
        # Sort by confidence and limit results
        candidates.sort(key=lambda x: x.confidence, reverse=True)
        candidates = candidates[:self.max_relationships_per_memory]
        
        return RelationshipAnalysis(
            candidates=candidates,
            semantic_similarity=semantic_sim if candidate_memories else 0.0,
            temporal_proximity=temporal_prox if candidate_memories else 0.0,
            contextual_overlap=contextual_overlap if candidate_memories else 0.0,
            entity_overlap=entity_overlap if candidate_memories else 0.0
        )

    def create_relationship(
        self, 
        db: Session, 
        relationship_data: MemoryRelationshipCreate
    ) -> MemoryRelationship:
        """
        Create a new memory relationship.
        
        Args:
            db: Database session
            relationship_data: Relationship creation data
            
        Returns:
            Created MemoryRelationship
        """
        # Validate that both memories exist
        source_memory = db.query(MemoryNode).filter(MemoryNode.id == relationship_data.source_memory_id).first()
        target_memory = db.query(MemoryNode).filter(MemoryNode.id == relationship_data.target_memory_id).first()
        
        if not source_memory or not target_memory:
            raise ValueError("Source or target memory not found")
        
        # Check for existing relationship
        existing = db.query(MemoryRelationship).filter(
            MemoryRelationship.source_memory_id == relationship_data.source_memory_id,
            MemoryRelationship.target_memory_id == relationship_data.target_memory_id,
            MemoryRelationship.relationship_type == relationship_data.relationship_type
        ).first()
        
        if existing:
            # Update existing relationship
            existing.strength = relationship_data.strength
            existing.context = relationship_data.context
            existing.created_by = relationship_data.created_by
            db.commit()
            return existing
        
        # Create new relationship
        relationship = MemoryRelationship(
            source_memory_id=relationship_data.source_memory_id,
            target_memory_id=relationship_data.target_memory_id,
            relationship_type=relationship_data.relationship_type,
            strength=relationship_data.strength,
            context=relationship_data.context,
            created_by=relationship_data.created_by or "system"
        )
        
        db.add(relationship)
        db.commit()
        db.refresh(relationship)
        
        # Create reciprocal relationship if appropriate
        self._create_reciprocal_relationship(db, relationship)
        
        return relationship

    def get_memory_relationships(
        self, 
        db: Session, 
        memory_id: str, 
        include_incoming: bool = True,
        include_outgoing: bool = True
    ) -> List[MemoryRelationship]:
        """
        Get all relationships for a memory.
        
        Args:
            db: Database session
            memory_id: Memory ID
            include_incoming: Include relationships where this memory is the target
            include_outgoing: Include relationships where this memory is the source
            
        Returns:
            List of MemoryRelationship objects
        """
        query_conditions = []
        
        if include_outgoing:
            query_conditions.append(MemoryRelationship.source_memory_id == memory_id)
        
        if include_incoming:
            query_conditions.append(MemoryRelationship.target_memory_id == memory_id)
        
        if not query_conditions:
            return []
        
        query = db.query(MemoryRelationship)
        if len(query_conditions) == 1:
            query = query.filter(query_conditions[0])
        else:
            from sqlalchemy import or_
            query = query.filter(or_(*query_conditions))
        
        return query.all()

    def find_memory_clusters(self, db: Session, user_id: str) -> List[List[str]]:
        """
        Find clusters of related memories using graph analysis.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of memory ID clusters
        """
        # Get all user memories
        memories = db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all()
        memory_ids = [m.id for m in memories]
        
        # Get all relationships between user memories
        relationships = db.query(MemoryRelationship).filter(
            MemoryRelationship.source_memory_id.in_(memory_ids),
            MemoryRelationship.target_memory_id.in_(memory_ids)
        ).all()
        
        # Build adjacency graph
        graph = {memory_id: set() for memory_id in memory_ids}
        for rel in relationships:
            graph[rel.source_memory_id].add(rel.target_memory_id)
            graph[rel.target_memory_id].add(rel.source_memory_id)
        
        # Find connected components using DFS
        visited = set()
        clusters = []
        
        def dfs(node, cluster):
            if node in visited:
                return
            visited.add(node)
            cluster.append(node)
            for neighbor in graph[node]:
                dfs(neighbor, cluster)
        
        for memory_id in memory_ids:
            if memory_id not in visited:
                cluster = []
                dfs(memory_id, cluster)
                if len(cluster) > 1:  # Only include clusters with multiple memories
                    clusters.append(cluster)
        
        return clusters

    def suggest_new_relationships(
        self, 
        db: Session, 
        memory: MemoryNode, 
        limit: int = 5
    ) -> List[RelationshipCandidate]:
        """
        Suggest new relationships for a memory.
        
        Args:
            db: Database session
            memory: Source memory
            limit: Maximum number of suggestions
            
        Returns:
            List of RelationshipCandidate objects
        """
        # Get existing relationships to avoid duplicates
        existing_relationships = self.get_memory_relationships(db, memory.id)
        existing_targets = {
            rel.target_memory_id if rel.source_memory_id == memory.id 
            else rel.source_memory_id 
            for rel in existing_relationships
        }
        
        # Find candidate memories (same user, recent, similar categories)
        candidates_query = db.query(MemoryNode).filter(
            MemoryNode.user_id == memory.user_id,
            MemoryNode.id != memory.id,
            ~MemoryNode.id.in_(existing_targets)
        )
        
        # Filter by temporal proximity
        recent_date = memory.timestamp - timedelta(days=self.temporal_window_days * 2)
        candidates_query = candidates_query.filter(MemoryNode.timestamp >= recent_date)
        
        candidates = candidates_query.limit(50).all()  # Get more candidates for analysis
        
        # Analyze relationships
        analysis = self.analyze_potential_relationships(db, memory, candidates)
        
        return analysis.candidates[:limit]

    def _calculate_semantic_similarity(self, memory1: MemoryNode, memory2: MemoryNode) -> float:
        """Calculate semantic similarity between two memories"""
        content1 = memory1.content.lower()
        content2 = memory2.content.lower()
        
        # Simple word overlap similarity
        words1 = set(content1.split())
        words2 = set(content2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0

    def _calculate_temporal_proximity(self, memory1: MemoryNode, memory2: MemoryNode) -> float:
        """Calculate temporal proximity between two memories"""
        time_diff = abs((memory1.timestamp - memory2.timestamp).total_seconds())
        max_seconds = self.temporal_window_days * 24 * 3600
        
        if time_diff > max_seconds:
            return 0.0
        
        return 1.0 - (time_diff / max_seconds)

    def _calculate_contextual_overlap(self, memory1: MemoryNode, memory2: MemoryNode) -> float:
        """Calculate contextual overlap between two memories"""
        # Compare categories
        cat1 = memory1.category or ""
        cat2 = memory2.category or ""
        category_match = 1.0 if cat1 == cat2 and cat1 else 0.0
        
        # Compare content types
        type_match = 1.0 if memory1.content_type == memory2.content_type else 0.0
        
        # Compare conversation IDs
        conv_match = 1.0 if (memory1.conversation_id and memory1.conversation_id == memory2.conversation_id) else 0.0
        
        return (category_match + type_match + conv_match) / 3.0

    def _calculate_entity_overlap(self, memory1: MemoryNode, memory2: MemoryNode) -> float:
        """Calculate entity overlap between two memories"""
        try:
            entities1 = set()
            entities2 = set()
            
            if memory1.entities:
                entities1 = set(json.loads(memory1.entities))
            if memory2.entities:
                entities2 = set(json.loads(memory2.entities))
            
            if not entities1 or not entities2:
                return 0.0
            
            intersection = entities1.intersection(entities2)
            union = entities1.union(entities2)
            
            return len(intersection) / len(union) if union else 0.0
        except:
            return 0.0

    def _detect_relationship_types(
        self, 
        memory1: MemoryNode, 
        memory2: MemoryNode
    ) -> List[Tuple[RelationshipType, float, str]]:
        """Detect specific relationship types between memories"""
        relationships = []
        content1 = memory1.content.lower()
        content2 = memory2.content.lower()
        
        for rel_type, keywords in self.relationship_indicators.items():
            strength = 0.0
            evidence_keywords = []
            
            for keyword in keywords:
                if keyword in content1 or keyword in content2:
                    strength += 0.1
                    evidence_keywords.append(keyword)
            
            if strength > 0:
                evidence = f"Keywords: {', '.join(evidence_keywords)}"
                relationships.append((rel_type, min(1.0, strength), evidence))
        
        # Special case: temporal relationships
        if memory1.timestamp and memory2.timestamp:
            time_diff = (memory2.timestamp - memory1.timestamp).total_seconds()
            if 0 < time_diff < 3600:  # Within an hour
                relationships.append((
                    RelationshipType.FOLLOWS, 
                    0.8, 
                    f"Temporal sequence: {time_diff/60:.0f} minutes apart"
                ))
        
        # Special case: same conversation
        if (memory1.conversation_id and 
            memory1.conversation_id == memory2.conversation_id):
            relationships.append((
                RelationshipType.RELATED_TO, 
                0.9, 
                "Same conversation context"
            ))
        
        return relationships

    def _calculate_relationship_confidence(
        self, 
        semantic_sim: float, 
        temporal_prox: float, 
        contextual_overlap: float, 
        entity_overlap: float, 
        relationship_strength: float
    ) -> float:
        """Calculate overall confidence for a relationship"""
        # Weighted combination of factors
        weights = {
            'semantic': 0.3,
            'temporal': 0.2,
            'contextual': 0.2,
            'entity': 0.1,
            'relationship': 0.2
        }
        
        confidence = (
            semantic_sim * weights['semantic'] +
            temporal_prox * weights['temporal'] +
            contextual_overlap * weights['contextual'] +
            entity_overlap * weights['entity'] +
            relationship_strength * weights['relationship']
        )
        
        return min(1.0, confidence)

    def _create_reciprocal_relationship(self, db: Session, relationship: MemoryRelationship):
        """Create reciprocal relationship if appropriate"""
        reciprocal_types = {
            RelationshipType.FOLLOWS: RelationshipType.PRECEDES,
            RelationshipType.PRECEDES: RelationshipType.FOLLOWS,
            RelationshipType.CAUSES: RelationshipType.CAUSED_BY,
            RelationshipType.CAUSED_BY: RelationshipType.CAUSES,
            RelationshipType.PARENT_OF: RelationshipType.CHILD_OF,
            RelationshipType.CHILD_OF: RelationshipType.PARENT_OF,
            RelationshipType.SIMILAR_TO: RelationshipType.SIMILAR_TO,
            RelationshipType.RELATED_TO: RelationshipType.RELATED_TO
        }
        
        reciprocal_type = reciprocal_types.get(relationship.relationship_type)
        if not reciprocal_type:
            return
        
        # Check if reciprocal already exists
        existing = db.query(MemoryRelationship).filter(
            MemoryRelationship.source_memory_id == relationship.target_memory_id,
            MemoryRelationship.target_memory_id == relationship.source_memory_id,
            MemoryRelationship.relationship_type == reciprocal_type
        ).first()
        
        if existing:
            return
        
        # Create reciprocal relationship
        reciprocal = MemoryRelationship(
            source_memory_id=relationship.target_memory_id,
            target_memory_id=relationship.source_memory_id,
            relationship_type=reciprocal_type,
            strength=relationship.strength,
            context=f"Reciprocal of: {relationship.context or 'system generated'}",
            created_by="system"
        )
        
        db.add(reciprocal)
        db.commit()


# Global service instance
memory_relationship_service = MemoryRelationshipService()
