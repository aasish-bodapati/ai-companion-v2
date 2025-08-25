# Architecture Overview

> Vision: This system is designed to replace a human personal assistant—available 24/7—with expert-level support across key areas of life, powered by a single shared memory and proactive coaching loops.

## System Architecture

```mermaid
graph TD
    A[Frontend - Next.js] <--> B[Backend - FastAPI]
    B <--> C[(Database - PostgreSQL)]
    B <--> D[OpenRouter]
    
    subgraph Frontend
    A --> A1[React Components]
    A --> A2[State Management]
    A --> A3[API Client]
    end
    
    subgraph Backend
    B --> B1[API Routes]
    B --> B2[Authentication]
    B --> B3[Database ORM]
    B --> B4[AI Integration]
    end
```

## Core Dependencies

### Backend
- **FastAPI**: Web framework for building APIs
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations
- **Python-Jose**: JWT token handling
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI server

### Frontend
- **Next.js 14**: React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Query (TanStack)**: Data fetching and caching
- **React Hook Form**: Form handling
- **Axios**: HTTP client

### AI/ML
- **OpenRouter**: LLM provider (OpenAI-compatible API)
- **Llama 3**: Primary language model
- **Sentence Transformers**: For embeddings

## Data Flow

1. User interacts with the frontend
2. Frontend makes authenticated requests to backend
3. Backend processes request and interacts with database/AI
4. Response sent back to frontend
5. UI updates based on response

