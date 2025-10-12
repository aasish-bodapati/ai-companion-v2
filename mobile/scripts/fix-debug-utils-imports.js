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

const fixDebugUtilsImports = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix the specific debugUtils import path
  content = content.replace(
    /from '\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/utils\/debugUtils'/g,
    "from '../../utils/debugUtils'"
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed debugUtils import in: ${path.relative(mobileSrcPath, filePath)}`);
    return true;
  }
  return false;
};

// Main execution
console.log('Fixing debugUtils import paths...');

const files = findFiles(mobileSrcPath, /\.(ts|tsx)$/);
let fixedCount = 0;

files.forEach(file => {
  if (fixDebugUtilsImports(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);