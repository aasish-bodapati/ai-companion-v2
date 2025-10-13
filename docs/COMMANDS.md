# HealthLog AI Commands Reference

## 🚀 Essential Commands

### Stop Servers
```bash
# Kill Python server (Windows)
ngrok http 8000
netstat -ano | findstr :8000
taskkill /f /pid <PID_NUMBER>
taskkill /f /im node.exe
taskkill /f /im python.exe
npx expo start --clear
npx expo start --tunnel --clear
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
- **Database**: SQLite (`healthlog.db`)

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


