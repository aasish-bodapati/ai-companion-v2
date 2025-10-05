# AI Companion - Maestro E2E Test Commands

This document provides comprehensive commands for running Maestro end-to-end tests for the AI Companion React Native app.

## Prerequisites

1. **Install Maestro**:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. **Install App**: Ensure your app is built and installed on device/emulator
   ```bash
   # For development
   npx expo start --android
   # or
   npx expo start --ios
   ```

3. **Update App ID**: Update `appId` in each test file to match your app's bundle identifier

## Basic Commands

### Run All Tests
```bash
# Run all tests
maestro test .

# Run with verbose output
maestro test --verbose .

# Run with specific device
maestro test --device-id emulator-5554 .
```

### Run Test Suites
```bash
# Run complete test suite
maestro test test-suite.yaml

# Run authentication tests
maestro test auth/

# Run dashboard tests
maestro test dashboard/

# Run fitness tests
maestro test fitness/

# Run nutrition tests
maestro test nutrition/

# Run analytics tests
maestro test analytics/

# Run profile tests
maestro test profile/

# Run notification tests
maestro test notifications/

# Run edge case tests
maestro test edge-cases/
```

### Run Individual Tests
```bash
# Run specific test files
maestro test auth/login.yaml
maestro test auth/signup.yaml
maestro test auth/logout.yaml

maestro test dashboard/navigation.yaml
maestro test dashboard/onboarding.yaml

maestro test fitness/workout-logging.yaml
maestro test fitness/routines.yaml

maestro test nutrition/meal-logging.yaml
maestro test nutrition/nutrition-routines.yaml

maestro test analytics/insights.yaml

maestro test profile/settings.yaml
maestro test profile/health-profile.yaml

maestro test notifications/permissions.yaml
maestro test notifications/reminders.yaml

maestro test edge-cases/network-errors.yaml
maestro test edge-cases/form-validation.yaml
```

## Advanced Commands

### Output Formats
```bash
# Generate JUnit report
maestro test --format junit --output test-reports/junit-report.xml .

# Generate JSON report
maestro test --format json --output test-reports/json-report.json .

# Generate HTML report
maestro test --format html --output test-reports/html-report.html .
```

### Device-Specific Testing
```bash
# Run on specific Android device
maestro test --device-id emulator-5554 .

# Run on specific iOS device
maestro test --device-id "iPhone 14 Pro" .

# List available devices
maestro test --list-devices
```

### Debugging and Troubleshooting
```bash
# Run with verbose output
maestro test --verbose auth/login.yaml

# Run with debug mode
maestro test --debug auth/login.yaml

# Dry run (validate without execution)
maestro test --dry-run .

# Run with custom timeout
maestro test --timeout 60000 .

# Run with retry on failure
maestro test --retry 3 .
```

## Using the Test Runner Script

### Basic Usage
```bash
# Make script executable (Linux/Mac)
chmod +x run-tests.sh

# Run all tests
./run-tests.sh

# Run specific test directory
./run-tests.sh auth/

# Run specific test file
./run-tests.sh auth/login.yaml
```

### Advanced Options
```bash
# Run with verbose output
./run-tests.sh -v auth/login.yaml

# Run on specific device
./run-tests.sh -d emulator-5554 auth/

# Generate JUnit report
./run-tests.sh -f junit -r reports/ .

# Generate JSON report
./run-tests.sh -f json -r reports/ .

# Show help
./run-tests.sh -h
```

## Using NPM Scripts

### Install Dependencies
```bash
cd maestro-tests
npm install
```

### Run Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:auth
npm run test:dashboard
npm run test:fitness
npm run test:nutrition
npm run test:analytics
npm run test:profile
npm run test:notifications
npm run test:edge-cases

# Run complete test suite
npm run test:suite

# Run with verbose output
npm run test:verbose

# Generate reports
npm run test:junit
npm run test:json

# Run on specific device
npm run test:device emulator-5554

# Validate tests (dry run)
npm run validate

# Setup test environment
npm run setup

# Clean test artifacts
npm run clean
```

## Test Configuration

### Update App ID
Edit each test file and update the `appId` field:
```yaml
appId: com.healthlog.mobile  # Change to your app's bundle ID
```

### Test Data
Update test data in `maestro.yaml`:
```yaml
testData:
  testUser:
    email: "test@example.com"
    password: "test123"
    fullName: "Test User"
```

### Timeouts
Adjust timeouts in `maestro.yaml`:
```yaml
timeouts:
  short: 5000
  medium: 15000
  long: 30000
  veryLong: 60000
```

## Continuous Integration

### GitHub Actions
```yaml
name: Maestro E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Run Tests
        run: maestro test --format junit --output test-results.xml .
```

### Jenkins Pipeline
```groovy
pipeline {
    agent any
    stages {
        stage('Install Maestro') {
            steps {
                sh 'curl -Ls "https://get.maestro.mobile.dev" | bash'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'maestro test --format junit --output test-results.xml .'
            }
        }
        stage('Publish Results') {
            steps {
                junit 'test-results.xml'
            }
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **App not found**:
   ```bash
   # Check if app is installed
   adb shell pm list packages | grep com.healthlog.mobile
   ```

2. **Device not found**:
   ```bash
   # List available devices
   adb devices
   maestro test --list-devices
   ```

3. **Test failures**:
   ```bash
   # Run with verbose output
   maestro test --verbose auth/login.yaml
   
   # Check app logs
   adb logcat | grep -i "healthlog"
   ```

4. **Permission issues**:
   ```bash
   # Grant necessary permissions
   adb shell pm grant com.healthlog.mobile android.permission.CAMERA
   adb shell pm grant com.healthlog.mobile android.permission.READ_EXTERNAL_STORAGE
   ```

### Debug Mode
```bash
# Run with debug output
maestro test --debug auth/login.yaml

# Run with step-by-step execution
maestro test --step-by-step auth/login.yaml
```

## Best Practices

1. **Test Organization**: Keep tests organized by feature/functionality
2. **Data Cleanup**: Use `clearState: true` to ensure clean test runs
3. **Timeouts**: Set appropriate timeouts for different operations
4. **Assertions**: Use specific, meaningful assertions
5. **Error Handling**: Test both success and failure scenarios
6. **Maintenance**: Regularly update tests as the app evolves

## Support

For issues and questions:
- Check Maestro documentation: https://maestro.mobile.dev
- Review test logs and error messages
- Ensure app is properly installed and configured
- Verify device/emulator is accessible
