# AI Companion - Project Context & Ground Truths

## 🎯 **Project Overview**
AI-powered health and wellness platform that combines manual logging with intelligent insights. Built for busy professionals who need simple, fast health tracking with clean data visualization across web and mobile platforms.

## 🏗️ **Architecture & Tech Stack**

### Backend (FastAPI + PostgreSQL)
- **Framework**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL (REQUIRED - never use SQLite)
- **Authentication**: JWT with bcrypt password hashing
- **API Structure**: Feature-based organization (`/api/health/`, `/api/core/`)
- **Key Services**: Indian food database, AI insights
- **Migration**: Alembic for database schema management

### Mobile (React Native + Expo)
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with bottom tabs
- **State Management**: React Context (AuthContext)
- **Key Screens**: Dashboard, Fitness, Nutrition, Analytics, Profile
- **Components**: Feature-based organization with reusable UI components

## 🎯 **Core Features**

### Health Logging
- **Fitness Tracking**: Activities, duration, calories, distance, weight training
- **Nutrition Logging**: Meals, macros, food items with detailed breakdowns  
- **Mood & Energy**: Daily mood ratings, energy levels, sleep quality
- **Water Intake**: Hydration tracking
- **Analytics**: Visual dashboards and trend analysis

### AI-Powered Features
- **Pattern Recognition**: Correlations between diet, exercise, and mood
- **Personalized Insights**: Tailored recommendations based on user data
- **Memory System**: FAISS vector store for learning user preferences

### Dashboard & Analytics (Latest)
- **Personalized Dashboard**: Dynamic welcome, micro-goals, quick stats, body type hero card
- **Integrated Stats**: Combined nutrition, water, mood tracking with progress indicators
- **Health Logging Cards**: Consolidated activity and wellness logging with circular progress
- **Priority AI Insights**: Color-coded, actionable recommendations with one-tap actions
- **Weekly Summary**: Trend visualization with gamification and motivational feedback
- **Analytics Redesign**: Time period filters, goal alignment tracking, comparison insights
- **Achievement System**: Progress-based badges, streaks, and gamification elements
- **Interactive Charts**: Time-based trends with data point interaction and statistics

## 📊 **Database Schema**

### Core Tables
- **users**: Integer IDs (migrated from UUIDs)
- **fitness_logs**: Workout activities with detailed metrics
- **nutrition_logs**: Meal logging with macro breakdowns
- **mood_logs**: Daily wellness tracking
- **simple_routines**: Workout routine templates
- **nutrition_routines**: Meal plan templates

### Key Relationships
- All health logs linked to users via `user_id` (integer)
- Routines support both fitness and nutrition tracking
- Comprehensive health profile and goal tracking

## 🚨 **Critical Ground Truths**

### Database
- **ALWAYS use PostgreSQL** - never SQLite
- **Integer IDs** - migrated from UUIDs, use SERIAL primary keys
- **Timezone Support** - All timestamps are timezone-aware
- **Data Validation** - Comprehensive field constraints and validation

### Development Environment
- **Servers Always Running** - Assume backend and mobile dev servers are running in dev mode
- **No Server Control** - AI assistant has NO authority to stop/start/restart servers
- **Never Restart Servers** - Don't stop/start servers without explicit user permission
- **PowerShell Commands** - Use PowerShell syntax for Windows commands
- **Dev Mode Only** - All servers run in development mode by default

### Code Standards
- **Feature-Based Organization** - Group related functionality together
- **Type Safety** - Comprehensive TypeScript types throughout
- **Error Handling** - Proper validation and error responses
- **Cross-Platform Sync** - Seamless data synchronization between web and mobile

## 🎨 **User Experience Principles**

### Core Philosophy
- **Simple, Fast Logging** - Under 30 seconds per entry
- **Clean Data Visualization** - Easy progress tracking
- **Mobile-First Design** - Optimized for mobile logging
- **Founder-Tested** - Built by someone who uses it daily

### Target Users
- **Busy Professionals** - 9-5 workers with limited time
- **Health-Conscious Individuals** - Track workouts and nutrition
- **Results-Focused Users** - Want simple, effective logging

## 🔧 **External Integrations**

### Nutrition APIs
- **Indian Food Database** - Localized food database
- **WGER API** - Exercise database integration

### AI Services
- **Configurable LLM** - OpenRouter, OpenAI, or Anthropic
- **Vector Store** - FAISS for pattern recognition
- **Memory System** - User preference learning

## 📱 **Mobile App Structure**

### Main Screens
- **Dashboard**: Redesigned with personalized welcome, body type hero card, integrated stats, and gamification
- **Fitness**: Workout logging and routine management
- **Nutrition**: Meal logging and nutrition tracking
- **Analytics**: Comprehensive analytics with time period filters, trend visualization, and comparison insights
- **Profile**: User settings and health profile

### Key Components
- **Dashboard Components**: Personalized welcome, quick stats, body type hero card, integrated stats, health logging cards, AI insights, weekly summary
- **Analytics Components**: Time period selector, goal alignment hero, time-based trends, comparison insights, achievement system
- **Modals**: Workout logging, meal logging, routine creation
- **Charts**: Interactive trend charts, progress visualization, comparison graphs
- **Forms**: Comprehensive logging with validation
- **Cards**: Quick stats, insights, progress indicators, gamification elements

## 🚀 **Development Guidelines**

### Adding Features
1. Create feature directory in appropriate location
2. Add models, schemas, CRUD operations, and API endpoints
3. Implement frontend components and services
4. Add comprehensive TypeScript types
5. Test thoroughly with real data

### Code Organization
- **Backend**: `backend/app/` with feature-based structure
- **Mobile**: `mobile/src/` with component-based organization
- **Shared**: Common utilities and types
- **Documentation**: Comprehensive docs in `docs/` folder

## 🔒 **Security & Privacy**

### Data Protection
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **Data Encryption** - Health data encrypted at rest
- **GDPR Compliance** - User data control and privacy

### API Security
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Comprehensive data validation
- **CORS Configuration** - Proper cross-origin setup
- **Error Handling** - Secure error responses

---

*This context document serves as the single source of truth for project understanding and development guidelines.*