# AI Companion - Maestro E2E Tests

This directory contains end-to-end tests for the AI Companion React Native app using Maestro.

## Test Structure

- `auth/` - Authentication flows (login, signup, logout)
- `dashboard/` - Dashboard and main app flows
- `fitness/` - Fitness tracking and workout logging
- `nutrition/` - Nutrition logging and meal tracking
- `analytics/` - Analytics and insights
- `profile/` - Profile management and settings
- `common/` - Shared test utilities and helpers

## Running Tests

### Prerequisites
1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Ensure your app is built and installed on device/emulator
3. Update `appId` in each test file to match your app's bundle identifier

### Running Individual Tests
```bash
# Run specific test
maestro test auth/login.yaml

# Run all tests in a directory
maestro test auth/

# Run all tests
maestro test .
```

### Running with Different Configurations
```bash
# Run with verbose output
maestro test --verbose auth/login.yaml

# Run with specific device
maestro test --device-id <device-id> auth/login.yaml

# Run and generate report
maestro test --format junit auth/login.yaml
```

## Test Data

Tests use the following test accounts:
- **Test User**: `test@example.com` / `test123`
- **Admin User**: `admin@example.com` / `admin123`

## App Configuration

Update the `appId` in each test file to match your app's bundle identifier:
- **Development**: `com.healthlog.mobile`
- **Production**: `com.healthlog.mobile.prod`

## Troubleshooting

- Ensure app is fully loaded before running tests
- Check device/emulator is connected and accessible
- Verify app permissions are granted (camera, notifications, etc.)
- Check network connectivity for API calls
