#!/usr/bin/env bash
# Complete EC2 deployment script for AI Companion Backend
# Optimized for AWS Free Tier (t2.micro/t3.micro with 1GB RAM)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Update system packages
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    log "Docker installed. Please log out and back in for group changes to take effect."
    exit 0
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    log "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create application directory
APP_DIR="/home/$(whoami)/ai-companion"
log "Creating application directory: $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# Create .env file if it doesn't exist
if [[ ! -f .env ]]; then
    log "Creating .env file template..."
    cat > .env << 'EOF'
# Database Configuration (Supabase/Neon)
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Settings
SECRET_KEY=your-generated-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# LLM Configuration
LLM_PROVIDER=openrouter
LLM_API_KEY=your-llm-api-key-here
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL_DEFAULT=mistralai/mistral-7b-instruct
LLM_MODEL_FAST=mistralai/mistral-7b-instruct
LLM_MODEL_VISION=mistralai/mistral-7b-instruct
LLM_MODEL_SUMMARY=mistralai/mistral-7b-instruct

# CORS Origins (update with your frontend URLs)
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://your-app.vercel.app"]

# Memory System (disabled for lightweight deployment)
MEMORY_ENABLED=false
MEMORY_PROVIDER=none

# Optional Redis (leave empty if not using)
REDIS_URL=

# Rate Limiting
RATE_LIMIT_ENABLED=false

# Feature Flags (disabled for lightweight)
MEMORY_DECAY_ENABLED=false
PERSONALITY_REFLECTION_ENABLED=false
GOAL_TRACKING_ENABLED=false
AUTO_MEMORY_ENABLED=false
ACTIONS_SUGGESTIONS_ENABLED=true
DIRECT_EXECUTION_ENABLED=true

# Telemetry (disabled)
OTEL_ENABLED=false
EOF
    warn "Please edit .env file with your actual values before continuing!"
    warn "Required: DATABASE_URL, SECRET_KEY, LLM_API_KEY, BACKEND_CORS_ORIGINS"
    echo "Edit with: nano $APP_DIR/.env"
    exit 0
fi

# Validate required environment variables
log "Validating environment variables..."
source .env

if [[ -z "${DATABASE_URL:-}" ]]; then
    error "DATABASE_URL is required in .env file"
fi

if [[ -z "${SECRET_KEY:-}" ]] || [[ "${SECRET_KEY}" == "your-generated-secret-key-here" ]]; then
    error "SECRET_KEY must be set to a secure random value in .env file"
fi

if [[ -z "${LLM_API_KEY:-}" ]] || [[ "${LLM_API_KEY}" == "your-llm-api-key-here" ]]; then
    error "LLM_API_KEY must be set in .env file"
fi

# Stop existing container if running
if docker ps -q -f name=ai-backend | grep -q .; then
    log "Stopping existing container..."
    docker stop ai-backend
    docker rm ai-backend
fi

# Pull latest image
log "Pulling latest backend image..."
docker pull aasish1212/ai-companion-v2-backend:latest

# Run the container with .env file
log "Starting AI Companion backend..."
docker run -d \
    --name ai-backend \
    --restart unless-stopped \
    -p 80:8000 \
    --env-file .env \
    --memory="800m" \
    --memory-swap="1g" \
    --cpus="0.8" \
    aasish1212/ai-companion-v2-backend:latest

# Wait for container to be healthy
log "Waiting for container to be healthy..."
sleep 10

# Check container status
if ! docker ps -q -f name=ai-backend | grep -q .; then
    error "Container failed to start. Check logs with: docker logs ai-backend"
fi

# Run database migrations
log "Running database migrations..."
docker exec ai-backend alembic upgrade head

# Health check
log "Performing health check..."
sleep 5
if curl -f http://localhost/api/v1/utils/health > /dev/null 2>&1; then
    log "✅ Backend is healthy and running!"
    log "API accessible at: http://$(curl -s http://checkip.amazonaws.com)/api/v1"
else
    warn "Health check failed. Check logs with: docker logs ai-backend"
fi

# Setup systemd service for auto-restart on boot
log "Setting up systemd service for auto-restart..."
sudo tee /etc/systemd/system/ai-companion.service > /dev/null << EOF
[Unit]
Description=AI Companion Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker start ai-backend
ExecStop=/usr/bin/docker stop ai-backend
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ai-companion.service

log "🎉 Deployment complete!"
log "Backend URL: http://$(curl -s http://checkip.amazonaws.com)"
log "Health check: http://$(curl -s http://checkip.amazonaws.com)/api/v1/utils/health"
log ""
log "Useful commands:"
log "  View logs: docker logs -f ai-backend"
log "  Restart: docker restart ai-backend"
log "  Update: $0"
log "  Edit config: nano $APP_DIR/.env && docker restart ai-backend"
