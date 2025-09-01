# 🧠 Holistic Memory System

## Overview

The Holistic Memory System implements the refined memory design that creates a unified memory layer while maintaining clean database structure. This system enables AI companions to provide deeply personalized responses by understanding the user's complete life context across all memory buckets.

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Holistic Memory Service                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Memory Orchestrator                     │   │
│  │  • Intent Detection                                 │   │
│  │  • Context Fetch                                    │   │
│  │  • Context Fusion                                   │   │
│  │  • Cross-Connection Analysis                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Memory Buckets                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │    Logs     │ │  Journals   │ │    Chats    │          │
│  │ (Structured)│ │(Unstructured)│ │(Semi-structured)│      │
│  │             │ │             │ │             │          │
│  │ • Fitness  │ │ • Emotions  │ │ • AI Convos │          │
│  │ • Meals    │ │ • Thoughts  │ │ • History   │          │
│  │ • Sleep    │ │ • Insights  │ │ • Context   │          │
│  │ • Mood     │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Database Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  WorkoutLog │ │JournalEntry │ │Conversation │          │
│  │   MealLog   │ │             │ │   Message   │          │
│  │   MoodLog   │ │             │ │             │          │
│  │ HydrationLog│ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Memory Buckets

1. **Logs (Structured)**
   - Fitness tracking (workouts, exercises)
   - Nutrition (meals, hydration)
   - Health metrics (sleep, mood)
   - Structured, quantifiable data

2. **Journals (Unstructured)**
   - Personal reflections
   - Emotional states
   - Long-form thoughts
   - Free-form text entries

3. **Chats (Semi-structured)**
   - AI conversations
   - Dialog history
   - Context and flow
   - Structured by conversation/message

4. **Memories (FAISS Vector)**
   - Semantic search
   - Long-term storage
   - Pattern recognition
   - Vector embeddings

## 🚀 Implementation

### 1. Memory Orchestrator

The heart of the system that coordinates all memory operations:

```python
from app.memory.orchestrator import memory_orchestrator

# Detect user intent
intent = memory_orchestrator.detect_intent("I feel tired today")
# Returns: IntentType.INTROSPECTION

# Fetch holistic context
context = memory_orchestrator.fetch_holistic_context(
    db=db,
    user_id=user_id,
    user_message="I feel tired today",
    time_window_hours=168  # 7 days
)
```

**Key Features:**
- Intent detection using keyword analysis
- Multi-bucket context fetching
- Cross-connection identification
- Context fusion and summarization

### 2. Holistic Memory Service

Enhanced service that integrates with the orchestrator:

```python
from app.memory.holistic_service import holistic_memory_service

# Generate AI response with holistic context
result = holistic_memory_service.generate_holistic_response(
    db=db,
    user_id=user_id,
    user_message="I feel tired today"
)

# Get unified timeline
timeline = holistic_memory_service.get_memory_timeline(
    db=db,
    user_id=user_id,
    days=7
)
```

**Key Features:**
- Enhanced system prompts with context
- Memory timeline generation
- Interaction storage
- Emotional valence estimation

### 3. API Endpoints

RESTful API for accessing holistic memory functionality:

```bash
# Get holistic context
GET /api/v1/holistic-memory/context?user_message=I feel tired today

# Generate AI response
POST /api/v1/holistic-memory/response
{
  "user_message": "I feel tired today"
}

# Get memory timeline
GET /api/v1/holistic-memory/timeline?days=7

# Analyze user intent
GET /api/v1/holistic-memory/intent?user_message=I feel tired today
```

## 📊 Data Flow Example

### User Message: "I feel tired today"

#### Step 1: Intent Detection
```
Input: "I feel tired today"
Keywords: ["feel", "tired"]
Intent: INTROSPECTION
Confidence: 0.85
```

#### Step 2: Context Fetch
```
Logs Bucket:
├── Recent workout: "heavy leg day" (yesterday)
├── Recent meal: "oatmeal, banana, protein shake" (2 hours ago)
├── Recent mood: 2/5 (1 hour ago)
└── Recent hydration: 500ml (3 hours ago)

Journals Bucket:
├── Entry: "Stress about deadlines affecting sleep and energy"
└── Entry: "Poor nutrition leads to energy crashes"

Chats Bucket:
├── Current: "Daily Check-in"
└── Recent: "Stress management discussion"
```

