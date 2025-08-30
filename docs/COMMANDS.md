# AI Companion Commands Reference

## Development Commands

taskkill /F /IM python.exe
taskkill /F /IM uvicorn.exe
taskkill /F /IM node.exe


### Backend Development
```bash
# Navigate to backend directory
cd backend

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


# Install dependencies
pip install -r requirements.txt
pip install -r requirements.extras.txt

# Run development server



# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Run tests
pytest
pytest tests/ -v

# Code formatting and linting
black .
flake8 .
```

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## Docker Commands

### Development with Docker Compose
```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs
docker-compose logs backend
docker-compose logs frontend
```

### Production Docker Commands
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Pull latest images
docker pull aasish1212/ai-companion-v2-backend:latest
docker pull aasish1212/ai-companion-v2-frontend:latest
```

## Database Commands

### PostgreSQL/Supabase
```bash
# Connect to database
psql "postgresql://username:password@host:port/database"

# Backup database
pg_dump "postgresql://username:password@host:port/database" > backup.sql

# Restore database
psql "postgresql://username:password@host:port/database" < backup.sql

# Reset database (development only)
python backend/scripts/reset_password.py
```

## Deployment Commands

### EC2 Deployment
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Deploy using script
./scripts/deploy-ec2.sh

# Start EC2 instance
./scripts/ec2-up.sh

# Update application
docker pull aasish1212/ai-companion-v2-backend:latest
docker stop ai-backend
docker rm ai-backend
# Run container command again
```

### Vercel Deployment (Frontend)
```bash
# Deploy to Vercel
vercel deploy

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

## Utility Commands

### Git Commands
```bash
# Clone repository
git clone https://github.com/username/ai-companion-v2.git

# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "feat: description of changes"

# Push changes
git push origin feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
```

### Environment Setup
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Make scripts executable
chmod +x scripts/*.sh
chmod +x run-dev.sh

# Run development environment
./run-dev.sh
# or on Windows
./run-dev.bat
```

### Monitoring and Debugging
```bash
# View application logs
docker logs ai-backend
docker logs ai-frontend

# Monitor resource usage
docker stats

# Check running containers
docker ps

# Inspect container
docker inspect ai-backend

# Execute commands in container
docker exec -it ai-backend bash
```

### Testing Commands
```bash
# Run all tests
make test

# Run specific test suites
npm run test:e2e
pytest backend/tests/

# Generate test coverage
pytest --cov=app backend/tests/
npm run test:coverage

# Run cross-browser tests
npm run test:cross-browser
```

### Maintenance Commands
```bash
# Clean up Docker
docker system prune -a
docker volume prune

# Clean up node modules
rm -rf frontend/node_modules
npm install

# Clean up Python cache
find . -type d -name __pycache__ -delete
find . -name "*.pyc" -delete

# Update dependencies
pip-compile requirements.in
npm update
```

## Quick Reference

### Common Issues
```bash
# Port already in use
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Permission denied
sudo chown -R $USER:$USER .
chmod +x script-name.sh

# Database connection issues
# Check .env file configuration
# Verify database is running
# Check network connectivity
```

### Environment Variables
```bash
# Required backend variables
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=your_key_here
JWT_SECRET_KEY=your_secret_here

# Required frontend variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
