"""
Neural Memory System - Mimics brain-like evolution and learning.
"""

import time
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from collections import defaultdict, deque
import math
import random

logger = logging.getLogger(__name__)

def get_utc_now():
    """Get current UTC datetime without timezone info (timezone-naive)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

@dataclass
class NeuralConnection:
    """Represents a synaptic connection between memories."""
    source_memory_id: str
    target_memory_id: str
    strength: float  # 0.0 to 1.0
    activation_count: int
    last_activated: datetime
    connection_type: str  # 'semantic', 'temporal', 'emotional', 'contextual'
    weight_decay: float = 0.95  # How quickly connection weakens
    
    def strengthen(self, amount: float = 0.1):
        """Strengthen the connection (like synaptic strengthening)."""
        self.strength = min(1.0, self.strength + amount)
        self.activation_count += 1
        self.last_activated = get_utc_now()
    
    def weaken(self, amount: float = 0.05):
        """Weaken the connection (like synaptic pruning)."""
        self.strength = max(0.0, self.strength - amount)
    
    def decay(self):
        """Apply natural decay over time."""
        time_diff = get_utc_now() - self.last_activated
        days = time_diff.days
        if days > 0:
            decay_factor = self.weight_decay ** days
            self.strength *= decay_factor

@dataclass
class NeuralMemory:
    """Represents a memory with neural properties."""
    memory_id: str
    content: str
    categories: List[str]
    importance: float
    activation_count: int
    last_activated: datetime
    creation_time: datetime
    neural_plasticity: float  # How easily this memory can form new connections
    consolidation_level: float  # 0.0 (short-term) to 1.0 (long-term)
    emotional_valence: float  # -1.0 (negative) to 1.0 (positive)
    context_richness: float  # How rich the context is
    
    def activate(self):
        """Activate this memory (like neuron firing)."""
        self.activation_count += 1
        self.last_activated = get_utc_now()
        # Strengthen the memory through use
        self.consolidation_level = min(1.0, self.consolidation_level + 0.01)
    
    def can_form_connections(self) -> bool:
        """Check if memory can form new connections."""
        return self.neural_plasticity > 0.3 and self.consolidation_level > 0.2

class NeuralMemorySystem:
    """
    A brain-like memory system that evolves and learns over time.
    """
    
    def __init__(self):
        self.memories: Dict[str, NeuralMemory] = {}
        self.connections: Dict[str, NeuralConnection] = {}
        self.memory_graph: Dict[str, List[str]] = defaultdict(list)  # Adjacency list
        self.patterns: Dict[str, Any] = {}
        self.learning_rate: float = 0.1
        self.consolidation_threshold: float = 0.7
        
        # Neural plasticity parameters
        self.plasticity_decay: float = 0.98
        self.connection_threshold: float = 0.3
        self.max_connections_per_memory: int = 10
        
        # Pattern recognition
        self.conversation_patterns: Dict[str, int] = defaultdict(int)
        self.temporal_patterns: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.emotional_patterns: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        
        # Learning feedback
        self.response_effectiveness: Dict[str, float] = defaultdict(lambda: 0.5)
        self.user_satisfaction: Dict[str, float] = defaultdict(lambda: 0.5)
    
    def add_memory(self, memory_id: str, content: str, categories: List[str], 
                   importance: float, emotional_valence: float = 0.0) -> NeuralMemory:
        """Add a new memory to the neural system."""
        neural_memory = NeuralMemory(
            memory_id=memory_id,
            content=content,
            categories=categories,
            importance=importance,
            activation_count=0,
            last_activated=get_utc_now(),
            creation_time=get_utc_now(),
            neural_plasticity=1.0,  # New memories are highly plastic
            consolidation_level=0.1,  # Start as short-term memory
            emotional_valence=emotional_valence,
            context_richness=self._calculate_context_richness(content, categories)
        )
        
        self.memories[memory_id] = neural_memory
        self._form_initial_connections(memory_id)
        return neural_memory
    
    def _calculate_context_richness(self, content: str, categories: List[str]) -> float:
        """Calculate how rich the context of a memory is."""
        richness = 0.0
        
        # Content length factor
        richness += min(1.0, len(content) / 100.0) * 0.3
        
        # Category diversity factor
        richness += min(1.0, len(categories) / 5.0) * 0.3
        
        # Emotional content factor
        emotional_words = ['love', 'hate', 'excited', 'worried', 'happy', 'sad', 'angry']
        emotional_count = sum(1 for word in emotional_words if word.lower() in content.lower())
        richness += min(1.0, emotional_count / 3.0) * 0.4
        
        return richness
    
    def _form_initial_connections(self, memory_id: str):
        """Form initial connections with similar memories."""
        new_memory = self.memories[memory_id]
        
        for existing_id, existing_memory in self.memories.items():
            if existing_id == memory_id:
                continue
            
            # Calculate similarity score
            similarity = self._calculate_memory_similarity(new_memory, existing_memory)
            
            if similarity > self.connection_threshold:
                # Form bidirectional connection
                connection_id = f"{memory_id}_to_{existing_id}"
                connection = NeuralConnection(
                    source_memory_id=memory_id,
                    target_memory_id=existing_id,
                    strength=similarity,
                    activation_count=0,
                    last_activated=get_utc_now(),
                    connection_type='semantic'
                )
                
                self.connections[connection_id] = connection
                self.memory_graph[memory_id].append(existing_id)
                self.memory_graph[existing_id].append(memory_id)
    
    def _calculate_memory_similarity(self, mem1: NeuralMemory, mem2: NeuralMemory) -> float:
        """Calculate similarity between two memories."""
        # Category overlap
        category_overlap = len(set(mem1.categories) & set(mem2.categories))
        category_similarity = category_overlap / max(len(mem1.categories), len(mem2.categories))
        
        # Content similarity (simple word overlap for now)
        words1 = set(mem1.content.lower().split())
        words2 = set(mem2.content.lower().split())
        if words1 and words2:
            content_similarity = len(words1 & words2) / len(words1 | words2)
        else:
            content_similarity = 0.0
        
        # Emotional similarity
        emotional_similarity = 1.0 - abs(mem1.emotional_valence - mem2.emotional_valence) / 2.0
        
        # Weighted combination
        similarity = (category_similarity * 0.4 + 
                     content_similarity * 0.4 + 
                     emotional_similarity * 0.2)
        
        return similarity
    
    def activate_memory_network(self, query: str, user_id: str, 
                               conversation_context: Dict[str, Any]) -> List[NeuralMemory]:
        """Activate a network of related memories (like brain activation)."""
        # Find the most relevant memories
        relevant_memories = self._find_relevant_memories(query, conversation_context)
        
        # Activate the primary memories
        for memory in relevant_memories:
            memory.activate()
        
        # Activate connected memories (spreading activation)
        activated_network = self._spread_activation(relevant_memories)
        
        # Learn from this activation pattern
        self._learn_from_activation(query, activated_network, conversation_context)
        
        # Update neural plasticity based on usage
        self._update_neural_plasticity(activated_network)
        
        return activated_network
    
    def _find_relevant_memories(self, query: str, context: Dict[str, Any]) -> List[NeuralMemory]:
        """Find memories relevant to the current query and context."""
        # Simple relevance scoring for now
        scored_memories = []
        
        for memory in self.memories.values():
            score = 0.0
            
            # Content relevance
            query_words = set(query.lower().split())
            memory_words = set(memory.content.lower().split())
            if memory_words:
                word_overlap = len(query_words & memory_words) / len(query_words | memory_words)
                score += word_overlap * 0.4
            
            # Category relevance
            if context.get('categories'):
                category_overlap = len(set(memory.categories) & set(context['categories']))
                score += category_overlap * 0.3
            
            # Recency and importance
            time_factor = 1.0 / (1.0 + (get_utc_now() - memory.last_activated).days)
            score += time_factor * 0.2
            score += memory.importance * 0.1
            
            if score > 0.1:  # Threshold for relevance
                scored_memories.append((memory, score))
        
        # Sort by relevance and return top memories
        scored_memories.sort(key=lambda x: x[1], reverse=True)
        return [memory for memory, score in scored_memories[:10]]
    
    def _spread_activation(self, primary_memories: List[NeuralMemory]) -> List[NeuralMemory]:
        """Spread activation to connected memories (like neural network activation)."""
        activated = set()
        activation_queue = deque(primary_memories)
        
        while activation_queue:
            memory = activation_queue.popleft()
            if memory.memory_id in activated:
                continue
            
            activated.add(memory.memory_id)
            
            # Find connected memories
            for connected_id in self.memory_graph.get(memory.memory_id, []):
                if connected_id in self.memories:
                    connected_memory = self.memories[connected_id]
                    
                    # Calculate activation strength
                    connection_id = f"{memory.memory_id}_to_{connected_id}"
                    connection = self.connections.get(connection_id)
                    
                    if connection and connection.strength > 0.3:
                        # Activate connected memory with reduced strength
                        connected_memory.activate()
                        activated.add(connected_id)
                        
                        # Continue spreading if activation is strong enough
                        if connection.strength > 0.6:
                            activation_queue.append(connected_memory)
        
        return [self.memories[mem_id] for mem_id in activated if mem_id in self.memories]
    
    def _learn_from_activation(self, query: str, activated_memories: List[NeuralMemory], 
                              context: Dict[str, Any]):
        """Learn from the current activation pattern to improve future responses."""
        # Update conversation patterns
        pattern_key = f"{query[:20]}_{context.get('time_of_day', 'unknown')}"
        self.conversation_patterns[pattern_key] += 1
        
        # Update temporal patterns
        time_of_day = context.get('time_of_day', 'unknown')
        for memory in activated_memories:
            for category in memory.categories:
                self.temporal_patterns[time_of_day][category] += 1
        
        # Update emotional patterns
        emotional_state = context.get('emotional_state', 'neutral')
        for memory in activated_memories:
            if abs(memory.emotional_valence) > 0.3:
                emotion_type = 'positive' if memory.emotional_valence > 0 else 'negative'
                primary_category = memory.categories[0] if memory.categories else 'general'
                self.emotional_patterns[emotion_type][primary_category] += 1
    
    def _update_neural_plasticity(self, activated_memories: List[NeuralMemory]):
        """Update neural plasticity based on memory usage patterns."""
        for memory in activated_memories:
            # Decrease plasticity as memory is used (becomes more stable)
            memory.neural_plasticity *= self.plasticity_decay
            
            # Increase consolidation level through use
            if memory.activation_count > 5:
                memory.consolidation_level = min(1.0, memory.consolidation_level + 0.05)
    
    def consolidate_memories(self):
        """Consolidate short-term memories into long-term storage (like sleep consolidation)."""
        current_time = get_utc_now()
        
        for memory in self.memories.values():
            # Check if memory should be consolidated
            if (memory.consolidation_level < self.consolidation_threshold and 
                memory.activation_count > 3 and
                (current_time - memory.last_activated).days > 1):
                
                # Strengthen important connections
                self._strengthen_important_connections(memory.memory_id)
                
                # Increase consolidation level
                memory.consolidation_level = min(1.0, memory.consolidation_level + 0.1)
                
                # Reduce plasticity (memory becomes more stable)
                memory.neural_plasticity = max(0.1, memory.neural_plasticity * 0.9)
    
    def _strengthen_important_connections(self, memory_id: str):
        """Strengthen connections that are frequently used together."""
        for connection_id, connection in self.connections.items():
            if (connection.source_memory_id == memory_id or 
                connection.target_memory_id == memory_id):
                
                # Strengthen if connection is used frequently
                if connection.activation_count > 2:
                    connection.strengthen(0.05)
    
    def prune_weak_connections(self):
        """Remove weak connections (like synaptic pruning in the brain)."""
        connections_to_remove = []
        
        for connection_id, connection in self.connections.items():
            # Apply natural decay
            connection.decay()
            
            # Remove very weak connections
            if connection.strength < 0.1:
                connections_to_remove.append(connection_id)
        
        # Remove weak connections
        for connection_id in connections_to_remove:
            connection = self.connections.pop(connection_id)
            
            # Remove from memory graph
            if connection.source_memory_id in self.memory_graph:
                self.memory_graph[connection.source_memory_id] = [
                    mem_id for mem_id in self.memory_graph[connection.source_memory_id]
                    if mem_id != connection.target_memory_id
                ]
            
            if connection.target_memory_id in self.memory_graph:
                self.memory_graph[connection.target_memory_id] = [
                    mem_id for mem_id in self.memory_graph[connection.target_memory_id]
                    if mem_id != connection.source_memory_id
                ]
    
    def get_memory_insights(self) -> Dict[str, Any]:
        """Get insights about the neural memory system's current state."""
        total_memories = len(self.memories)
        total_connections = len(self.connections)
        
        # Calculate average connection strength
        if total_connections > 0:
            avg_connection_strength = sum(conn.strength for conn in self.connections.values()) / total_connections
        else:
            avg_connection_strength = 0.0
        
        # Calculate memory consolidation distribution
        consolidation_levels = [mem.consolidation_level for mem in self.memories.values()]
        short_term = sum(1 for level in consolidation_levels if level < 0.3)
        medium_term = sum(1 for level in consolidation_levels if 0.3 <= level < 0.7)
        long_term = sum(1 for level in consolidation_levels if level >= 0.7)
        
        # Calculate plasticity distribution
        plasticity_levels = [mem.neural_plasticity for mem in self.memories.values()]
        avg_plasticity = sum(plasticity_levels) / len(plasticity_levels) if plasticity_levels else 0.0
        
        return {
            "total_memories": total_memories,
            "total_connections": total_connections,
            "avg_connection_strength": avg_connection_strength,
            "memory_consolidation": {
                "short_term": short_term,
                "medium_term": medium_term,
                "long_term": long_term
            },
            "avg_plasticity": avg_plasticity,
            "conversation_patterns": dict(self.conversation_patterns),
            "temporal_patterns": dict(self.temporal_patterns),
            "emotional_patterns": dict(self.emotional_patterns)
        }
    
    def learn_from_feedback(self, memory_id: str, feedback_score: float):
        """Learn from user feedback to improve memory relevance."""
        if memory_id in self.memories:
            memory = self.memories[memory_id]
            
            # Update memory importance based on feedback
            if feedback_score > 0.5:
                memory.importance = min(1.0, memory.importance + 0.1)
                # Strengthen connections to this memory
                self._strengthen_connections_to_memory(memory_id)
            else:
                memory.importance = max(0.0, memory.importance - 0.05)
    
    def _strengthen_connections_to_memory(self, memory_id: str):
        """Strengthen all connections pointing to a specific memory."""
        for connection in self.connections.values():
            if connection.target_memory_id == memory_id:
                connection.strengthen(0.02)

# Global instance
neural_memory_system = NeuralMemorySystem()
