# Testing Action Plan - Immediate Fixes

## Priority 1: Backend API Fixes

### 1.1 Fix Memory API 404 Errors

**Issue**: Multiple memory endpoints returning 404 errors
**Root Cause**: Likely routing or authentication issues

**Actions**:
```bash
# 1. Check memory routes registration
cd backend
python -c "from app.main import app; print([route.path for route in app.routes if 'memory' in route.path])"

# 2. Test memory endpoints directly
curl -X GET http://localhost:8000/api/v1/memories -H "Authorization: Bearer test-token"

# 3. Check authentication middleware
# Review app/api/deps.py for proper auth handling
```

**Files to Check**:
- `backend/app/api/endpoints/memories.py`
- `backend/app/api/deps.py`
- `backend/app/main.py` (route registration)

### 1.2 Fix Conversation Streaming 500 Errors

**Issue**: Conversation streaming endpoints returning 500 errors
**Root Cause**: Likely LLM integration or response handling issues

**Actions**:
```bash
# 1. Test streaming endpoint
curl -X POST http://localhost:8000/api/v1/conversations/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"message": "test", "conversation_id": "test-id"}'

# 2. Check LLM configuration
# Review app/core/llm.py for proper error handling
```

**Files to Check**:
- `backend/app/api/endpoints/conversations_streaming.py`
- `backend/app/core/llm.py`
- `backend/app/core/conversation_flow.py`

### 1.3 Fix Authentication Error Codes

**Issue**: Some endpoints returning 404 instead of 401/403
**Root Cause**: Authentication middleware not properly configured

**Actions**:
```bash
# 1. Test unauthenticated requests
curl -X GET http://localhost:8000/api/v1/memories
# Should return 401, not 404

# 2. Test with invalid token
curl -X GET http://localhost:8000/api/v1/memories -H "Authorization: Bearer invalid-token"
# Should return 401, not 404
```

**Files to Check**:
- `backend/app/api/deps.py`
- `backend/app/middleware/auth_cookies.py`
- `backend/app/core/security.py`

## Priority 2: Frontend Test Infrastructure

### 2.1 Fix Server Connectivity Issues

**Issue**: E2E tests failing due to connection refused
**Root Cause**: Tests running before servers are ready

**Actions**:
```bash
# 1. Add health check before tests
# Create frontend/tests/helpers/health-check.ts
export async function waitForServers() {
  const maxAttempts = 30;
  const delay = 1000;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const backendResponse = await fetch('http://localhost:8000/health');
      const frontendResponse = await fetch('http://localhost:3000');
      
      if (backendResponse.ok && frontendResponse.ok) {
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1}: Servers not ready, retrying...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw new Error('Servers failed to start within timeout');
}
```

### 2.2 Fix Test Selectors

**Issue**: `[data-testid="message-input"]` not found
**Root Cause**: Missing or incorrect test attributes

**Actions**:
```bash
# 1. Add data-testid attributes to components
# Update frontend/src/components/ChatInput.tsx
<input
  data-testid="message-input"
  type="text"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  placeholder="Type your message..."
/>

# 2. Add data-testid to other critical components
# - Navigation links
# - Send button
# - Response containers
# - Memory items
```

**Files to Update**:
- `frontend/src/components/ChatInput.tsx`
- `frontend/src/components/Navigation.tsx`
- `frontend/src/components/MemoryList.tsx`
- `frontend/src/app/companion/page.tsx`

## Priority 3: Test Data Management

### 3.1 Implement Test Data Setup

**Issue**: Tests interfering with each other due to shared state
**Root Cause**: No proper test data isolation

**Actions**:
```bash
# 1. Create test data factories
# backend/tests/factories.py
from app.models import User, Conversation, Memory
from app.schemas import UserCreate

def create_test_user():
    return UserCreate(
        email="test@example.com",
        password="testpassword123"
    )

def create_test_conversation(user_id: str):
    return Conversation(
        user_id=user_id,
        title="Test Conversation"
    )

# 2. Add database cleanup
# backend/tests/conftest.py
@pytest.fixture(autouse=True)
def cleanup_database():
    yield
    # Clean up test data after each test
    db = next(get_db())
    db.query(Memory).delete()
    db.query(Conversation).delete()
    db.query(User).delete()
    db.commit()
```

### 3.2 Mock External Services

**Issue**: Tests failing due to external API dependencies
**Root Cause**: No mocking of external services

**Actions**:
```bash
# 1. Mock LLM responses
# backend/tests/mocks/llm_mock.py
class MockLLM:
    def generate(self, prompt: str) -> str:
        return "Mock response for testing"
    
    def generate_stream(self, prompt: str):
        yield "Mock streaming response"

# 2. Mock external APIs
# backend/tests/mocks/external_apis.py
class MockOpenRouterAPI:
    def generate_content(self, *args, **kwargs):
        return {"text": "Mock OpenRouter response"}

# 3. Update test configuration
# backend/tests/conftest.py
@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch):
    monkeypatch.setattr("app.core.llm.generate_response", MockOpenRouterAPI().generate_content)
```

## Priority 4: Test Execution Improvements

### 4.1 Add Retry Mechanisms

**Issue**: Flaky tests due to timing issues
**Root Cause**: No retry logic for transient failures

**Actions**:
```bash
# 1. Add retry decorator
# backend/tests/utils/retry.py
import time
from functools import wraps

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise e
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

# 2. Apply to flaky tests
@retry(max_attempts=3)
def test_memory_creation():
    # Test implementation
    pass
```

### 4.2 Improve Test Reporting

**Issue**: Difficult to understand test failures
**Root Cause**: Insufficient error reporting

**Actions**:
```bash
# 1. Add detailed error messages
# backend/tests/conftest.py
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )

# 2. Add custom test markers
@pytest.mark.slow
def test_long_running_operation():
    pass

# 3. Improve assertion messages
def test_memory_creation():
    response = client.post("/api/v1/memories", json={"content": "test"})
    assert response.status_code == 201, f"Expected 201, got {response.status_code}. Response: {response.text}"
```

## Implementation Timeline

### Day 1: Backend API Fixes
- [ ] Fix memory API 404 errors
- [ ] Fix conversation streaming 500 errors
- [ ] Fix authentication error codes

### Day 2: Frontend Infrastructure
- [ ] Add health checks before E2E tests
- [ ] Fix test selectors
- [ ] Add data-testid attributes

### Day 3: Test Data Management
- [ ] Implement test data factories
- [ ] Add database cleanup
- [ ] Mock external services

### Day 4: Test Execution
- [ ] Add retry mechanisms
- [ ] Improve test reporting
- [ ] Add custom test markers

### Day 5: Validation
- [ ] Run full test suite
- [ ] Verify improvements
- [ ] Document any remaining issues

## Success Criteria

### Backend Tests
- [ ] 90%+ test pass rate
- [ ] No 404/500 errors in API tests
- [ ] All authentication tests passing
- [ ] LLM integration tests working with mocks

### Frontend Tests
- [ ] 85%+ test pass rate
- [ ] All E2E tests running without connection errors
- [ ] All test selectors working
- [ ] Tests completing within timeout limits

### Overall
- [ ] Test execution time < 5 minutes
- [ ] No flaky tests
- [ ] Clear error messages for failures
- [ ] Proper test isolation

---

*This action plan should be executed in order, with each day's tasks completed before moving to the next day.*
