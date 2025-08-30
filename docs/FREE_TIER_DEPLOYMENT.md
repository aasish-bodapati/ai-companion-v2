# 🆓 Free Tier Deployment Guide

This guide will help you deploy your AI Companion app to free tier services, optimized for minimal resource usage.

## 🎯 **What We've Optimized**

### **Image Size Reduction**
- **Before**: 18GB Docker image
- **After**: ~500MB-1GB Docker image
- **Savings**: 90%+ reduction

### **Resource Usage**
- **Backend**: 512MB RAM, 0.5 CPU
- **Frontend**: 256MB RAM, 0.25 CPU
- **Database**: 256MB RAM, 0.25 CPU
- **Total**: ~1GB RAM, 1 CPU

## 🚀 **Deployment Options**

### **1. Railway.app (Recommended)**
- **Free tier**: $5/month credit
- **RAM**: Up to 512MB per service
- **Deployment**: Git-based, very simple
- **Cost**: $5/month after free tier

### **2. Render.com**
- **Free tier**: 750 hours/month
- **RAM**: 512MB
- **Deployment**: Git-based, easy setup
- **Cost**: $7/month after free tier

### **3. Fly.io**
- **Free tier**: 3 shared-cpu VMs, 3GB storage
- **RAM**: 256MB per VM
- **Deployment**: Docker-based
- **Cost**: Pay-as-you-use after free tier

## 🐳 **Quick Start with Railway**

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login to Railway**
```bash
railway login
```

### **Step 3: Deploy Backend**
```bash
cd backend
railway init
railway up --service backend
```

### **Step 4: Deploy Frontend**
```bash
cd frontend
railway init
railway up --service frontend
```

### **Step 5: Set Environment Variables**
```bash
railway variables set OPENAI_API_KEY=your_api_key
railway variables set DATABASE_URL=your_db_url
```

## 🔧 **Manual Deployment Steps**

### **1. Build Optimized Images**
```bash
# Backend
cd backend
docker build -f Dockerfile.free-tier -t ai-companion-backend:free-tier .

# Frontend
cd frontend
docker build -f Dockerfile.free-tier -t ai-companion-frontend:free-tier .
```

### **2. Test Locally**
```bash
# Test the optimized setup
docker-compose -f docker-compose.free-tier.yml up -d

# Check resource usage
docker stats
```

### **3. Deploy to Railway**
```bash
# Use the deployment script
chmod +x deploy-railway.sh
./deploy-railway.sh
```

## 📊 **Resource Optimization Details**

### **Backend Optimizations**
- **Alpine Linux**: Smaller base image
- **Minimal dependencies**: Only essential packages
- **No heavy ML libraries**: Disabled by default
- **Streaming responses**: Reduce memory usage
- **Lazy loading**: Load models only when needed

### **Frontend Optimizations**
- **Production build**: Only necessary files
- **Tree shaking**: Remove unused code
- **Image optimization**: Compress assets
- **CDN usage**: External asset hosting

### **Database Optimizations**
- **PostgreSQL Alpine**: Smaller image
- **Connection pooling**: Efficient connections
- **Index optimization**: Faster queries
- **Data archiving**: Remove old data

## 🌐 **Environment Configuration**

### **Required Variables**
```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:port/db
OPENAI_API_KEY=your_openai_key
MEMORY_ENABLED=false
LLM_BASE_URL=https://openrouter.ai/api/v1

# Frontend
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

### **Optional Variables**
```bash
# Performance tuning
WORKERS=1
MAX_CONNECTIONS=10
TIMEOUT=30

# Monitoring
LOG_LEVEL=INFO
METRICS_ENABLED=false
```

## 📈 **Scaling Strategy**

### **Phase 1: Free Tier (0-3 months)**
- **Railway**: $5/month credit
- **Features**: Basic functionality
- **Users**: 10-100 users
- **Cost**: $0-5/month

### **Phase 2: Growth (3-6 months)**
- **Railway**: Paid plan ($10-20/month)
- **Features**: Full functionality
- **Users**: 100-1000 users
- **Cost**: $10-20/month

### **Phase 3: Scale (6+ months)**
- **AWS/GCP**: Optimized setup
- **Features**: Enterprise features
- **Users**: 1000+ users
- **Cost**: $50-200/month

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Out of Memory**
```bash
# Check memory usage
docker stats

# Reduce memory limits
deploy:
  resources:
    limits:
      memory: 256M  # Reduce from 512M
```

#### **Build Failures**
```bash
# Check Dockerfile syntax
docker build -f Dockerfile.free-tier .

# Verify requirements
pip install -r requirements.free-tier.txt
```

#### **Deployment Issues**
```bash
# Check Railway logs
railway logs

# Verify environment variables
railway variables
```

### **Performance Monitoring**
```bash
# Check resource usage
railway status

# Monitor logs
railway logs --follow

# View metrics
railway dashboard
```

## 💰 **Cost Optimization Tips**

### **1. Use Spot Instances (when available)**
- **Railway**: No spot instances
- **Render**: No spot instances
- **Fly.io**: Pay-per-use model

### **2. Optimize Resource Allocation**
- **Start small**: Begin with minimal resources
- **Scale gradually**: Add resources as needed
- **Monitor usage**: Track actual consumption

### **3. Use Free Tier Credits**
- **Railway**: $5/month credit
- **Render**: 750 free hours
- **Fly.io**: 3 free VMs

## 🔮 **Future Upgrades**

### **When to Move to Paid Plans**
- **Memory usage**: Consistently >80%
- **CPU usage**: Consistently >80%
- **User growth**: >100 active users
- **Feature needs**: Require heavy ML features

### **Migration Path**
1. **Railway paid** ($10-20/month)
2. **AWS t3.medium** ($30/month)
3. **AWS t3.large** ($60/month)
4. **Custom infrastructure** ($100+/month)

## 📞 **Support & Resources**

### **Railway Support**
- **Documentation**: https://docs.railway.app
- **Discord**: https://discord.gg/railway
- **GitHub**: https://github.com/railwayapp

### **Community Resources**
- **Stack Overflow**: Tag with 'railway'
- **Reddit**: r/railway
- **Twitter**: @railwayapp

---

## ✅ **Deployment Checklist**

- [ ] Install Railway CLI
- [ ] Login to Railway
- [ ] Build optimized images
- [ ] Test locally
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Set environment variables
- [ ] Test deployment
- [ ] Monitor resources
- [ ] Set up monitoring

---

**Congratulations! You now have a free tier deployment setup! 🎉**
