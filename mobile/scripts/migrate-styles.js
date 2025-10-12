#!/usr/bin/env node

/**
 * Style Migration Script
 * Automates the replacement of hardcoded values with theme constants
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Migration patterns based on audit findings
const MIGRATION_PATTERNS = {
  // Background colors (found 328+ times)
  backgroundColor: {
    '#ffffff': 'COLORS.background.primary',
    '#f8fafc': 'COLORS.background.secondary',
    '#f3f4f6': 'COLORS.background.tertiary',
    '#e5e7eb': 'COLORS.gray[200]',
    '#d1d5db': 'COLORS.gray[300]',
    '#3b82f6': 'COLORS.primary.main',
    '#10b981': 'COLORS.success',
    '#f59e0b': 'COLORS.warning',
    '#ef4444': 'COLORS.danger',
  },
  
  // Border radius (found 334+ times)
  borderRadius: {
    '50': 'BORDER_RADIUS.round',
    '20': 'BORDER_RADIUS.xxl',
    '16': 'BORDER_RADIUS.lg',
    '12': 'BORDER_RADIUS.md',
    '8': 'BORDER_RADIUS.sm',
    '4': 'BORDER_RADIUS.xs',
  },
  
  // Padding values (found 636+ times)
  padding: {
    '24': 'SPACING.xl',
    '20': 'SPACING.lg',
    '16': 'SPACING.md',
    '12': 'SPACING.sm',
    '8': 'SPACING.xs',
    '4': 'SPACING.xxs',
  },
  
  // Font sizes (found 110+ times)
  fontSize: {
    '28': 'FONT_SIZE.xxxxl',
    '20': 'FONT_SIZE.xxl',
    '18': 'FONT_SIZE.xl',
    '16': 'FONT_SIZE.lg',
    '14': 'FONT_SIZE.md',
    '12': 'FONT_SIZE.sm',
    '10': 'FONT_SIZE.xs',
  },
  
  // Text colors
  color: {
    '#1f2937': 'COLORS.text.primary',
    '#6b7280': 'COLORS.text.secondary',
    '#9ca3af': 'COLORS.text.tertiary',
    '#ffffff': 'COLORS.text.inverse',
  },
};

// Style presets that can replace common patterns
const STYLE_PRESETS = {
  card: 'STYLE_PRESETS.card',
  cardSmall: 'STYLE_PRESETS.cardSmall',
  cardLarge: 'STYLE_PRESETS.cardLarge',
  buttonPrimary: 'STYLE_PRESETS.buttonPrimary',
  buttonSecondary: 'STYLE_PRESETS.buttonSecondary',
  input: 'STYLE_PRESETS.input',
  textTitle: 'STYLE_PRESETS.textTitle',
  textHeading: 'STYLE_PRESETS.textHeading',
  textBody: 'STYLE_PRESETS.textBody',
  textSecondary: 'STYLE_PRESETS.textSecondary',
  textCaption: 'STYLE_PRESETS.textCaption',
  row: 'STYLE_PRESETS.row',
  rowSpaceBetween: 'STYLE_PRESETS.rowSpaceBetween',
  centerContent: 'STYLE_PRESETS.centerContent',
  modalOverlay: 'STYLE_PRESETS.modalOverlay',
  modalContent: 'STYLE_PRESETS.modalContent',
};

class StyleMigrator {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      replacements: 0,
      errors: 0,
    };
  }

  // Find all component files
  findComponentFiles() {
    const patterns = [
      'src/components/**/*.tsx',
      'src/screens/**/*.tsx',
    ];
    
    let files = [];
    patterns.forEach(pattern => {
      files = files.concat(glob.sync(pattern));
    });
    
    return files.filter(file => 
      !file.includes('__tests__') && 
      !file.includes('.test.') &&
      !file.includes('.spec.')
    );
  }

  // Read file content
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      this.stats.errors++;
      return null;
    }
  }

  // Write file content
  writeFile(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  // Check if file already uses theme constants
  usesThemeConstants(content) {
    return content.includes('from \'../../theme/constants\'') ||
           content.includes('from \'../../../theme/constants\'') ||
           content.includes('STYLE_PRESETS') ||
           content.includes('COLORS.') ||
           content.includes('SPACING.') ||
           content.includes('BORDER_RADIUS.') ||
           content.includes('FONT_SIZE.');
  }

  // Add theme imports if not present
  addThemeImports(content) {
    const importLines = [
      "import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme/constants';",
      "import { STYLE_PRESETS } from '../../theme/duplicateStyles';"
    ];

    // Check if theme imports already exist
    if (content.includes('from \'../../theme/constants\'') || 
        content.includes('from \'../../../theme/constants\'')) {
      return content;
    }

    // Find the last import statement
    const importRegex = /^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm;
    const imports = content.match(importRegex) || [];
    
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      return content.slice(0, insertIndex) + '\n' + importLines.join('\n') + '\n' + content.slice(insertIndex);
    } else {
      // No imports found, add at the beginning
      return importLines.join('\n') + '\n\n' + content;
    }
  }

  // Replace hardcoded values in style objects
  replaceHardcodedValues(content) {
    let newContent = content;
    let replacements = 0;

    // Replace backgroundColor values
    Object.entries(MIGRATION_PATTERNS.backgroundColor).forEach(([hardcoded, themeValue]) => {
      const regex = new RegExp(`backgroundColor:\\s*['"]${hardcoded}['"]`, 'g');
      const matches = newContent.match(regex);
      if (matches) {
        newContent = newContent.replace(regex, `backgroundColor: ${themeValue}`);
        replacements += matches.length;
      }
    });

    // Replace borderRadius values
    Object.entries(MIGRATION_PATTERNS.borderRadius).forEach(([hardcoded, themeValue]) => {
      const regex = new RegExp(`borderRadius:\\s*${hardcoded}\\b`, 'g');
      const matches = newContent.match(regex);
      if (matches) {
        newContent = newContent.replace(regex, `borderRadius: ${themeValue}`);
        replacements += matches.length;
      }
    });

    // Replace padding values
    Object.entries(MIGRATION_PATTERNS.padding).forEach(([hardcoded, themeValue]) => {
      const regex = new RegExp(`padding(?:Horizontal|Vertical)?:\\s*${hardcoded}\\b`, 'g');
      const matches = newContent.match(regex);
      if (matches) {
        newContent = newContent.replace(regex, (match) => {
          const property = match.split(':')[0];
          return `${property}: ${themeValue}`;
        });
        replacements += matches.length;
      }
    });

    // Replace fontSize values
    Object.entries(MIGRATION_PATTERNS.fontSize).forEach(([hardcoded, themeValue]) => {
      const regex = new RegExp(`fontSize:\\s*${hardcoded}\\b`, 'g');
      const matches = newContent.match(regex);
      if (matches) {
        newContent = newContent.replace(regex, `fontSize: ${themeValue}`);
        replacements += matches.length;
      }
    });

    // Replace color values
    Object.entries(MIGRATION_PATTERNS.color).forEach(([hardcoded, themeValue]) => {
      const regex = new RegExp(`color:\\s*['"]${hardcoded}['"]`, 'g');
      const matches = newContent.match(regex);
      if (matches) {
        newContent = newContent.replace(regex, `color: ${themeValue}`);
        replacements += matches.length;
      }
    });

    this.stats.replacements += replacements;
    return { content: newContent, replacements };
  }

  // Process a single file
  processFile(filePath) {
    console.log(`Processing: ${filePath}`);
    
    const content = this.readFile(filePath);
    if (!content) return;

    // Skip if already using theme constants
    if (this.usesThemeConstants(content)) {
      console.log(`  ✓ Already using theme constants`);
      return;
    }

    // Add theme imports
    let newContent = this.addThemeImports(content);
    
    // Replace hardcoded values
    const result = this.replaceHardcodedValues(newContent);
    
    if (result.replacements > 0) {
      // Write the updated content
      if (this.writeFile(filePath, result.content)) {
        console.log(`  ✓ Made ${result.replacements} replacements`);
        this.stats.filesProcessed++;
      }
    } else {
      console.log(`  - No hardcoded values found`);
    }
  }

  // Run migration on all files
  async run() {
    console.log('🚀 Starting Style Migration...\n');
    
    const files = this.findComponentFiles();
    console.log(`Found ${files.length} component files to process\n`);
    
    files.forEach(file => {
      this.processFile(file);
    });
    
    console.log('\n📊 Migration Summary:');
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Total replacements: ${this.stats.replacements}`);
    console.log(`Errors: ${this.stats.errors}`);
    
    if (this.stats.errors === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Check the logs above.');
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  const migrator = new StyleMigrator();
  migrator.run().catch(console.error);
}

module.exports = StyleMigrator;
