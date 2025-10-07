/**
 * Automated Migration Script
 * Automatically migrates remaining duplicate code patterns
 */

import { isFeatureEnabled } from '../config/featureFlags';
import { DUPLICATE_STYLES } from '../theme/duplicateStyles';
import { MigrationHelpers } from '../utils/migrationHelpers';
import { DebugUtils } from '../utils/debugUtils';
import { createLoadingState } from '../utils/duplicateCodeUtils';

export const AutomatedMigration = {
  // Migrate hardcoded styles in a component
  migrateStyles: (componentName: string, styles: any) => {
    console.log(`🎨 Migrating styles for ${componentName}...`);
    
    const migratedStyles = {};
    let migrationCount = 0;
    
    for (const [key, style] of Object.entries(styles)) {
      if (typeof style === 'object' && style !== null) {
        migratedStyles[key] = {};
        
        for (const [prop, value] of Object.entries(style)) {
          let migratedValue = value;
          
          // Migrate common hardcoded values
          if (prop === 'backgroundColor' && value === '#f8fafc') {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.BACKGROUND_F8FAFC);
            migrationCount++;
          } else if (prop === 'backgroundColor' && value === '#ffffff') {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.BACKGROUND_WHITE);
            migrationCount++;
          } else if (prop === 'fontSize' && value === 18) {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.FONT_SIZE_18);
            migrationCount++;
          } else if (prop === 'fontSize' && value === 16) {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.FONT_SIZE_16);
            migrationCount++;
          } else if (prop === 'fontSize' && value === 14) {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.FONT_SIZE_14);
            migrationCount++;
          } else if (prop === 'borderRadius' && value === 16) {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.BORDER_RADIUS_16);
            migrationCount++;
          } else if (prop === 'borderRadius' && value === 12) {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.BORDER_RADIUS_12);
            migrationCount++;
          } else if (prop === 'borderRadius' && value === 8) {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.BORDER_RADIUS_8);
            migrationCount++;
          } else if (prop === 'paddingHorizontal' && value === 20) {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.PADDING_HORIZONTAL_20);
            migrationCount++;
          } else if (prop === 'color' && value === '#3b82f6') {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.COLORS.PRIMARY);
            migrationCount++;
          } else if (prop === 'color' && value === '#1f2937') {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.COLORS.TEXT_PRIMARY);
            migrationCount++;
          } else if (prop === 'color' && value === '#6b7280') {
            migratedValue = MigrationHelpers.replaceStyle(value, DUPLICATE_STYLES.COLORS.TEXT_SECONDARY);
            migrationCount++;
          }
          
          migratedStyles[key][prop] = migratedValue;
        }
      } else {
        migratedStyles[key] = style;
      }
    }
    
    console.log(`✅ Migrated ${migrationCount} style properties for ${componentName}`);
    return migratedStyles;
  },

  // Migrate console.log statements
  migrateConsoleLogs: (componentName: string, code: string) => {
    console.log(`📝 Migrating console.log statements for ${componentName}...`);
    
    let migrationCount = 0;
    let migratedCode = code;
    
    // Replace console.log with MigrationHelpers.replaceConsoleLog
    const consoleLogRegex = /console\.log\(/g;
    migratedCode = migratedCode.replace(consoleLogRegex, (match) => {
      migrationCount++;
      return 'MigrationHelpers.replaceConsoleLog(';
    });
    
    // Replace console.warn with MigrationHelpers.replaceConsoleLog
    const consoleWarnRegex = /console\.warn\(/g;
    migratedCode = migratedCode.replace(consoleWarnRegex, (match) => {
      migrationCount++;
      return 'MigrationHelpers.replaceConsoleLog(';
    });
    
    // Replace console.error with MigrationHelpers.replaceErrorHandling
    const consoleErrorRegex = /console\.error\(/g;
    migratedCode = migratedCode.replace(consoleErrorRegex, (match) => {
      migrationCount++;
      return 'MigrationHelpers.replaceErrorHandling(';
    });
    
    console.log(`✅ Migrated ${migrationCount} console statements for ${componentName}`);
    return migratedCode;
  },

  // Migrate loading state patterns
  migrateLoadingStates: (componentName: string, code: string) => {
    console.log(`⏳ Migrating loading state patterns for ${componentName}...`);
    
    let migrationCount = 0;
    let migratedCode = code;
    
    // Add imports if not present
    if (!migratedCode.includes('createLoadingState')) {
      const importRegex = /(import.*from.*['"][^'"]*['"];?\s*)/;
      const match = migratedCode.match(importRegex);
      if (match) {
        const newImport = "import { createLoadingState } from '../../utils/duplicateCodeUtils';\nimport { isFeatureEnabled } from '../../config/featureFlags';\n";
        migratedCode = migratedCode.replace(importRegex, match[0] + newImport);
        migrationCount++;
      }
    }
    
    // Replace useState loading pattern
    const useStateRegex = /const \[loading, setLoading\] = useState\(false\);/g;
    migratedCode = migratedCode.replace(useStateRegex, (match) => {
      migrationCount++;
      return `// Use new loading state management if feature is enabled
  const loadingState = isFeatureEnabled('USE_NEW_LOADING_UTILS') 
    ? createLoadingState() 
    : { loading: false, setLoading: () => {}, withLoading: async (fn: () => Promise<any>) => fn(), resetError: () => {} };
  
  const [loading, setLoading] = useState(false);`;
    });
    
    console.log(`✅ Migrated ${migrationCount} loading patterns for ${componentName}`);
    return migratedCode;
  },

  // Run full migration for a component
  migrateComponent: (componentName: string, componentData: any) => {
    console.log(`🚀 Starting full migration for ${componentName}...`);
    
    const results = {
      componentName,
      stylesMigrated: 0,
      consoleLogsMigrated: 0,
      loadingStatesMigrated: 0,
      totalMigrations: 0,
    };
    
    // Migrate styles if present
    if (componentData.styles) {
      const migratedStyles = AutomatedMigration.migrateStyles(componentName, componentData.styles);
      results.stylesMigrated = Object.keys(migratedStyles).length;
    }
    
    // Migrate console.log statements if present
    if (componentData.code) {
      const migratedCode = AutomatedMigration.migrateConsoleLogs(componentName, componentData.code);
      results.consoleLogsMigrated = (componentData.code.match(/console\.(log|warn|error)\(/g) || []).length;
    }
    
    // Migrate loading states if present
    if (componentData.code) {
      const migratedCode = AutomatedMigration.migrateLoadingStates(componentName, componentData.code);
      results.loadingStatesMigrated = (componentData.code.match(/const \[loading, setLoading\] = useState\(false\);/g) || []).length;
    }
    
    results.totalMigrations = results.stylesMigrated + results.consoleLogsMigrated + results.loadingStatesMigrated;
    
    console.log(`✅ Migration complete for ${componentName}: ${results.totalMigrations} total migrations`);
    return results;
  },

  // Run migration for multiple components
  migrateComponents: (components: {name: string, data: any}[]) => {
    console.log(`🚀 Starting batch migration for ${components.length} components...`);
    
    const results = {
      totalComponents: components.length,
      totalMigrations: 0,
      componentResults: [] as any[],
    };
    
    components.forEach(component => {
      const result = AutomatedMigration.migrateComponent(component.name, component.data);
      results.componentResults.push(result);
      results.totalMigrations += result.totalMigrations;
    });
    
    console.log(`✅ Batch migration complete: ${results.totalMigrations} total migrations across ${results.totalComponents} components`);
    return results;
  },

  // Generate migration report
  generateReport: (results: any) => {
    console.log('\n📊 Migration Report:');
    console.log(`Total Components: ${results.totalComponents}`);
    console.log(`Total Migrations: ${results.totalMigrations}`);
    console.log('\nComponent Details:');
    
    results.componentResults.forEach(result => {
      console.log(`  ${result.componentName}:`);
      console.log(`    Styles: ${result.stylesMigrated}`);
      console.log(`    Console Logs: ${result.consoleLogsMigrated}`);
      console.log(`    Loading States: ${result.loadingStatesMigrated}`);
      console.log(`    Total: ${result.totalMigrations}`);
    });
    
    return results;
  },
};

export default AutomatedMigration;
