# AI Companion - Maestro Test Setup Script for Windows
# This script sets up the Maestro testing environment on Windows

Write-Host "Setting up Maestro E2E testing environment for AI Companion..." -ForegroundColor Green

# Check if Maestro is installed
Write-Host "Checking Maestro installation..." -ForegroundColor Yellow
try {
    $maestroVersion = maestro --version
    Write-Host "Maestro is already installed: $maestroVersion" -ForegroundColor Green
} catch {
    Write-Host "Maestro not found. Installing..." -ForegroundColor Yellow
    # Install Maestro
    Invoke-WebRequest -Uri "https://get.maestro.mobile.dev" -OutFile "maestro-install.ps1"
    .\maestro-install.ps1
    Remove-Item "maestro-install.ps1"
    Write-Host "Maestro installed successfully!" -ForegroundColor Green
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if ADB is available
Write-Host "Checking ADB availability..." -ForegroundColor Yellow
try {
    $adbVersion = adb version
    Write-Host "ADB is available" -ForegroundColor Green
} catch {
    Write-Host "ADB not found. Please install Android SDK or ensure it's in your PATH" -ForegroundColor Red
}

# Create test reports directory
Write-Host "Creating test reports directory..." -ForegroundColor Yellow
if (!(Test-Path "test-reports")) {
    New-Item -ItemType Directory -Path "test-reports"
    Write-Host "Test reports directory created" -ForegroundColor Green
} else {
    Write-Host "Test reports directory already exists" -ForegroundColor Green
}

# Install npm dependencies if package.json exists
if (Test-Path "package.json") {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "NPM dependencies installed" -ForegroundColor Green
}

# Check if app is installed
Write-Host "Checking if AI Companion app is installed..." -ForegroundColor Yellow
try {
    $appInstalled = adb shell pm list packages | Select-String "com.healthlog.mobile"
    if ($appInstalled) {
        Write-Host "AI Companion app is installed" -ForegroundColor Green
    } else {
        Write-Host "AI Companion app not found. Please install the app first:" -ForegroundColor Yellow
        Write-Host "  npx expo start --android" -ForegroundColor Cyan
        Write-Host "  or" -ForegroundColor Cyan
        Write-Host "  npx expo start --ios" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Could not check app installation. Please ensure ADB is working" -ForegroundColor Yellow
}

# Display available commands
Write-Host "`nSetup complete! Available commands:" -ForegroundColor Green
Write-Host "  maestro test .                    # Run all tests" -ForegroundColor Cyan
Write-Host "  maestro test auth/                # Run auth tests" -ForegroundColor Cyan
Write-Host "  maestro test --verbose .          # Run with verbose output" -ForegroundColor Cyan
Write-Host "  maestro test --format junit .     # Generate JUnit report" -ForegroundColor Cyan
Write-Host "  .\run-tests.sh                    # Use test runner script" -ForegroundColor Cyan
Write-Host "  npm test                          # Run via npm scripts" -ForegroundColor Cyan

Write-Host "`nFor more commands, see COMMANDS.md" -ForegroundColor Yellow
Write-Host "Setup completed successfully!" -ForegroundColor Green
