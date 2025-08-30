# Backend Test Suite

This directory contains a comprehensive, well-organized test suite for the AI Companion backend.

## Test Organization

### 📁 Unit Tests (`unit/`)
Small, focused tests for individual functions, classes, and methods.
- **Fast execution** (< 100ms per test)
- **No external dependencies** (mocked/stubbed)
- **Single responsibility** (test one thing at a time)

### 📁 Integration Tests (`integration/`)
Tests for service interactions, database operations, and API endpoints.
- **Medium execution time** (100ms - 1s per test)
- **May use test database**
- **Test component interactions**

### 📁 E2E Tests (`e2e/`)
Full workflow tests that simulate real user scenarios.
- **Slower execution** (1s+ per test)
- **Full system integration**
- **Real database and external services**

### 📁 Performance Tests (`performance/`)
Load testing, stress testing, and performance benchmarks.
- **Variable execution time**
- **Performance metrics collection**
- **Resource usage monitoring**

## Running Tests

### All Tests
```bash
pytest
```

### By Category
```bash
# Unit tests only (fastest)
pytest tests/unit/

# Integration tests
pytest tests/integration/

# E2E tests
pytest tests/e2e/

# Performance tests
pytest tests/performance/
```

### By Markers
```bash
# Fast tests only
pytest -m "not slow"

# Slow tests only
pytest -m "slow"

# Specific feature tests
pytest -m "memory"  # Memory-related tests
pytest -m "auth"    # Authentication tests
pytest -m "api"     # API endpoint tests
```

### Coverage
```bash
# Generate coverage report
pytest --cov=app --cov-report=html

# View coverage in browser
open htmlcov/index.html
```

## Test Guidelines

### Unit Tests
- Test one function/method at a time
- Use mocks for external dependencies
- Keep tests under 100ms
- Use descriptive test names

### Integration Tests
- Test component interactions
- Use test database when needed
- Mock external APIs
- Test error conditions

### E2E Tests
- Test complete user workflows
- Use realistic test data
- Test edge cases and error scenarios
- Clean up test data after tests

## Test Data Management

- Use fixtures for common test data
- Clean up after each test
- Use unique identifiers to avoid conflicts
- Mock external services to avoid rate limits

## Continuous Integration

Tests are automatically run on:
- Pull requests
- Main branch commits
- Scheduled runs for performance tests

## Adding New Tests

1. **Choose the right category** based on test scope
2. **Follow naming conventions**: `test_<feature>_<scenario>.py`
3. **Use appropriate markers** for test categorization
4. **Add to relevant test suite** if testing existing functionality
5. **Update this README** if adding new test categories
