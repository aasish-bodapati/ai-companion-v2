# AI Companion Backend

FastAPI-based backend for the AI Companion application, providing intelligent conversation management, memory storage, and AI-powered insights.

## 🏗️ Architecture

### Core Components
- **FastAPI Application**: Modern, fast web framework with automatic API documentation
- **SQLAlchemy ORM**: Database abstraction layer with migration support
- **Alembic**: Database migration management
- **Pydantic**: Data validation and serialization
- **JWT Authentication**: Secure user session management

### Directory Structure
```
backend/
├── app/                    # Main application package
│   ├── api/              # API endpoints and routing
│   │   ├── endpoints/    # Individual API endpoint modules
│   │   └── api_v1/      # API version 1 router
│   ├── core/             # Core functionality and configuration
│   │   ├── config.py     # Application settings
│   │   ├── security.py   # Authentication and security
│   │   └── llm.py       # AI/LLM integration
│   ├── models/           # Database models (SQLAlchemy)
│   ├── schemas/          # Pydantic schemas for validation
│   ├── services/         # Business logic and external services
│   ├── crud/             # Database CRUD operations
│   ├── db/               # Database configuration and sessions
│   ├── memory/           # Memory management and storage
│   └── middleware/       # Custom middleware components
├── tests/                 # Test suite
├── alembic/               # Database migrations
├── requirements.txt       # Python dependencies
└── .env.example          # Environment variables template
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL or SQLite
- Virtual environment (recommended)

### Installation

1. **Create and activate virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**
   ```bash
   python init_db.py
   ```

5. **Run migrations (if using PostgreSQL)**
   ```bash
   alembic upgrade head
   ```

6. **Start the server**
   ```bash
   uvicorn app.main:app --reload
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=sqlite:///./minimal.db
# or for PostgreSQL: postgresql://user:password@localhost/dbname

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
OPENROUTER_API_KEY=your-openrouter-api-key
TOGETHER_API_KEY=your-together-api-key

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

## 🧪 Testing

### Run all tests
```bash
pytest
```

### Run with coverage
```bash
pytest --cov=app tests/
```

### Run specific test file
```bash
pytest tests/test_memory.py
```

## 📊 API Documentation

Once the server is running, you can access:

- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc
- **OpenAPI schema**: http://localhost:8000/openapi.json

## 🔍 Key Features

### Memory Management
- **FAISS Vector Store**: Efficient similarity search for memories
- **Automatic Extraction**: AI-powered personal information capture
- **Context Awareness**: Intelligent conversation history management

### AI Integration
- **Multi-Provider Support**: OpenRouter API for multiple LLM options
- **Streaming Responses**: Real-time AI conversation streaming
- **Memory-Augmented**: Context-aware responses using stored memories

### Security
- **JWT Authentication**: Secure user session management
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Comprehensive data validation with Pydantic

## 🚀 Development

### Code Quality
- **Ruff**: Fast Python linter and formatter
- **Type Hints**: Full type annotation support
- **Pydantic**: Runtime data validation

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Adding New Endpoints

1. Create endpoint module in `app/api/endpoints/`
2. Define Pydantic schemas in `app/schemas/`
3. Add CRUD operations in `app/crud/`
4. Include in API router in `app/api/api_v1/api.py`

## 📝 Logging

The application uses structured logging with configurable levels:

```python
import logging
logger = logging.getLogger(__name__)
logger.info("Application started")
logger.error("Error occurred", exc_info=True)
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure DATABASE_URL is correct
2. **Missing Dependencies**: Run `pip install -r requirements.txt`
3. **Migration Errors**: Check Alembic configuration and run `alembic upgrade head`
4. **CORS Issues**: Verify BACKEND_CORS_ORIGINS includes your frontend URL

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=DEBUG
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
