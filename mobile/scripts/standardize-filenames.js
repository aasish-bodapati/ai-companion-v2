#!/usr/bin/env node

/**
 * File Name Standardization Script
 * Standardizes file names according to the established naming conventions
 */

const fs = require('fs');
const path = require('path');

// Define the naming conventions
const CONVENTIONS = {
  // Services should be PascalCaseService.ts
  services: {
    pattern: /^[A-Z][a-zA-Z]*Service\.ts$/,
    transform: (name) => {
      // Remove .ts extension, ensure it ends with Service, then add .ts back
      const baseName = name.replace('.ts', '');
      const serviceName = baseName.endsWith('Service') ? baseName : `${baseName}Service`;
      return `${serviceName}.ts`;
    }
  },
  // Hooks should be usePascalCase.ts
  hooks: {
    pattern: /^use[A-Z][a-zA-Z]*\.ts$/,
    transform: (name) => {
      // Already follows convention, just ensure proper casing
      return name;
    }
  },
  // Utils should be camelCaseUtils.ts or camelCase.ts
  utils: {
    pattern: /^[a-z][a-zA-Z]*(Utils)?\.ts$/,
    transform: (name) => {
      // Already follows convention, just ensure proper casing
      return name;
    }
  },
  // Components should be PascalCase.tsx
  components: {
    pattern: /^[A-Z][a-zA-Z]*\.tsx$/,
    transform: (name) => {
      // Already follows convention, just ensure proper casing
      return name;
    }
  }
};

// Files that need to be renamed
const RENAMES = {
  // Services directory
  'mobile/src/services/activeRoutineService.ts': 'mobile/src/services/ActiveRoutineService.ts',
  'mobile/src/services/aiInsightsService.ts': 'mobile/src/services/AiInsightsService.ts',
  'mobile/src/services/bodyTypeGoals.ts': 'mobile/src/services/BodyTypeGoalsService.ts',
  'mobile/src/services/bodyTypeGoalsApi.ts': 'mobile/src/services/BodyTypeGoalsApiService.ts',
  'mobile/src/services/bodyTypeScoringService.ts': 'mobile/src/services/BodyTypeScoringService.ts',
  'mobile/src/services/dashboardService.ts': 'mobile/src/services/DashboardService.ts',
  'mobile/src/services/exerciseCategoryService.ts': 'mobile/src/services/ExerciseCategoryService.ts',
  'mobile/src/services/exerciseService.ts': 'mobile/src/services/ExerciseService.ts',
  'mobile/src/services/fitnessService.ts': 'mobile/src/services/FitnessService.ts',
  'mobile/src/services/healthService.ts': 'mobile/src/services/HealthService.ts',
  'mobile/src/services/indianFoodService.ts': 'mobile/src/services/IndianFoodService.ts',
  'mobile/src/services/localFoodService.ts': 'mobile/src/services/LocalFoodService.ts',
  'mobile/src/services/moodService.ts': 'mobile/src/services/MoodService.ts',
  'mobile/src/services/numericalGoalsService.ts': 'mobile/src/services/NumericalGoalsService.ts',
  'mobile/src/services/nutritionGoalsService.ts': 'mobile/src/services/NutritionGoalsService.ts',
  'mobile/src/services/nutritionService.ts': 'mobile/src/services/NutritionService.ts',
  'mobile/src/services/onboardingService.ts': 'mobile/src/services/OnboardingService.ts',
  'mobile/src/services/profileService.ts': 'mobile/src/services/ProfileService.ts',
  'mobile/src/services/routineService.ts': 'mobile/src/services/RoutineService.ts',
  'mobile/src/services/simpleWaterService.ts': 'mobile/src/services/SimpleWaterService.ts',
  'mobile/src/services/smartNotificationsService.ts': 'mobile/src/services/SmartNotificationsService.ts',
  'mobile/src/services/stepTrackingService.ts': 'mobile/src/services/StepTrackingService.ts',
  'mobile/src/services/timezoneDetectionService.ts': 'mobile/src/services/TimezoneDetectionService.ts',
  'mobile/src/services/weatherService.ts': 'mobile/src/services/WeatherService.ts',
  
  // Keep these as they already follow conventions
  'mobile/src/services/BaseService.ts': 'mobile/src/services/BaseService.ts',
  'mobile/src/services/HealthDataService.ts': 'mobile/src/services/HealthDataService.ts',
  'mobile/src/services/GenericLogService.ts': 'mobile/src/services/GenericLogService.ts',
  'mobile/src/services/api.ts': 'mobile/src/services/ApiService.ts',
  'mobile/src/services/goalTemplates.ts': 'mobile/src/services/GoalTemplatesService.ts',
};

// Function to rename files
function renameFile(oldPath, newPath) {
  try {
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${oldPath} → ${newPath}`);
      return true;
    } else {
      console.log(`❌ File not found: ${oldPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error renaming ${oldPath}:`, error.message);
    return false;
  }
}

// Function to update imports in a file
function updateImportsInFile(filePath, oldName, newName) {
  try {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const oldImport = `from '${oldName}'`;
    const newImport = `from '${newName}'`;
    
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
      fs.writeFileSync(filePath, content);
      console.log(`📝 Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating imports in ${filePath}:`, error.message);
  }
}

// Function to find all files that import a specific service
function findFilesWithImport(importPath) {
  const files = [];
  
  function searchDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        searchDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes(importPath)) {
            files.push(fullPath);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }
  
  searchDirectory('mobile/src');
  return files;
}

// Main execution
function main() {
  console.log('🚀 Starting file name standardization...\n');
  
  let successCount = 0;
  let totalCount = 0;
  
  // Process renames
  for (const [oldPath, newPath] of Object.entries(RENAMES)) {
    totalCount++;
    
    if (oldPath === newPath) {
      console.log(`⏭️  Skipping (already correct): ${oldPath}`);
      continue;
    }
    
    const oldName = path.basename(oldPath, '.ts');
    const newName = path.basename(newPath, '.ts');
    
    if (renameFile(oldPath, newPath)) {
      successCount++;
      
      // Update imports in all files that reference this service
      const filesToUpdate = findFilesWithImport(oldName);
      for (const file of filesToUpdate) {
        updateImportsInFile(file, oldName, newName);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalCount}`);
  console.log(`   Successfully renamed: ${successCount}`);
  console.log(`   Failed: ${totalCount - successCount}`);
  
  if (successCount > 0) {
    console.log('\n✨ File standardization complete!');
    console.log('💡 Next steps:');
    console.log('   1. Run tests to ensure everything works');
    console.log('   2. Update any remaining import references');
    console.log('   3. Commit the changes');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { renameFile, updateImportsInFile, findFilesWithImport };
