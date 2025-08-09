# Development Workflows

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+ (or SQLite for development)
- Git

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-org/ai-companion-v2.git
cd ai-companion-v2/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\\venv\\Scripts\\activate

# Install dependencies
pip install -r requirements-dev.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Common Tasks

### Starting a New Feature
1. Create a new branch from `develop`
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```
2. Implement your changes
3. Write tests
4. Update documentation if needed
5. Run tests and linters
   ```bash
   # Backend
   cd backend
   pytest
   black .
   isort .
   flake8
   mypy .
   
   # Frontend
   cd ../frontend
   npm test
   npm run lint
   npm run type-check
   ```
6. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
7. Push your branch and create a pull request

### Fixing a Bug
1. Create a new branch from `develop`
   ```bash
   git checkout develop
   git pull
   git checkout -b fix/issue-description
   ```
2. Write a test that reproduces the bug
3. Fix the bug
4. Verify the test passes
5. Run all tests
6. Update documentation if needed
7. Commit and push your changes
8. Create a pull request

### Code Review Process
1. Create a draft pull request for early feedback
2. Request review from at least one team member
3. Address all review comments
4. Update the PR description with any changes
5. Get approval from at least one reviewer
6. Squash and merge the PR

## Deployment Workflow

### Staging Deployment
1. Merge your changes to the `develop` branch
2. The CI/CD pipeline will automatically deploy to staging
3. Verify your changes on the staging environment
4. Run integration tests

### Production Deployment
1. Create a release branch from `develop`
   ```bash
   git checkout develop
   git pull
   git checkout -b release/vX.Y.Z
   ```
2. Update the version in `backend/app/__init__.py`
3. Update `CHANGELOG.md`
4. Create a pull request to `main`
5. Get approval from at least one other developer
6. Merge the PR to `main`
7. Create a new release in GitHub
8. The CI/CD pipeline will automatically deploy to production

## Database Migrations

### Creating a New Migration
```bash
cd backend
alembic revision --autogenerate -m "your migration message"
```

### Running Migrations
```bash
# Upgrade to the latest version
alembic upgrade head

# Downgrade one version
alembic downgrade -1
```

## Testing Workflow

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd ../frontend
npm test
```

### Test Coverage
```bash
# Backend
cd backend
pytest --cov=app --cov-report=term-missing

# Frontend
cd ../frontend
npm run test:coverage
```

## Documentation Updates
1. Update the relevant `.md` files
2. Verify links are working
3. Update the table of contents if needed
4. Commit with `docs:` prefix
5. Create a pull request

## Troubleshooting

### Common Issues
- **Database connection issues**: Check that PostgreSQL is running and the connection string in `.env` is correct
- **Frontend not connecting to backend**: Make sure the backend is running and check the API URL in the frontend config
- **Test failures**: Run tests with `-v` for more detailed output
- **Dependency issues**: Try deleting `node_modules` and `venv` and reinstalling dependencies
