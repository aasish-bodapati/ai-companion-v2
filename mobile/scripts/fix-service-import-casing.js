const fs = require('fs');
const path = require('path');

const mobileSrcPath = path.join(__dirname, '..', 'src');

const findFiles = (startPath, filter) => {
  let results = [];
  const files = fs.readdirSync(startPath);
  for (const file of files) {
    const filename = path.join(startPath, file);
    const stat = fs.statSync(filename);
    if (stat.isDirectory()) {
      results = results.concat(findFiles(filename, filter));
    } else if (filter.test(filename)) {
      results.push(filename);
    }
  }
  return results;
};

const fixServiceImports = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix service import casing
  const serviceMappings = {
    'nutritionService': 'NutritionService',
    'apiService': 'ApiService',
    'routineService': 'RoutineService',
    'moodService': 'MoodService',
    'simpleWaterService': 'SimpleWaterService',
    'onboardingService': 'OnboardingService',
    'weatherService': 'WeatherService',
    'fitnessService': 'FitnessService',
    'healthDataService': 'HealthDataService',
    'exerciseService': 'ExerciseService',
    'indianFoodService': 'IndianFoodService',
    'localFoodService': 'LocalFoodService',
    'numericalGoalsService': 'NumericalGoalsService',
    'stepTrackingService': 'StepTrackingService',
    'timezoneDetectionService': 'TimezoneDetectionService',
    'smartNotificationsService': 'SmartNotificationsService'
  };

  // Fix import statements
  for (const [wrongCase, correctCase] of Object.entries(serviceMappings)) {
    // Fix import paths
    content = content.replace(
      new RegExp(`from '\\.\\./\\.\\./services/${wrongCase}'`, 'g'),
      `from '../../services/${correctCase}'`
    );
    content = content.replace(
      new RegExp(`from '\\.\\./\\.\\./services/${wrongCase}\\.ts'`, 'g'),
      `from '../../services/${correctCase}'`
    );
    content = content.replace(
      new RegExp(`from '\\.\\./\\.\\./services/${wrongCase}\\.js'`, 'g'),
      `from '../../services/${correctCase}'`
    );
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed service imports in: ${path.relative(mobileSrcPath, filePath)}`);
    return true;
  }
  return false;
};

// Main execution
console.log('Fixing service import casing...');

const files = findFiles(mobileSrcPath, /\.(ts|tsx)$/);
let fixedCount = 0;

files.forEach(file => {
  if (fixServiceImports(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);
