# AI Companion Chat System - Technical Documentation

## Overview

The AI Companion chat system is a sophisticated conversational AI platform built with a React/TypeScript frontend and Python/FastAPI backend. The system provides personalized, context-aware conversations with memory persistence, multi-provider LLM support, and real-time streaming responses.

## Architecture

### High-Level Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React/TS)    │◄──►│  (FastAPI/Py)   │◄──►│   LLM APIs      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                      │                      │
├─ Chat Components    ├─ Message Endpoints   ├─ OpenRouter
├─ State Management   ├─ Memory Service      ├─ OpenRouter
├─ Real-time UI      ├─ LLM Abstraction     └─ Local Fallback
└─ Message Handling   └─ Context Building
```

## Backend Implementation

### Core Message Flow

1. **Message Reception** (`/conversations/{id}/messages`)
   - Validates conversation ownership
   - Applies rate limiting per user/IP
   - Implements idempotency with Redis/in-memory fallback
   - Normalizes and sanitizes user input
   - Auto-captures memories when personalization enabled

2. **Reply Generation** (`/conversations/{id}/reply`)
   - Builds personalized system prompt from user memories
   - Assembles conversation context (recent messages + vector memories)
   - Calls LLM with retry logic and circuit breaker
   - Applies response shaping and safety filters

### LLM Provider Abstraction

**File**: `backend/app/core/llm.py`

```python
# Provider Priority Chain
OpenRouter → Enhanced Local Stub

def generate_response(model, system_prompt, messages, max_tokens):
    # Tries providers in order with automatic fallback
    # Includes comprehensive local stub for offline operation
```

**Key Features**:
- **Circuit Breaker**: Prevents cascade failures with exponential backoff
- **Provider Fallback**: Automatic failover between LLM providers
- **Enhanced Stub**: Intelligent local responses for development/offline use
- **Streaming Support**: Real-time response generation

### Memory Integration

**Personalized System Prompts**:
```python
# Builds context from user's stored memories
enhanced_prompt = memory_service.build_personalized_system_prompt(db, user_id)

# Adds conversation context with vector similarity search
context = memory_service.get_conversation_context(
    db, user_id, conversation_id,
    recent_messages=4,
    memory_limit=4,
    current_message=message_text
)
```

**Memory Types**:
- **Profile**: Basic user information
- **Preference**: User likes/dislikes
- **Fact**: Specific user details (work, allergies, etc.)

### Safety & Security

**Input Sanitization**:
- Allergy-aware text filtering (removes "peanut" → "allergen")
- Sensitive query detection (passwords, SSN, credit cards)
- Content normalization and validation

**Rate Limiting**:
- Per-user and per-IP limits
- Configurable windows and thresholds
- Redis-backed for distributed systems

**Idempotency**:
- Prevents duplicate message processing
- TTL-based cleanup (10 minutes default)
- Redis primary, in-memory fallback

### Resilience Features

**Retry Logic**:
```python
async def _call_llm_with_retries(fn, model, system_prompt, messages, max_tokens, attempts=3):
    # Exponential backoff with jitter
    # Circuit breaker integration
    # Provider-agnostic error handling
