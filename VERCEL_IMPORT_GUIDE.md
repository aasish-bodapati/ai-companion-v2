# 🚀 Vercel Environment Import Guide

## 📁 **Import Environment File to Vercel**

### **Step 1: Go to Vercel Dashboard**
1. Visit [vercel.com](https://vercel.com)
2. Select your `ai-companion-v2` project
3. Go to **Settings** → **Environment Variables**

### **Step 2: Import Environment File**
1. **Click "Import" button** (usually in the top right)
2. **Select the `vercel.env` file** from your project
3. **Click "Import"** to add all variables at once

### **Step 3: Verify Variables**
After import, you should see these variables:
- ✅ `NEXT_PUBLIC_API_URL`
- ✅ `NEXT_PUBLIC_API_HEALTH_URL`
- ✅ `NEXT_PUBLIC_MEMORY_ENABLED`
- ✅ `NEXT_PUBLIC_DEBUG_MODE`
- ✅ `NEXT_PUBLIC_APP_NAME`
- ✅ `NEXT_PUBLIC_APP_VERSION`
- ✅ `NEXT_PUBLIC_ENVIRONMENT`

### **Step 4: Deploy**
1. **Push changes to GitHub** (auto-deploy)
2. **Or manually redeploy** from Vercel dashboard

## 🔗 **What This Connects:**

- **Frontend**: `https://ai-companion-v2.vercel.app`
- **Backend**: `https://ai-companion-v2-production.up.railway.app/api/v1`

## ✅ **Success Check:**

After deployment, visit your Vercel app and check the browser console. You should see:
- ✅ No CORS errors
- ✅ API calls to Railway backend
- ✅ App loads successfully

## 🆘 **Need Help?**

If import fails:
1. Make sure you're in the right Vercel project
2. Check that `vercel.env` file is accessible
3. Try importing variables one by one instead
