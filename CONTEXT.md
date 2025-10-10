# AI Companion - Project Context & Ground Truths

**CRITICAL**: You do NOT have permission to start or restart servers. They are already running in dev mode and will not be stopped or restarted without explicit user permission.

## 🎯 **Project Overview**
AI-powered health and wellness platform that combines manual logging with intelligent insights. Built for busy professionals who need simple, fast health tracking with clean data visualization across web and mobile platforms.

**Current Status**: Active development with comprehensive backend API, React Native mobile app, and PostgreSQL database. Recent focus on water logging improvements, timezone handling, and enhanced analytics dashboard.

## 🏗️ **Architecture & Tech Stack**

### Backend (FastAPI + PostgreSQL)
- **Framework**: FastAPI 0.104.1 with SQLAlchemy 2.0.23 ORM
- **Database**: PostgreSQL (REQUIRED - never use SQLite)
- **Authentication**: JWT with bcrypt password hashing
- **API Structure**: Feature-based organization (`/api/health/`, `/api/core/`, `/api/analytics/`)
- **Key Services**: Indian food database, AI insights, analytics engine, water logging with timezone support
- **Migration**: Alembic 1.13.2 for database schema management
- **Security**: Rate limiting, CORS, security headers, timeout middleware (30s timeout)
- **Monitoring**: Built-in metrics endpoint with Prometheus-compatible format
- **Recent Updates**: Enhanced water logging with gender-based goals, improved timezone handling, generic health logging patterns

### Mobile (React Native + Expo)
- **Framework**: React Native 0.81.4 with Expo SDK 54
- **Navigation**: React Navigation v7 with bottom tabs and stack navigation
- **State Management**: React Context (AuthContext) + Zustand for app state
- **Key Screens**: Dashboard, Fitness, Nutrition, Analytics, Profile
- **Components**: Feature-based organization with reusable UI components (126+ components)
- **Testing**: Jest with React Native Testing Library
- **Key Features**: Floating action button for quick logging, comprehensive analytics dashboard, body type scoring system

## 🎯 **Core Features**

### Health Logging
- **Fitness Tracking**: Activities, duration, calories, distance, weight training with exercise database integration
- **Nutrition Logging**: Meals, macros, food items with detailed breakdowns and Indian food database
- **Mood & Energy**: Daily mood ratings (1-10 scale), energy levels, sleep quality tracking
- **Water Intake**: Hydration tracking with ML/oz support and progress visualization
- **Weight Tracking**: Body metrics logging with trend analysis
- **Analytics**: Comprehensive dashboards with time-based trends and pattern recognition

### AI-Powered Features
- **Pattern Recognition**: Correlations between diet, exercise, and mood with strength indicators
- **Personalized Insights**: Tailored recommendations based on user data and behavior patterns
- **Predictive Analytics**: Progress forecasting, risk identification, optimal timing suggestions
- **Memory System**: FAISS vector store for learning user preferences and habits
- **Smart Recommendations**: AI-powered workout suggestions, nutrition guidance, and habit formation

### Dashboard & Analytics (Latest)
- **Personalized Dashboard**: Dynamic welcome, micro-goals, quick stats, body type hero card
- **Integrated Stats**: Combined nutrition, water, mood tracking with progress indicators
- **Health Logging Cards**: Consolidated activity and wellness logging with circular progress
- **Priority AI Insights**: Color-coded, actionable recommendations with one-tap actions
- **Weekly Summary**: Trend visualization with gamification and motivational feedback
- **Comprehensive Analytics**: Time period filters, goal alignment tracking, comparison insights
- **Achievement System**: Progress-based badges, streaks, and gamification elements
- **Interactive Charts**: Time-based trends with data point interaction and statistics
- **Body Type Goals**: Personalized fitness goals based on body type and user attributes

## 📊 **Database Schema**

### Core Tables
- **users**: Integer IDs with timezone support, active routine tracking
- **fitness_logs**: Workout activities with duration, calories, exercise data (JSON)
- **nutrition_logs**: Meal logging with macros, food items (JSON), meal types
- **mood_logs**: Daily wellness tracking with 1-10 rating scale, emoji support
- **water_logs**: Hydration tracking with ML/oz amounts and log types (recently enhanced)
- **user_weight_logs**: Body metrics tracking with trend analysis
- **user_health_profile**: Health measurements, body composition, activity levels
- **simple_routines**: Workout routine templates and progress tracking
- **routine_workout_days**: Individual workout days within routines
- **routine_exercises**: Specific exercises within workout days
- **nutrition_routines**: Meal plan templates with macro targets
- **user_goals**: Goal setting and tracking system

