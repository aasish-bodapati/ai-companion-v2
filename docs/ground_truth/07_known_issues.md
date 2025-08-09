# Known Issues & Technical Debt

## Critical Issues

### 1. Authentication Token Mismatch
- **Status**: In Progress
- **Description**: Token URL in `deps.py` doesn't match the actual login endpoint
- **Impact**: Causes 404 errors on protected routes
- **Branch**: `bugfix/auth-token-url`
- **ETA**: 2023-08-10

### 2. SQLite Threading Issues
- **Status**: Open
- **Description**: SQLite objects created in one thread can't be used in another
- **Error**: `SQLite objects created in a thread can only be used in that same thread`
- **Impact**: Crashes in production with multiple concurrent users
- **Priority**: High

## High Priority

### 3. Message Creation Fails with 500
- **Status**: Investigating
- **Description**: Creating messages sometimes fails with a 500 error
- **Error Logs**:
  ```
  ERROR:app.api.endpoints.messages:Error creating message
  sqlalchemy.exc.ProgrammingError: (sqlite3.ProgrammingError) 
  Incorrect number of bindings supplied
  ```
- **Workaround**: Refresh the page and try again

### 4. Memory Leak in Chat Interface
- **Status**: Confirmed
- **Description**: Memory usage grows with chat history
- **Steps to Reproduce**:
  1. Have a long conversation
  2. Monitor memory usage
  3. Notice gradual increase
- **Impact**: Degraded performance over time

## Medium Priority

### 5. Inconsistent Error Handling
- **Status**: Backlog
- **Description**: Error responses aren't standardized across endpoints
- **Example**:
  - Some endpoints return `{ "error": "message" }`
  - Others return `{ "detail": "message" }`
- **Impact**: Makes frontend error handling more complex

### 6. Missing Input Validation
- **Status**: Backlog
- **Description**: Some API endpoints don't validate input properly
- **Example**:
  - Message content length isn't validated
  - No rate limiting on authentication endpoints

## Low Priority

### 7. Incomplete Test Coverage
- **Status**: Backlog
- **Description**: Many components lack tests
- **Coverage**:
  - Backend: 65%
  - Frontend: 45%
  - E2E: 10%

### 8. Documentation Gaps
- **Status**: In Progress
- **Description**: Some modules lack docstrings
- **Areas Needing Attention**:
  - AI integration code
  - Memory system
  - Authentication flow

## Technical Debt

### 1. Database Schema
- [ ] Add indexes for common queries
- [ ] Normalize message metadata
- [ ] Add soft delete functionality

### 2. Performance
- [ ] Implement caching for frequent queries
- [ ] Optimize database queries
- [ ] Add pagination to list endpoints

### 3. Security
- [ ] Add rate limiting
- [ ] Implement CSRF protection
- [ ] Add security headers

## Feature Backlog

### High Priority
- [ ] Real-time updates with WebSockets
- [ ] File upload support
- [ ] Message search functionality

### Medium Priority
- [ ] User preferences
- [ ] Conversation archiving
- [ ] Export conversation history

### Low Priority
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Message reactions

## Monitoring & Observability

### Missing Metrics
- [ ] API response times
- [ ] Error rates
- [ ] User activity

### Logging Improvements
- [ ] Structured logging
- [ ] Request ID correlation
- [ ] Sensitive data redaction

## Infrastructure

### Deployment
- [ ] Set up staging environment
- [ ] Implement blue/green deployment
- [ ] Database backup strategy

### CI/CD
- [ ] Automated testing in CI
- [ ] Automated deployments
- [ ] Rollback procedure

## Testing Debt

### Unit Tests Needed
- [ ] Authentication service
- [ ] Message processing
- [ ] Memory retrieval

### Integration Tests
- [ ] API endpoints
- [ ] Database operations
- [ ] Third-party services

## Documentation

### API Documentation
- [ ] Update OpenAPI specs
- [ ] Add examples for all endpoints
- [ ] Document error responses

### Developer Documentation
- [ ] Setup instructions
- [ ] Architecture decisions
- [ ] Troubleshooting guide

## Performance Issues

### Identified Bottlenecks
1. **Database Queries**
   - N+1 query problem in conversation listing
   - No pagination in message history

2. **Frontend**
   - Large bundle size
   - Unoptimized images

## Security Concerns

### Pending Security Tasks
- [ ] Regular dependency updates
- [ ] Security headers
- [ ] Input sanitization audit

## Dependencies

### Outdated Packages
```
backend/
  - fastapi (0.95.0 -> 0.100.0)
  - sqlalchemy (1.4.46 -> 2.0.0)

frontend/
  - next (13.1.6 -> 13.4.0)
  - react (18.2.0 -> 18.3.0)
```

### Vulnerabilities
- [ ] `lodash` prototype pollution (moderate)
- [ ] `axios` SSRF (low)

## Accessibility (a11y)

### Issues
- [ ] Missing alt text on images
- [ ] Insufficient color contrast
- [ ] Keyboard navigation incomplete

## Internationalization (i18n)

### Todo
- [ ] Add i18n framework
- [ ] Extract all user-facing strings
- [ ] Add language selector

## Mobile Experience

### Known Issues
- [ ] Chat input jumps on mobile keyboards
- [ ] Sidebar doesn't collapse on small screens
- [ ] Touch targets too small

## Browser Compatibility

### Testing Needed
- [ ] Safari
- [ ] Firefox
- [ ] Mobile browsers

## Performance Budget

### Current Metrics
- Time to Interactive: 4.2s (target: < 3s)
- First Contentful Paint: 2.1s (target: < 2s)
- Bundle Size: 1.4MB (target: < 1MB)
