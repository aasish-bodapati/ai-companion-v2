# Development Rules

## Coding Standards

### Backend (Python)
- Follow [PEP 8](https://peps.python.org/pep-0008/) style guide
- Use type hints for all function signatures
- Maximum line length: 88 characters (black default)
- Use absolute imports
- Document all public functions with Google-style docstrings
- Use `snake_case` for variables and functions
- Use `PascalCase` for class names

### Frontend (TypeScript/React)
- Use TypeScript strict mode
- Follow [Airbnb React/JSX Style Guide](https://airbnb.io/javascript/react/)
- Use functional components with hooks
- Prefer named exports over default exports
- Use `camelCase` for variables and functions
- Use `PascalCase` for components and interfaces
- Use `UPPER_CASE` for constants

## Testing Requirements

### Backend
- Write unit tests for all business logic
- Use `pytest` for testing
- Aim for 80%+ test coverage
- Mock external dependencies
- Use `pytest-mock` for mocking
- Test both success and error cases

### Frontend
- Use Jest and React Testing Library
- Test component rendering and interactions
- Mock API calls
- Test error states
- Test accessibility

## Git Workflow

### Branching
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `chore/*`: Maintenance tasks

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Pull Requests
- Reference related issues
- Keep PRs focused and small
- Include tests
- Update documentation if needed
- Get at least one review before merging

## Security Guidelines

### Data Protection
- Never log sensitive information
- Encrypt sensitive data at rest
- Use environment variables for secrets
- Implement proper input validation
- Sanitize all user inputs

### Authentication & Authorization
- Use JWT for authentication
- Implement proper session management
- Use role-based access control
- Set secure and httpOnly flags on cookies
- Implement rate limiting

### Dependencies
- Keep dependencies up to date
- Use Dependabot for security updates
- Regularly audit dependencies
- Pin dependency versions

## Code Review Process
1. Create a draft PR for early feedback
2. Ensure all tests pass
3. Update documentation if needed
4. Request review from at least one team member
5. Address all review comments
6. Get approval before merging

## Documentation Standards
- Keep documentation up to date
- Document all public APIs
- Include examples in documentation
- Keep a changelog
- Document breaking changes

## Performance Guidelines
- Optimize database queries
- Use pagination for large datasets
- Implement caching where appropriate
- Monitor performance metrics
- Profile before optimizing
