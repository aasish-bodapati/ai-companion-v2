# PowerShell script to restart the Next.js dev server properly
Write-Host "🔄 Stopping any running Node.js processes..." -ForegroundColor Yellow

# Stop any running Node.js processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "🧹 Cleaning build cache..." -ForegroundColor Yellow

# Remove .next directory if it exists
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
}

Write-Host "🚀 Starting Next.js dev server..." -ForegroundColor Green

# Start the dev server without Turbopack
npm run dev -- --no-turbo
