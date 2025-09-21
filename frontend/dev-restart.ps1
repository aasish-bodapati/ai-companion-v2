# Development Server Restart Script
# This script helps manage the development server and hot reload issues

Write-Host "🔄 Restarting Development Server..." -ForegroundColor Cyan

# Kill any existing Node processes on port 3000
Write-Host "🔍 Checking for existing processes..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "⚠️  Found existing processes on port 3000" -ForegroundColor Red
    $processes | ForEach-Object {
        $pid = $_.OwningProcess
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "🛑 Stopping process: $($process.ProcessName) (PID: $pid)" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

# Clean Next.js cache
Write-Host "🧹 Cleaning Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ Cache cleaned" -ForegroundColor Green
}

# Start development server
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "📝 Available commands:" -ForegroundColor Cyan
Write-Host "   npm run dev        - Standard development server" -ForegroundColor White
Write-Host "   npm run dev:turbo  - Turbo mode (experimental)" -ForegroundColor White
Write-Host "   npm run dev:clean  - Clean cache and start" -ForegroundColor White
Write-Host ""

# Start the server
npm run dev