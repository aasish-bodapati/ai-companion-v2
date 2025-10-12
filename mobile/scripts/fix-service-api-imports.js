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

const fixServiceApiImports = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix import statements that import from 'api' instead of './api'
  content = content.replace(
    /from 'api'/g,
    "from './api'"
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed API imports in: ${path.relative(mobileSrcPath, filePath)}`);
    return true;
  }
  return false;
};

// Main execution
console.log('Fixing service API import paths...');

const files = findFiles(mobileSrcPath, /\.(ts|tsx)$/);
let fixedCount = 0;

files.forEach(file => {
  if (fixServiceApiImports(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);
