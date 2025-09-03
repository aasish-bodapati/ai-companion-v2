# AI Companion Frontend Test Suite

This directory contains comprehensive tests for the AI Companion Frontend, focusing on user experience and functionality validation.

## Test Structure

### Test Categories

1. **Unit Tests** (`tests/unit/`)
   - Test individual components in isolation
   - Mock external dependencies
   - Fast execution
   - Focus on component behavior and logic

2. **Integration Tests** (`tests/integration/`)
   - Test component interactions
   - Test API integration
   - Test user flows
   - More realistic scenarios

3. **End-to-End Tests** (`tests/e2e/`)
   - Test complete user journeys
   - Test in real browser environment
   - Test with real API calls (mocked)
   - Validate full application behavior

## Test Files

### Unit Tests
- **`LoginForm.test.tsx`** - Login form component tests
  - Form validation
  - User input handling
  - Error states
  - Success flows

- **`OnboardingWizard.test.tsx`** - Onboarding form tests
  - Form field handling
  - Data persistence
  - Validation logic
  - Mode switching

- **`ChatInterface.test.tsx`** - Chat interface tests
  - Message sending
  - Response handling
  - Memory usage indicators
  - Loading states

### Integration Tests
- **`AuthFlow.test.tsx`** - Complete authentication flow
  - Login to registration navigation
  - Form validation across components
  - Error handling
  - Success flows

- **`OnboardingFlow.test.tsx`** - Complete onboarding flow
  - Profile creation and updates
  - Data persistence
  - Form validation
  - API integration

### End-to-End Tests
- **`login.spec.ts`** - Login page E2E tests
  - Form submission
  - Navigation
  - Error handling
  - Success flows

- **`onboarding.spec.ts`** - Onboarding page E2E tests
  - Complete form filling
  - Data saving
  - Profile loading
  - Validation

- **`chat.spec.ts`** - Chat functionality E2E tests
  - Message sending
  - Memory usage
  - Conversation flow
  - Error handling

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

### Test Commands

#### Run All Tests
```bash
# Run all test suites
npm run test:all

# Or use the test runner
node run_tests.js all
```

#### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit
node run_tests.js unit

# Integration tests only
npm run test:integration
node run_tests.js integration

# End-to-end tests only
npm run test:e2e
node run_tests.js e2e
```

#### Run with Coverage
```bash
# Generate coverage report
npm run test:coverage
node run_tests.js coverage
```

#### Development Mode
```bash
# Watch mode for unit tests
npm run test:watch
node run_tests.js watch

# CI mode
npm run test:ci
node run_tests.js ci
```

#### E2E Test Variants
```bash
# Smoke tests (quick E2E tests)
npm run test:e2e:smoke
node run_tests.js e2e_smoke

# Regression tests (comprehensive E2E tests)
npm run test:e2e:regression
node run_tests.js e2e_regression
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration
- TypeScript support
- Module path mapping
- Coverage thresholds
- Test environment setup

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing
- Mobile viewport testing
- Screenshot and video capture
- Trace collection
- Local dev server integration

### Test Setup (`jest.setup.js`)
- Global test utilities
- Mock configurations
- Browser API mocks
- Console warning suppression

## Test Coverage

### Coverage Requirements
- **Minimum 70% coverage** for all metrics
- **100% coverage** for critical user flows
- **100% coverage** for authentication
- **100% coverage** for onboarding
- **100% coverage** for chat functionality

### Coverage Reports
- **Terminal**: Real-time coverage during test execution
- **HTML**: Detailed coverage report in `coverage/` directory
- **CI/CD**: XML reports for continuous integration

## Test Data and Mocking

### API Mocking
- Mock API responses for consistent testing
- Simulate different response scenarios
- Test error handling
- Validate request payloads

### Authentication Mocking
- Mock user authentication state
- Test protected routes
- Simulate login/logout flows
- Test authorization

### Browser API Mocking
- Mock Next.js router
- Mock window.location
- Mock fetch API
- Mock IntersectionObserver

## Test Scenarios

### Critical User Flows

1. **Authentication Flow**
   - User registration
   - User login
   - Password validation
   - Error handling
   - Success redirects

2. **Onboarding Flow**
   - Profile creation
   - Form validation
   - Data persistence
   - Profile updates
   - Blueprint creation

3. **Chat Flow**
   - Message sending
   - Response handling
   - Memory usage
   - Conversation history
   - Error recovery

### Edge Cases

1. **Form Validation**
   - Empty fields
   - Invalid formats
   - Length limits
   - Special characters

2. **Network Issues**
   - API failures
   - Timeout handling
   - Retry logic
   - Offline scenarios

3. **Browser Compatibility**
   - Different browsers
   - Mobile devices
   - Screen sizes
   - Accessibility

## Continuous Integration

### CI/CD Pipeline
```bash
# Install dependencies
npm ci

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run all tests
npm run test:ci

# Run E2E tests
npm run test:e2e
```

### Test Reports
- **Jest**: Test results and coverage
- **Playwright**: E2E test results with screenshots
- **Coverage**: HTML and XML reports
- **Artifacts**: Screenshots, videos, and traces

## Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test -- LoginForm.test.tsx

# Run with verbose output
npm test -- --verbose

# Run in watch mode
npm run test:watch
```

### E2E Test Debugging
```bash
# Run with headed browser
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run specific test
npx playwright test login.spec.ts

# Show test results
npx playwright show-report
```

### Coverage Debugging
```bash
# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html
```

## Best Practices

### Test Writing
1. **Write tests first** (TDD approach)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Keep tests independent**
5. **Mock external dependencies**

### Test Organization
1. **Group related tests**
2. **Use consistent naming**
3. **Follow AAA pattern** (Arrange, Act, Assert)
4. **Keep tests focused**
5. **Avoid test duplication**

### Performance
1. **Run tests in parallel**
2. **Use appropriate test types**
3. **Mock expensive operations**
4. **Optimize test data**
5. **Clean up after tests**

## Troubleshooting

### Common Issues

1. **Tests failing due to timeouts**
   - Increase timeout values
   - Check for async operations
   - Verify mock responses

2. **E2E tests flaky**
   - Add proper waits
   - Use stable selectors
   - Check for race conditions

3. **Coverage not meeting thresholds**
   - Add missing test cases
   - Check for untested code paths
   - Verify coverage configuration

4. **Mock not working**
   - Check mock setup
   - Verify import paths
   - Ensure proper cleanup

### Getting Help
- Check test logs for detailed error messages
- Use debug mode for step-by-step execution
- Review test documentation
- Check CI/CD logs for environment issues

## Maintenance

### Regular Tasks
- Update test dependencies
- Review and update test scenarios
- Monitor test performance
- Update coverage thresholds
- Clean up obsolete tests

### Test Updates
- Update tests when adding new features
- Refactor tests when changing implementation
- Remove tests for deprecated features
- Add tests for bug fixes
- Update mock data as needed
