# AI Companion Commands Reference

## 🚀 Essential Commands

### Start Python Server
```bash
# From backend/ directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Stop Python Server
```bash
# Kill process on port 8000 (Windows)
taskkill /f /im python.exe

# Or kill by port (Windows)
netstat -ano | findstr :8000
taskkill /f /pid <PID_NUMBER>
```


