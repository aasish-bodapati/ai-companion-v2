# File Name Standardization Script for Windows PowerShell
# Standardizes file names according to the established naming conventions

Write-Host "🚀 Starting file name standardization..." -ForegroundColor Green
Write-Host ""

# Change to the mobile directory
Set-Location -Path "mobile"

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js to run this script." -ForegroundColor Red
    exit 1
}

# Run the standardization script
Write-Host "📝 Running file name standardization..." -ForegroundColor Yellow
node scripts/standardize-filenames.js

# Check if the script ran successfully
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ File standardization completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Review the changes made" -ForegroundColor White
    Write-Host "   2. Run tests to ensure everything works:" -ForegroundColor White
    Write-Host "      npm test" -ForegroundColor Gray
    Write-Host "   3. Check for any remaining import issues:" -ForegroundColor White
    Write-Host "      npm run lint" -ForegroundColor Gray
    Write-Host "   4. Commit the changes:" -ForegroundColor White
    Write-Host "      git add ." -ForegroundColor Gray
    Write-Host "      git commit -m 'Standardize file names according to conventions'" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ File standardization failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Done!" -ForegroundColor Green
