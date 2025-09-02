#!/usr/bin/env python3
"""
MVP Startup Script - Get your AI Companion running in 2 minutes!
"""

import subprocess
import sys
import time

def start_backend():
    """Start the FastAPI backend server"""
    print("🚀 Starting Backend Server...")
    try:
        # Start the server in the background
        subprocess.Popen([
            sys.executable, "-m", "uvicorn", "app.main:app", 
            "--reload", "--host", "0.0.0.0", "--port", "8000"
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print("✅ Backend server starting...")
        time.sleep(3)  # Wait for server to start
        
        # Test if server is running
        import requests
        try:
            response = requests.get("http://localhost:8000/docs")
            if response.status_code == 200:
                print("✅ Backend server is running at http://localhost:8000")
                print("📚 API docs available at http://localhost:8000/docs")
                return True
        except Exception:
            pass
        
        print("⚠️ Backend server may still be starting...")
        return True
        
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return False

def main():
    """Main MVP startup function"""
    print("🎯 AI COMPANION MVP LAUNCH")
    print("=" * 40)
    print("Getting you to MVP in 2 minutes...")
    print()
    
    # Start backend
    if start_backend():
        print()
        print("🎉 BACKEND IS RUNNING!")
        print()
        print("📱 NEXT STEPS:")
        print("1. Open a NEW terminal")
        print("2. Navigate to the frontend directory:")
        print("   cd ../frontend")
        print("3. Start the frontend:")
        print("   npm run dev")
        print()
        print("🌐 Your MVP will be available at:")
        print("   Frontend: http://localhost:3000")
        print("   Backend:  http://localhost:8000")
        print("   Demo:     http://localhost:3000/two-mode-demo")
        print()
        print("🚀 You're ready to test your two-mode AI companion!")
        print()
        print("💡 Quick Test:")
        print("- Go to /two-mode-demo")
        print("- Switch between Action and Conversation modes")
        print("- Log some actions (workouts, meals, mood)")
        print("- Have a conversation")
    else:
        print("❌ Failed to start MVP. Check the logs above.")

if __name__ == "__main__":
    main()
