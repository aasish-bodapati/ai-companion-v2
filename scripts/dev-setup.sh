#!/bin/bash

# AI Companion V2 - Development Setup Script
# This script sets up the development environment for both backend and frontend

set -e

echo "🚀 Setting up AI Companion V2 development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3.11+ is required but not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 18+ is required but not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed"
        exit 1
    fi
    
    print_success "System requirements met"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source .venv/bin/activate
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_status "Creating .env file from template..."
            cp .env.example .env
            print_warning "Please edit .env file with your configuration"
        else
            print_warning "No .env.example found. Please create .env manually"
        fi
    fi
    
    # Initialize database
    print_status "Initializing database..."
    python init_db.py
    
    print_success "Backend setup complete"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Copy environment file if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.local.example" ]; then
            print_status "Creating .env.local file from template..."
            cp .env.local.example .env.local
            print_warning "Please edit .env.local file with your configuration"
        else
            print_warning "No .env.local.example found. Please create .env.local manually"
        fi
    fi
    
    print_success "Frontend setup complete"
    cd ..
}

# Create development scripts
create_dev_scripts() {
    print_status "Creating development scripts..."
    
    # Backend start script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
EOF
    
    # Frontend start script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd frontend
npm run dev
EOF
    
    # Both services start script
    cat > start-both.sh << 'EOF'
#!/bin/bash
# Start both backend and frontend in parallel
./start-backend.sh &
BACKEND_PID=$!
./start-frontend.sh &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF
    
    # Make scripts executable
    chmod +x start-backend.sh start-frontend.sh start-both.sh
    
    print_success "Development scripts created"
}

# Main setup function
main() {
    print_status "Starting AI Companion V2 development setup..."
    
    check_requirements
    setup_backend
    setup_frontend
    create_dev_scripts
    
    echo ""
    print_success "🎉 Development environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit backend/.env with your configuration"
    echo "2. Edit frontend/.env.local with your configuration"
    echo "3. Start development servers:"
    echo "   - Backend only: ./start-backend.sh"
    echo "   - Frontend only: ./start-frontend.sh"
    echo "   - Both: ./start-both.sh"
    echo ""
    echo "Access your application:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
}

# Run main function
main "$@"
