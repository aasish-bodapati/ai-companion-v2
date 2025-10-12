#!/usr/bin/env node

/**
 * Fix Duplicate Service Exports Script
 * Removes duplicate service exports and fixes class instantiation issues
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

function fixDuplicateExports(content) {
  let modified = false;
  
  // Fix duplicate service exports
  const duplicatePatterns = [
    // Remove duplicate export const serviceName = new ServiceName();
    {
      pattern: /export const (\w+Service) = new \1\(\);\s*export const \1 = new \1\(\);/g,
      replacement: 'export const $1 = new $1();'
    },
    // Fix class name mismatches (e.g., stepTrackingService = new StepTrackingService())
    {
      pattern: /export const (\w+Service) = new ([A-Z]\w+Service)\(\);/g,
      replacement: (match, instanceName, className) => {
        // Convert instance name to class name
        const expectedClassName = instanceName.charAt(0).toUpperCase() + instanceName.slice(1);
        if (expectedClassName === className) {
          return `export const ${instanceName} = new ${className}();`;
        }
        return match;
      }
    },
    // Remove duplicate default exports
    {
      pattern: /export default \w+;\s*export default \w+;/g,
      replacement: 'export default $1;'
    }
  ];
  
  duplicatePatterns.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        content = content.replace(pattern, replacement);
      }
      modified = true;
    }
  });
  
  return { content, modified };
}

function fixClassInstantiation(content) {
  let modified = false;
  
  // Fix class instantiation issues
  const classFixes = [
    // Fix stepTrackingService = new StepTrackingService() -> stepTrackingService = new StepTrackingService()
    {
      pattern: /export const stepTrackingService = new stepTrackingService\(\);/g,
      replacement: 'export const stepTrackingService = new StepTrackingService();'
    },
    // Fix other similar issues
    {
      pattern: /export const (\w+Service) = new \1\(\);/g,
      replacement: (match, serviceName) => {
        const className = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
        return `export const ${serviceName} = new ${className}();`;
      }
    }
  ];
  
  classFixes.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        content = content.replace(pattern, replacement);
      }
      modified = true;
    }
  });
  
  return { content, modified };
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix duplicate exports
    const duplicateResult = fixDuplicateExports(content);
    content = duplicateResult.content;
    if (duplicateResult.modified) {
      modified = true;
    }
    
    // Fix class instantiation
    const classResult = fixClassInstantiation(content);
    content = classResult.content;
    if (classResult.modified) {
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
  console.log('🔧 Fixing duplicate service exports...\n');
  
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
    console.log('\n✅ Duplicate exports fixed successfully!');
  } else {
    console.log('\n✅ No duplicate export issues found.');
  }
}

main();
