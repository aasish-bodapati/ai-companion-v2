#!/usr/bin/env node

/**
 * Style Consolidation Script
 * Replaces hardcoded style values with theme constants using duplicateStyles.ts
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Style mappings (inline to avoid TypeScript import issues)
const HARDCODED_VALUES = {
  // Background colors
  '#FFFFFF': 'COLORS.background',
  '#F8F9FA': 'COLORS.backgroundSecondary',
  '#E9ECEF': 'COLORS.border',
  '#6C757D': 'COLORS.textSecondary',
  '#495057': 'COLORS.textPrimary',
  '#212529': 'COLORS.textDark',
  
  // Spacing
  '8px': 'SPACING.xs',
  '12px': 'SPACING.sm',
  '16px': 'SPACING.md',
  '20px': 'SPACING.lg',
  '24px': 'SPACING.xl',
  '32px': 'SPACING.xxl',
  
  // Border radius
  '4px': 'BORDER_RADIUS.sm',
  '8px': 'BORDER_RADIUS.md',
  '12px': 'BORDER_RADIUS.lg',
  '16px': 'BORDER_RADIUS.xl',
  
  // Font sizes
  '12px': 'FONT_SIZE.xs',
  '14px': 'FONT_SIZE.sm',
  '16px': 'FONT_SIZE.md',
  '18px': 'FONT_SIZE.lg',
  '20px': 'FONT_SIZE.xl',
  '24px': 'FONT_SIZE.xxl',
};

function mapHardcodedValue(value) {
  return HARDCODED_VALUES[value] || value;
}

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
  '**/build/**',
  '**/duplicateStyles.ts',  // Don't process the mapping file itself
  '**/constants.ts'  // Don't process the constants file
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file already imports theme constants
    const hasThemeImport = content.includes('import') && 
      (content.includes('theme/constants') || content.includes('theme/duplicateStyles'));
    
    // Process hardcoded values
    Object.entries(HARDCODED_VALUES).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${value}\\b`, 'g');
      if (content.includes(value)) {
        const replacement = mapHardcodedValue(value);
        if (replacement !== value) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
    });
    
    // Add theme import if needed and file was modified
    if (modified && !hasThemeImport) {
      // Find the last import statement
      const importRegex = /^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        
        // Add theme import
        const themeImport = "\nimport { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme/constants';\n";
        content = content.slice(0, insertIndex) + themeImport + content.slice(insertIndex);
      }
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
  console.log('🎨 Starting style consolidation...\n');
  
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
  
  console.log(`\n📊 Style Consolidation Summary:`);
  console.log(`   ✅ Files processed: ${processedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total files checked: ${files.length}`);
  
  if (processedCount > 0) {
    console.log(`\n🎉 Style consolidation completed!`);
    console.log(`   Hardcoded values replaced with theme constants`);
    console.log(`   Theme imports added where needed`);
  } else {
    console.log(`\n✨ No hardcoded styles found to consolidate`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, main };
