# AI Companion v2 - Project Overview

## Vision Statement

The AI Companion app is designed to create a deeply personal AI companion that evolves with users over time, eliminating the need for repeated context sharing. At its core, this app aims to be a digital manifestation of a real person who is with you all the time and takes on whatever role you need depending on the circumstances.

### Key Vision Elements

1. **Deep Personal Understanding**: Rich onboarding creates a foundation of knowledge about the user
2. **Continuous Evolution**: AI continuously updates and refines memory based on interactions
3. **Context Awareness**: Eliminates need to repeat or re-explain personal context
4. **Adaptive Roles**: AI adapts to different situations and user needs
5. **Long-term Memory**: Persistent memory system that grows with the user
6. **Future Expansion**: Planned integration of fitness, nutrition, and other life tracking features

## Current Implementation Status

### ✅ Completed Features

#### Core Infrastructure
- **Backend**: FastAPI with SQLAlchemy ORM, JWT authentication
- **Frontend**: Next.js 14 with React 19, TypeScript, Tailwind CSS
- **Database**: SQLite (dev) / PostgreSQL (prod) with UUID primary keys
- **Authentication**: Secure JWT-based user management

#### AI & Memory System
- **LLM Integration**: Together AI API with Llama-3.3-70B-Instruct-Turbo-Free model
- **Memory Architecture**: FAISS vector database + SQLAlchemy metadata storage
- **Embeddings**: sentence-transformers with all-MiniLM-L6-v2 model (384 dimensions)
- **Context Retrieval**: Semantic search for personalized AI responses

#### User Experience
- **Multi-step Onboarding**: 6-step process covering identity, interests, communication style, goals, boundaries, and fun
- **Conversation Management**: Full chat interface with conversation history
- **Memory Persistence**: Stores onboarding data and conversation context
- **Responsive UI**: Modern, accessible interface with dark/light theme support

### 🚧 In Progress / Planned Features

#### Advanced Memory Features (Milestone 4)
- Spiderweb memory model with weighted edges
- Temporal decay for memory relevance
- Enhanced context retrieval algorithms

#### Memory Analytics (Milestone 5)
- User memory insights and patterns
- Memory strength and usage analytics
- Personalized memory recommendations

#### Fitness & Nutrition Tracking (Milestone 6)
- Exercise and workout logging
- Nutrition and calorie tracking
- Health goal integration with AI companion
- Progress monitoring and AI coaching

#### Advanced Personalization (Milestone 7)
- Behavioral pattern recognition
- Predictive assistance
- Emotional state awareness
- Proactive support and check-ins

## Technical Architecture

### Backend Architecture
```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── models/              # SQLAlchemy database models
│   │   ├── user.py         # User authentication model
│   │   ├── onboarding.py   # Rich user profile data
│   │   ├── conversation.py # Chat conversations and messages
│   │   └── memory.py       # Memory nodes for vector search
│   ├── api/                 # API endpoints and routing
│   ├── memory/              # Memory system implementation
│   │   ├── service.py      # Memory orchestration service
│   │   ├── faiss_store.py  # FAISS vector database operations
│   │   └── embeddings.py   # Text embedding generation
│   ├── crud/                # Database operations layer
│   └── core/                # Configuration and utilities
```

### Frontend Architecture
```
frontend/src/
├── app/                     # Next.js app router pages
│   ├── onboarding/         # Multi-step onboarding flow
│   ├── chat/               # Chat interface
│   ├── profile/            # User profile management
│   └── memories/           # Memory visualization
├── features/                # Feature-based component organization
│   ├── onboarding/         # Onboarding components and logic
│   ├── chat/               # Chat interface components
│   └── conversations/      # Conversation management
├── components/              # Reusable UI components
│   ├── memory/             # Memory-related components
│   ├── auth/               # Authentication components
│   └── layout/             # Layout and navigation
└── lib/                     # Utilities and API client
```

