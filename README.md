# AI Companion v2

A modern AI-powered personal companion with memory, conversation, and intelligent assistance capabilities.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

- `SECRET_KEY`: Generate with `openssl rand -hex 32`
- `LLM_API_KEY`: Your LLM provider API key
- `SQLALCHEMY_DATABASE_URI`: Database connection string

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm run test:all
```

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs)
- [Standard Practices Analysis](STANDARD_PRACTICES_ANALYSIS.md)

## 🔒 Security

- JWT authentication
- Password hashing with bcrypt
- Security headers
- CORS configuration
- Input validation

## 🏗️ Architecture

- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Frontend**: Next.js + TypeScript + React Query
- **Database**: PostgreSQL/SQLite
- **AI**: Configurable LLM providers
- **Memory**: FAISS vector store
