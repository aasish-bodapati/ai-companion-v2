#!/usr/bin/env node

/**
 * Import Fix Script
 * Fixes all import references after file renaming
 */

const fs = require('fs');
const path = require('path');

// Mapping of old service names to new service names
const serviceMappings = {
  'activeRoutineService': 'ActiveRoutineService',
  'aiInsightsService': 'AiInsightsService',
  'bodyTypeGoals': 'BodyTypeGoalsService',
  'bodyTypeGoalsApi': 'BodyTypeGoalsApiService',
  'bodyTypeScoringService': 'BodyTypeScoringService',
  'dashboardService': 'DashboardService',
  'exerciseCategoryService': 'ExerciseCategoryService',
  'exerciseService': 'ExerciseService',
  'fitnessService': 'FitnessService',
  'healthService': 'HealthService',
  'indianFoodService': 'IndianFoodService',
  'localFoodService': 'LocalFoodService',
  'moodService': 'MoodService',
  'numericalGoalsService': 'NumericalGoalsService',
  'nutritionGoalsService': 'NutritionGoalsService',
  'nutritionService': 'NutritionService',
  'onboardingService': 'OnboardingService',
  'profileService': 'ProfileService',
  'routineService': 'RoutineService',
  'simpleWaterService': 'SimpleWaterService',
  'smartNotificationsService': 'SmartNotificationsService',
  'stepTrackingService': 'StepTrackingService',
  'timezoneDetectionService': 'TimezoneDetectionService',
  'weatherService': 'WeatherService',
  'api': 'ApiService',
  'goalTemplates': 'GoalTemplatesService',
};

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix various import patterns
    for (const [oldName, newName] of Object.entries(serviceMappings)) {
      const patterns = [
        // Direct imports
        { from: `from '${oldName}'`, to: `from '${newName}'` },
        { from: `from "./${oldName}"`, to: `from "./${newName}"` },
        { from: `from "../${oldName}"`, to: `from "../${newName}"` },
        { from: `from "../../${oldName}"`, to: `from "../../${newName}"` },
        { from: `from "../../../${oldName}"`, to: `from "../../../${newName}"` },
        { from: `from "../../../../${oldName}"`, to: `from "../../../../${newName}"` },
        { from: `from "../../../../../${oldName}"`, to: `from "../../../../../${newName}"` },
        
        // Import statements
        { from: `import { ${oldName}`, to: `import { ${newName}` },
        { from: `import ${oldName}`, to: `import ${newName}` },
        { from: `import * as ${oldName}`, to: `import * as ${newName}` },
        
        // Destructuring imports
        { from: `{ ${oldName} }`, to: `{ ${newName} }` },
        { from: `{ ${oldName},`, to: `{ ${newName},` },
        { from: `, ${oldName} }`, to: `, ${newName} }` },
        { from: `, ${oldName},`, to: `, ${newName},` },
      ];
      
      for (const pattern of patterns) {
        if (content.includes(pattern.from)) {
          content = content.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
          updated = true;
        }
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`📝 Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing imports in ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all TypeScript/JavaScript files
function findAllFiles(dir) {
  const files = [];
  
  function searchDirectory(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          searchDirectory(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  searchDirectory(dir);
  return files;
}

// Main execution
function main() {
  console.log('🚀 Starting import fixes...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findAllFiles(srcDir);
  
  let fixedCount = 0;
  let totalCount = files.length;
  
  console.log(`📁 Found ${totalCount} files to check\n`);
  
  for (const file of files) {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalCount}`);
  console.log(`   Files with imports fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${totalCount - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n✨ Import fixes complete!');
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

module.exports = { fixImportsInFile, findAllFiles };
