# 🚀 Railway Setup Guide

## 📋 **Step 1: Set Environment Variables in Railway**

Go to your Railway dashboard and set these variables **one by one** (don't paste the entire file):

### **Essential Variables (Required):**
```
NODE_ENV=production
MEMORY_ENABLED=false
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=your_actual_openrouter_api_key
```

### **Security Variables (Required):**
```
SECRET_KEY=generate_a_random_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### **CORS Settings (Required):**
```
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:8000"]
```

### **Optional Variables:**
```
MEMORY_IMPORTANCE_MIN=0.0
MEMORY_IMPORTANCE_MAX=1.0
LOG_LEVEL=INFO
```

## 🗄️ **Step 2: Create PostgreSQL Database**

1. **Click "New Service"** in Railway
2. **Select "Database" → "PostgreSQL"**
3. **Railway will automatically set `DATABASE_URL`**

## 🔑 **Step 3: Get Your API Keys**

- **OpenRouter API Key**: Get from [openrouter.ai](https://openrouter.ai)
- **Secret Key**: Generate a random string (32+ characters)

## ✅ **Step 4: Redeploy**

1. **Click "Redeploy"** in Railway
2. **Your app will use the new environment variables**
3. **Database will be automatically connected**

## 🌐 **Step 5: Test Your Deployment**

Your API will be available at:
- **Health Check**: `https://your-app.railway.app/api/v1/utils/health`
- **API Base**: `https://your-app.railway.app/api/v1/`

## 🎯 **Important Notes**

- **Don't paste the entire .env file** - set variables individually
- **Let Railway handle the database** - don't set DATABASE_URL manually
- **Use your actual API keys** - replace the placeholder values
- **Redeploy after setting variables** - changes don't take effect until redeploy

## 🆘 **Need Help?**

If you encounter issues:
1. Check Railway logs for errors
2. Verify all variables are set correctly
3. Make sure database service is created
4. Redeploy after any changes
