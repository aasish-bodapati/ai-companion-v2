# AI Companion MVP Test Suite

This directory contains comprehensive tests for the AI Companion MVP, covering all critical functionality to ensure a production-ready system with memory-first architecture and incognito privacy features.

## Test Structure

The test suite is organized into 8 main categories that align with the MVP requirements:

### 1. Conversations & Chat (`test_conversations.py`)
- **Goal**: Ensure users can create/manage conversations, send/receive messages, and AI replies correctly
- **Key Tests**:
  - Conversation creation with proper defaults (incognito_mode=false)
  - Incognito conversation creation
  - Message sending and AI reply generation
  - Message history retention
  - Idempotency (duplicate message handling)
  - Rate limiting
- **Critical Scenarios**:
  - Regular conversation: "My name is Alex" → later "What's my name?" → recalls Alex
  - Incognito conversation: "My name is Alex" → later "What's my name?" → no recall

### 2. Memory System (`test_memory_system.py`)
- **Goal**: Validate memory capture, retrieval, and lifecycle
- **Key Tests**:
  - Memory capture from user facts/preferences
  - Memory retrieval in future responses
  - Deduplication (preventing duplicate memories)
  - Importance scoring (life goals vs trivial facts)
  - Memory categorization (fact, preference, goal, etc.)
  - Memory update/delete operations
- **Critical Scenarios**:
  - "I live in Seattle" → stored as fact
  - Repeat same fact → no duplicate created
  - "My life goal is to wake up at 6AM daily" → higher importance score
  - Delete memory → confirm removal

### 3. Productivity Tools (`test_productivity_tools.py`)
- **Goal**: CRUD operations for notes, tasks, and reminders
- **Key Tests**:
  - Notes: create, list, update, delete
  - Tasks: create, list, update (status changes), delete
  - Reminders: create, list, update, delete, schedule time
  - User isolation (no data leaks between users)
- **Critical Scenarios**:
  - User A creates note → only visible to User A
  - Reminder with timestamp → shows correct datetime

### 4. User Management (`test_auth_user_management.py`)
- **Goal**: Secure authentication and profile management
- **Key Tests**:
  - User registration
  - Login with JWT token generation
  - Logout and token invalidation
  - Profile updates
  - Authentication enforcement on protected endpoints
- **Critical Scenarios**:
  - Call `/memory/users/me/memories` without JWT → 401 Unauthorized

### 5. Onboarding Flow (`test_onboarding_flow.py`)
- **Goal**: Initial user data processed into memories
- **Key Tests**:
  - Submit onboarding description processing
  - Memory chunking and categorization
  - Later retrieval of onboarding memories
- **Critical Scenarios**:
  - Submit "I hike weekends, I work in AI" → creates hiking and profession memories
  - Later ask "What do I do on weekends?" → retrieves hiking memory

### 6. Incognito Mode (`test_incognito_mode.py`)
- **Goal**: Memory-off conversations work like ChatGPT
- **Key Tests**:
  - Incognito conversation creation
  - No memory capture in incognito mode
  - No memory retrieval in incognito mode
  - Normal memory functionality in regular conversations
- **Critical Scenarios**:
  - Regular conversation stores "I live in Seattle"
  - Incognito conversation → AI does not mention Seattle

### 7. Monitoring & Analytics (`test_monitoring_analytics.py`)
- **Goal**: Ensure system observability
- **Key Tests**:
  - Memory status endpoint with statistics
  - System health endpoints
  - Prometheus metrics endpoint
  - Memory event logging
  - Error logging and monitoring
  - Performance metrics
- **Critical Scenarios**:
  - Memory status shows total count, deduplication stats
  - System status returns 200 OK with health info
  - Memory operations are logged

### 8. Performance (`test_performance.py`)
- **Goal**: Basic performance validation for MVP
- **Key Tests**:
  - Memory search latency (under 1 second)
  - Conversation scalability (100+ messages)
  - Concurrent operations
  - Database connection pool handling
  - Large dataset performance
- **Critical Scenarios**:
  - Memory search returns results under 1 second
  - Conversations scale to ~100 messages without slowdown

## Running Tests

### Quick Start
```bash
# Run all tests
python run_tests.py all

# Run core tests (skip performance)
python run_tests.py quick

# Run with coverage report
python run_tests.py coverage
```

### Individual Test Categories
```bash
# Run specific test categories
python run_tests.py conversation    # Conversations & Chat
python run_tests.py memory         # Memory System
python run_tests.py productivity   # Productivity Tools
python run_tests.py auth           # User Management
python run_tests.py onboarding     # Onboarding Flow
python run_tests.py incognito      # Incognito Mode
python run_tests.py monitor        # Monitoring & Analytics
python run_tests.py performance    # Performance Tests
```

### Direct pytest Commands
```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_conversations.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run performance tests with output
pytest tests/test_performance.py -v -s
```

## Test Configuration

### Fixtures (`conftest.py`)
- `client`: AsyncClient for making HTTP requests
- `auth_headers`: Authentication headers for protected endpoints
- `db_session`: Database session for direct database operations
- `test_user`: Test user for authentication tests

### Dependencies
All required testing dependencies are included in `requirements.txt`:
- `pytest>=8.0.0` - Test framework
- `pytest-cov>=4.1.0` - Coverage reporting
- `pytest-asyncio>=0.23.0` - Async test support
- `httpx>=0.25.1` - HTTP client for API testing
- `starlette>=0.27.0` - ASGI framework support

## MVP Success Criteria

The MVP is considered production-ready when **ALL** tests pass:

✅ **Core Functionality**
- Users can chat normally and AI replies correctly
- Regular conversations store and recall facts
- Incognito conversations have no memory storage/retrieval
- Notes, tasks, and reminders CRUD works per user
- Onboarding creates initial memories
- Authentication and security are enforced

✅ **System Health**
- Monitoring shows memory/system statistics
- Performance meets basic requirements
- Error handling and logging work correctly

## Test Data and Isolation

- Each test uses isolated test data
- Tests clean up after themselves
- User isolation is enforced (no data leaks between users)
- Database transactions are properly managed
- Mocking is used for external dependencies

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Fast execution (most tests complete in seconds)
- Clear pass/fail criteria
- Comprehensive coverage reporting
- Performance benchmarks for regression detection

## Troubleshooting

### Common Issues
1. **Database connection errors**: Ensure test database is properly configured
2. **Authentication failures**: Check that test user fixtures are working
3. **Performance test failures**: May indicate system resource issues
4. **Import errors**: Verify all dependencies are installed

### Debug Mode
```bash
# Run tests with detailed output
pytest tests/ -v -s --tb=long

# Run single test with debugging
pytest tests/test_conversations.py::TestConversationCreation::test_create_conversation -v -s
```

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Add appropriate fixtures in `conftest.py`
3. Include both positive and negative test cases
4. Add performance considerations for new features
5. Update this README with new test categories

---

**Note**: This test suite represents the minimum viable product (MVP) requirements. Additional tests may be needed as the system evolves beyond the MVP stage.