```

**Circuit Breaker States**:
- **Closed**: Normal operation
- **Open**: Failures exceed threshold, block requests
- **Half-Open**: Test single request after cooldown

## Frontend Implementation

### Component Architecture

**File**: `frontend/src/features/chat/components/ChatContainer.tsx`

```typescript
interface ChatContainerProps {
  chatState: ChatState;           // Message state management
  memoryHandlers: MemoryHandlers; // Memory operations
  attachmentHandlers: AttachmentHandlers; // File handling
  onSend: (rememberNow?: boolean) => Promise<void>;
  onFeedback: (messageId: string, isPositive: boolean) => void;
}
```

### State Management

**Chat State Hook** (`useChatState.ts`):
- Message list management
- Input handling and validation
- Loading states and error handling
- Real-time message streaming
- Auto-scroll and UI updates

### Real-Time Features

**Streaming Implementation**:
- Server-Sent Events (SSE) for live responses
- Progressive message building
- Typing indicators and status updates
- Graceful fallback for connection issues

### Memory Integration

**Quick Save Feature**:
- One-click memory capture from messages
- Inline memory status indicators
- Undo functionality for accidental saves
- Visual feedback for memory operations

## Data Flow

### Message Send Flow

```
1. User types message → ChatInput
2. Frontend validates → API call with idempotency key
3. Backend processes → Creates user message
4. Memory capture → Auto-extracts facts/preferences
5. Context building → Retrieves relevant memories
6. LLM generation → Calls provider with context
7. Response processing → Safety filters + shaping
8. Database storage → Saves assistant message
9. Frontend update → Displays response
```

### Memory Capture Flow

```
1. Message analysis → Extract facts/preferences
2. Vector embedding → Generate semantic representations
3. Similarity check → Avoid duplicate memories
4. Storage → PostgreSQL + vector index
5. Context building → Available for future conversations
```

## Configuration

### Environment Variables

```bash
# LLM Configuration
LLM_PROVIDER=openrouter          # openrouter|stub
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://openrouter.ai/api/v1

# Rate Limiting
RATE_LIMIT_SEND_PER_WINDOW=60    # Messages per window
RATE_LIMIT_WINDOW_SECONDS=60     # Window duration

# Memory Settings
IDEMPOTENCY_TTL_SECONDS=600      # Idempotency cache TTL
EVALUATION_MODE=false            # Disable response shaping for tests
```

### Database Schema

**Messages Table**:
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    role VARCHAR(20) NOT NULL,     -- 'user' | 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES users(id)
);
```

**Memories Table**:
```sql
CREATE TABLE memories (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    content_type VARCHAR(50),      -- 'profile' | 'preference' | 'fact'
    embedding VECTOR(1536),        -- For similarity search
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Performance Optimizations

### Caching Strategy

- **Message Context**: 10-second TTL for recent messages
- **Memory Queries**: Vector similarity caching
- **System Prompts**: Built once per conversation
- **Idempotency**: Redis-backed with TTL cleanup

### Resource Management

- **Token Limits**: Configurable max_tokens per provider
- **Context Pruning**: Limited recent messages (4) and memories (4)
- **Connection Pooling**: HTTP client reuse for LLM calls
- **Background Processing**: Async memory capture

## Error Handling

### Graceful Degradation

1. **LLM Failure**: Automatic provider fallback
2. **Network Issues**: Local stub responses
3. **Memory Errors**: Continue without personalization
4. **Rate Limits**: Clear error messages to user
5. **Database Issues**: In-memory fallbacks where possible

### Monitoring & Logging

- **LLM Metrics**: Response times, provider usage, error rates
- **Memory Operations**: Capture success/failure rates
- **Rate Limiting**: Blocked request tracking
- **Circuit Breaker**: State transition logging

## Testing Strategy

### Unit Tests
- LLM provider abstraction
- Memory service operations
- Message validation logic
- Safety filter effectiveness

### Integration Tests
- End-to-end message flow
- Provider failover scenarios
- Memory persistence and retrieval
- Rate limiting enforcement

### Load Testing
- Concurrent user simulation
- Provider capacity testing
- Memory system scalability
- Database performance under load

## Deployment Considerations

### Scaling
- **Horizontal**: Multiple backend instances with shared Redis
- **Database**: Read replicas for memory queries
- **LLM Providers**: Multiple API keys for rate limit distribution

### Security
- **API Keys**: Environment-based configuration
- **Input Validation**: Multiple layers of sanitization
- **Rate Limiting**: Per-user and global limits
- **Memory Privacy**: User-scoped data isolation

### Monitoring
- **Health Checks**: Provider availability monitoring
- **Performance Metrics**: Response time tracking
- **Error Alerting**: Circuit breaker state changes
- **Usage Analytics**: Token consumption and cost tracking
