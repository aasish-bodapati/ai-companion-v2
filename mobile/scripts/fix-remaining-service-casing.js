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

const fixRemainingServiceCasing = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix remaining service import casing issues
  const serviceMappings = {
    'aiInsightsService': 'AiInsightsService',
    'profileService': 'ProfileService',
    'simpleWaterService': 'SimpleWaterService',
    'moodService': 'MoodService',
    'nutritionService': 'NutritionService',
    'fitnessService': 'FitnessService'
  };

  // Fix import statements
  for (const [wrongCase, correctCase] of Object.entries(serviceMappings)) {
    // Fix import paths
    content = content.replace(
      new RegExp(`from '\\.\\./\\.\\./services/${wrongCase}'`, 'g'),
      `from '../../services/${correctCase}'`
    );
    content = content.replace(
      new RegExp(`from '\\.\\./services/${wrongCase}'`, 'g'),
      `from '../services/${correctCase}'`
    );
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed service casing in: ${path.relative(mobileSrcPath, filePath)}`);
    return true;
  }
  return false;
};

// Main execution
console.log('Fixing remaining service import casing...');

const files = findFiles(mobileSrcPath, /\.(ts|tsx)$/);
let fixedCount = 0;

files.forEach(file => {
  if (fixRemainingServiceCasing(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);
