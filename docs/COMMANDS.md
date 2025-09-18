# HealthLog AI Commands Reference

## 🚀 Essential Commands

### Frontend Development
```bash
# From frontend/ directory
npm run dev              # Start Next.js dev server (port 3000)
npm run dev:webpack      # Start with webpack (alternative)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript checks
```

### Backend Development
```bash
# From backend/ directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Alternative with specific host
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Database Management
```bash
# From backend/ directory
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Initialize database
python init_db.py
```

### Stop Servers
```bash
# Kill Python server (Windows)
taskkill /f /im python.exe

# Or kill by port (Windows)
netstat -ano | findstr :8000
taskkill /f /pid <PID_NUMBER>

# Kill Node server (Windows)
taskkill /f /im node.exe
```

## 🔧 Development Workflow

### Full Stack Development
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Testing
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm run test:all
```

## 📊 Project Structure

### Backend (FastAPI)
- **Main App**: `backend/app/main.py`
- **API Routes**: `backend/app/api/`
- **Models**: `backend/app/models/`
- **Database**: SQLite (`backend/data/minimal.db`)

### Frontend (Next.js)
- **App Router**: `frontend/src/app/`
- **Components**: `frontend/src/components/`
- **Features**: `frontend/src/features/`
- **API Client**: `frontend/src/lib/api.ts`

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health


