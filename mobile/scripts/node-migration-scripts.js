/**
 * Node.js Migration Scripts
 * These scripts can be run in a Node.js environment for actual file operations
 * Run with: node scripts/node-migration-scripts.js
 */

const fs = require('fs');
const path = require('path');

const MigrationScripts = {
  // Script to find and replace hardcoded style values
  replaceHardcodedStyles: (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return false;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      let changes = 0;

      // Replace common hardcoded values
      const replacements = [
        { from: "backgroundColor: '#f8fafc'", to: "backgroundColor: DUPLICATE_STYLES.BACKGROUND_F8FAFC" },
        { from: "borderRadius: 16", to: "borderRadius: DUPLICATE_STYLES.BORDER_RADIUS_16" },
        { from: "paddingHorizontal: 20", to: "paddingHorizontal: DUPLICATE_STYLES.PADDING_HORIZONTAL_20" },
        { from: "fontSize: 18", to: "fontSize: DUPLICATE_STYLES.FONT_SIZE_18" },
        { from: "color: '#3b82f6'", to: "color: DUPLICATE_STYLES.COLORS.PRIMARY" },
        { from: "color: '#1f2937'", to: "color: DUPLICATE_STYLES.COLORS.TEXT_PRIMARY" },
        { from: "color: '#6b7280'", to: "color: DUPLICATE_STYLES.COLORS.TEXT_SECONDARY" },
      ];

      replacements.forEach(({ from, to }) => {
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (content.includes(from)) {
          content = content.replace(regex, to);
          changes++;
        }
      });

      // Add import if needed
      if (changes > 0 && !content.includes('DUPLICATE_STYLES')) {
        const importLine = "import { DUPLICATE_STYLES } from '../theme/duplicateStyles';\n";
        content = importLine + content;
      }

      if (changes > 0) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${filePath} with ${changes} style replacements`);
        return true;
      } else {
        console.log(`ℹ️ No hardcoded styles found in ${filePath}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      return false;
    }
  },

  // Script to replace console.log with DebugUtils
  replaceConsoleLogs: (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return false;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      let changes = 0;

      // Replace console.log patterns
      const consoleLogRegex = /console\.(log|warn|error|info)\(/g;
      if (consoleLogRegex.test(content)) {
        content = content.replace(/console\.log\(/g, 'DebugUtils.log(');
        content = content.replace(/console\.warn\(/g, 'DebugUtils.warn(');
        content = content.replace(/console\.error\(/g, 'DebugUtils.error(');
        content = content.replace(/console\.info\(/g, 'DebugUtils.info(');
        
        changes = (content.match(/DebugUtils\.(log|warn|error|info)\(/g) || []).length;
      }

      // Add import if needed
      if (changes > 0 && !content.includes('DebugUtils')) {
        const importLine = "import { DebugUtils } from '../utils/debugUtils';\n";
        content = importLine + content;
      }

      if (changes > 0) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${filePath} with ${changes} console.log replacements`);
        return true;
      } else {
        console.log(`ℹ️ No console.log statements found in ${filePath}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      return false;
    }
  },

  // Script to find files that need migration
  findFilesNeedingMigration: (directory) => {
    const filesToMigrate = {
      hardcodedStyles: [],
      consoleLogs: [],
      loadingPatterns: [],
    };

    function scanDirectory(dir) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for hardcoded styles
          if (content.includes("backgroundColor: '#f8fafc'") || 
              content.includes("borderRadius: 16") ||
              content.includes("paddingHorizontal: 20")) {
            filesToMigrate.hardcodedStyles.push(filePath);
          }
          
          // Check for console.log statements
          if (content.includes('console.log(') || 
              content.includes('console.warn(') ||
              content.includes('console.error(')) {
            filesToMigrate.consoleLogs.push(filePath);
          }
          
          // Check for loading patterns
          if (content.includes('const [loading, setLoading] = useState(false)') &&
              content.includes('setLoading(true)')) {
            filesToMigrate.loadingPatterns.push(filePath);
          }
        }
      });
    }

    console.log(`🔍 Scanning for files needing migration in ${directory}...`);
    scanDirectory(directory);
    
    console.log(`📊 Found ${filesToMigrate.hardcodedStyles.length} files with hardcoded styles`);
    console.log(`📊 Found ${filesToMigrate.consoleLogs.length} files with console.log statements`);
    console.log(`📊 Found ${filesToMigrate.loadingPatterns.length} files with loading patterns`);
    
    return filesToMigrate;
  },

  // Run all migration scripts
  runAllMigrations: (directory) => {
    console.log('🚀 Running all migration scripts...');
    
    const filesToMigrate = MigrationScripts.findFilesNeedingMigration(directory);
    
    // Process hardcoded styles
    console.log('\n📝 Processing hardcoded styles...');
    filesToMigrate.hardcodedStyles.forEach(file => {
      MigrationScripts.replaceHardcodedStyles(file);
    });
    
    // Process console.log statements
    console.log('\n📝 Processing console.log statements...');
    filesToMigrate.consoleLogs.forEach(file => {
      MigrationScripts.replaceConsoleLogs(file);
    });
    
    console.log('\n✅ Migration complete!');
  }
};

// If running directly, execute migrations
if (require.main === module) {
  const srcDirectory = path.join(__dirname, '..', 'src');
  MigrationScripts.runAllMigrations(srcDirectory);
}

module.exports = MigrationScripts;
