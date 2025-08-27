@echo off
REM AI Companion V2 - Development Startup Script for Windows

echo 🤖 Starting AI Companion V2 Development Environment...

REM Check prerequisites
echo 🔍 Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.11+ from https://python.org/
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Setup backend
echo 🔧 Setting up backend...
cd backend

REM Check if virtual environment exists
if not exist "venv\" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo 📥 Installing Python dependencies...
pip install -r requirements.txt

REM Setup environment file
if not exist ".env" (
    echo ⚙️ Setting up environment file...
    copy env_template.txt .env
    echo 📝 Please edit backend\.env with your configuration
)

REM Initialize database
echo 🗄️ Initializing database...
python init_db.py

REM Start backend server
echo 🚀 Starting backend server...
start "Backend Server" cmd /c "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Setup frontend
echo 🎨 Setting up frontend...
cd ..\frontend

REM Install Node.js dependencies
echo 📥 Installing Node.js dependencies...
npm install

REM Start frontend server
echo 🚀 Starting frontend server...
start "Frontend Server" cmd /c "npm run dev"

REM Wait a moment for servers to start
timeout /t 3 /nobreak >nul

echo.
echo 🎉 AI Companion V2 is now running!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop all servers and exit...
pause >nul

REM Cleanup
echo 🛑 Stopping servers...
taskkill /f /im "uvicorn.exe" 2>nul
taskkill /f /im "node.exe" 2>nul
echo ✅ Cleanup complete
