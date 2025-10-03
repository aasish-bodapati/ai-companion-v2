# AI Companion - Health & Wellness Platform

A comprehensive health and wellness platform with AI-powered insights, featuring both web and mobile applications for tracking fitness, nutrition, and mood.

## 🎯 Core Vision

Transform your health journey with intelligent logging and AI-powered insights. AI Companion combines precise manual data entry with AI analysis to provide personalized wellness coaching, pattern recognition, and actionable recommendations.

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

### 📱 **Cross-Platform Experience**
- **Web Application**: Full-featured web interface for comprehensive tracking
- **Mobile App**: React Native app for on-the-go logging
- **Real-time Sync**: Seamless data synchronization across platforms
- **Offline Support**: Log activities even without internet connection

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (required)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

### Mobile App Setup
```bash
cd mobile
npm install
npm start
# Scan QR code with Expo Go app
```

### First Steps
1. **Start Backend** - Run the FastAPI server
2. **Launch Mobile App** - Use Expo Go to scan QR code
3. **Complete Onboarding** - Set your health goals and preferences
4. **Start Logging** - Track your daily activities and get AI insights

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

# Mobile app tests
cd mobile
npm test
```

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs)
- [Health Logging Guide](docs/HEALTH_LOGGING.md)
- [AI Assistant Features](docs/AI_FEATURES.md)
- [Database Schemas](docs/DATABASE_SCHEMAS.md)
- [API Examples](docs/API_EXAMPLES.md)

## 🔒 Security & Privacy

- JWT authentication with secure sessions
- Password hashing with bcrypt
- Health data encryption at rest
- GDPR-compliant data handling
- Secure API endpoints with validation

## 🏗️ Technical Architecture

- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Mobile**: React Native + Expo SDK 54 + TypeScript
- **Database**: PostgreSQL with health-optimized schemas
- **AI Engine**: Configurable LLM providers (OpenRouter, OpenAI, Anthropic)
- **Memory System**: FAISS vector store for pattern recognition
- **Analytics**: Real-time health data processing and insights
