# AI Companion Deployment Guide

This guide covers deploying the AI Companion application using Docker, Vercel, and GitHub Actions.

## 🐳 Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- PostgreSQL database (or use the included PostgreSQL container)
- Redis (optional, for caching and rate limiting)

### Local Development with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-companion-v2
   ```

2. **Set up environment variables**
   ```bash
   # Copy and edit the environment template
   cp backend/env_template.txt backend/.env
   ```

3. **Start the application**
   ```bash
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5432

### Production Deployment

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.yml --profile production build
   ```

2. **Start production stack**
   ```bash
   docker-compose -f docker-compose.yml --profile production up -d
   ```

3. **Set up SSL certificates** (recommended for production)
   ```bash
   # Create SSL directory
   mkdir ssl
   
   # Add your SSL certificates
   # - ssl/cert.pem (certificate)
   # - ssl/key.pem (private key)
   ```

## 🚀 Vercel Deployment

### Frontend Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure environment variables**
   - Go to Vercel Dashboard
   - Navigate to your project settings
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL`: Your backend API URL

### Backend Deployment

The backend can be deployed to various platforms:

#### Option 1: Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

#### Option 2: Heroku
1. Create a new Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy using Heroku CLI

#### Option 3: DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

## 🔄 GitHub Actions CI/CD

The project includes a comprehensive CI/CD pipeline that:

### What it does:
- **Backend Tests**: Runs Python tests with PostgreSQL
- **Frontend Tests**: Runs React/Next.js tests and linting
- **Integration Tests**: End-to-end testing
- **Security Scanning**: Vulnerability scanning with Trivy
- **Docker Builds**: Builds production Docker images
- **Deployment**: Automatic deployment to staging/production

### Setup:

1. **Enable GitHub Actions**
   - Go to your repository settings
   - Enable GitHub Actions

2. **Set up environments**
   - Create `staging` and `production` environments
   - Add required secrets:
     - `DATABASE_URL`
     - `SECRET_KEY`
     - `LLM_API_KEY`
     - `VERCEL_TOKEN` (for Vercel deployment)

3. **Configure branch protection**
   - Require status checks to pass
   - Require pull request reviews
   - Enable automatic deployment

## 🔧 Environment Configuration

### Required Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
SECRET_KEY=your-secret-key-here

# LLM Configuration
LLM_PROVIDER=openrouter  # or stub, openai, anthropic
LLM_API_KEY=your-api-key
LLM_MODEL_DEFAULT=mistralai/mistral-7b-instruct

# Streaming
STREAMING_ENABLED=true

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000", "https://your-domain.com"]

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 📊 Monitoring and Health Checks

### Health Check Endpoints
- Backend: `GET /api/v1/public/health`
- Frontend: `GET /health`
- Docker: Automatic health checks configured

### Monitoring Setup
1. **Application Monitoring**: Set up Sentry or similar
2. **Infrastructure Monitoring**: Use your cloud provider's monitoring
3. **Logs**: Configure log aggregation (ELK stack, etc.)

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Use strong, unique SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database connection encryption
- [ ] API key rotation

### SSL/TLS Setup
```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d your-domain.com

# Or manually configure SSL in nginx.conf
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   docker-compose ps postgres
   
   # View database logs
   docker-compose logs postgres
   ```

2. **Streaming Not Working**
   - Verify `STREAMING_ENABLED=true`
   - Check nginx configuration for WebSocket support
   - Ensure proper CORS headers

3. **Frontend Build Errors**
   ```bash
   # Clear Next.js cache
   cd frontend
   rm -rf .next
   npm run build
   ```

4. **Docker Build Failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

## 📈 Performance Optimization

### Backend Optimization
- Enable database connection pooling
- Configure Redis caching
- Use CDN for static assets
- Enable gzip compression

### Frontend Optimization
- Enable Next.js image optimization
- Configure proper caching headers
- Use dynamic imports for code splitting
- Optimize bundle size

## 🔄 Updates and Maintenance

### Updating the Application
1. Pull latest changes: `git pull origin main`
2. Update dependencies: `npm install` / `pip install -r requirements.txt`
3. Run migrations: `alembic upgrade head`
4. Restart services: `docker-compose restart`

### Database Migrations
```bash
# Run migrations
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

### Backup Strategy
- Regular database backups
- Configuration backups
- Code repository backups
- Disaster recovery plan

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review logs: `docker-compose logs`
3. Verify environment variables
4. Check GitHub Actions for build errors
5. Consult the project documentation
