# AI Companion Testing Strategy

This document outlines the comprehensive testing strategy for the AI Companion project, including backend, frontend, integration, and E2E testing approaches.

## 🎯 Testing Philosophy

Our testing strategy follows these principles:

- **Comprehensive Coverage**: Test all critical functionality
- **Fast Feedback**: Unit tests run in <100ms
- **Realistic Scenarios**: E2E tests simulate real user workflows
- **Maintainable Tests**: Clear structure and minimal duplication
- **Performance Aware**: Load and stress testing for critical paths

## 🏗️ Test Organization

### Backend Tests (`backend/tests/`)

```
backend/tests/
├── unit/                    # Fast, isolated tests (<100ms)
│   ├── core/               # Core functionality tests
│   ├── models/             # Data model tests
│   ├── services/           # Business logic tests
│   ├── api/                # API endpoint tests
│   └── utils/              # Utility function tests
├── integration/             # Component interaction tests (100ms-1s)
│   ├── api/                # API integration tests
│   ├── services/           # Service integration tests
│   └── database/           # Database operation tests
├── e2e/                    # Full workflow tests (1s+)
│   ├── workflows/          # Complete user scenarios
│   └── scenarios/          # Edge case scenarios
└── performance/             # Load and stress tests
    ├── load/               # Load testing
    ├── stress/             # Stress testing
    └── benchmarks/         # Performance benchmarks
```

### Frontend Tests (`frontend/tests/`)

```
frontend/tests/
├── unit/                    # Component and utility tests
│   ├── components/         # React component tests
│   ├── hooks/              # Custom hook tests
│   ├── utils/              # Utility function tests
│   └── services/           # Service layer tests
├── integration/             # Component interaction tests
├── e2e/                    # User workflow tests
└── visual/                 # Visual regression tests
```

## 🚀 Running Tests

### Backend Testing

#### Quick Start
```bash
cd backend

# Run all tests
python run_tests.py

# Run only unit tests (fastest)
python run_tests.py --type unit

# Run with coverage
python run_tests.py --coverage

# Run specific test categories
python run_tests.py --type integration
python run_tests.py --type e2e
python run_tests.py --type performance
```

#### Advanced Options
```bash
# Run tests with specific markers
python run_tests.py --markers memory auth

# Run tests in parallel
python run_tests.py --parallel

# Generate HTML report
python run_tests.py --report html

# Run specific test files
python run_tests.py --files tests/unit/test_memory.py

# List available options
python run_tests.py --list
```

#### Traditional Pytest Commands
```bash
# Run all tests
pytest

# Run by category
pytest tests/unit/
pytest tests/integration/
pytest tests/e2e/

# Run by markers
pytest -m "unit"
pytest -m "memory"
pytest -m "not slow"

# Run with coverage
pytest --cov=app --cov-report=html
```

### Frontend Testing

#### Quick Start
```bash
cd frontend

# Run all tests
node run_tests.js

# Run only unit tests
node run_tests.js --type unit

# Run with coverage
node run_tests.js --coverage

# Run in watch mode
node run_tests.js --watch
```

#### Advanced Options
```bash
# Run specific test types
node run_tests.js --type integration
node run_tests.js --type e2e

# CI mode
node run_tests.js --ci

# Verbose output
node run_tests.js --verbose

# List available options
node run_tests.js --list
```

#### Traditional NPM Commands
```bash
# Run all tests
npm test

# Run by category
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📊 Test Categories

### Unit Tests
- **Purpose**: Test individual functions, methods, and components in isolation
- **Speed**: <100ms per test
- **Dependencies**: Mocked/stubbed external dependencies
- **Scope**: Single responsibility, one assertion per test
- **Examples**: 
  - Validation functions
  - Utility methods
  - Component rendering
  - Hook logic

### Integration Tests
- **Purpose**: Test component interactions and service integrations
- **Speed**: 100ms-1s per test
- **Dependencies**: May use test database, mocked external APIs
- **Scope**: Component interactions, service workflows
- **Examples**:
  - API endpoint testing
  - Service interactions
  - Database operations
  - Component integration

### E2E Tests
- **Purpose**: Test complete user workflows and system integration
- **Speed**: 1s+ per test
- **Dependencies**: Full system, real database, mocked external services
- **Scope**: Complete user scenarios, critical paths
- **Examples**:
  - User registration flow
  - Chat conversation workflow
  - Memory management
  - Error handling scenarios

### Performance Tests
- **Purpose**: Test system performance under load and stress
- **Speed**: Variable (depends on load)
- **Dependencies**: Full system, performance monitoring
- **Scope**: Load testing, stress testing, benchmarks
- **Examples**:
  - Concurrent user load
  - Memory operation performance
  - Search query performance
  - System scalability

## 🏷️ Test Markers

### Category Markers
- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.e2e` - E2E tests
- `@pytest.mark.performance` - Performance tests

