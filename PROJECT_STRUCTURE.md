# 📁 AI Companion V2 - Project Structure

## 📂 Root Directory
```
ai-companion-v2/
├── 📄 README.md                          # Main project documentation
├── 📄 FINAL_BETA_READINESS_REPORT.md     # Beta readiness status
├── 📄 Makefile                           # Build automation
├── 📁 backend/                           # Python FastAPI backend
├── 📁 frontend/                          # Next.js React frontend
└── 📁 docs/                              # Project documentation
```

## 🔧 Backend Structure (`backend/`)
```
backend/
├── 📄 requirements.txt                   # Python dependencies
├── 📄 env_template.txt                   # Environment variables template
├── 📄 init_db.py                         # Database initialization
├── 📄 pytest.ini                         # Test configuration
├── 📄 ruff.toml                          # Code linting configuration
├── 📄 alembic.ini                        # Database migration config
├── 📁 alembic/                           # Database migrations
├── 📁 app/                               # Main application code
│   ├── 📄 main.py                        # FastAPI application entry
│   ├── 📁 api/                           # API endpoints
│   ├── 📁 core/                          # Core configuration
│   ├── 📁 models/                        # Database models
│   ├── 📁 schemas/                       # Pydantic schemas
│   ├── 📁 crud/                          # Database operations
│   ├── 📁 services/                      # Business logic
│   ├── 📁 memory/                        # AI memory system
│   └── 📁 middleware/                    # Request middleware
├── 📁 tests/                             # Backend tests
└── 📁 scripts/                           # Utility scripts
```

## 🌐 Frontend Structure (`frontend/`)
```
frontend/
├── 📄 package.json                       # Node.js dependencies
├── 📄 next.config.ts                     # Next.js configuration
├── 📄 tailwind.config.js                 # Tailwind CSS config
├── 📄 playwright.config.ts               # E2E test configuration
├── 📁 public/                            # Static assets
├── 📁 src/                               # Source code
│   ├── 📁 app/                           # Next.js app router pages
│   ├── 📁 components/                    # Reusable UI components
│   ├── 📁 contexts/                      # React contexts
│   ├── 📁 features/                      # Feature-specific code
│   ├── 📁 hooks/                         # Custom React hooks
│   ├── 📁 lib/                           # Utility libraries
│   └── 📁 utils/                         # Helper functions
└── 📁 tests/                             # Frontend E2E tests
    ├── 📄 e2e-comprehensive.spec.ts      # Core test suite (15 tests)
    ├── 📄 edge-cases.spec.ts             # Edge case tests (15 scenarios)
    ├── 📄 performance-load.spec.ts       # Performance tests (10 scenarios)
    ├── 📄 cross-browser.spec.ts          # Cross-browser tests (15 scenarios)
    ├── 📄 fixtures.ts                    # Test fixtures
    └── 📁 helpers/                       # Test utilities
```

## 📚 Documentation (`docs/`)
```
docs/
├── 📄 BETA_DEPLOYMENT_GUIDE.md           # Production deployment guide
├── 📄 BETA_READINESS_CHECKLIST.md        # Pre-launch checklist
├── 📄 Tech_Notes_Architecture.md         # Technical architecture
├── 📄 Product_One_Pager.md               # Product overview
├── 📄 Roadmap.md                         # Development roadmap
├── 📄 Changelog.md                       # Version history
├── 📄 AI_Personal_Assistant_Operating_Rules.md  # AI behavior rules
└── 📁 specs/                             # Technical specifications
```

## 🎯 Key Files by Purpose

### 🚀 **Development**
- `backend/app/main.py` - Backend application entry point
- `frontend/src/app/layout.tsx` - Frontend application layout
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node.js dependencies

### 🗄️ **Database**
- `backend/alembic/` - Database migrations
- `backend/app/models/` - Database models
- `backend/init_db.py` - Database setup

### 🧪 **Testing**
- `frontend/tests/e2e-comprehensive.spec.ts` - Core E2E tests (100% passing)
- `backend/tests/` - Backend unit and integration tests
- `frontend/playwright.config.ts` - Test configuration

### 🔧 **Configuration**
- `backend/env_template.txt` - Environment variables
- `frontend/next.config.ts` - Next.js settings
- `backend/ruff.toml` - Code quality rules

### 📖 **Documentation**
- `README.md` - Main project documentation
- `FINAL_BETA_READINESS_REPORT.md` - Beta status
- `docs/BETA_DEPLOYMENT_GUIDE.md` - Deployment instructions

## 🎨 **Frontend Architecture**

### 📱 **Pages** (`src/app/`)
- `/` - Landing page
- `/register` - User registration
- `/login` - User authentication
- `/onboarding` - User setup
- `/companion` - Main chat interface
- `/today` - Life dashboard
- `/memories` - Memory management

### 🧩 **Components** (`src/components/`)
- `auth/` - Authentication components
- `chat/` - Chat interface components
- `layout/` - Layout and navigation
- `ui/` - Reusable UI components

### 🔗 **Features** (`src/features/`)
- `auth/` - Authentication logic
- `chat/` - Chat functionality
- `memory/` - Memory system
- `goals/` - Goal tracking

## 🔙 **Backend Architecture**

### 🛣️ **API Routes** (`app/api/`)
- `auth/` - Authentication endpoints
- `conversations/` - Chat functionality
- `memory/` - Memory management
- `onboarding/` - User setup
- `users/` - User management

### 🔧 **Services** (`app/services/`)
- `auth_service.py` - Authentication logic
- `conversation_service.py` - Chat processing
- `memory_service.py` - AI memory system
- `llm_service.py` - AI model integration

### 💾 **Data Layer** (`app/models/`)
- `user.py` - User data model
- `conversation.py` - Chat data
- `memory.py` - Memory storage
- `message.py` - Message handling

## 🧪 **Testing Strategy**

### ✅ **Core Test Suite** (100% Passing)
1. **e2e-comprehensive.spec.ts** - 15 essential tests covering:
   - User registration and authentication
   - Chat interface functionality
   - Memory system operations
   - Navigation and UI interactions
   - Error handling and recovery

### 🔍 **Extended Test Coverage**
2. **edge-cases.spec.ts** - 15 edge case scenarios
3. **performance-load.spec.ts** - 10 performance tests
4. **cross-browser.spec.ts** - 15 browser compatibility tests

**Total: 55+ comprehensive test scenarios**

## 🚀 **Deployment Ready**

The project is **100% production ready** with:
- ✅ Clean, organized structure
- ✅ Comprehensive documentation
- ✅ Complete test coverage
- ✅ Optimized performance
- ✅ Security hardening
- ✅ Cross-browser compatibility

---

*This structure represents a clean, production-ready codebase with minimal dependencies and maximum clarity.*