### Key Relationships
- All health logs linked to users via `user_id` (integer) with CASCADE delete
- Comprehensive health profile with body composition metrics
- Routine system supporting both fitness and nutrition tracking
- Goal tracking with progress monitoring and achievement system
- Timezone-aware logging with proper datetime handling

## 🚨 **Critical Ground Truths**

### Database
- **ALWAYS use PostgreSQL** - never SQLite (postgresql://postgres:postgres@localhost:5432/healthlog_db)
- **Integer IDs** - migrated from UUIDs, use SERIAL primary keys
- **Timezone Support** - All timestamps are timezone-aware with user timezone handling via TimezoneHandler
- **Data Validation** - Comprehensive field constraints and validation
- **CASCADE Delete** - All user-related data is properly cascaded on user deletion
- **Recent Changes** - Water logging enhanced with gender-based goals, improved timezone filtering

### Development Environment
- **Servers Always Running** - Assume backend (port 8000) and mobile dev servers are running in dev mode
- **No Server Control** - AI assistant has NO authority to stop/start/restart servers
- **Never Restart Servers** - Don't stop/start servers without explicit user permission
- **PowerShell Commands** - ALWAYS use PowerShell syntax for Windows commands (not bash/cmd)
- **Dev Mode Only** - All servers run in development mode by default
- **CORS Configured** - Backend allows mobile access from 192.168.x.x networks

### Code Standards
- **Feature-Based Organization** - Group related functionality together
- **Type Safety** - Comprehensive TypeScript types throughout
- **Error Handling** - Proper validation and error responses with RFC 7807 problem+json format
- **Cross-Platform Sync** - Seamless data synchronization between web and mobile
- **Generic Patterns** - Use generic health logging CRUD patterns to reduce code duplication
- **Response Formatting** - Consistent response formatting using HealthLogResponseFormatter

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
- **Indian Food Database** - Localized food database with comprehensive nutrition data
- **WGER API** - Exercise database integration for workout tracking
- **Food Search** - Advanced food search and nutrition lookup capabilities

### AI Services
- **Configurable LLM** - OpenRouter, OpenAI, or Anthropic integration
- **Vector Store** - FAISS for pattern recognition and user preference learning
- **Memory System** - User preference learning and behavior pattern analysis
- **Analytics Engine** - Comprehensive health metrics and trend analysis

### API Endpoints Structure
- **Core APIs** (`/api/core/`): Authentication, user management, onboarding
- **Health APIs** (`/api/health/`): Fitness logs, nutrition logs, water logs, mood logs, routines, exercises, foods
- **Analytics APIs** (`/api/analytics/`): Health metrics, predictive insights, trends, pattern insights, recommendations
- **Common APIs** (`/api/common/`): Generic health logging patterns, response formatters, endpoint mixins

## 📱 **Mobile App Structure**

### Navigation Architecture
- **Stack Navigator**: Root navigation with Login, Register, Onboarding, Main tabs
- **Tab Navigator**: Bottom tabs with custom floating plus button for quick logging
- **Authentication Flow**: Login → Onboarding (if needed) → Main app
- **State Management**: AuthContext for authentication, Zustand for app state

### Main Screens
- **Dashboard**: Personalized welcome, body type hero card, integrated stats, health logging cards, AI insights
- **Fitness**: Workout logging, routine management, exercise database integration
- **Nutrition**: Meal logging, nutrition tracking, Indian food database, macro tracking
- **Analytics**: Comprehensive analytics with time period filters, trend visualization, comparison insights
- **Profile**: User settings, health profile, goal management, body type configuration

### Key Components
- **Dashboard Components**: Personalized welcome, quick stats, body type hero card, integrated stats, health logging cards, AI insights, weekly summary
- **Analytics Components**: Time period selector, goal alignment hero, time-based trends, comparison insights, achievement system
- **Body Type Components**: Body type scoring dashboard, progress cards, scoring examples
- **Fitness Components**: Dynamic exercise forms, workout logging modals, routine management, progress tracking
- **Nutrition Components**: Macro progress tracking, nutrition logging, meal planning
- **Health Components**: Water logging cards, mood logging, universal health logger
- **Modals**: Workout logging, meal logging, routine creation, quick add modal
- **Charts**: Interactive trend charts, progress visualization, comparison graphs
- **Forms**: Comprehensive logging with validation and user-friendly interfaces
- **Cards**: Quick stats, insights, progress indicators, gamification elements
- **Floating Action Button**: Quick access to logging modals from any screen

## 🚀 **Development Guidelines**

### PowerShell Command Requirements
- **ALWAYS use PowerShell syntax** for all Windows commands
- Use `Get-Process` instead of `ps`, `Stop-Process` instead of `kill`
- Use `Get-NetTCPConnection` instead of `netstat`, `taskkill` for process termination
- Use `cd` for directory changes, `ls` or `Get-ChildItem` for listing
- Use `npm` and `npx` commands as-is (they work in PowerShell)
- Use `python` and `uvicorn` commands as-is (they work in PowerShell)
- Use `alembic` commands as-is (they work in PowerShell)

### Adding Features
1. Create feature directory in appropriate location
2. Add models, schemas, CRUD operations, and API endpoints
3. Implement frontend components and services
4. Add comprehensive TypeScript types
5. Test thoroughly with real data
6. Update database migrations with Alembic
7. Ensure proper error handling and validation

### Code Organization
- **Backend**: `backend/app/` with feature-based structure
  - `models/`: Database models with proper relationships
  - `schemas/`: Pydantic schemas for API validation
  - `crud/`: Database operations and business logic
  - `api/`: API endpoints organized by feature
  - `core/`: Configuration, security, and utilities
- **Mobile**: `mobile/src/` with component-based organization
  - `screens/`: Main application screens
  - `components/`: Reusable UI components
  - `services/`: API integration and business logic
  - `stores/`: State management with Zustand
  - `contexts/`: React Context for global state
- **Shared**: Common utilities and types
- **Documentation**: Comprehensive docs in `docs/` folder

## 🔒 **Security & Privacy**

### Data Protection
- **JWT Authentication** - Secure token-based auth with 2-day expiry
- **Password Hashing** - bcrypt for password security
- **Data Encryption** - Health data encrypted at rest
- **GDPR Compliance** - User data control and privacy
- **CASCADE Delete** - Proper data cleanup on user deletion

### API Security
- **Rate Limiting** - Configurable rate limiting (currently disabled for MVP)
- **Input Validation** - Comprehensive data validation with Pydantic schemas
- **CORS Configuration** - Proper cross-origin setup for mobile access
- **Error Handling** - Secure error responses with RFC 7807 problem+json format
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, CSP
- **Timeout Middleware** - 30-second request timeout to prevent hanging requests
- **Correlation IDs** - Request tracking for debugging and monitoring

### Monitoring & Metrics
- **Built-in Metrics** - Prometheus-compatible metrics endpoint
- **Request Tracking** - Per-route performance monitoring
- **Error Logging** - Comprehensive error tracking and logging
- **Health Checks** - Built-in health check endpoints

## 📈 **Recent Development Updates**

### Backend Improvements
- **Water Logging Enhancement**: Gender-based water goals (2.7L for females, 3.7L for males)
- **Timezone Handling**: Improved timezone support using TimezoneHandler utility
- **Generic Health Logging**: Implemented generic CRUD patterns to reduce code duplication
- **Response Formatting**: Standardized response formatting with HealthLogResponseFormatter
- **Database Session Management**: Enhanced logging and error handling in database operations
- **API Organization**: Feature-based API structure with health, core, and analytics modules
- **Security Enhancements**: Comprehensive security headers, CORS configuration, and timeout middleware

### Mobile App Features
- **Component Library**: 126+ reusable components organized by feature
- **Floating Action Button**: Quick access to logging modals from any screen
- **Body Type System**: Comprehensive body type scoring and progress tracking
- **Analytics Dashboard**: Advanced analytics with time period filters and trend visualization
- **Quick Logging**: Streamlined logging experience with modals and forms

### Database Schema Updates
- **Routine System**: Enhanced routine management with workout days and exercises
- **Water Logging**: Improved water tracking with ML/oz conversion and log types
- **Health Profile**: Comprehensive user health information and measurements
- **Goal Tracking**: User goal setting and progress monitoring system
- **Integer IDs**: Migrated from UUIDs to integer primary keys for better performance
- **Timezone Support**: All timestamps are timezone-aware with proper datetime handling

## 🔧 **PowerShell Command Examples**

### Process Management
```powershell
# Check running processes
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"}

# Stop specific process by PID
Stop-Process -Id <PID_NUMBER> -Force

# Stop all Python processes
Get-Process python | Stop-Process -Force

# Check port usage
Get-NetTCPConnection -LocalPort 8000
```

### Database Operations
```powershell
# Run migrations
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Initialize database
python init_db.py
```

### Development Servers
```powershell
# Backend server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Mobile app
cd mobile
npx expo start --clear
npx expo start --tunnel --clear
```

---

*This context document serves as the single source of truth for project understanding and development guidelines. Last updated: December 2024*