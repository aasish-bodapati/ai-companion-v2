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

const fixUnusedImports = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Remove unused React imports in non-React files
  if (filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    // Check if React is imported but not used
    if (content.includes("import React from 'react';") && !content.includes('React.')) {
      content = content.replace(/import React from 'react';\n?/, '');
    }
  }

  // Remove unused theme imports that are commonly unused
  const unusedThemeImports = [
    'FONT_WEIGHT',
    'SHADOWS', 
    'STYLE_PRESETS',
    'BORDER_RADIUS',
    'FONT_SIZE',
    'SPACING',
    'COLORS'
  ];

  // Check if these imports are used in the file
  for (const importName of unusedThemeImports) {
    const importRegex = new RegExp(`import\\s*{[^}]*\\b${importName}\\b[^}]*}\\s*from\\s*['"][^'"]*['"];?`, 'g');
    const matches = content.match(importRegex);
    
    if (matches) {
      for (const match of matches) {
        // Check if the import is actually used in the file
        const importNameRegex = new RegExp(`\\b${importName}\\b`, 'g');
        const usageMatches = content.match(importNameRegex);
        
        // If it appears only in the import statement, remove it
        if (usageMatches && usageMatches.length === 1) {
          // Remove the entire import line if it only contains unused imports
          if (match.includes('{') && match.includes('}')) {
            const importContent = match.match(/\{([^}]+)\}/)[1];
            const imports = importContent.split(',').map(imp => imp.trim());
            const usedImports = imports.filter(imp => {
              const name = imp.split(' as ')[0].trim();
              return name !== importName && content.includes(name);
            });
            
            if (usedImports.length === 0) {
              // Remove entire import line
              content = content.replace(match + '\n', '');
            } else {
              // Remove just the unused import from the destructuring
              const newImportContent = `{ ${usedImports.join(', ')} }`;
              const newMatch = match.replace(/\{[^}]+\}/, newImportContent);
              content = content.replace(match, newMatch);
            }
          }
        }
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed unused imports in: ${path.relative(mobileSrcPath, filePath)}`);
    return true;
  }
  return false;
};

// Main execution
console.log('Fixing unused imports...');

const files = findFiles(mobileSrcPath, /\.(ts|tsx)$/);
let fixedCount = 0;

files.forEach(file => {
  if (fixUnusedImports(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);