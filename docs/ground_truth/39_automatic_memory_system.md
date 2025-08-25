# Automatic Memory System Design

## Current Friction Points

### Manual User Interventions Required
1. **Memory Page Controls**: Users must manually mark memories as "Core", "Reinforce", or delete them
2. **Memory Context Visibility**: Users must click "Show/Hide" to see memory context
3. **Feedback Buttons**: Manual thumbs up/down for memory relevance
4. **Search & Filter**: Users must actively search and filter their memories
5. **Importance Scoring**: System relies on user interaction patterns rather than content analysis

### Technical Issues
1. **Reactive Memory Capture**: Only saves memories when explicitly triggered
2. **No Consolidation**: Creates duplicate memories for similar content
3. **Manual Lifecycle**: No automatic decay, cleanup, or optimization
4. **Visible Complexity**: Exposes internal memory mechanics to users

## Proposed Automatic Memory System

### Core Principles
- **Invisible Operation**: Memory system works completely in background
- **Smart Capture**: Automatically identifies and saves important information
- **Content-Based Intelligence**: Uses semantic analysis, not user clicks
- **Proactive Consolidation**: Prevents duplicates and merges related memories
- **Adaptive Importance**: Learns what matters to each user over time

### Architecture Changes

#### 1. Automatic Memory Capture
```typescript
// Triggers for automatic memory saving:
- Every user message (filtered by importance threshold)
- All action executions (workout logs, meals, goals, etc.)
- Document uploads with extracted key information
- Profile updates and preference changes
- Significant conversation topics (detected via NLP)
```

#### 2. Intelligent Importance Scoring
```python
def calculate_auto_importance(content: str, context: dict) -> float:
    """
    Automatic importance scoring based on:
    - Content type (goals=high, casual chat=low)
    - Personal relevance (mentions user's interests/goals)
    - Actionable information (contains specific data/metrics)
    - Emotional significance (detected sentiment)
    - Frequency of similar topics
    """
    pass
```

#### 3. Smart Memory Consolidation
```python
def consolidate_memories(new_memory: str, existing_memories: List[Memory]) -> ConsolidationAction:
    """
    Options:
    - MERGE: Combine with similar existing memory
    - UPDATE: Replace outdated information
    - CREATE: Store as new unique memory
    - DISCARD: Too low importance or duplicate
    """
    pass
```

#### 4. Background Lifecycle Management
```python
# Automatic processes:
- Memory decay based on access patterns
- Cleanup of low-relevance memories
- Promotion of frequently accessed memories
- Optimization of memory embeddings
```

### Implementation Plan

#### Phase 1: Auto-Capture Enhancement
- Hook into all user interactions (messages, actions, uploads)
- Implement content-based importance scoring
- Remove manual "remember this" toggles

#### Phase 2: Smart Consolidation
- Semantic similarity detection for memory deduplication
- Automatic merging of related memories
- Update existing memories instead of creating duplicates

#### Phase 3: Invisible UI
- Remove manual memory controls from frontend
- Hide memory context panel (always active in background)
- Eliminate feedback buttons and manual management

#### Phase 4: Adaptive Intelligence
- Learn user patterns to improve importance scoring
- Automatic memory lifecycle management
- Proactive memory optimization

### Success Metrics
- Zero manual memory management required
- Improved response relevance without user intervention
- Reduced memory storage overhead through consolidation
- User satisfaction with "it just knows" experience

### Configuration
```python
# Backend settings for automatic memory
AUTO_MEMORY_ENABLED: bool = True
AUTO_IMPORTANCE_THRESHOLD: float = 0.6  # Only save memories above this score
AUTO_CONSOLIDATION_ENABLED: bool = True
AUTO_LIFECYCLE_ENABLED: bool = True
MEMORY_UI_VISIBLE: bool = False  # Hide all manual controls
```
