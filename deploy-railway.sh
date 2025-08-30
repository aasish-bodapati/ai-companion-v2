#!/bin/bash

# Railway Deployment Script for AI Companion
echo "🚀 Deploying AI Companion to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway..."
    railway login
fi

# Create new project (if doesn't exist)
echo "📁 Setting up Railway project..."
if [ ! -f ".railway" ]; then
    echo "Creating new Railway project..."
    railway init
else
    echo "Using existing Railway project..."
fi

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set MEMORY_ENABLED=false

# Deploy backend
echo "🐍 Deploying backend..."
cd backend
railway up --service backend
cd ..

# Deploy frontend
echo "⚛️ Deploying frontend..."
cd frontend
railway up --service frontend
cd ..

# Get deployment URLs
echo "🌐 Getting deployment URLs..."
railway status

echo "✅ Deployment complete!"
echo "🔗 Check your Railway dashboard for the live URLs"
echo "📊 Monitor usage at: https://railway.app/dashboard"
