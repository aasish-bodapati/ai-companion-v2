const fs = require('fs');
const path = require('path');

// Get all TypeScript/JavaScript files
const getFiles = (dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) => {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files = files.concat(getFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
};

// Remove unused imports and variables
const fixUnusedImports = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove unused imports (more conservative approach)
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip if it's a comment or empty line
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim() === '') {
        newLines.push(line);
        continue;
      }
      
      // Check for import statements
      if (line.trim().startsWith('import ')) {
        // Extract imported names
        const importMatch = line.match(/import\s+.*?\s+from\s+['"](.*?)['"]/);
        if (importMatch) {
          // For now, keep all imports - we'll let ESLint handle this more carefully
          newLines.push(line);
          continue;
        }
      }
      
      // Check for unused variable declarations
      if (line.includes('const ') || line.includes('let ') || line.includes('var ')) {
        // Look for variables that are declared but never used
        const varMatch = line.match(/(const|let|var)\s+(\w+)\s*=/);
        if (varMatch) {
          const varName = varMatch[2];
          // Check if this variable is used anywhere else in the file
          const restOfFile = content.substring(content.indexOf(line) + line.length);
          if (!restOfFile.includes(varName) && !line.includes('// eslint-disable')) {
            // This variable is unused, but we'll be conservative and not remove it automatically
            newLines.push(line);
            continue;
          }
        }
      }
      
      newLines.push(line);
    }
    
    const newContent = newLines.join('\n');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modified = true;
    }
    
    return modified;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
};

// Main execution
const srcDir = path.join(process.cwd(), 'src');
const files = getFiles(srcDir);

console.log(`Found ${files.length} files to process...`);

let fixedCount = 0;
let errorCount = 0;

for (const file of files) {
  try {
    const fixed = fixUnusedImports(file);
    if (fixed) {
      console.log(`Fixed: ${path.relative(srcDir, file)}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
    errorCount++;
  }
}

console.log(`\nSummary:`);
console.log(`- Files processed: ${files.length}`);
console.log(`- Files fixed: ${fixedCount}`);
console.log(`- Errors: ${errorCount}`);


