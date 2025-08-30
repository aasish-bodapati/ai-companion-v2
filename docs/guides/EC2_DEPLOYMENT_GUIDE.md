# EC2 Deployment Guide - AI Companion Backend

Complete guide for deploying the FastAPI backend on AWS EC2 Free Tier with external database.

## Prerequisites

- AWS EC2 instance (t2.micro/t3.micro, Ubuntu 22.04 LTS)
- Security Group allowing inbound HTTP (port 80) and SSH (port 22)
- Supabase or Neon database URL
- OpenRouter API key (or other LLM provider)

## Quick Deploy Commands

### 1. SSH into your EC2 instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 2. Run the deployment script
```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/ai-companion-v2/main/scripts/deploy-ec2.sh -o deploy-ec2.sh
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### 3. Configure environment variables
The script will create a `.env` template. Edit it with your values:
```bash
nano /home/ubuntu/ai-companion/.env
```

Required variables:
```env
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-long-random-secret-key
LLM_API_KEY=your-openrouter-api-key
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
```

### 4. Start the backend
```bash
./deploy-ec2.sh
```

## Manual Deployment Steps

If you prefer manual control:

### 1. Install Docker
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in
```

### 2. Create application directory
```bash
mkdir -p ~/ai-companion
cd ~/ai-companion
```

### 3. Create .env file
```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:pass@host:port/database
SECRET_KEY=your-generated-secret-key
LLM_PROVIDER=openrouter
LLM_API_KEY=your-api-key
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
MEMORY_ENABLED=false
MEMORY_PROVIDER=none
RATE_LIMIT_ENABLED=false
EOF
```

### 4. Run the container
```bash
# Stop any existing container
docker stop ai-backend 2>/dev/null || true
docker rm ai-backend 2>/dev/null || true

# Run new container
docker run -d \
    --name ai-backend \
    --restart unless-stopped \
    -p 80:8000 \
    --env-file .env \
    --memory="800m" \
    --memory-swap="1g" \
    --cpus="0.8" \
    aasish1212/ai-companion-v2-backend:latest
```

### 5. Run database migrations
```bash
docker exec ai-backend alembic upgrade head
```

### 6. Verify deployment
```bash
# Check container status
docker ps

# Check logs
docker logs ai-backend

# Health check
curl http://localhost/api/v1/utils/health
```

## Auto-restart on EC2 reboot

The deployment script automatically sets up a systemd service. To manually configure:

```bash
sudo tee /etc/systemd/system/ai-companion.service > /dev/null << EOF
[Unit]
Description=AI Companion Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/ai-companion
ExecStart=/usr/bin/docker start ai-backend
ExecStop=/usr/bin/docker stop ai-backend
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ai-companion.service
```

## Resource Optimization for Free Tier

The deployment is optimized for 1GB RAM:
- Single Uvicorn worker
- Memory limit: 800MB
- CPU limit: 0.8 cores
- Memory features disabled
- Minimal system dependencies

## Useful Commands

```bash
# View logs
docker logs -f ai-backend

# Restart backend
docker restart ai-backend

# Update to latest image
docker pull aasish1212/ai-companion-v2-backend:latest
docker stop ai-backend
docker rm ai-backend
# Then run the container command again

# Edit configuration
nano ~/ai-companion/.env
docker restart ai-backend

# Check resource usage
docker stats ai-backend

# Shell into container
docker exec -it ai-backend bash
```

## Troubleshooting

### Container won't start
```bash
docker logs ai-backend
# Common issues: invalid DATABASE_URL, missing SECRET_KEY
```

### Out of memory
```bash
# Check system memory
free -h
# Check container memory
docker stats ai-backend
# Consider using swap or upgrading instance
```

### Database connection issues
```bash
# Test database connection
docker exec ai-backend python -c "
import os
from sqlalchemy import create_engine
engine = create_engine(os.getenv('DATABASE_URL'))
conn = engine.connect()
print('Database connection successful')
conn.close()
"
```

### Health check fails
```bash
# Check if port 80 is accessible
curl -v http://localhost/api/v1/utils/health

# Check security group allows inbound HTTP (port 80)
# Check if another service is using port 80
sudo netstat -tulpn | grep :80
```

## Frontend Configuration

Update your Vercel environment variables:
```
NEXT_PUBLIC_API_URL=http://your-ec2-public-ip/api/v1
```

For production, use a domain name and HTTPS:
1. Point your domain to the EC2 public IP
2. Use Cloudflare or AWS CloudFront for HTTPS
3. Update CORS origins in `.env`

## Security Considerations

- Use HTTPS in production (Cloudflare, ALB, or reverse proxy)
- Restrict Security Group to necessary ports only
- Regularly update the EC2 instance and Docker images
- Use AWS Secrets Manager for sensitive values in production
- Enable CloudWatch monitoring for production deployments
