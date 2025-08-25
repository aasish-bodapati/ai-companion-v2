# Backend Server Commands

## Start Backend Server
```bash
cd backend
.venv312\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Alternative with app-dir
```bash
uvicorn app.main:app --reload --app-dir e:/docs/ai-companion-v2/backend
```

## Dual Write (Chat -> SQL + Memory)
- Controlled by `DUAL_WRITE_ENABLED` in `backend/app/core/config.py` (and override via `backend/.env`).
- When enabled, chat commands like `note:`, `/todo`, `remind me` create rows in SQL tables and also save to memory.

Example `.env` toggle:
```env
DUAL_WRITE_ENABLED=true
```

## Database Commands
```bash
# Run migrations
alembic upgrade head

# Reset database
scripts/db.ps1 reset

# Check database status
scripts/db.ps1 status
```

## Frontend Commands
```bash
cd frontend
npm run dev
```

## Kill Stuck Processes (Windows)

If the frontend/backend ports are stuck or processes aren't stopping cleanly, use these commands.

```powershell
# Kill Uvicorn / Python (backend)
taskkill /F /IM uvicorn.exe
taskkill /F /IM python.exe

# Kill Node (Next.js dev server)
taskkill /F /IM node.exe

# Find which process is listening on a port
netstat -ano | findstr :8000  # backend
netstat -ano | findstr :3000  # frontend

# Kill by port (PowerShell using cmd /c to leverage `for /f`)
cmd /c "for /f \"tokens=5\" %P in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %P"
cmd /c "for /f \"tokens=5\" %P in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %P"