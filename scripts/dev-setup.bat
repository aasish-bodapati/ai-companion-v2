@echo off
REM AI Companion V2 - Development Setup Script (Windows)
REM This script sets up the development environment for both backend and frontend

echo 🚀 Setting up AI Companion V2 development environment...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.11+ is required but not installed
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 18+ is required but not installed
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is required but not installed
    exit /b 1
)

echo [SUCCESS] System requirements met

REM Setup backend
echo [INFO] Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install dependencies
echo [INFO] Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Copy environment file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env file from template...
        copy .env.example .env
        echo [WARNING] Please edit .env file with your configuration
    ) else (
        echo [WARNING] No .env.example found. Please create .env manually
    )
)

REM Initialize database
echo [INFO] Initializing database...
python init_db.py

echo [SUCCESS] Backend setup complete
cd ..

REM Setup frontend
echo [INFO] Setting up frontend...
cd frontend

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
npm install

REM Copy environment file if it doesn't exist
if not exist ".env.local" (
    if exist ".env.local.example" (
        echo [INFO] Creating .env.local file from template...
        copy .env.local.example .env.local
        echo [WARNING] Please edit .env.local file with your configuration
    ) else (
        echo [WARNING] No .env.local.example found. Please create .env.local manually
    )
)

echo [SUCCESS] Frontend setup complete
cd ..

REM Create development scripts
echo [INFO] Creating development scripts...

REM Backend start script
echo @echo off > start-backend.bat
echo cd backend >> start-backend.bat
echo call .venv\Scripts\activate.bat >> start-backend.bat
echo uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 >> start-backend.bat

REM Frontend start script
echo @echo off > start-frontend.bat
echo cd frontend >> start-frontend.bat
echo npm run dev >> start-frontend.bat

REM Both services start script
echo @echo off > start-both.bat
echo echo Starting both backend and frontend... >> start-both.bat
echo start "Backend" cmd /k "cd backend ^& call .venv\Scripts\activate.bat ^& uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" >> start-both.bat
echo start "Frontend" cmd /k "cd frontend ^& npm run dev" >> start-both.bat
echo echo Both services started in separate windows >> start-both.bat
echo pause >> start-both.bat

echo [SUCCESS] Development scripts created

echo.
echo 🎉 Development environment setup complete!
echo.
echo Next steps:
echo 1. Edit backend\.env with your configuration
echo 2. Edit frontend\.env.local with your configuration
echo 3. Start development servers:
echo    - Backend only: start-backend.bat
echo    - Frontend only: start-frontend.bat
echo    - Both: start-both.bat
echo.
echo Access your application:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo.
pause
