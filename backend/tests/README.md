# AI Companion Backend Test Suite

This directory contains comprehensive tests for the AI Companion Backend, focusing on memory correctness as the #1 priority.

## Test Structure

### Core Test Files

1. **`test_memory_correctness.py`** - The most important test file
   - Tests the specific scenarios from requirements
   - Onboarding processing: "I wake up at 7 and run for 30 minutes" → DB has wake_up_time=7, habit run=30min
   - Memory retrieval: "What time do I wake up?" → Response includes 7 AM
   - Updating memories: "I wake up at 7" → "I wake up at 6 now" → DB updated to 6
   - Null cases: "Hello!" → Nothing stored

2. **`test_memory_crud.py`** - Memory CRUD operations
   - Create, read, update, delete memory operations
   - Metadata handling
   - Soft/hard delete functionality
   - User isolation

3. **`test_memory_service.py`** - Memory service layer
   - Memory storage and retrieval
   - Importance scoring
   - Memory consolidation
   - Profile memory handling

4. **`test_onboarding_processing.py`** - Onboarding functionality
   - Profile creation and management
   - Structured data storage
   - Completion status tracking

5. **`test_api_endpoints.py`** - API integration tests
   - `/onboarding/process-briefing` endpoint
   - `/onboarding-chat/chat` endpoint
   - `/onboarding-chat/test-memory` endpoint
   - Memory management endpoints

### Test Configuration

- **`conftest.py`** - Test fixtures and configuration
- **`pytest.ini`** - Pytest configuration
- **`run_tests.py`** - Test runner script

## Running Tests

### Run All Tests
```bash
cd backend
python run_tests.py
```

### Run Specific Test Suites
```bash
# Memory correctness tests (most important)
python run_tests.py --memory

# API endpoint tests
python run_tests.py --api

# CRUD operation tests
python run_tests.py --crud

# Memory service tests
python run_tests.py --service

# Onboarding processing tests
python run_tests.py --onboarding

# Unit tests only
python run_tests.py --unit

# Integration tests only
python run_tests.py --integration
```

### Run with Coverage
```bash
python -m pytest tests/ --cov=app --cov-report=html
```

## Test Categories

### Unit Tests
- Test individual functions and methods
- Mock external dependencies
- Fast execution
- Focus on logic correctness

### Integration Tests
- Test API endpoints
- Test database interactions
- Test service layer integration
- More realistic scenarios

### Memory Correctness Tests
- **Priority #1**: Test memory storage and retrieval accuracy
- Test fact extraction from onboarding
- Test memory updates and consolidation
- Test null case handling

## Key Test Scenarios

### 1. Onboarding Processing
```python
def test_onboarding_processing_wake_up_time():
    # Input: "I wake up at 7 and run for 30 minutes."
    # Assert: DB has fact wake_up_time=7, habit run=30min
```

### 2. Memory Retrieval
```python
def test_memory_retrieval_wake_up_time():
    # Input: "What time do I wake up?"
    # Assert: Response includes 7 AM
```

### 3. Updating Memories
```python
def test_updating_memories_wake_up_time_change():
    # Input 1: "I wake up at 7."
    # Input 2: "I wake up at 6 now."
    # Assert: DB updated to 6
```

### 4. Null Cases
```python
def test_null_cases_greeting():
    # Input: "Hello!"
    # Assert: Nothing stored
```

## Test Data

### Fixtures
- `test_user` - Standard test user
- `test_user_2` - Second test user for isolation tests
- `test_memory` - Sample memory for testing
- `test_onboarding_profile` - Sample onboarding profile
- `auth_headers` - Authentication headers for API tests

### Mock Data
- `sample_briefing_text` - Sample onboarding text
- `mock_llm_response` - Mock LLM responses
- `memory_test_data` - Test data for memory operations

## Coverage Requirements

- **Minimum 80% code coverage**
- **100% coverage for memory-related code**
- **100% coverage for onboarding processing**
- **100% coverage for API endpoints**

## Test Database

- Uses SQLite in-memory database for tests
- Fresh database for each test
- No external dependencies
- Fast test execution

## Mocking Strategy

- **LLM calls**: Mocked to avoid external API calls
- **Vector store**: Mocked to avoid FAISS dependencies
- **Database**: Real SQLite for realistic testing
- **External services**: All mocked

## Continuous Integration

Tests should be run:
- On every commit
- Before deployment
- In CI/CD pipeline
- With coverage reporting

## Debugging Tests

### Run Single Test
```bash
python -m pytest tests/test_memory_correctness.py::TestMemoryCorrectness::test_onboarding_processing_wake_up_time -v
```

### Run with Debug Output
```bash
python -m pytest tests/ -v -s --tb=long
```

### Run with Coverage
```bash
python -m pytest tests/ --cov=app --cov-report=term-missing
```

## Test Maintenance

- Update tests when adding new features
- Ensure all new code has tests
- Keep test data realistic
- Maintain test performance
- Document test scenarios

## Performance Considerations

- Tests should run in < 30 seconds total
- Individual tests should run in < 1 second
- Use mocking to avoid slow operations
- Parallel test execution where possible

## Best Practices

1. **Test the behavior, not the implementation**
2. **Use descriptive test names**
3. **One assertion per test when possible**
4. **Mock external dependencies**
5. **Keep tests independent**
6. **Use realistic test data**
7. **Test edge cases and error conditions**
8. **Maintain high test coverage**
