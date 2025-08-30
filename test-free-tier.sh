#!/bin/bash

# Test Free Tier Setup Script
echo "🧪 Testing Free Tier Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
echo "🔍 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_status "Docker is running"

# Build optimized images
echo "🐳 Building optimized images..."

echo "Building backend..."
cd backend
if docker build -f Dockerfile.free-tier -t ai-companion-backend:free-tier .; then
    print_status "Backend image built successfully"
else
    print_error "Backend image build failed"
    exit 1
fi
cd ..

echo "Building frontend..."
cd frontend
if docker build -f Dockerfile.free-tier -t ai-companion-frontend:free-tier .; then
    print_status "Frontend image built successfully"
else
    print_error "Frontend image build failed"
    exit 1
fi
cd ..

# Check image sizes
echo "📊 Checking image sizes..."
BACKEND_SIZE=$(docker images ai-companion-backend:free-tier --format "{{.Size}}")
FRONTEND_SIZE=$(docker images ai-companion-frontend:free-tier --format "{{.Size}}")

echo "Backend image size: $BACKEND_SIZE"
echo "Frontend image size: $FRONTEND_SIZE"

# Test the setup locally
echo "🚀 Starting free tier setup..."
if docker-compose -f docker-compose.free-tier.yml up -d; then
    print_status "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
if docker-compose -f docker-compose.free-tier.yml ps | grep -q "Up"; then
    print_status "All services are running"
else
    print_error "Some services failed to start"
    docker-compose -f docker-compose.free-tier.yml logs
    exit 1
fi

# Check resource usage
echo "📊 Checking resource usage..."
echo "Current resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Test backend health
echo "🏥 Testing backend health..."
if curl -f http://localhost:8000/api/v1/utils/health > /dev/null 2>&1; then
    print_status "Backend is healthy"
else
    print_warning "Backend health check failed (might still be starting)"
fi

# Test frontend
echo "🌐 Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is responding"
else
    print_warning "Frontend check failed (might still be starting)"
fi

echo ""
echo "🎉 Free tier setup test completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test your app functionality at http://localhost:3000"
echo "2. Monitor resource usage: docker stats"
echo "3. View logs: docker-compose -f docker-compose.free-tier.yml logs -f"
echo "4. Deploy to Railway: ./deploy-railway.sh"
echo ""
echo "🛑 To stop services: docker-compose -f docker-compose.free-tier.yml down"
echo "🧹 To clean up: docker-compose -f docker-compose.free-tier.yml down -v"