### Memory System Architecture
```
User Input → Embedding Generation → FAISS Vector Search → Context Retrieval → LLM Response
     ↓              ↓                    ↓                    ↓              ↓
Memory Storage → Database Logging → Relevance Scoring → Context Building → Memory Update
```

## Data Models

### User & Profile
- **User**: Basic authentication (email, password, name)
- **OnboardingProfile**: Rich personal context including:
  - Identity (name, nickname, pronouns, birthday, location)
  - Interests (topics, hobbies, favorites)
  - Communication style (response style, tone, small talk level)
  - Goals (primary reason, personal goals, check-ins)
  - Boundaries (avoid topics, memory policy, recall preferences)
  - Fun (dream trip, random facts, AI persona preferences)

### Memory System
- **MemoryNode**: Stores content with metadata for vector search
  - Content and type classification
  - User association and conversation context
  - Timestamp and relevance scoring
  - FAISS vector ID for similarity search

### Conversations
- **Conversation**: Chat sessions with titles and timestamps
- **Message**: Individual messages with role (user/assistant/system) and content

## Key Technical Decisions

### Memory System Choices
- **FAISS over alternatives**: Chosen for local, fast semantic search without external dependencies
- **Hybrid approach**: Database stores metadata and content, FAISS handles vector similarity
- **Embedding model**: all-MiniLM-L6-v2 for balance of quality and speed (384 dimensions)
- **Index type**: IndexFlatIP for cosine similarity matching

### LLM Integration
- **Together AI**: Chosen for cost-effective access to high-quality models
- **Llama-3.3-70B**: Large context window for comprehensive memory integration
- **Context injection**: System prompts enhanced with retrieved memories

### Database Design
- **UUID primary keys**: Ensures uniqueness across distributed systems
- **Cascade relationships**: Proper cleanup of related data
- **Indexing strategy**: Optimized for memory retrieval and user queries

## Current Limitations & Technical Debt

### Performance Considerations
- Memory system performance optimization needed
- Streaming responses for LLM not yet implemented
- Cost efficiency monitoring for LLM calls required

### Code Quality
- Pydantic V2 migration needed (deprecation warnings)
- SQLAlchemy 2.0 compatibility improvements
- FastAPI lifespan events deprecation warnings

### Feature Gaps
- No fitness/nutrition tracking yet implemented
- Limited proactive assistance capabilities
- Basic memory analytics only

## Development Workflow

### Testing Strategy
- Regular testing after each milestone to prevent overbuilding
- Backend unit tests for all new functionality
- Integration tests for memory system
- Frontend testing for user flows
- Performance testing for memory retrieval

### Deployment
- Development: SQLite + local FAISS
- Production: PostgreSQL + persistent FAISS storage
- Environment-based configuration management

## Next Steps & Roadmap

### Immediate Priorities (Milestone 4)
1. Implement advanced memory features (spiderweb model, weighted edges)
2. Add temporal decay for memory relevance
3. Enhance context retrieval algorithms
4. Optimize memory system performance

### Short-term Goals (Milestones 5-6)
1. Build memory analytics and insights dashboard
2. Design and implement fitness/nutrition tracking
3. Create health goal integration with AI companion
4. Develop progress monitoring and AI coaching

### Long-term Vision (Milestone 7+)
1. Advanced personalization and learning algorithms
2. Behavioral pattern recognition
3. Emotional state awareness
4. Proactive support and intelligent check-ins
5. Integration with external health and fitness platforms

## Conclusion

The AI Companion v2 project has established a solid foundation with a sophisticated memory system, rich user profiling, and AI integration. The current implementation successfully demonstrates the core vision of a context-aware AI companion that remembers user preferences and conversation history.

The planned fitness and nutrition tracking features will significantly enhance the app's utility as a comprehensive life companion, moving beyond conversation to active life management and coaching. The modular architecture and memory system provide a strong foundation for these future enhancements.

The project represents a significant step toward creating truly personalized AI companions that evolve with users over time, eliminating the need for repeated context sharing while providing increasingly relevant and helpful assistance.
