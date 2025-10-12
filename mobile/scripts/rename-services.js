#!/usr/bin/env node

/**
 * Service File Renaming Script
 * Renames service files to follow PascalCaseService.ts convention
 */

const fs = require('fs');
const path = require('path');

// Service files to rename
const serviceRenames = [
  { from: 'activeRoutineService.ts', to: 'ActiveRoutineService.ts' },
  { from: 'aiInsightsService.ts', to: 'AiInsightsService.ts' },
  { from: 'bodyTypeGoals.ts', to: 'BodyTypeGoalsService.ts' },
  { from: 'bodyTypeGoalsApi.ts', to: 'BodyTypeGoalsApiService.ts' },
  { from: 'bodyTypeScoringService.ts', to: 'BodyTypeScoringService.ts' },
  { from: 'dashboardService.ts', to: 'DashboardService.ts' },
  { from: 'exerciseCategoryService.ts', to: 'ExerciseCategoryService.ts' },
  { from: 'exerciseService.ts', to: 'ExerciseService.ts' },
  { from: 'fitnessService.ts', to: 'FitnessService.ts' },
  { from: 'healthService.ts', to: 'HealthService.ts' },
  { from: 'indianFoodService.ts', to: 'IndianFoodService.ts' },
  { from: 'localFoodService.ts', to: 'LocalFoodService.ts' },
  { from: 'moodService.ts', to: 'MoodService.ts' },
  { from: 'numericalGoalsService.ts', to: 'NumericalGoalsService.ts' },
  { from: 'nutritionGoalsService.ts', to: 'NutritionGoalsService.ts' },
  { from: 'nutritionService.ts', to: 'NutritionService.ts' },
  { from: 'onboardingService.ts', to: 'OnboardingService.ts' },
  { from: 'profileService.ts', to: 'ProfileService.ts' },
  { from: 'routineService.ts', to: 'RoutineService.ts' },
  { from: 'simpleWaterService.ts', to: 'SimpleWaterService.ts' },
  { from: 'smartNotificationsService.ts', to: 'SmartNotificationsService.ts' },
  { from: 'stepTrackingService.ts', to: 'StepTrackingService.ts' },
  { from: 'timezoneDetectionService.ts', to: 'TimezoneDetectionService.ts' },
  { from: 'weatherService.ts', to: 'WeatherService.ts' },
  { from: 'api.ts', to: 'ApiService.ts' },
  { from: 'goalTemplates.ts', to: 'GoalTemplatesService.ts' },
];

// Function to rename a file
function renameFile(oldPath, newPath) {
  try {
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${path.basename(oldPath)} → ${path.basename(newPath)}`);
      return true;
    } else {
      console.log(`⚠️  File not found: ${path.basename(oldPath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error renaming ${path.basename(oldPath)}:`, error.message);
    return false;
  }
}

// Function to find all files that import a specific service
function findFilesWithImport(serviceName) {
  const files = [];
  const srcDir = path.join(__dirname, '..', 'src');
  
  function searchDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          searchDirectory(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Check for various import patterns
            const importPatterns = [
              `from '${serviceName}'`,
              `from "./${serviceName}"`,
              `from "../${serviceName}"`,
              `from "../../${serviceName}"`,
              `from "../../../${serviceName}"`,
              `from "../../../../${serviceName}"`,
              `import { ${serviceName}`,
              `import ${serviceName}`,
            ];
            
            for (const pattern of importPatterns) {
              if (content.includes(pattern)) {
                files.push(fullPath);
                break;
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  searchDirectory(srcDir);
  return files;
}

// Function to update imports in a file
function updateImportsInFile(filePath, oldName, newName) {
  try {
    if (!fs.existsSync(filePath)) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Update various import patterns
    const patterns = [
      { from: `from '${oldName}'`, to: `from '${newName}'` },
      { from: `from "./${oldName}"`, to: `from "./${newName}"` },
      { from: `from "../${oldName}"`, to: `from "../${newName}"` },
      { from: `from "../../${oldName}"`, to: `from "../../${newName}"` },
      { from: `from "../../../${oldName}"`, to: `from "../../../${newName}"` },
      { from: `from "../../../../${oldName}"`, to: `from "../../../../${newName}"` },
    ];
    
    for (const pattern of patterns) {
      if (content.includes(pattern.from)) {
        content = content.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`📝 Updated imports in: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating imports in ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('🚀 Starting service file renaming...\n');
  
  const servicesDir = path.join(__dirname, '..', 'src', 'services');
  let successCount = 0;
  let totalCount = serviceRenames.length;
  
  for (const rename of serviceRenames) {
    const oldPath = path.join(servicesDir, rename.from);
    const newPath = path.join(servicesDir, rename.to);
    
    if (renameFile(oldPath, newPath)) {
      successCount++;
      
      // Update imports in all files that reference this service
      const oldName = rename.from.replace('.ts', '');
      const newName = rename.to.replace('.ts', '');
      
      const filesToUpdate = findFilesWithImport(oldName);
      console.log(`🔍 Found ${filesToUpdate.length} files importing ${oldName}`);
      
      for (const file of filesToUpdate) {
        updateImportsInFile(file, oldName, newName);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total services processed: ${totalCount}`);
  console.log(`   Successfully renamed: ${successCount}`);
  console.log(`   Failed: ${totalCount - successCount}`);
  
  if (successCount > 0) {
    console.log('\n✨ Service file renaming complete!');
    console.log('💡 Next steps:');
    console.log('   1. Run tests to ensure everything works');
    console.log('   2. Check for any remaining import issues');
    console.log('   3. Commit the changes');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { renameFile, updateImportsInFile, findFilesWithImport };
