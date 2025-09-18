# HealthLog AI - Architecture Guide

## 🏗️ Project Structure

This project follows a **feature-based architecture** with clear separation of concerns and health-focused organization.

### Backend Structure

```
backend/app/
├── api/                    # API layer
│   ├── core/              # Core functionality (auth, users, onboarding)
│   ├── health/            # Health logging and analytics
│   ├── chat/              # Chat and conversations
│   └── api_v1/            # Main API router
├── core/                  # Core infrastructure
│   ├── config.py         # Application configuration
│   ├── llm.py            # LLM client
│   └── security.py       # Authentication & security
├── models/                # Database models
│   ├── health/           # Health-related models
│   ├── conversation.py   # Chat models
│   └── user.py           # User models
├── schemas/               # Pydantic schemas
│   ├── health/           # Health schemas
│   ├── conversation.py   # Chat schemas
│   └── user.py           # User schemas
├── crud/                  # Database operations
│   ├── health/           # Health CRUD operations
│   ├── conversation.py   # Chat CRUD operations
│   └── user.py           # User CRUD operations
└── main.py               # FastAPI application
```

### Frontend Structure

```
frontend/src/
├── app/                   # Next.js app router
│   ├── logging/          # Health logging pages
│   ├── chat/             # Chat pages
│   └── onboarding/       # Onboarding pages
├── features/              # Feature-based modules
│   ├── health/           # Health logging feature
│   │   ├── components/   # Health UI components
│   │   ├── hooks/        # Health React hooks
│   │   ├── api/          # Health API service
│   │   └── index.ts      # Feature exports
│   ├── chat/             # Chat feature
│   │   ├── components/   # Chat components
│   │   ├── ui/           # Chat UI components
│   │   ├── hooks/        # Chat hooks
│   │   └── index.ts      # Feature exports
│   └── conversations/    # Conversation management
├── components/            # Shared components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── types/                 # TypeScript type definitions
├── constants/             # Application constants
└── lib/                   # Utility libraries
```

## 🎯 Key Principles

### 1. **Feature-Based Organization**
- Each feature is self-contained with its own components, hooks, and API
- Clear boundaries between different functionalities
- Easy to locate and modify specific features

### 2. **Health-Focused Design**
- All health-related functionality is grouped together
- Clear separation between health logging and chat features
- Optimized for health and wellness use cases

### 3. **Type Safety**
- Comprehensive TypeScript types for all data structures
- Proper API response typing
- Validation and error handling

### 4. **Clean Architecture**
- Clear separation between UI, business logic, and data layers
- Reusable components and hooks
- Centralized API services

## 🔧 Development Guidelines

### Adding New Features
1. Create a new feature directory under `frontend/src/features/`
2. Include components, hooks, API, and types
3. Export everything through an `index.ts` file
4. Add corresponding backend API endpoints

### Adding New Health Features
1. Add models to `backend/app/models/health/`
2. Add schemas to `backend/app/schemas/health/`
3. Add CRUD operations to `backend/app/crud/health/`
4. Add API endpoints to `backend/app/api/health/`
5. Add frontend components to `frontend/src/features/health/`

### Code Organization
- Keep related functionality together
- Use descriptive file and directory names
- Export through index files for clean imports
- Follow TypeScript best practices

## 📊 Benefits

- **Maintainability**: Easy to find and modify specific functionality
- **Scalability**: Simple to add new features without affecting existing code
- **Developer Experience**: Clear structure and comprehensive types
- **Health Focus**: Optimized for health and wellness applications
- **Code Reusability**: Shared components and utilities
