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

const fixApiImports = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Calculate relative path to services/api.ts
  const relativePath = path.relative(path.dirname(filePath), path.join(mobileSrcPath, 'services', 'api.ts'));
  const importPath = relativePath.replace(/\\/g, '/').replace(/\.ts$/, '');

  // Fix import statements
  content = content.replace(
    /from '\.\/api'/g,
    `from '${importPath}'`
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed API import in: ${path.relative(mobileSrcPath, filePath)} -> ${importPath}`);
    return true;
  }
  return false;
};

// Main execution
console.log('Fixing API import paths...');

const files = findFiles(mobileSrcPath, /\.(ts|tsx)$/);
let fixedCount = 0;

files.forEach(file => {
  if (fixApiImports(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);