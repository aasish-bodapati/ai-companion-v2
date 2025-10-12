#!/usr/bin/env node

/**
 * Fix Critical TypeScript Errors Script
 * Addresses the most critical compilation issues
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

function addReactImport(content) {
  // Check if React is already imported
  if (content.includes("import React") || content.includes("import * as React")) {
    return content;
  }
  
  // Check if file uses JSX
  if (content.includes('<') && content.includes('>')) {
    const importStatement = "import React from 'react';\n";
    const firstImportMatch = content.match(/^import .* from .*;$/m);
    if (firstImportMatch) {
      return content.replace(firstImportMatch[0], `${firstImportMatch[0]}\n${importStatement}`);
    } else {
      return `${importStatement}\n${content}`;
    }
  }
  
  return content;
}

function fixDuplicateIdentifiers(content) {
  // Fix duplicate service exports
  const duplicatePatterns = [
    { pattern: /export const (\w+Service) = new \1\(\);\s*export const \1 = new \1\(\);/g, replacement: 'export const $1 = new $1();' },
    { pattern: /export const (\w+Service) = new \1\(\);\s*export default \1;/g, replacement: 'export const $1 = new $1();\nexport default $1;' }
  ];
  
  let modified = false;
  duplicatePatterns.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  return { content, modified };
}

function fixImportPaths(content) {
  // Fix common import path issues
  const importFixes = [
    { pattern: /from '\$1'/g, replacement: "from '../api'" },
    { pattern: /from '\.\/goalTemplates'/g, replacement: "from './GoalTemplatesService'" },
    { pattern: /from '\.\/stepTrackingService'/g, replacement: "from './StepTrackingService'" }
  ];
  
  let modified = false;
  importFixes.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  return { content, modified };
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Add React import if needed
    const originalContent = content;
    content = addReactImport(content);
    if (content !== originalContent) {
      modified = true;
    }
    
    // Fix duplicate identifiers
    const duplicateResult = fixDuplicateIdentifiers(content);
    content = duplicateResult.content;
    if (duplicateResult.modified) {
      modified = true;
    }
    
    // Fix import paths
    const importResult = fixImportPaths(content);
    content = importResult.content;
    if (importResult.modified) {
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
  console.log('🔧 Fixing critical TypeScript errors...\n');
  
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
    console.log('\n✅ Critical errors fixed successfully!');
  } else {
    console.log('\n✅ No critical errors found.');
  }
}

main();
