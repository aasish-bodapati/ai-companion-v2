# File Naming Standardization Script
# This script renames files to follow consistent naming conventions

Write-Host "🚀 Starting File Naming Standardization..." -ForegroundColor Green

# Change to the mobile directory
Set-Location "E:\docs\ai-companion-v2\mobile"

# Service files to rename (camelCase -> PascalCaseService)
$serviceRenames = @{
    "src/services/activeRoutineService.ts" = "src/services/ActiveRoutineService.ts"
    "src/services/bodyTypeGoalsApi.ts" = "src/services/BodyTypeGoalsService.ts"
    "src/services/exerciseCategoryService.ts" = "src/services/ExerciseCategoryService.ts"
    "src/services/fitnessService.ts" = "src/services/FitnessService.ts"
    "src/services/healthService.ts" = "src/services/HealthService.ts"
    "src/services/indianFoodService.ts" = "src/services/IndianFoodService.ts"
    "src/services/localFoodService.ts" = "src/services/LocalFoodService.ts"
    "src/services/moodService.ts" = "src/services/MoodService.ts"
    "src/services/nutritionService.ts" = "src/services/NutritionService.ts"
    "src/services/onboardingService.ts" = "src/services/OnboardingService.ts"
    "src/services/profileService.ts" = "src/services/ProfileService.ts"
    "src/services/routineService.ts" = "src/services/RoutineService.ts"
    "src/services/simpleWaterService.ts" = "src/services/SimpleWaterService.ts"
    "src/services/smartNotificationsService.ts" = "src/services/SmartNotificationsService.ts"
    "src/services/stepTrackingService.ts" = "src/services/StepTrackingService.ts"
    "src/services/timezoneDetectionService.ts" = "src/services/TimezoneDetectionService.ts"
    "src/services/weatherService.ts" = "src/services/WeatherService.ts"
    "src/services/aiInsightsService.ts" = "src/services/AiInsightsService.ts"
    "src/services/bodyTypeScoringService.ts" = "src/services/BodyTypeScoringService.ts"
    "src/services/dashboardService.ts" = "src/services/DashboardService.ts"
    "src/services/exerciseService.ts" = "src/services/ExerciseService.ts"
    "src/services/numericalGoalsService.ts" = "src/services/NumericalGoalsService.ts"
    "src/services/nutritionGoalsService.ts" = "src/services/NutritionGoalsService.ts"
}

# Utility files to rename (if needed)
$utilityRenames = @{
    # Add utility renames here if needed
}

# Store files to rename (if needed)
$storeRenames = @{
    # Add store renames here if needed
}

# Function to rename files safely
function Rename-FileSafely {
    param(
        [string]$OldPath,
        [string]$NewPath
    )
    
    if (Test-Path $OldPath) {
        try {
            Rename-Item $OldPath $NewPath
            Write-Host "✅ Renamed: $OldPath -> $NewPath" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "❌ Failed to rename: $OldPath - $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
    else {
        Write-Host "⚠️  File not found: $OldPath" -ForegroundColor Yellow
        return $false
    }
}

# Rename service files
Write-Host "`n📁 Renaming Service Files..." -ForegroundColor Cyan
$serviceCount = 0
foreach ($oldPath in $serviceRenames.Keys) {
    $newPath = $serviceRenames[$oldPath]
    if (Rename-FileSafely $oldPath $newPath) {
        $serviceCount++
    }
}

# Rename utility files
Write-Host "`n🔧 Renaming Utility Files..." -ForegroundColor Cyan
$utilityCount = 0
foreach ($oldPath in $utilityRenames.Keys) {
    $newPath = $utilityRenames[$oldPath]
    if (Rename-FileSafely $oldPath $newPath) {
        $utilityCount++
    }
}

# Rename store files
Write-Host "`n🏪 Renaming Store Files..." -ForegroundColor Cyan
$storeCount = 0
foreach ($oldPath in $storeRenames.Keys) {
    $newPath = $storeRenames[$oldPath]
    if (Rename-FileSafely $oldPath $newPath) {
        $storeCount++
    }
}

# Summary
Write-Host "`n📊 Renaming Summary:" -ForegroundColor Magenta
Write-Host "Services renamed: $serviceCount" -ForegroundColor Green
Write-Host "Utilities renamed: $utilityCount" -ForegroundColor Green
Write-Host "Stores renamed: $storeCount" -ForegroundColor Green

Write-Host "`n✅ File naming standardization completed!" -ForegroundColor Green
Write-Host "⚠️  Remember to update import statements in affected files." -ForegroundColor Yellow
