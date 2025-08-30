#!/bin/bash

# Deploy AI Companion Backend on EC2 Instance
# Run this script on your EC2 instance after infrastructure setup

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying AI Companion Backend on EC2${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install required packages
echo -e "${GREEN}📦 Installing required packages...${NC}"
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
echo -e "${GREEN}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "  ✅ Docker installed"
else
    echo "  ℹ️  Docker already installed"
fi

# Install Docker Compose
echo -e "${GREEN}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "  ✅ Docker Compose installed"
else
    echo "  ℹ️  Docker Compose already installed"
fi

# Create application directory
APP_DIR="/home/$(whoami)/ai-companion"
echo -e "${GREEN}📁 Creating application directory: ${APP_DIR}${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone your repository (replace with your actual repo URL)
echo -e "${GREEN}📥 Cloning repository...${NC}"
if [[ ! -d ".git" ]]; then
    # Replace with your actual repository URL
    git clone https://github.com/yourusername/ai-companion-v2.git .
    echo "  ✅ Repository cloned"
else
    echo "  ℹ️  Repository already exists, pulling latest changes"
    git pull origin main
fi

# Create production environment file
echo -e "${GREEN}📝 Creating production environment file...${NC}"
if [[ ! -f ".env" ]]; then
    echo -e "${YELLOW}⚠️  Please create .env file with your production configuration${NC}"
    echo "You can copy from .env.production and update the values:"
    echo "cp backend/.env.production .env"
    echo "nano .env"
    echo ""
    echo "Required updates:"
    echo "1. LLM_API_KEY - Your OpenRouter API key"
    echo "2. CLAUDE_API_KEY - Your Claude API key"
    echo "3. BACKEND_CORS_ORIGINS - Your Vercel domain"
    echo ""
    read -p "Press Enter after creating .env file..."
else
    echo "  ✅ Environment file exists"
fi

# Build and start the backend
echo -e "${GREEN}🏗️  Building and starting backend...${NC}"
cd backend

# Build the Docker image
echo "  🔨 Building Docker image..."
docker build -t ai-companion-backend:latest .

# Stop existing container if running
if docker ps -q -f name=ai-backend | grep -q .; then
    echo "  🛑 Stopping existing container..."
    docker stop ai-backend
    docker rm ai-backend
fi

# Run the container (optimized for t2.micro free tier)
echo "  🚀 Starting backend container..."
docker run -d \
    --name ai-backend \
    --restart unless-stopped \
    -p 8000:8000 \
    --env-file ../.env \
    --memory="800m" \
    --memory-swap="1g" \
    --cpus="0.5" \
    ai-companion-backend:latest

# Wait for container to be healthy
echo -e "${YELLOW}⏳ Waiting for container to be healthy...${NC}"
sleep 15

# Check container status
if ! docker ps -q -f name=ai-backend | grep -q .; then
    echo -e "${RED}❌ Container failed to start. Check logs:${NC}"
    docker logs ai-backend
    exit 1
fi

# Run database migrations
echo -e "${GREEN}🗄️  Running database migrations...${NC}"
docker exec ai-backend alembic upgrade head

# Health check
echo -e "${GREEN}🏥 Performing health check...${NC}"
sleep 5
if curl -f http://localhost:8000/api/v1/utils/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy and running!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed. Check logs:${NC}"
    docker logs ai-backend
fi

# Setup Nginx reverse proxy
echo -e "${GREEN}🌐 Setting up Nginx reverse proxy...${NC}"
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/ai-companion > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/api/v1/utils/health;
        proxy_set_header Host $host;
    }

    # Root redirect
    location / {
        return 301 https://your-app.vercel.app;
    }

    # Logging
    access_log /var/log/nginx/ai-companion-access.log;
    error_log /var/log/nginx/ai-companion-error.log;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/ai-companion /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "  ✅ Nginx configured and started"

# Setup systemd service for auto-restart
echo -e "${GREEN}⚙️  Setting up systemd service...${NC}"
sudo tee /etc/systemd/system/ai-companion.service > /dev/null << EOF
[Unit]
Description=AI Companion Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/docker start ai-backend
ExecStop=/usr/bin/docker stop ai-backend
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ai-companion.service

echo "  ✅ Systemd service configured"

# Setup log rotation
echo -e "${GREEN}📋 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/ai-companion > /dev/null << 'EOF'
/home/*/ai-companion/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF

echo "  ✅ Log rotation configured"

# Create logs directory
mkdir -p $APP_DIR/logs

# Final status check
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo -e "${GREEN}📊 Status Summary:${NC}"
echo "=================================="
echo "Backend Container: $(docker ps -q -f name=ai-backend | wc -l) running"
echo "Nginx Status: $(systemctl is-active nginx)"
echo "Backend Health: $(curl -s http://localhost:8000/api/v1/utils/health | jq -r '.status' 2>/dev/null || echo 'Unknown')"
echo ""
echo -e "${GREEN}🌐 Access URLs:${NC}"
echo "Backend API: http://$(curl -s http://checkip.amazonaws.com)/api/v1"
echo "Health Check: http://$(curl -s http://checkip.amazonaws.com)/health"
echo ""
echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo "View logs: docker logs -f ai-backend"
echo "Restart backend: docker restart ai-backend"
echo "Restart nginx: sudo systemctl restart nginx"
echo "View nginx logs: sudo tail -f /var/log/nginx/ai-companion-error.log"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Update your Vercel frontend to use the new backend URL"
echo "2. Test the API endpoints"
echo "3. Set up SSL certificate with Let's Encrypt"
echo "4. Configure monitoring and alerts"
echo "5. Set up automated backups"

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo ""
echo -e "${GREEN}🎯 Your backend is now accessible at:${NC}"
echo "http://${PUBLIC_IP}/api/v1"
echo ""
echo -e "${GREEN}🔐 Update your Vercel frontend environment variables:${NC}"
echo "NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}/api/v1"
