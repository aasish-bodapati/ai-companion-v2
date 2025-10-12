const fs = require('fs');
const path = require('path');

// Find all files that import debugUtils with wrong path
const findFiles = (dir, pattern) => {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, pattern));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (pattern.test(content)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
};

// Fix import paths
const fixImportPaths = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Count ../ in the path to determine correct import depth
  const relativePath = path.relative('src', filePath);
  const depth = relativePath.split(path.sep).length - 1;
  
  // Calculate correct import path
  const correctPath = '../'.repeat(depth) + 'utils/debugUtils';
  
  // Replace the import
  const updatedContent = content.replace(
    /from '\.\.\/\.\.\/\.\.\/\.\.\/utils\/debugUtils'/g,
    `from '${correctPath}'`
  );
  
  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  
  return false;
};

// Main execution
console.log('Fixing all debugUtils import paths...');

const files = findFiles('src', /from '\.\.\/\.\.\/\.\.\/\.\.\/utils\/debugUtils'/);
let fixedCount = 0;

files.forEach(file => {
  if (fixImportPaths(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);
