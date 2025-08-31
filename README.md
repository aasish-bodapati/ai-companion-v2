# 🤖 AI Companion V2

A next-generation AI personal assistant that learns from your conversations, remembers important details, and helps improve your life through personalized insights and recommendations.

## ✨ Features

### 🧠 **Intelligent Memory System**
- **Personal Information Capture**: Automatically extracts and stores important details from conversations
- **Context-Aware Responses**: Uses your personal history to provide relevant, personalized assistance
- **Smart Memory Management**: Organizes memories by categories (work, personal, health, etc.)

### 💬 **Advanced Chat Interface**
- **Real-time Streaming**: Fast, responsive AI conversations
- **Quick Actions**: One-click access to common tasks (plan day, set goals, get advice)
- **Multi-turn Conversations**: Maintains context across long discussions

### 🎯 **Life Improvement Features**
- **Today Dashboard**: Daily overview of habits, goals, and suggestions
- **Goal Tracking**: Set and monitor personal and professional objectives
- **Habit Monitoring**: Track daily routines and life patterns
- **Personalized Recommendations**: AI-powered suggestions based on your lifestyle

### 🔐 **Security & Privacy**
- **Secure Authentication**: JWT-based user authentication
- **Data Privacy**: Your personal information stays secure and private
- **Session Management**: Robust session handling across devices

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)
- **PostgreSQL** or **SQLite** (database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-companion-v2
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   python init_db.py
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - Database ORM with migrations
- **Alembic** - Database migration management
- **Pydantic** - Data validation and serialization
- **JWT Authentication** - Secure user sessions

### Frontend (Next.js + React)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Playwright** - End-to-end testing

### AI & Memory
- **OpenRouter API** - Access to multiple LLM providers
- **FAISS Vector Store** - Efficient similarity search
- **Memory Extraction** - Automatic personal information capture
- **Context Management** - Intelligent conversation history

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test:e2e
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=sqlite:///./minimal.db
SECRET_KEY=your-secret-key
OPENROUTER_API_KEY=your-openrouter-key
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
ai-companion-v2/
├── backend/                 # FastAPI backend
│   ├── app/                # Main application
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── db/            # Database configuration
│   ├── tests/             # Test suite
│   ├── alembic/           # Database migrations
│   └── requirements.txt   # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/               # Source code
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── package.json      # Node.js dependencies
└── docs/                  # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ by the AI Companion Team**