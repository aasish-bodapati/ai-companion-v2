# PowerShell script to restart development server with clean cache
Write-Host "Stopping any running Next.js processes..." -ForegroundColor Yellow

# Kill any existing Next.js processes
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*next*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Cleaning all caches..." -ForegroundColor Yellow

# Remove .next directory
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Removed .next directory" -ForegroundColor Green
}

# Remove node_modules/.cache if it exists
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "Removed node_modules/.cache" -ForegroundColor Green
}

# Remove TypeScript build info
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo"
    Write-Host "Removed TypeScript build info" -ForegroundColor Green
}

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Starting development server with clean cache..." -ForegroundColor Yellow

# Start development server with webpack (more stable than turbo)
npm run dev:webpack