### Feature Markers
- `@pytest.mark.memory` - Memory-related functionality
- `@pytest.mark.auth` - Authentication and authorization
- `@pytest.mark.api` - API endpoints
- `@pytest.mark.database` - Database operations
- `@pytest.mark.llm` - LLM integration
- `@pytest.mark.conversation` - Conversation management
- `@pytest.mark.scheduler` - Scheduling functionality

### Characteristic Markers
- `@pytest.mark.slow` - Slow tests (>1s)
- `@pytest.mark.smoke` - Critical path tests
- `@pytest.mark.flaky` - Potentially flaky tests
- `@pytest.mark.timeout` - Tests with timeouts

## 📈 Test Coverage

### Coverage Goals
- **Unit Tests**: 90%+ line coverage
- **Integration Tests**: 80%+ line coverage
- **E2E Tests**: Critical path coverage
- **Overall**: 85%+ combined coverage

### Coverage Reports
```bash
# Backend
python run_tests.py --coverage
# View: open htmlcov/index.html

# Frontend
npm run test:coverage
# View: open coverage/lcov-report/index.html
```

## 🔧 Test Configuration

### Backend Configuration
- **File**: `backend/pytest.ini`
- **Features**: 
  - Automatic test categorization
  - Marker management
  - Performance optimization
  - Warning filters

### Frontend Configuration
- **File**: `frontend/jest.config.ts`
- **Features**:
  - TypeScript support
  - React Testing Library
  - Coverage reporting
  - Mock configurations

## 🚨 Test Best Practices

### Writing Tests
1. **Single Responsibility**: Each test should verify one thing
2. **Descriptive Names**: Test names should explain what is being tested
3. **Arrange-Act-Assert**: Clear test structure
4. **Minimal Dependencies**: Mock external dependencies
5. **Fast Execution**: Keep tests under 100ms when possible

### Test Data Management
1. **Use Fixtures**: Leverage pytest fixtures for common data
2. **Clean Up**: Always clean up test data
3. **Unique Identifiers**: Use timestamps or UUIDs to avoid conflicts
4. **Mock External Services**: Avoid rate limits and network dependencies

### Performance Testing
1. **Baseline Metrics**: Establish performance baselines
2. **Realistic Load**: Use realistic user scenarios
3. **Resource Monitoring**: Monitor CPU, memory, and response times
4. **Regression Detection**: Fail tests on performance regressions

## 🧹 Test Maintenance

### Regular Tasks
- **Weekly**: Review test failures and flaky tests
- **Monthly**: Update test dependencies and configurations
- **Quarterly**: Review test coverage and add missing tests
- **Annually**: Refactor test structure and optimize performance

### Test Quality Metrics
- **Execution Time**: Track test suite performance
- **Failure Rate**: Monitor test reliability
- **Coverage Trends**: Track coverage improvements
- **Maintenance Cost**: Time spent fixing tests

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
# Example workflow
- name: Run Backend Tests
  run: |
    cd backend
    python run_tests.py --type unit --coverage
    python run_tests.py --type integration
    python run_tests.py --type e2e

- name: Run Frontend Tests
  run: |
    cd frontend
    node run_tests.js --type all --ci
```

### Pre-commit Hooks
- Run unit tests before commit
- Check test coverage thresholds
- Validate test file structure

## 📚 Additional Resources

### Documentation
- [Backend Test README](backend/tests/README.md)
- [Pytest Documentation](https://docs.pytest.org/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Tools
- **Backend**: pytest, pytest-cov, pytest-xdist
- **Frontend**: Jest, React Testing Library, Playwright
- **Coverage**: Coverage.py, Istanbul
- **Performance**: Locust, Artillery

### Community
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Python Testing](https://realpython.com/python-testing/)
- [React Testing](https://testing-library.com/docs/react-testing-library/intro/)

## 🤝 Contributing

When adding new tests:

1. **Choose the right category** based on test scope
2. **Follow naming conventions**: `test_<feature>_<scenario>.py`
3. **Use appropriate markers** for test categorization
4. **Add to relevant test suite** if testing existing functionality
5. **Update this document** if adding new test categories

## 📞 Support

For questions about testing:

1. Check this document first
2. Review existing test examples
3. Check test runner help: `python run_tests.py --help` or `node run_tests.js --help`
4. Open an issue for complex problems

---

**Remember**: Good tests are an investment in code quality and developer productivity. Write them well, maintain them regularly, and they will serve you well!