#### Step 3: Context Fusion
```
Cross-Connections:
├── Mood-Workout: Heavy leg day correlates with low energy
├── Journal-Emotion: Stress patterns affecting energy
└── Chat-Context: Previous stress management goals

Holistic Summary:
├── User State: Low energy
├── Recent Activity: Workout, meal logging, journaling
├── Emotional Context: Stress themes
└── Physical Context: Active, nutrition tracking
```

#### Step 4: AI Response Generation
```
Enhanced System Prompt:
"You are an AI companion with access to the user's holistic memory context..."

Context Provided:
- Recent heavy leg workout
- Stress about deadlines
- Past nutrition insights
- Previous stress management goals

AI Response:
"I can see you're feeling tired today, and looking at your recent activity..."
```

## 🎯 Key Benefits

### 1. **Clean Database Structure**
- Separate tables for different data types
- Clear separation of concerns
- Easy to maintain and scale

### 2. **Unified Memory Context**
- AI sees complete user picture
- Cross-bucket pattern recognition
- Holistic understanding of user state

### 3. **Companion-like AI Responses**
- References specific past events
- Shows understanding of patterns
- Provides personalized advice
- Demonstrates memory and care

### 4. **Scalable Architecture**
- Easy to add new memory buckets
- Modular design for extensions
- Foundation for personal OS features

## 🔧 Usage Examples

### Basic Context Retrieval

```python
from app.memory.holistic_service import holistic_memory_service

# Get context for a user message
context = holistic_memory_service.get_holistic_context(
    db=db,
    user_id="user-123",
    user_message="How am I doing with my fitness goals?",
    time_window_hours=168
)

print(f"User State: {context['holistic_summary']['user_state']}")
print(f"Recent Activity: {context['holistic_summary']['recent_activity']}")
```

### AI Response Generation

```python
# Generate personalized AI response
result = holistic_memory_service.generate_holistic_response(
    db=db,
    user_id="user-123",
    user_message="I'm feeling stressed about work"
)

print(f"AI Response: {result['response']}")
print(f"Intent: {result['intent']['type']}")
print(f"Confidence: {result['intent']['confidence']}")
```

### Timeline Generation

```python
# Get unified timeline view
timeline = holistic_memory_service.get_memory_timeline(
    db=db,
    user_id="user-123",
    days=7
)

for entry in timeline['timeline']:
    print(f"{entry['timestamp']} - {entry['title']}")
    print(f"  {entry['description']}")
    print(f"  Source: {entry['source']}")
```

## 🧪 Testing

Run the demonstration script to see the system in action:

```bash
cd backend
python test_holistic_memory.py
```

This will show:
1. Intent detection
2. Context fetching
3. Context fusion
4. AI response generation
5. Timeline creation

## 🚀 Future Enhancements

### 1. **Knowledge Graph Integration**
- Nodes for entities (workouts, meals, emotions)
- Edges for relationships and patterns
- Graph-based insights and recommendations

### 2. **Advanced Pattern Recognition**
- Machine learning for pattern detection
- Predictive insights
- Behavioral trend analysis

### 3. **Memory Summarization**
- Daily/weekly memory snapshots
- Automatic insight generation
- Progress tracking and reporting

### 4. **Enhanced Emotional Intelligence**
- Sentiment analysis
- Emotional pattern recognition
- Mood prediction and support

## 📚 API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/context` | GET | Get holistic memory context |
| `/response` | POST | Generate AI response with context |
| `/timeline` | GET | Get unified memory timeline |
| `/intent` | GET | Analyze user message intent |
| `/summary` | GET | Get holistic memory summary |
| `/health` | GET | System health check |

### Request/Response Models

See `backend/app/schemas/holistic_memory.py` for complete schema definitions.

## 🔒 Security & Privacy

- User authentication required for all endpoints
- Data isolation by user ID
- Privacy levels for sensitive information
- Audit trails for memory access

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure all dependencies are installed
   - Check Python path includes app directory

2. **Database Connection Issues**
   - Verify database configuration
   - Check connection strings

3. **Memory Context Errors**
   - Verify user exists in database
   - Check memory bucket data availability

### Debug Mode

Enable debug logging to see detailed system operation:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new functionality
3. Update documentation
4. Ensure backward compatibility

## 📄 License

This system is part of the AI Companion v2 project. See main project license for details.

---

**The Holistic Memory System transforms your AI companion from a simple chatbot into a truly understanding companion that remembers your life story and provides deeply personalized support.**
