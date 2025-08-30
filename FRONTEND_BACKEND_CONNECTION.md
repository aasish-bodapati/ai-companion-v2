# 🔗 Frontend-Backend Connection Guide

## 🚀 **Connect Vercel Frontend to Railway Backend**

### **Step 1: Update Railway CORS Settings**

Go to your Railway dashboard and update the `BACKEND_CORS_ORIGINS` variable:

```
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:8000","https://ai-companion-v2.vercel.app"]
```

**Your Vercel domain is: `ai-companion-v2.vercel.app`**

### **Step 2: Set Vercel Environment Variables**

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

#### **Required Variables:**
```
NEXT_PUBLIC_API_URL=https://ai-companion-v2-production.up.railway.app/api/v1
```

#### **Optional Variables:**
```
NEXT_PUBLIC_API_HEALTH_URL=https://ai-companion-v2-production.up.railway.app/api/v1/utils/health
NEXT_PUBLIC_MEMORY_ENABLED=false
NEXT_PUBLIC_DEBUG_MODE=false
```

**Your Railway backend domain is: `ai-companion-v2-production.up.railway.app`**

### **Step 3: Redeploy Both Services**

1. **Railway**: Click "Redeploy" after updating CORS
2. **Vercel**: Push changes to GitHub (auto-deploy) or manually redeploy

### **Step 4: Test the Connection**

#### **Test Backend Health:**
```bash
curl https://ai-companion-v2-production.up.railway.app/api/v1/utils/health
```

#### **Test Frontend API Call:**
Visit your Vercel app and check the browser console for any CORS errors.

## 🔧 **Troubleshooting Common Issues**

### **CORS Error:**
```
Access to fetch at 'https://your-app.railway.app/api/v1/...' from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**Solution**: Make sure your Railway CORS includes your Vercel domain exactly.

### **API Not Found:**
```
404 Not Found
```

**Solution**: Verify your Railway backend is running and the URL is correct.

### **Environment Variables Not Working:**
**Solution**: 
1. Check Vercel environment variables are set correctly
2. Redeploy Vercel after setting variables
3. Verify variable names start with `NEXT_PUBLIC_`

## 📱 **Local Development Setup**

For local development, you can override the API URL:

```bash
# Run frontend locally with Railway backend
NEXT_PUBLIC_API_URL=https://your-app.railway.app/api/v1 npm run dev
```

## 🌐 **Production URLs**

- **Backend API**: `https://ai-companion-v2-production.up.railway.app/api/v1`
- **Frontend App**: `https://ai-companion-v2.vercel.app`
- **Health Check**: `https://ai-companion-v2-production.up.railway.app/api/v1/utils/health`

## ✅ **Success Indicators**

- ✅ Frontend loads without console errors
- ✅ API calls to Railway backend succeed
- ✅ No CORS errors in browser console
- ✅ Health check endpoint returns 200 OK

## 🆘 **Need Help?**

1. Check Railway logs for backend errors
2. Check Vercel deployment logs for frontend errors
3. Verify environment variables are set correctly
4. Ensure both services are redeployed after changes
