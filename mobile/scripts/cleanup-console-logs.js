#!/usr/bin/env node

/**
 * Console Log Cleanup Script
 * Replaces console.log statements with DebugUtils.log for better debugging control
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process
const srcDir = path.join(__dirname, '..', 'src');
const filePattern = '**/*.{ts,tsx}';

// Files to exclude (test files, config files, etc.)
const excludePatterns = [
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/test-utils/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**'
];

// Console methods to replace
const consoleMethods = [
  'console.log',
  'console.warn', 
  'console.error',
  'console.info'
];

// DebugUtils methods mapping
const debugUtilsMapping = {
  'console.log': 'DebugUtils.log',
  'console.warn': 'DebugUtils.warn',
  'console.error': 'DebugUtils.error',
  'console.info': 'DebugUtils.info'
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file already imports DebugUtils
    const hasDebugUtilsImport = content.includes('import') && 
      (content.includes('DebugUtils') || content.includes('debugUtils'));
    
    // Add DebugUtils import if needed and file has console statements
    const hasConsoleStatements = consoleMethods.some(method => content.includes(method));
    
    if (hasConsoleStatements && !hasDebugUtilsImport) {
      // Find the last import statement
      const importRegex = /^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        
        // Add DebugUtils import
        const debugUtilsImport = "\nimport { DebugUtils } from '../utils/debugUtils';\n";
        content = content.slice(0, insertIndex) + debugUtilsImport + content.slice(insertIndex);
        modified = true;
      }
    }
    
    // Replace console methods with DebugUtils methods
    consoleMethods.forEach(consoleMethod => {
      const debugMethod = debugUtilsMapping[consoleMethod];
      const regex = new RegExp(consoleMethod.replace('.', '\\.'), 'g');
      
      if (content.includes(consoleMethod)) {
        content = content.replace(regex, debugMethod);
        modified = true;
      }
    });
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🧹 Starting console log cleanup...\n');
  
  // Find all TypeScript/TSX files
  const files = glob.sync(filePattern, {
    cwd: srcDir,
    ignore: excludePatterns,
    absolute: true
  });
  
  console.log(`Found ${files.length} files to process\n`);
  
  let processedCount = 0;
  let errorCount = 0;
  
  files.forEach(filePath => {
    try {
      if (processFile(filePath)) {
        processedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   ✅ Files processed: ${processedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total files checked: ${files.length}`);
  
  if (processedCount > 0) {
    console.log(`\n🎉 Console log cleanup completed!`);
    console.log(`   All console statements replaced with DebugUtils methods`);
    console.log(`   DebugUtils imports added where needed`);
  } else {
    console.log(`\n✨ No console statements found to replace`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, main };
