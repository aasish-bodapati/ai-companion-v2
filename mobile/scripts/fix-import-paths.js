#!/usr/bin/env node

/**
 * Fix Import Path Issues Script
 * Fixes missing import paths and module resolution issues
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process
const srcDir = path.join(__dirname, '..', 'src');
const filePattern = '**/*.{ts,tsx}';

// Files to exclude
const excludePatterns = [
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/test-utils/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**'
];

function fixImportPaths(content) {
  let modified = false;
  
  // Fix common import path issues
  const importFixes = [
    // Fix missing ../api imports
    {
      pattern: /from '\.\.\/api'/g,
      replacement: "from './api'"
    },
    // Fix $1 placeholders (leftover from previous fixes)
    {
      pattern: /from '\$1'/g,
      replacement: "from './api'"
    },
    // Fix missing module imports
    {
      pattern: /from '\.\/goalTemplates'/g,
      replacement: "from './GoalTemplatesService'"
    },
    // Fix stepTrackingService import casing
    {
      pattern: /from '\.\.\/services\/stepTrackingService'/g,
      replacement: "from '../services/StepTrackingService'"
    }
  ];
  
  importFixes.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  return { content, modified };
}

function fixMissingImports(content) {
  let modified = false;
  
  // Add missing imports
  const missingImports = [
    // Add DebugUtils import if missing but used
    {
      condition: (content) => content.includes('DebugUtils.') && !content.includes("import { DebugUtils }"),
      addImport: "import { DebugUtils } from '../utils/debugUtils';\n"
    },
    // Add React import if missing but JSX is used
    {
      condition: (content) => content.includes('<') && content.includes('>') && !content.includes("import React"),
      addImport: "import React from 'react';\n"
    }
  ];
  
  missingImports.forEach(({ condition, addImport }) => {
    if (condition(content)) {
      // Add import at the top of the file
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Find the last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, addImport);
      content = lines.join('\n');
      modified = true;
    }
  });
  
  return { content, modified };
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix import paths
    const importResult = fixImportPaths(content);
    content = importResult.content;
    if (importResult.modified) {
      modified = true;
    }
    
    // Fix missing imports
    const missingResult = fixMissingImports(content);
    content = missingResult.content;
    if (missingResult.modified) {
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing import path issues...\n');
  
  const files = glob.sync(filePattern, { cwd: srcDir });
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(srcDir, file);
    
    const shouldExclude = excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(file);
    });
    
    if (shouldExclude) return;
    
    processedCount++;
    if (processFile(fullPath)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files modified: ${modifiedCount}`);
  console.log(`   Files unchanged: ${processedCount - modifiedCount}`);
  
  if (modifiedCount > 0) {
    console.log('\n✅ Import path issues fixed successfully!');
  } else {
    console.log('\n✅ No import path issues found.');
  }
}

main();
