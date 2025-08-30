# 🚀 Beta Deployment Guide - AI Companion V2

## Quick Start for Beta Users

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd ai-companion-v2
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env_template.txt .env
# Edit .env with your API keys (see Configuration section below)

# Initialize database
python init_db.py

# Start backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

### 4. Access the Application

Visit: http://localhost:3000

## Configuration

### Required Environment Variables (backend/.env)

```bash
# LLM Configuration - Choose ONE provider
# Option 1: OpenRouter (Mistral 7B)
OPENROUTER_API_KEY=your-openrouter-api-key-here
LLM_PROVIDER=openrouter

# Option 2: OpenRouter (Fallback)
LLM_KEY=your_openrouter_api_key_here
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_PROVIDER=openrouter

# Option 3: Local Llama (Ollama)
LLM_BASE_URL=http://localhost:11434/v1
LLM_PROVIDER=llama

# Database (SQLite for development)
SQLALCHEMY_DATABASE_URI=sqlite:///data/minimal.db

# JWT Settings
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# CORS Origins
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

### Getting API Keys

#### Google AI Studio (Recommended)
1. Visit: https://aistudio.google.com/
2. Create a new project
3. Get your API key
4. Set `OPENROUTER_API_KEY` in your .env file

#### OpenRouter (Alternative)
1. Visit: https://openrouter.ai/
2. Sign up and get API key
3. Set `LLM_KEY` in your .env file

#### Local Llama (Development)
1. Install Ollama: https://ollama.ai/
2. Run: `ollama pull llama3.1:8b`
3. Start Ollama server
4. Set `LLM_BASE_URL=http://localhost:11434/v1`

## Testing the Setup

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
# Should return: {"status": "ok"}
```

### 2. Frontend Health Check
Visit: http://localhost:3000
Should show the login/registration page

### 3. Core Functionality Test

1. **Register a new user**
   - Go to http://localhost:3000/register
   - Create an account

2. **Complete onboarding**
   - Follow the onboarding wizard
   - Set your preferences

3. **Test conversation**
   - Start a new conversation
   - Say: "I like Italian food and prefer quiet restaurants"
   - Check if memory is captured

4. **Test memory attribution**
   - Ask: "What should I eat for dinner?"
   - Should reference your Italian food preference

## Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check if port 8000 is available
netstat -an | grep 8000

# Check Python version
python --version  # Should be 3.12+

# Check dependencies
pip list | grep fastapi
```

#### Frontend Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### LLM API Errors
```bash
# Check API key configuration
cat backend/.env | grep LLM

# Test API connection
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://generativelanguage.googleapis.com/v1beta/models
```

#### Database Issues
```bash
# Reset database
cd backend
rm data/minimal.db
python init_db.py
```

### Logs and Debugging

#### Backend Logs
```bash
# Start with debug logging
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --log-level debug
```

#### Frontend Logs
```bash
# Check browser console for errors
# Check terminal for build errors
npm run build
```

## Beta User Guidelines

### What to Test

1. **User Registration & Onboarding**
   - [ ] Registration works
   - [ ] Onboarding flow is clear
   - [ ] Preferences are saved

2. **Core Chat Functionality**
   - [ ] Conversations can be created
   - [ ] Messages are sent and received
   - [ ] LLM responses are coherent

3. **Memory System**
   - [ ] Personal information is captured
   - [ ] Memories are attributed in responses
   - [ ] Memory management interface works

4. **Error Handling**
   - [ ] Graceful handling of API errors
   - [ ] Clear error messages
   - [ ] Recovery from failures

### Reporting Issues

When reporting issues, please include:

1. **Environment Details**
   - Operating system
   - Node.js version
   - Python version
   - Browser (if frontend issue)

2. **Steps to Reproduce**
   - Exact steps taken
   - Expected vs actual behavior
   - Screenshots if applicable

3. **Error Messages**
   - Full error text
   - Console logs
   - Network tab information

4. **Configuration**
   - Which LLM provider you're using
   - Any custom configuration

### Performance Expectations

- **Page Load Time**: < 3 seconds
- **Message Response Time**: < 5 seconds
- **Memory Retrieval**: < 2 seconds
- **System Uptime**: > 95%

## Security Notes

### Development Environment
- Uses SQLite database (not for production)
- JWT tokens with 8-day expiration
- CORS configured for localhost only

### Production Considerations
- Use PostgreSQL for production
- Implement proper rate limiting
- Add HTTPS enforcement
- Configure proper CORS origins
- Use environment-specific secrets

## Support

For beta support:
- Create issues in the repository
- Include detailed reproduction steps
- Attach relevant logs and screenshots
- Specify your environment configuration

---

**Ready for Beta Testing!** 🚀

The core infrastructure is complete and ready for beta users. The main remaining task is configuring the LLM provider of your choice.
