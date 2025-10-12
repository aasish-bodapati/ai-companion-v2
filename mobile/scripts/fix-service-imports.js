#!/usr/bin/env node

/**
 * Fix Service Imports Script
 * Replaces class imports with instance imports for services
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Service mappings: ClassName -> instanceName
const SERVICE_MAPPINGS = {
  'FitnessService': 'fitnessService',
  'NutritionService': 'nutritionService',
  'RoutineService': 'routineService',
  'SimpleWaterService': 'simpleWaterService',
  'MoodService': 'moodService',
  'HealthService': 'healthService',
  'ProfileService': 'profileService',
  'DashboardService': 'dashboardService',
  'ExerciseCategoryService': 'exerciseCategoryService',
  'OnboardingService': 'onboardingService',
  'StepTrackingService': 'stepTrackingService',
  'WeatherService': 'weatherService',
  'SmartNotificationsService': 'smartNotificationsService',
  'TimezoneDetectionService': 'timezoneDetectionService',
  'NumericalGoalsService': 'numericalGoalsService',
  'BodyTypeGoalsApiService': 'bodyTypeGoalsApiService',
  'ExerciseService': 'exerciseService',
  'HealthDataService': 'healthDataService',
  'IndianFoodService': 'indianFoodService',
  'LocalFoodService': 'localFoodService',
  'ActiveRoutineService': 'activeRoutineService',
  'AiInsightsService': 'aiInsightsService',
  'ApiService': 'apiService',
};

// Files to process
const srcDir = path.join(__dirname, '..', 'src');
const filePattern = '**/*.{ts,tsx}';

// Files to exclude
const excludePatterns = [
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/test-utils/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/services/**'  // Don't process service files themselves
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix import statements
    for (const [className, instanceName] of Object.entries(SERVICE_MAPPINGS)) {
      // Fix named imports
      const namedImportRegex = new RegExp(`import\\s*{\\s*${className}\\s*}\\s*from\\s*['"][^'"]*['"];?`, 'g');
      if (content.match(namedImportRegex)) {
        content = content.replace(namedImportRegex, `import { ${instanceName} } from '$1';`);
        modified = true;
      }
      
      // Fix default imports
      const defaultImportRegex = new RegExp(`import\\s+${className}\\s+from\\s*['"]([^'"]*)['"];?`, 'g');
      if (content.match(defaultImportRegex)) {
        content = content.replace(defaultImportRegex, `import { ${instanceName} } from '$1';`);
        modified = true;
      }
      
      // Fix usage of class names to instance names
      const usageRegex = new RegExp(`\\b${className}\\b`, 'g');
      if (content.match(usageRegex)) {
        content = content.replace(usageRegex, instanceName);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing service imports...\n');
  
  // Get all files
  const files = glob.sync(filePattern, { cwd: srcDir });
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(srcDir, file);
    
    // Check if file should be excluded
    const shouldExclude = excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(file);
    });
    
    if (shouldExclude) {
      return;
    }
    
    processedCount++;
    if (processFile(fullPath)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files modified: ${modifiedCount}`);
  console.log(`   Files unchanged: ${processedCount - modifiedCount}`);
  
  if (modifiedCount > 0) {
    console.log('\n✅ Service imports fixed successfully!');
  } else {
    console.log('\n✅ No service import issues found.');
  }
}

main();
