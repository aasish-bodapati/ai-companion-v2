# 🧪 Testing Infrastructure

This document describes the comprehensive testing infrastructure for the AI Companion project, including backend and frontend testing strategies, CI/CD pipelines, and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [Test Migration](#test-migration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Our testing infrastructure follows industry best practices with:

- **Organized Test Structure**: Clear separation of test types
- **Automated CI/CD**: GitHub Actions workflows for all testing
- **Comprehensive Coverage**: Unit, integration, E2E, and performance tests
- **Parallel Execution**: Fast test execution with pytest-xdist
- **Coverage Reporting**: Detailed coverage analysis and reports
- **Production Deployment**: Automated deployment after successful tests

## 🐍 Backend Testing

### Test Structure

```
backend/tests/
├── unit/           # Fast, isolated unit tests
│   ├── services/   # Service layer tests
│   ├── models/     # Data model tests
│   ├── core/       # Core functionality tests
│   └── utils/      # Utility function tests
├── integration/    # Component interaction tests
│   ├── api/        # API endpoint tests
│   ├── database/   # Database integration tests
│   └── services/   # Service integration tests
├── e2e/           # End-to-end workflow tests
│   ├── workflows/  # Complete user workflows
│   └── scenarios/  # User scenarios
└── performance/    # Performance and load tests
    ├── load/       # Load testing
    └── benchmarks/ # Performance benchmarks
```

### Test Types

#### Unit Tests (`tests/unit/`)
- **Purpose**: Test individual functions and classes in isolation
- **Speed**: Very fast (< 1 second per test)
- **Dependencies**: No external dependencies (mocked)
- **Scope**: Single function/class
- **Examples**: Service methods, utility functions, data models

#### Integration Tests (`tests/integration/`)
- **Purpose**: Test component interactions and API endpoints
- **Speed**: Fast (1-5 seconds per test)
- **Dependencies**: Database, external services (mocked)
- **Scope**: Multiple components working together
- **Examples**: API endpoints, database operations, service interactions

#### E2E Tests (`tests/e2e/`)
- **Purpose**: Test complete user workflows and scenarios
- **Speed**: Medium (5-30 seconds per test)
- **Dependencies**: Full application stack
- **Scope**: Complete user journeys
- **Examples**: User registration, conversation flows, memory operations

#### Performance Tests (`tests/performance/`)
- **Purpose**: Test system performance and scalability
- **Speed**: Slow (30+ seconds per test)
- **Dependencies**: Full application with load
- **Scope**: System-wide performance characteristics
- **Examples**: Load testing, stress testing, benchmark comparisons

### Test Markers

Tests are automatically categorized using pytest markers:

```python
# Automatic marker assignment based on test location
@pytest.mark.unit          # tests/unit/
@pytest.mark.integration   # tests/integration/
@pytest.mark.e2e          # tests/e2e/
@pytest.mark.performance  # tests/performance/

# Feature-based markers
@pytest.mark.memory       # Memory-related tests
@pytest.mark.auth         # Authentication tests
@pytest.mark.api          # API endpoint tests
@pytest.mark.database     # Database tests
@pytest.mark.llm          # LLM integration tests
```

### Running Backend Tests

#### Using the Test Runner

```bash
# Run all tests
python run_tests.py --all

# Run specific test types
python run_tests.py --type unit
python run_tests.py --type integration
python run_tests.py --type e2e
python run_tests.py --type performance

# Run tests with specific markers
python run_tests.py --markers memory,auth
python run_tests.py --markers api,database

# Run with coverage and parallel execution
python run_tests.py --all --coverage --parallel

# Save results to file
python run_tests.py --all --output-file results.txt
```

#### Using pytest directly

```bash
# Run all tests
pytest

# Run specific test types
pytest tests/unit/
pytest tests/integration/
pytest tests/e2e/
pytest tests/performance/

# Run tests with markers
pytest -m "memory and auth"
pytest -m "api or database"

# Run with coverage
pytest --cov=app --cov-report=html

# Run in parallel
pytest -n auto
```

## ⚛️ Frontend Testing

### Test Structure

```
frontend/tests/
├── unit/           # React component unit tests
│   ├── components/ # Component tests
│   ├── hooks/      # Custom hook tests
│   └── utils/      # Utility function tests
├── integration/    # Component interaction tests
│   ├── forms/      # Form interaction tests
│   └── flows/      # User flow tests
├── e2e/           # Playwright E2E tests
│   ├── workflows/  # Complete user workflows
│   └── scenarios/  # User scenarios
└── visual/         # Visual regression tests
    └── screenshots/ # Screenshot comparisons
```

### Test Types

#### Unit Tests (`tests/unit/`)
- **Purpose**: Test individual React components and hooks
- **Framework**: Jest + React Testing Library
- **Speed**: Very fast (< 1 second per test)
- **Scope**: Single component/hook
- **Examples**: Component rendering, prop handling, state changes

#### Integration Tests (`tests/integration/`)
- **Purpose**: Test component interactions and form flows
- **Framework**: Jest + React Testing Library
- **Speed**: Fast (1-5 seconds per test)
- **Scope**: Multiple components working together
- **Examples**: Form submissions, component communication, user interactions

#### E2E Tests (`tests/e2e/`)
- **Purpose**: Test complete user workflows in browser
- **Framework**: Playwright
- **Speed**: Medium (5-30 seconds per test)
- **Scope**: Complete user journeys
- **Examples**: User registration, chat interactions, memory operations

#### Visual Tests (`tests/visual/`)
- **Purpose**: Detect visual regressions
- **Framework**: Playwright + visual comparison
- **Speed**: Medium (10-60 seconds per test)
- **Scope**: UI appearance and layout
- **Examples**: Screenshot comparisons, layout testing

### Running Frontend Tests

#### Using the Test Runner

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:visual

# Run with coverage
npm run test:all -- --coverage

# Run in watch mode
npm run test:unit -- --watch

# Run in CI mode
npm run test:all -- --ci
```

#### Using Jest/Playwright directly

```bash
# Unit and integration tests
npm test
npm test -- --coverage
npm test -- --watch

# E2E tests
npx playwright test
npx playwright test --headed
npx playwright test --debug

# Visual tests
npx playwright test --grep "visual"
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

#### Backend Tests (`backend-tests.yml`)
- **Triggers**: Push/PR to main/develop with backend changes
- **Matrix**: Python 3.11, 3.12 × Test types (unit, integration, E2E, performance)
- **Features**: Dependency caching, parallel execution, coverage reporting
- **Artifacts**: Test results, coverage reports

#### Frontend Tests (`frontend-tests.yml`)
- **Triggers**: Push/PR to main/develop with frontend changes
- **Matrix**: Node 18, 20 × Test types (unit, integration, E2E)
- **Features**: Dependency caching, Playwright browser installation
- **Artifacts**: Test results, coverage reports, build artifacts

#### Production Deployment (`deploy.yml`)
- **Triggers**: After successful completion of all test workflows
- **Features**: Docker image building, ECR push, EC2 deployment
- **Security**: AWS credentials, SSH key authentication
- **Monitoring**: Health checks, deployment notifications

### Workflow Features

- **Path-based triggers**: Only run when relevant files change
- **Matrix builds**: Test multiple configurations in parallel
- **Dependency caching**: Fast builds with cached dependencies
- **Artifact storage**: Preserve test results and coverage reports
- **Health checks**: Verify deployment success
- **Rollback capability**: Automatic rollback on failure

## 📁 Test Organization

### File Naming Conventions

```
# Test files
test_[component]_[feature].py          # Backend
[Component].test.[feature].tsx         # Frontend

# Test directories
tests/[type]/[category]/               # Organized by type and category

# Examples
test_memory_service_utils.py           # Backend unit test
test_memory_api_integration.py         # Backend integration test
ChatInput.test.rendering.tsx           # Frontend unit test
ChatInput.test.interaction.tsx         # Frontend integration test
```

### Test Structure Guidelines

```python
# Backend test structure
def test_function_name():
    """Test description."""
    # Arrange
    input_data = "test input"
    
    # Act
    result = function_under_test(input_data)
    
    # Assert
    assert result == "expected output"

# Frontend test structure
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    render(<Component prop="value" />)
    
    // Act
    const element = screen.getByText('expected text')
    
    // Assert
    expect(element).toBeInTheDocument()
  })
})
```

## 🏃‍♂️ Running Tests

### Local Development

```bash
# Backend
cd backend
python run_tests.py --type unit --watch

# Frontend
cd frontend
npm run test:unit -- --watch
```

### CI/CD Execution

```bash
# Tests run automatically on:
# - Push to main/develop
# - Pull request to main/develop
# - Manual workflow dispatch

# View results in GitHub Actions tab
# Download artifacts for detailed analysis
```

### Test Environment Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m pytest --version

# Frontend
cd frontend
npm install
npx playwright install
```

## 🔄 Test Migration

### Automatic Migration

Use the migration script to reorganize existing tests:

```bash
cd backend
python scripts/migrate_tests.py --dry-run    # See what would change
python scripts/migrate_tests.py              # Perform migration
```

### Manual Migration

1. **Identify test type** based on content and purpose
2. **Move to appropriate directory** in new structure
3. **Update imports** if necessary
4. **Verify test execution** in new location
5. **Update any hardcoded paths** in test files

### Migration Checklist

- [ ] Run migration script in dry-run mode
- [ ] Review proposed changes
- [ ] Execute migration
- [ ] Verify all tests still pass
- [ ] Update CI/CD configuration if needed
- [ ] Commit new structure
- [ ] Update team documentation

## 📚 Best Practices

### Test Writing

- **Arrange-Act-Assert**: Clear test structure
- **Descriptive names**: Test names that explain the scenario
- **Single responsibility**: One assertion per test
- **Meaningful data**: Use realistic test data
- **Clean setup/teardown**: Proper test isolation

### Test Organization

- **Logical grouping**: Group related tests together
- **Consistent naming**: Follow established conventions
- **Appropriate scope**: Choose right test type for the scenario
- **Documentation**: Clear docstrings and comments

### Performance

- **Fast execution**: Unit tests should be very fast
- **Parallel execution**: Use pytest-xdist for speed
- **Efficient setup**: Minimize test setup overhead
- **Resource cleanup**: Proper cleanup after tests

### Maintenance

- **Regular updates**: Keep tests up to date with code changes
- **Refactoring**: Improve tests as you improve code
- **Coverage monitoring**: Track and improve test coverage
- **Performance monitoring**: Track test execution times

## 🛠️ Troubleshooting

### Common Issues

#### Backend Tests

```bash
# Import errors
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Database connection issues
export DATABASE_URL="sqlite:///./test.db"

# Memory issues
export MEMORY_ENABLED=false
```

#### Frontend Tests

```bash
# Playwright browser issues
npx playwright install

# Jest configuration issues
npm run test:unit -- --verbose

# Coverage issues
npm run test:unit -- --coverage --watchAll=false
```

#### CI/CD Issues

```bash
# Workflow failures
# Check GitHub Actions logs for specific error messages
# Verify secrets are properly configured
# Check file paths and permissions
```

### Debugging Tests

```bash
# Backend - verbose output
pytest -v -s --tb=long

# Frontend - debug mode
npm run test:unit -- --verbose --no-coverage

# E2E - headed mode
npx playwright test --headed --debug
```

### Performance Issues

```bash
# Slow test execution
pytest --durations=10          # Show slowest tests
npm run test:unit -- --verbose # Frontend timing

# Memory issues
pytest --maxfail=1             # Stop on first failure
npm run test:unit -- --maxWorkers=1
```

## 📊 Monitoring and Reporting

### Test Metrics

- **Execution time**: Track test performance
- **Coverage**: Monitor code coverage trends
- **Failure rates**: Track test reliability
- **Flakiness**: Identify unstable tests

### Coverage Reports

```bash
# Backend
python run_tests.py --all --coverage
# View: backend/htmlcov/index.html

# Frontend
npm run test:all -- --coverage
# View: frontend/coverage/lcov-report/index.html
```

### Test Results

- **GitHub Actions**: Automatic test execution and reporting
- **Artifacts**: Downloadable test results and coverage reports
- **Notifications**: Slack/email notifications for failures
- **Dashboards**: Test status and metrics overview

## 🔮 Future Enhancements

### Planned Improvements

- **Test parallelization**: Further optimize test execution speed
- **Visual regression**: Enhanced visual testing capabilities
- **Performance benchmarking**: Automated performance regression detection
- **Test data management**: Better test data generation and management
- **Mobile testing**: Add mobile device testing capabilities

### Integration Opportunities

- **Code quality**: SonarQube integration
- **Security scanning**: Automated security testing
- **Dependency scanning**: Vulnerability detection
- **Performance monitoring**: Real-time performance tracking

---

## 📞 Support

For questions about the testing infrastructure:

1. **Check this documentation** first
2. **Review GitHub Actions logs** for specific errors
3. **Check test output** for detailed error messages
4. **Consult team members** for complex issues

---

*Last updated: $(date)*

