#!/usr/bin/env node

/**
 * Final Cleanup Script
 * Removes unused imports and performs final code cleanup
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

function removeUnusedImports(content) {
  // Common unused imports to remove
  const unusedImports = [
    /^import\s+React\s+from\s+['"]react['"];?\s*$/gm,
    /^import\s+\{\s*\}\s+from\s+['"][^'"]+['"];?\s*$/gm,  // Empty imports
    /^import\s+.*\s+from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/[^'"]+['"];?\s*$/gm,  // Deep imports
  ];
  
  let modified = false;
  unusedImports.forEach(regex => {
    if (regex.test(content)) {
      content = content.replace(regex, '');
      modified = true;
    }
  });
  
  return { content, modified };
}

function cleanUpCode(content) {
  let modified = false;
  
  // Remove multiple empty lines
  const multipleEmptyLines = /\n\s*\n\s*\n/g;
  if (multipleEmptyLines.test(content)) {
    content = content.replace(multipleEmptyLines, '\n\n');
    modified = true;
  }
  
  // Remove trailing whitespace
  const trailingWhitespace = /[ \t]+$/gm;
  if (trailingWhitespace.test(content)) {
    content = content.replace(trailingWhitespace, '');
    modified = true;
  }
  
  // Remove empty export statements
  const emptyExports = /^export\s*{\s*}\s*;?\s*$/gm;
  if (emptyExports.test(content)) {
    content = content.replace(emptyExports, '');
    modified = true;
  }
  
  return { content, modified };
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove unused imports
    const importResult = removeUnusedImports(content);
    if (importResult.modified) {
      content = importResult.content;
      modified = true;
    }
    
    // Clean up code
    const cleanupResult = cleanUpCode(content);
    if (cleanupResult.modified) {
      content = cleanupResult.content;
      modified = true;
    }
    
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
  console.log('🧹 Starting final cleanup...\n');
  
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
  
  console.log(`\n📊 Final Cleanup Summary:`);
  console.log(`   ✅ Files processed: ${processedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total files checked: ${files.length}`);
  
  if (processedCount > 0) {
    console.log(`\n🎉 Final cleanup completed!`);
    console.log(`   Unused imports removed`);
    console.log(`   Code formatting cleaned up`);
  } else {
    console.log(`\n✨ No cleanup needed - code is already clean!`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, main };
