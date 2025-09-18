# HealthLog AI - Your Personal Wellness Assistant

A comprehensive AI-powered health and wellness companion that combines manual logging with intelligent insights. Track your fitness, nutrition, and mood while receiving personalized coaching and pattern recognition from your AI assistant.

## 🎯 Core Vision

Transform your health journey with intelligent logging and AI-powered insights. HealthLog AI combines the precision of manual data entry with the intelligence of AI analysis to provide personalized wellness coaching, pattern recognition, and actionable recommendations.

## ✨ Key Features

### 📊 **Comprehensive Health Logging**
- **Fitness Tracking**: Activities, duration, calories, distance, weight training
- **Nutrition Logging**: Meals, macros, food items with detailed breakdowns
- **Mood & Energy**: Daily mood ratings, energy levels, and activity tracking
- **Smart Analytics**: Visual dashboards and trend analysis

### 🤖 **AI-Powered Personal Assistant**
- **Pattern Recognition**: Identify correlations between diet, exercise, and mood
- **Personalized Insights**: Get tailored recommendations based on your data
- **Goal Tracking**: Set and monitor health and wellness objectives
- **Memory System**: Learn from your preferences and past behaviors

### 🎨 **Intuitive User Experience**
- **Manual Logging**: Precise data entry through beautiful, responsive forms
- **Quick Actions**: Fast logging for common activities
- **Real-time Validation**: Instant feedback and error prevention
- **Mobile-First Design**: Log anywhere, anytime

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### First Steps
1. **Register** your account at `http://localhost:3000/register`
2. **Complete** the health onboarding to set your goals
3. **Start Logging** your daily activities in the Health Log
4. **Get Insights** from your AI assistant based on your data

## 🔧 Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

- `SECRET_KEY`: Generate with `openssl rand -hex 32`
- `LLM_API_KEY`: Your LLM provider API key (OpenRouter, OpenAI, or Anthropic)
- `SQLALCHEMY_DATABASE_URI`: Database connection string

## 🎯 Use Cases

### For Fitness Enthusiasts
- Track workouts, sets, reps, and progress
- Monitor calorie burn and energy levels
- Get AI insights on training patterns
- Set and achieve fitness goals

### For Nutrition Focus
- Log detailed meal information
- Track macronutrients and calories
- Identify eating patterns and correlations
- Receive personalized nutrition advice

### For Wellness Tracking
- Monitor mood and energy throughout the day
- Connect lifestyle factors with wellbeing
- Track progress toward health goals
- Get AI-powered wellness insights

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm run test:all
```

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs)
- [Health Logging Guide](docs/HEALTH_LOGGING.md)
- [AI Assistant Features](docs/AI_FEATURES.md)

## 🔒 Security & Privacy

- JWT authentication with secure sessions
- Password hashing with bcrypt
- Health data encryption at rest
- GDPR-compliant data handling
- Secure API endpoints with validation

## 🏗️ Technical Architecture

- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL/SQLite with health-optimized schemas
- **AI Engine**: Configurable LLM providers (OpenRouter, OpenAI, Anthropic)
- **Memory System**: FAISS vector store for pattern recognition
- **Analytics**: Real-time health data processing and insights
