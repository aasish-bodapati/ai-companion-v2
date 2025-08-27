#!/bin/bash

# AI Companion V2 - Development Startup Script

echo "🤖 Starting AI Companion V2 Development Environment..."

# Check if running on Windows (Git Bash/WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 Detected Windows environment"
    PYTHON_CMD="python"
    NPM_CMD="npm"
else
    echo "🐧 Detected Unix-like environment"
    PYTHON_CMD="python3"
    NPM_CMD="npm"
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists $PYTHON_CMD; then
    echo "❌ Python is not installed. Please install Python 3.11+ from https://python.org/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Setup environment file
if [ ! -f ".env" ]; then
    echo "⚙️ Setting up environment file..."
    cp env_template.txt .env
    echo "📝 Please edit backend/.env with your configuration"
fi

# Initialize database
echo "🗄️ Initializing database..."
$PYTHON_CMD init_db.py

# Start backend server in background
echo "🚀 Starting backend server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../frontend

# Install Node.js dependencies
echo "📥 Installing Node.js dependencies..."
$NPM_CMD install

# Start frontend server in background
echo "🚀 Starting frontend server..."
$NPM_CMD run dev &
FRONTEND_PID=$!

# Wait a moment for servers to start
sleep 3

echo ""
echo "🎉 AI Companion V2 is now running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait
