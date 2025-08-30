@echo off
echo Starting AI Companion App (Backend + Frontend)...
echo.
echo This will open two command windows:
echo 1. Backend server on port 8000
echo 2. Frontend server on port 3000
echo.
echo Press any key to continue...
pause >nul

start "AI Companion Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "AI Companion Frontend" cmd /k "cd frontend && npm run dev -- --hostname 0.0.0.0"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo To access from your phone, use your computer's IP address:
echo Frontend: http://YOUR_IP:3000
echo Backend: http://YOUR_IP:8000
echo.
echo Press any key to exit this launcher...
pause >nul
