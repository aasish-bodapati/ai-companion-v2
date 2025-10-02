# UI Components Testing Guide

This directory contains comprehensive tests for the shared UI components, organized by testing type and component.

## Test Structure

```
__tests__/
├── README.md                    # This file
├── StatsCard.test.tsx          # Unit tests for StatsCard
├── FormField.test.tsx          # Unit tests for FormField
├── DateSelector.test.tsx       # Unit tests for DateSelector
├── FormModal.test.tsx          # Unit tests for FormModal
├── integration/                # Integration tests
│   └── FormLayout.test.tsx     # Form layout integration tests
├── performance/                # Performance tests
│   └── Performance.test.tsx    # Performance and memory tests
└── accessibility/              # Accessibility tests
    └── Accessibility.test.tsx  # A11y compliance tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Categories
```bash
# UI component tests only
npm run test:ui

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance

# Accessibility tests only
npm run test:accessibility
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Categories

### 1. Unit Tests
- **Purpose**: Test individual components in isolation
- **Coverage**: Props, state, events, rendering
- **Files**: `*.test.tsx` in root of `__tests__/`

### 2. Integration Tests
- **Purpose**: Test how components work together
- **Coverage**: Component interactions, data flow, user workflows
- **Files**: `integration/*.test.tsx`

### 3. Performance Tests
- **Purpose**: Ensure components perform well under load
- **Coverage**: Render times, memory usage, bundle size
- **Files**: `performance/*.test.tsx`

### 4. Accessibility Tests
- **Purpose**: Ensure components are accessible to all users
- **Coverage**: Screen reader support, keyboard navigation, color contrast
- **Files**: `accessibility/*.test.tsx`

## Testing Best Practices

### 1. Test Structure
```tsx
describe('ComponentName', () => {
  // Setup
  const defaultProps = { /* ... */ };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic rendering
  it('renders correctly with basic props', () => {
    // Test implementation
  });

  // Props variations
  it('handles different prop values', () => {
    // Test implementation
  });

  // User interactions
  it('handles user interactions', () => {
    // Test implementation
  });

  // Edge cases
  it('handles edge cases', () => {
    // Test implementation
  });
});
```

### 2. Mocking Guidelines
- Mock external dependencies (APIs, navigation, etc.)
- Use realistic mock data
- Keep mocks simple and focused
- Mock at the module level when possible

### 3. Assertion Guidelines
- Test behavior, not implementation
- Use meaningful test descriptions
- Test both positive and negative cases
- Verify accessibility attributes

### 4. Performance Testing
- Test with realistic data volumes
- Measure render times
- Check memory usage
- Verify bundle size impact

## Component-Specific Testing

### StatsCard
- **Props**: title, value, subtitle, icon, trend, onPress
- **States**: loading, disabled, different variants
- **Interactions**: press events, haptic feedback
- **Accessibility**: screen reader support, focus management

### FormField
- **Props**: label, value, onChangeText, error, helperText
- **States**: required, disabled, error, success
- **Interactions**: text input, blur events, icon press
- **Accessibility**: form labels, error announcements

### DateSelector
- **Props**: selectedDate, onDateSelect, label
- **States**: different date formats, calendar modal
- **Interactions**: navigation, calendar selection
- **Accessibility**: date announcements, keyboard navigation

### FormModal
- **Props**: visible, onClose, title, actions
- **States**: loading, different variants, form validation
- **Interactions**: modal open/close, action buttons
- **Accessibility**: modal announcements, focus management

## Continuous Integration

### Pre-commit Hooks
```bash
# Run tests before commit
npm run test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### CI Pipeline
1. Install dependencies
2. Run linting
3. Run type checking
4. Run unit tests
5. Run integration tests
6. Run performance tests
7. Run accessibility tests
8. Generate coverage report

## Debugging Tests

### Common Issues
1. **Mock not working**: Check mock placement and scope
2. **Async operations**: Use `waitFor` or `act`
3. **Component not rendering**: Check props and dependencies
4. **Test timing out**: Add appropriate timeouts

### Debug Commands
```bash
# Run specific test with verbose output
npm test -- --verbose StatsCard.test.tsx

# Run tests in debug mode
npm test -- --detectOpenHandles

# Run tests with coverage for specific file
npm run test:coverage -- --testPathPattern=StatsCard
```

## Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **Performance Tests**: All critical paths
- **Accessibility Tests**: All interactive elements

## Maintenance

### Regular Tasks
- Update tests when components change
- Review and update mocks
- Check for deprecated testing patterns
- Update accessibility tests for new requirements

### Test Review Checklist
- [ ] All props are tested
- [ ] All user interactions are tested
- [ ] Error states are tested
- [ ] Accessibility is verified
- [ ] Performance is acceptable
- [ ] Tests are maintainable

## Resources

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Accessibility Testing Guide](https://web.dev/accessibility-testing/)
- [Performance Testing Best Practices](https://web.dev/performance-testing/)
