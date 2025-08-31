# AI Companion V2 - Project Structure

This document provides a comprehensive overview of the AI Companion V2 project structure, explaining the organization and purpose of each directory and file.

## 🏗️ Overall Architecture

The project follows a modern, clean architecture with clear separation of concerns:

```
ai-companion-v2/
├── backend/                 # FastAPI backend application
├── frontend/                # Next.js frontend application
├── docs/                    # Project documentation
├── scripts/                 # Development and utility scripts
└── README.md               # Main project documentation
```

## 📁 Backend Structure

### Core Application (`backend/app/`)
```
app/
├── api/                    # API layer and endpoints
│   ├── api_v1/           # API version 1 router
│   ├── deps.py           # Dependency injection
│   ├── problem.py        # Problem handling
│   └── endpoints/        # Individual API endpoints
│       ├── chat/         # Chat-related endpoints
│       ├── memory/       # Memory management
│       ├── users/        # User management
│       └── ...
├── core/                  # Core application functionality
│   ├── config.py         # Configuration management
│   ├── security.py       # Authentication & security
│   ├── llm.py           # AI/LLM integration
│   ├── memory_types.py   # Memory system types
│   └── ...
├── models/                # Database models (SQLAlchemy)
├── schemas/               # Data validation (Pydantic)
├── services/              # Business logic layer
├── crud/                  # Database operations
├── db/                    # Database configuration
├── memory/                # Memory management system
└── middleware/            # Custom middleware
```

### Key Backend Components

- **FastAPI Application**: Modern, fast web framework
- **SQLAlchemy ORM**: Database abstraction and migrations
- **Alembic**: Database migration management
- **Pydantic**: Data validation and serialization
- **JWT Authentication**: Secure user session management
- **FAISS Vector Store**: Efficient memory similarity search

## 📁 Frontend Structure

### Source Code (`frontend/src/`)
```
src/
├── app/                   # Next.js App Router
│   ├── chat/             # Chat interface pages
│   ├── memories/         # Memory management pages
│   ├── today/            # Daily dashboard
│   ├── goals/            # Goal tracking
│   ├── calendar/         # Calendar integration
│   ├── profile/          # User profile
│   └── layout.tsx        # Root layout
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── chat/             # Chat-specific components
├── services/              # API service layer
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── lib/                   # Third-party library configs
└── contexts/              # React context providers
```

### Key Frontend Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Query**: Server state management
- **Playwright**: End-to-end testing

## 📁 Documentation Structure

### Core Documentation
- **README.md**: Main project overview and setup
- **Backend README**: Backend architecture and development
- **Frontend README**: Frontend architecture and development

### User Guides
- **9-5 User Workflow**: Daily workflow for users
- **CHAT_SIMPLE_EXPLANATION**: Simple explanation of chat features
- **AI_Personal_Assistant_Operating_Rules**: AI behavior and rules

### Technical Documentation
- **CHAT_TECHNICAL_DOCUMENTATION**: Technical details of chat system
- **ENHANCED_MEMORY_SCHEMA**: Memory system schema
- **DIRECT_SETUP_GUIDE**: Direct setup instructions
- **NETWORK_ACCESS_GUIDE**: Network configuration

### Development Guides
- **COMMANDS**: Development commands and shortcuts
- **Changelog**: Project changelog and version history

## 📁 Scripts and Utilities

### Development Scripts (`scripts/`)
- **dev-setup.sh**: Unix/Linux development setup
- **dev-setup.bat**: Windows development setup

### Generated Scripts
- **start-backend.sh/.bat**: Start backend server
- **start-frontend.sh/.bat**: Start frontend server
- **start-both.sh/.bat**: Start both services

## 🔧 Configuration Files

### Backend Configuration
- **.env.example**: Environment variables template
- **requirements.txt**: Python dependencies
- **alembic.ini**: Database migration configuration
- **pytest.ini**: Testing configuration
- **ruff.toml**: Code linting configuration

### Frontend Configuration
- **package.json**: Node.js dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **tailwind.config.js**: Tailwind CSS configuration
- **next.config.ts**: Next.js configuration
- **eslint.config.mjs**: ESLint configuration

## 🗄️ Database Structure

### Database Management
- **SQLite**: Default development database
- **PostgreSQL**: Production database option
- **Alembic**: Migration management
- **FAISS**: Vector storage for memories

### Key Models
- **Users**: User accounts and authentication
- **Conversations**: Chat conversations
- **Messages**: Individual chat messages
- **Memories**: Stored personal information
- **Goals**: User goals and tracking

## 🧪 Testing Structure

### Backend Testing
- **tests/**: Comprehensive test suite
- **pytest**: Testing framework
- **TestClient**: FastAPI testing utilities

### Frontend Testing
- **tests/**: Test suite
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing

## 🚀 Development Workflow

### Local Development
1. **Setup**: Run development setup script
2. **Backend**: Start FastAPI server with hot reload
3. **Frontend**: Start Next.js development server
4. **Database**: SQLite for development, migrations for production

### Code Quality
- **Ruff**: Fast Python linting and formatting
- **ESLint**: JavaScript/TypeScript linting
- **TypeScript**: Static type checking
- **Prettier**: Code formatting

## 📊 Performance Considerations

### Backend Optimization
- **Async/Await**: Non-blocking I/O operations
- **Database Indexing**: Optimized queries
- **Caching**: Redis integration for performance
- **Connection Pooling**: Efficient database connections

### Frontend Optimization
- **Code Splitting**: Dynamic imports for better performance
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Performance monitoring
- **Lazy Loading**: Component and route lazy loading

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt for password security
- **CORS Configuration**: Cross-origin resource sharing
- **Rate Limiting**: API abuse prevention

### Data Protection
- **Input Validation**: Pydantic schema validation
- **SQL Injection Protection**: SQLAlchemy ORM
- **XSS Prevention**: Content security policies
- **Environment Variables**: Secure configuration management

## 🌐 Deployment Considerations

### Development
- **Local Environment**: SQLite, local development servers
- **Hot Reload**: Fast development iteration
- **Debug Tools**: Comprehensive logging and debugging

### Production Ready
- **Environment Configuration**: Secure production settings
- **Database Migrations**: Automated database updates
- **Health Checks**: Application monitoring
- **Error Handling**: Graceful error management

## 📈 Monitoring and Observability

### Application Monitoring
- **Logging**: Structured logging with configurable levels
- **Metrics**: Performance and usage metrics
- **Health Checks**: Service health monitoring
- **Error Tracking**: Comprehensive error handling

### Development Tools
- **API Documentation**: Auto-generated OpenAPI docs
- **Interactive Testing**: Swagger UI for API testing
- **Development Server**: Hot reload and debugging
- **Type Checking**: Real-time TypeScript validation

This structure provides a clean, maintainable, and scalable foundation for the AI Companion application, with clear separation of concerns and modern development practices.
