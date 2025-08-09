# Development Workflow

## Local Development Setup

### Prerequisites
- Node.js 18+ & npm 9+
- Python 3.10+
- PostgreSQL 14+
- Redis (for caching)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-companion-v2.git
cd ai-companion-v2
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements-dev.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Development Servers
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Git Workflow

### Branch Naming
- `feature/`: New features
- `bugfix/`: Bug fixes
- `hotfix/`: Critical production fixes
- `chore/`: Maintenance tasks
- `docs/`: Documentation updates

### Commit Message Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code changes that don't fix bugs or add features
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to build process or auxiliary tools

Example:
```
feat(auth): add password reset flow

- Add forgot password endpoint
- Implement password reset email template
- Add tests for password reset flow

Closes #123
```

## Testing

### Backend Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=app --cov-report=term-missing
```

### Frontend Tests
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm test -- --watch
```

## Code Quality

### Linting
```bash
# Backend
flake8 .
black .
isort .

# Frontend
npm run lint
npm run type-check
```

### Pre-commit Hooks
Pre-commit hooks are configured to run:
1. Black (code formatting)
2. isort (import sorting)
3. flake8 (linting)
4. mypy (type checking)

Install pre-commit:
```bash
pip install pre-commit
pre-commit install
```

## Deployment

### Staging
```bash
# Build frontend
cd frontend
npm run build

# Deploy backend
cd ../backend
./deploy.sh staging
```

### Production
```bash
# Build frontend with production settings
cd frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com npm run build

# Deploy backend
cd ../backend
./deploy.sh production
```

## Environment Variables

### Backend (`.env`)
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_companion

# Authentication
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI
TOGETHER_API_KEY=your-together-ai-key
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
```

## Troubleshooting

### Database Issues
```bash
# Reset database
python -m app.db.init_db

# Create new migration
alembic revision --autogenerate -m "description"
```

### Dependency Issues
```bash
# Backend
pip install -r requirements.txt

# Frontend
rm -rf node_modules package-lock.json
npm install
```

## Code Review Process
1. Create a feature branch from `main`
2. Make your changes with tests
3. Open a pull request
4. Request review from at least one team member
5. Address review comments
6. Merge after approval and CI passes

## Monitoring
- **Backend**: Sentry for error tracking
- **Frontend**: LogRocket for session replay
- **Infrastructure**: Datadog for metrics and logging
